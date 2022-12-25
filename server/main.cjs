require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const spotifyApi = require("./api/spotifyApi.cjs");
const spotifyPlaylistApi = require("./api/spotifyPlaylistApi.cjs");
const spotifyTrackApi = require("./api/spotifyTrackApi.cjs");
const spotifySearchApi = require("./api/spotifySearchApi.cjs");
//const spotifyLikedApi = require("./api/spotifyLikedApi.cjs");
const lastfm = require("./api/lastfm.cjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "build")));
app.set("port", process.env.PORT || 8080);

const router = express.Router();
app.use("/server", router);

app.get("/server", (req, res) => {
  res.sendFile(path.join(__dirname, "views/page.html"));
});

/**
 * spotify api
 */
// Get Access Token
app.post("/server/login", spotifyApi.login);

// Get UserId, display name, and country
app.post("/server/user", spotifyApi.getUser);

/**
 * spotify playlist api
 */
// Get user's playlists
app.post("/server/playlists", spotifyPlaylistApi.getPlaylists);

// Create new playlist
app.post("/server/create", spotifyPlaylistApi.create);

// Unfollow a playlist
app.post("/server/unfollow", spotifyPlaylistApi.unfollow);

// Follow a playlist
app.post("/server/follow", spotifyPlaylistApi.follow);

/**
 * spotify track api
 */
// Add tracks to a specific position in a playlist
app.post("/server/add", spotifyTrackApi.add);

// Remove all occurances of a track from a playlist
app.post("/server/remove", spotifyTrackApi.remove);

// Get tracks in a playlist
app.post("/server/tracks", spotifyTrackApi.getTracks);

/**
 * spotify search api
 */
// Search general playlists
app.post("/server/search-playlists", spotifySearchApi.searchPlaylists);

// Search general tracks
app.post("/server/search-tracks", spotifySearchApi.searchTracks);

/**
 * lastfm api
 */
// Get associated genres for an artist
app.post("/server/genres", lastfm.getArtistsGenres);

// Reset associated genres for all artists
app.post("/server/reset-genres", lastfm.resetArtistGenres);

/**
 * spotify liked api
 */
