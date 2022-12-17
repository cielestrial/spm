const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const spotifyApi = require("./api/spotifyApi.cjs");
const lastfm = require("./api/lastfm.cjs");

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

// Get Access Token
app.post("/login", spotifyApi.login);

// Get UserId, display name, and country
app.post("/user", spotifyApi.getUser);

// Get user's playlists
app.post("/playlists", spotifyApi.getPlaylists);

// Create new playlist
app.post("/create", spotifyApi.create);

// Add tracks to a specific position in a playlist
app.post("/add", spotifyApi.add);

// Remove all occurances of a track from a playlist
app.post("/remove", spotifyApi.remove);

// Unfollow a playlist
app.post("/unfollow", spotifyApi.unfollow);

// Follow a playlist
app.post("/follow", spotifyApi.follow);

// Get tracks in a playlist
app.post("/tracks", spotifyApi.getTracks);

// Search general playlists
app.post("/search-playlists", spotifyApi.searchPlaylists);

// Search general tracks
app.post("/search-tracks", spotifyApi.searchTracks);

// Get associated genres for an artist
app.post("/genres", lastfm.getArtistGenres);

// Reset associated genres for all artists
app.post("/reset-genres", lastfm.resetArtistGenres);
