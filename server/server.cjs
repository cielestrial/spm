const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const SpotifyWebApi = require("spotify-web-api-node");
const maxGetLimit = 50;
const maxPostLimit = 100;
let userId;
let country;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "build")));
app.set("port", process.env.PORT || 8080);

const server = app.listen(app.get("port"), function () {
  console.log("listening on port ", server.address().port);
});

/**
 * /
 * /login
 * /user
 * /playlists
 * /create
 * /add
 * /remove
 * /tracks
 * /unfollow
 * /follow
 * /search-playlists
 * /search-tracks
 */

app.get("/", function (req, res) {
  res.send(
    "<body style='background-color:#2b3039; color:#00e344; display:grid; place-content:center;'>" +
      "<h1 style='text-align: center; margin: 0; padding: 0; margin-bottom: 1rem;'>" +
      "Your Spotify Playlist Manager" +
      "</h1>" +
      "<h3 style='text-align:center; margin:0; padding:0; margin-bottom:1rem;'>" +
      "Welcome to the YSPM Server" +
      "</h3>" +
      "<h5 style='text-align:center; margin:0; padding:0; margin-bottom:1rem;'>" +
      "By: Cielestrial" +
      "</h5>" +
      "</body>"
  );
});

const spotifyApi = new SpotifyWebApi({
  redirectUri: "http://localhost:3000",
  clientId: "d03dd28afb3f40d1aad5e6a45d9bff7f",
  clientSecret: "e75eb0904b534609ac65376077d10329"
});

/**
 * Get Access Token
 */
app.post("/login", (req, res) => {
  const code = req.body.code;
  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      spotifyApi.setAccessToken(data.body["access_token"]);
      spotifyApi.setRefreshToken(data.body["refresh_token"]);
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expriresIn: data.body.expires_in
      });
    })
    .catch(err => {
      console.log("Something went wrong with accessToken", err);
      res.sendStatus(400);
    });
});

/**
 * Get UserId, display name, and country
 */
app.post("/user", (req, res) => {
  spotifyApi
    .getMe()
    .then(data => {
      userId = data.body.id;
      country = data.body.country;
      console.log(
        "Some information about the authenticated user:",
        "userId:",
        userId,
        "display_name:",
        data.body.display_name,
        "country:",
        country
      );
      res.json({
        display_name: data.body.display_name
      });
    })
    .catch(err => {
      console.log("Something went wrong with user", err);
    });
});

/**
 * Get user's playlists
 */
app.post("/playlists", (req, res) => {
  const offset = req.body.options.offset;
  const limit =
    req.body.options.limit < maxGetLimit ? req.body.options.limit : maxGetLimit;

  spotifyApi
    .getUserPlaylists({
      offset: offset,
      limit: limit
    })
    .then(data => {
      console.log(
        "Successfully retrieved playlists at",
        "Offset:",
        data.body.offset,
        "Total:",
        data.body.total,
        "Limit:",
        limit
      );
      res.json({
        total: data.body.total,
        list: data.body.items.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          owner: playlist.owner.display_name,
          uri: playlist.uri,
          snapshot: playlist.snapshot_id,
          total: playlist.tracks.total
        }))
      });
    })
    .catch(err => {
      console.log("Something went wrong with retrieving playlists", err);
    });
});

/**
 * Create new playlist
 */
app.post("/create", (req, res) => {
  const name = req.body.name;
  const description = req.body.description;
  spotifyApi
    .createPlaylist(name, { description: description })
    .then(data => {
      console.log("Successfully created playlists", data.body.name);
      res.json({
        id: data.body.id,
        name: data.body.name,
        owner: data.body.owner.display_name,
        uri: data.body.uri,
        snapshot: data.body.snapshot_id,
        total: data.body.tracks.total
      });
    })
    .catch(err => {
      console.log("Something went wrong with playlist creation", err);
    });
});

/**
 * Add tracks to a specific position in a playlist
 */
app.post("/add", (req, res) => {
  const playlistId = req.body.playlistId;
  const uris = req.body.uris;
  const total = req.body.total;
  const offset = req.body.options.offset;
  const limit =
    req.body.options.limit < maxPostLimit
      ? req.body.options.limit
      : maxPostLimit;
  spotifyApi
    .addTracksToPlaylist(playlistId, uris, { position: 0 })
    .then(data => {
      console.log(
        "Successfully added tracks to playlist",
        "Offset:",
        offset,
        "Total:",
        total,
        "Limit:",
        limit
      );
      res.json({ snapshot: data.body.snapshot_id });
    })
    .catch(err => {
      console.log("Something went wrong with adding songs to playlist", err);
    });
});

/**
 * Remove all occurances of a track from a playlist
 */
