require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const spotifyApi = require("../netlify/functions/api/spotifyApi.cjs");
const spotifyPlaylistApi = require("../netlify/functions/api/spotifyPlaylistApi.cjs");
const spotifyTrackApi = require("../netlify/functions/api/spotifyTrackApi.cjs");
const spotifySearchApi = require("../netlify/functions/api/spotifySearchApi.cjs");
//const spotifyLikedApi = require("./api/spotifyLikedApi.cjs");
const lastfm = require("../netlify/functions/api/lastfm.cjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "build")));
app.set("port", process.env.PORT || 8080);

const server = app.listen(app.get("port"), function () {
  console.log("listening on port ", server.address().port);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/page.html"));
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

// Reset associated genres for all artists
app.post("/reset-genres", lastfm.resetArtistGenres);

/**
 * spotify liked api
 */
