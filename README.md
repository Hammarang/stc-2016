# stc-2016
Spotify Tech Challenge - Team Yellow Heart​
# This is an entry for the Spotify Tech Challenge 2016
The purpose of the app is to do a POC for selecting music from a picture. The image can either be uploaded or captured through the camera. The image is analyzed to capture dominent color palette saturation, brightness, contrast and intensity. The image properties is then mapped to the audio features that can be fetched from the Spotify Web API (https://developer.spotify.com/web-api)

Mobile is currently not supported. 

# Running the app
The backend requires Node to run. 
Running locally also requires a settings.json file with the `client_id` and `client_secret` specified.
`npm install` & `npm start`
