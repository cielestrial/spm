require("dotenv").config();
const path = require("path");
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const bodyParser = require("body-parser");
const spotifyApi = require("./apis/spotifyApi.cjs");
const spotifyPlaylistApi = require("./apis/spotifyPlaylistApi.cjs");
const spotifyTrackApi = require("./apis/spotifyTrackApi.cjs");
const spotifySearchApi = require("./apis/spotifySearchApi.cjs");
//const spotifyLikedApi = require("./apis/spotifyLikedApi.cjs");
const lastfm = require("./apis/lastfm.cjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "build")));
app.set("port", process.env.PORT || 8080);

const router = express.Router();
app.use("/.netlify/functions/api", router);

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/page.html"));
});

/**
 * spotify api
 */
// Get Access Token
router.get("/login", spotifyApi.login);

// Get UserId, display name, and country
router.get("/user", spotifyApi.getUser);

/**
 * spotify playlist api
 */
// Get user's playlists
router.get("/playlists", spotifyPlaylistApi.getPlaylists);

// Create new playlist
router.get("/create", spotifyPlaylistApi.create);

// Unfollow a playlist
router.get("/unfollow", spotifyPlaylistApi.unfollow);

// Follow a playlist
router.get("/follow", spotifyPlaylistApi.follow);

/**
 * spotify track api
 */
// Add tracks to a specific position in a playlist
router.get("/add", spotifyTrackApi.add);

// Remove all occurances of a track from a playlist
router.get("/remove", spotifyTrackApi.remove);

// Get tracks in a playlist
router.get("/tracks", spotifyTrackApi.getTracks);

/**
 * spotify search api
 */
// Search general playlists
router.get("/search-playlists", spotifySearchApi.searchPlaylists);

// Search general tracks
router.get("/search-tracks", spotifySearchApi.searchTracks);

/**
 * lastfm api
 */
// Get associated genres for an artist
router.get("/genres", lastfm.getArtistsGenres);

// Reset associated genres for all artists
router.get("/reset-genres", lastfm.resetArtistGenres);

/**
 * spotify liked api
 */

module.exports.handler = serverless(app);
