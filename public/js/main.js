// Create canvas containing the test image
let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');
let img = document.getElementById('main-image');
// console.log(img);

let colorThief = new ColorThief();

document.getElementById('like_btn').onclick = function() {
  if(track) {
    let starPush = window.location.origin + "/star";
    starPush += "?id=" + track.id;
    console.log(starPush);
    fetch(starPush)
      .catch(function(err) {
        console.log('Fetch Error :-S', err);
      });
  }
}

// Setup file uploading, reanalyzing the image after it is uploaded
document.getElementById('hashtag_btn').onclick = function() {
  let fileUploader = document.getElementById('upload_file');
  fileUploader.onchange = function(event) {
    let fileList = fileUploader.files;

    if (FileReader && fileList && fileList.length) {
    var fr = new FileReader();
    fr.onload = function () {
        img.src = fr.result;
        let dominantPalette = getDominantPalette(img);
        let features = analyzeImage(dominantPalette);
        setUIPalette(dominantPalette);
        gotoRecommendation(features.intensity, features.brightness, features.saturation);
    }
    fr.readAsDataURL(fileList[0]);
    }
  }
  // Open file uploader
  fileUploader.click();
}

function analyzeImageAndPlay(image) {
  let dominantPalette = getDominantPalette(image);
  let features = analyzeImage(dominantPalette);
  setUIPalette(dominantPalette);
  gotoRecommendation(features.intensity, features.brightness, features.saturation);
}

function analyzeImage(dominantPalette) {
  return {
    intensity: getPaletteIntensity(dominantPalette),
    brightness: getBrightness(dominantPalette),
    saturation: getSaturation(dominantPalette),
  }
}

function setUIPalette(palette) {
  let firstDominant = rgbToStr(palette[0]);
  let secondDominant = rgbToStr(palette[1]);

  document.body.style.background = firstDominant;
  document.body.style.backgroundImage = '-moz-linear-gradient('
        + "right" + ', ' + firstDominant + ', ' + secondDominant + ')';
  document.body.style.backgroundImage = '-webkit-linear-gradient('
        + "left" + ', ' + firstDominant + ', ' + secondDominant + ')';
  document.body.style.backgroundImage = 'linear-gradient('
        + "to right" + ', ' + firstDominant + ', ' + secondDominant + ')';
  document.body.style.backgroundImage = '-o-linear-gradient('
        + "right" + ', ' + firstDominant + ', ' + secondDominant + ')';

  document.getElementById("left_colour").style.background = firstDominant;
  document.getElementById("right_colour").style.background = secondDominant;

  document.getElementById("left_hex").innerHTML = rgbToHexStr(palette[0]);
  document.getElementById("right_hex").innerHTML = rgbToHexStr(palette[1]);
}

function rgbToStr(color) {
  return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
}

function componentToHex(c) {
  let hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHexStr(color) {
  console.log(color);
  return "#" + componentToHex(color[0]) + componentToHex(color[1]) + componentToHex(color[2]);
}


var track;
// Goto the recommendations page with the calculated parameters
function gotoRecommendation(intensity, brightness, saturation) {
  let valence = intensity;
  let energy = brightness + saturation;

  // Cap energy for Spotify API
  if (energy > 1) {
    energy = 1;
  }
  let gotoPage = window.location.origin + "/recommendations";
  gotoPage += "?valence=" + valence;
  gotoPage += "&energy=" + energy;
  console.log(gotoPage);

  fetch(gotoPage)
    .then(
      function(response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +
            response.status);
          return;
        }

        // Examine the text in the response
        response.json().then(function(data) {
          console.log(data);
          document.getElementById("thumb").src = data.image;
          document.getElementById("song").innerHTML = data.artist + ' - ' + data.name;
          playSong(data.preview);
          track = data;
        });
      }
    )
    .catch(function(err) {
      console.log('Fetch Error :-S', err);
    });
}

// Calculates "contrast" in relation to most dominant color
function getPaletteContrast(palette) {
  let lightnessPalette = palette.map(color => {
    return rgbToHsl(color).l
  });
  let mainColor = lightnessPalette[0];
  let squareLightDiff = 0;
  for (var i = 1; i < lightnessPalette.length; i++) {
    squareLightDiff += Math.pow(lightnessPalette[i] - mainColor, 2);
  }
  return Math.pow(squareLightDiff/lightnessPalette.length, 0.5);
}

// Calculates the average brightness of the palette
function getBrightness(palette) {
  return palette
    .map(color => {
      return rgbToHsl(color).l
    })
    .reduce((sum, val) => {
      return sum + val
    })
  /palette.length
}

function getSaturation(palette) {
  return palette
    .map(color => {
      return rgbToHsl(color).s
    })
    .reduce((sum, val) => {
      return sum + val
    })
  /palette.length
}

// Gets the intensity of a palette of colors. The intensity being the V-values
// in HSV form
function getPaletteIntensity(palette) {
  return palette
    .map(color => {
      return rgbToHsv(color).v
    })
    .reduce((sum, val) => {
      return sum + val
    })
  /palette.length;
}

// Convert an array of RGB values to HSV
function rgbToHsv(pixel) {
  return tinycolor(
    {
      r: pixel[0],
      b: pixel[1],
      g: pixel[2],
    }
  ).toHsv();
}

// Convert an array of RGB values to HSV
function rgbToHsl(pixel) {
  return tinycolor(
    {
      r: pixel[0],
      b: pixel[1],
      g: pixel[2],
    }
  ).toHsl();
}


// Returns an array of pixels, RGBA
function getPixels(image, context) {
  let pixels = [];

  for (var offsetX = 0; offsetX < image.width; offsetX++) {
    for (var offsetY = 0; offsetY < image.height; offsetY++) {
      pixels.push(context.getImageData(offsetX, offsetY, 1, 1).data);
    }
  }
  return pixels;
}

function getDominantColor(image){
  return colorThief.getColor(image);
}

function getDominantPalette(image){
  return colorThief.getPalette(image, 4);
}

function playSong(url) {
  var player = document.getElementById('player');
  player.src = url;
  player.load();
  player.play();
}

function convertCanvasToImage(canvas) {
  var image = canvas.toDataURL("image/png");
  return image;
}

function getBase64Image(image) {
    return image.replace(/^data:image\/(png|jpg);base64,/, "");
}
