require("dotenv").config();
const path = require("path");
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
const spotifyApi = require("./spotifyApi.cjs");
const spotifyPlaylistApi = require("./spotifyPlaylistApi.cjs");
const spotifyTrackApi = require("./spotifyTrackApi.cjs");
const spotifySearchApi = require("./spotifySearchApi.cjs");
//const spotifyLikedApi = require("./apis/spotifyLikedApi.cjs");
const lastfm = require("./lastfm.cjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "build")));
app.set("port", process.env.PORT || 8080);

//const app = express.Router();

app.post("/", (req, res) => {
  res.send(
    "<!DOCTYPE html>" +
      "<head>" +
      "<style>" +
      "html {" +
      "background-color: #2b3039;" +
      "color: #00e344;" +
      "display: grid;" +
      "place-content: center;" +
      "height: 100%;" +
      "}" +
      "h1," +
      "h3," +
      "h5 {" +
      "text-align: center;" +
      "margin: 0;" +
      "padding: 0;" +
      "margin-bottom: 1rem;" +
      "}" +
      "</style>" +
      "</head>" +
      "<html>" +
      "<body>" +
      "<h1>Your Spotify Playlist Manager</h1>" +
      "<h3>Welcome to the YSPM Server</h3>" +
      "<h5>By: Cielestrial</h5>" +
      "</body>" +
      "</html>"
  );
});

/**
 * spotify api
 */
// Get Access Token
app.post("/login", spotifyApi.login);

// Get UserId, display name, and country
app.post("/user", spotifyApi.getUser);

/**
 * spotify playlist api
 */
// Get user's playlists
app.post("/playlists", spotifyPlaylistApi.getPlaylists);

// Create new playlist
app.post("/create", spotifyPlaylistApi.create);

// Unfollow a playlist
app.post("/unfollow", spotifyPlaylistApi.unfollow);

// Follow a playlist
app.post("/follow", spotifyPlaylistApi.follow);

/**
 * spotify track api
 */
// Add tracks to a specific position in a playlist
app.post("/add", spotifyTrackApi.add);

// Remove all occurances of a track from a playlist
app.post("/remove", spotifyTrackApi.remove);

// Get tracks in a playlist
app.post("/tracks", spotifyTrackApi.getTracks);

/**
 * spotify search api
 */
// Search general playlists
app.post("/search-playlists", spotifySearchApi.searchPlaylists);

// Search general tracks
app.post("/search-tracks", spotifySearchApi.searchTracks);

/**
 * lastfm api
 */
// Get associated genres for an artist
app.post("/genres", lastfm.getArtistsGenres);

/**
 * spotify liked api
 */

//app.use("/server", app);

//module.exports.handler = serverless(app);
