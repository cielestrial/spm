require("dotenv").config();
const serverless = require("serverless-http");
const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const spotifyApi = require("./spotifyApi.cjs");
const spotifyPlaylistApi = require("./spotifyPlaylistApi.cjs");
const spotifyTrackApi = require("./spotifyTrackApi.cjs");
const spotifySearchApi = require("./spotifySearchApi.cjs");
//const spotifyLikedApi = require("./api/spotifyLikedApi.cjs");
const lastfm = require("./lastfm.cjs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

//app.use(express.static(path.join(__dirname, "build")));
/*;
app.set("port", process.env.PORT || 8080);
const server = app.listen(app.get("port"), function () {
  console.log("listening on port ", server.address().port);
});

*/
const router = express.Router();
/**
 * spotify api
 */
// Get Access Token
router.post("/login", spotifyApi.login);

// Get UserId, display name, and country
router.post("/user", spotifyApi.getUser);

/**
 * spotify playlist api
 */
// Get user's playlists
router.post("/playlists", spotifyPlaylistApi.getPlaylists);

// Create new playlist
router.post("/create", spotifyPlaylistApi.create);

// Unfollow a playlist
router.post("/unfollow", spotifyPlaylistApi.unfollow);

// Follow a playlist
router.post("/follow", spotifyPlaylistApi.follow);

/**
 * spotify track api
 */
// Add tracks to a specific position in a playlist
router.post("/add", spotifyTrackApi.add);

// Remove all occurances of a track from a playlist
router.post("/remove", spotifyTrackApi.remove);

// Get tracks in a playlist
router.post("/tracks", spotifyTrackApi.getTracks);

/**
 * spotify search api
 */
// Search general playlists
router.post("/search-playlists", spotifySearchApi.searchPlaylists);

// Search general tracks
router.post("/search-tracks", spotifySearchApi.searchTracks);

/**
 * lastfm api
 */
// Get associated genres for an artist
router.post("/genres", lastfm.getArtistsGenres);

// Reset associated genres for all artists
router.post("/reset-genres", lastfm.resetArtistGenres);

/**
 * spotify liked api
 */
app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