app.post("/remove", (req, res) => {
  const playlistId = req.body.playlistId;
  const uris = req.body.uris;
  const snapshot = req.body.snapshot;
  const total = req.body.total;
  const offset = req.body.options.offset;
  const limit =
    req.body.options.limit < maxPostLimit
      ? req.body.options.limit
      : maxPostLimit;
  spotifyApi
    .removeTracksFromPlaylist(playlistId, uris)
    .then(data => {
      console.log(
        "Successfully removed tracks from playlist",
        "Offset:",
        offset,
        "Total:",
        total,
        "Limit:",
        limit
      );
      res.json({ snapshot: data.body.snapshot_id });
    })
    .catch(err => {
      console.log(
        "Something went wrong with removing songs from playlist",
        err
      );
    });
});

/**
 * Unfollow a playlist
 */
app.post("/unfollow", (req, res) => {
  const playlistId = req.body.playlistId;
  spotifyApi
    .unfollowPlaylist(playlistId)
    .then(data => {
      console.log("Successfully unfollowed playlist");
      res.json("success");
    })
    .catch(err => {
      console.log("Something went wrong with unfollowing the playlist", err);
    });
});

/**
 * Follow a playlist
 */
app.post("/follow", (req, res) => {
  const playlistId = req.body.playlistId;
  spotifyApi
    .followPlaylist(playlistId)
    .then(data => {
      console.log("Successfully followed playlist");
      res.json("success");
    })
    .catch(err => {
      console.log("Something went wrong with following the playlist", err);
    });
});

/**
 * Get tracks in a playlist
 */
app.post("/tracks", (req, res) => {
  const playlistId = req.body.playlistId;
  const offset = req.body.options.offset;
  const limit =
    req.body.options.limit < maxGetLimit ? req.body.options.limit : maxGetLimit;
  spotifyApi
    .getPlaylistTracks(playlistId, {
      offset: offset,
      limit: limit,
      market: country,
      include_external: "audio",
      fields:
        "items(is_local, " +
        "track(album.name, album.artists, artists.name, duration_ms, " +
        "id, name, uri, is_playable, linked_from(id, uri))), " +
        "offset, total"
    })
    .then(data => {
      console.log(
        "Successfully retrieved tracks at",
        "Offset:",
        data.body.offset,
        "Total:",
        data.body.total,
        "Limit:",
        limit
      );
      res.json({
        list: data.body.items.map(track => ({
          is_local: track.is_local,
          is_playable: track.track.is_playable,
          id: track.track.id,
          name: track.track.name,
          uri: track.track.uri,
          linked_from:
            track.track.linked_from !== undefined
              ? {
                  id: track.track.linked_from.id,
                  uri: track.track.linked_from.uri
                }
              : undefined,
          duration: track.track.duration_ms,
          album: track.track.album.name,
          album_artists: track.track.album.artists.map(artist => artist.name),
          artists: track.track.artists.map(artist => artist.name)
        }))
      });
    })
    .catch(err => {
      console.log("Something went wrong with retrieving tracks", err);
    });
});

/**
 * Search general playlists
 */
app.post("/search-playlists", (req, res) => {
  const maxOffset = 1000;
  const query = req.body.querySearch;
  const offset = req.body.options.offset;
  const limit =
    req.body.options.limit < maxGetLimit ? req.body.options.limit : maxGetLimit;
  spotifyApi
    .searchPlaylists(query, {
      market: country,
      offset: offset,
      limit: limit,
      include_external: "audio"
    })
    .then(data => {
      console.log("Found playlists are", data.body.playlists);
      res.json({
        total: data.body.playlists.total,
        list: data.body.playlists.items.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          owner: playlist.owner.display_name,
          uri: playlist.uri,
          total: playlist.tracks.total
        }))
      });
    })
    .catch(err => {
      console.log("Something went wrong with searching for playlists", err);
    });
});

/**
 * Search general tracks
 */
app.post("/search-tracks", (req, res) => {
  const maxOffset = 1000;
  const query = req.body.querySearch;
  const offset = req.body.options.offset;
  const limit =
    req.body.options.limit < maxGetLimit ? req.body.options.limit : maxGetLimit;
  spotifyApi
    .searchTracks(query, {
      market: country,
      offset: offset,
      limit: limit,
      include_external: "audio"
    })
    .then(data => {
      console.log("Found tracks are", data.body.tracks);
      res.json({
        total: data.body.tracks.total,
        list: data.body.tracks.items
          .filter(tr => !tr.is_local && tr.is_playable)
          .map(track => ({
            is_local: track.is_local,
            is_playable: track.is_playable,
            id: track.id,
            name: track.name,
            uri: track.uri,
            duration: track.duration_ms,
            album: track.album.name,
            album_artists: track.album.artists.map(artist => artist.name),
            artists: track.artists.map(artist => artist.name)
          }))
      });
    })
    .catch(err => {
      console.log("Something went wrong with searching for tracks", err);
    });
});
