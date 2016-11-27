var redirect_uri; // Your redirect uri
var localhost;
if (process.env.PORT) {
  redirect_uri = 'https://stc-2016.herokuapp.com/callback';
  localhost = 'https://stc-2016.herokuapp.com';
} else {
  redirect_uri = 'http://localhost:3000/callback';
  localhost = 'http://localhost:3000';
}

var request = require('request');
var express = require('express');
var fs = require('fs');
var cookieParser = require('cookie-parser');
var querystring = require('querystring');
var stateKey = 'spotify_auth_state';

var settings = JSON.parse(fs.readFileSync('settings.json').toString());
var client_id = settings.client_id; // Your client id
var client_secret = settings.client_secret; // Your secret

var users = {};

var app = express();
app.use(express.static(__dirname + '/public'))
   .use(cookieParser());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

var server = app.listen(process.env.PORT || 3000, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})

// Login code below stolen from https://github.com/spotify/web-api-auth-examples
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get('/user', function(req, res) {
  var options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + req.query.access_token },
    json: true
  };
  request.get(options, function(error, response, body) {
    var access_token = req.query.access_token;
    var user = body.id;
    users[user] = body;
    res.redirect('/app.html?token=' + access_token + '&user_id=' + user);
  });
});

app.get('/user_info', function(req, res) {
  var user = req.query.user_id;
  var data = users[user];
  res.send({
    'user_name': data.display_name,
    'user_image': data.images[0].url
  });
});

app.get('/login', function(req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-library-modify user-top-read';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function(req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.end(querystring.stringify({
      error: 'state_mismatch'
    }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        var refresh_token = body.refresh_token;

        res.redirect('/user?' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      } else {
        console.log("ERROR: " + error)
        console.log(response);
        console.log(body);
        res.end(JSON.stringify(error));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      console.log("Got access token: " + access_token);
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/star', function(req, res) {
  saveTracksUrl = 'https://api.spotify.com/v1/me/tracks?ids=';
  saveTracksUrl += req.query.id;
  var starOptions = {
      url: saveTracksUrl,
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + access_token
      },
  };
  console.log(starOptions);

  request.put(starOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      console.log("Saved song ok!");
    } else {
      console.log("ERROR: " + error)
      console.log(response);
      console.log(body);
    }
  });
});

app.get('/recommendations', function(req, res) {
  var token = req.query.token;
  var selectedTrack;
  var topTracksUrl = 'https://api.spotify.com/v1/me/top/tracks?limit=5';
  var topTracksOptions = {
      uri: topTracksUrl,
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
      }
  };
  var seed = "";
  request.get(topTracksOptions, function(error, response, body) {
    var info = JSON.parse(body);
    if (!error && response.statusCode == 200) {
      for (var i = 0; i < info.items.length; i++) {
        seed = seed + info.items[i].id + ",";
      }
      seed = seed.slice(0, seed.length - 1);
    } else {
      console.log("Got error:");
      console.log(error);
      console.log(response.statusCode);
    }
    console.log("------- SEEDS -----------");
    console.log(seed);
    console.log("------- END SEEDS -----------");

    var recommendationsUrl = 'https://api.spotify.com/v1/recommendations?' +
      querystring.stringify({
        seed_tracks: seed,
        target_valence: req.query.valence,
        target_energy: req.query.energy,
        limit: 1
      });
    var recommendationsOptions = {
        uri: recommendationsUrl,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    };
    var trackIds = [];
    request.get(recommendationsOptions, function(error, response, body) {
      var info = JSON.parse(body);
      if (!error && response.statusCode == 200) {
        for (var i = 0; i < info.tracks.length; i++) {
          trackIds.push(info.tracks[i].id);
        }
      } else {
        console.log("Got error:");
        console.log(error);
        console.log(response);
      }
      console.log("------- TRACKS -----------");
      console.log(trackIds);
      console.log("------- END TRACKS -----------");

      var trackUrl = 'https://api.spotify.com/v1/tracks/' + trackIds[0];
      var trackOptions = {
          uri: trackUrl,
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + token
          }
      };
      request.get(trackOptions, function(error, response, body) {
        var info = JSON.parse(body);
        var shouldReturn = {
          id: info.id,
          name: info.name,
          artist: info.artists[0].name,
          preview: info.preview_url,
          image: info.album.images[2].url
        }
        console.log("returning shit");
        console.log(shouldReturn);
        res.send(shouldReturn);
      });
    });
  });
});
