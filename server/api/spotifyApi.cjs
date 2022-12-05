const SpotifyWebApi = require("spotify-web-api-node");
const spotifyApi = new SpotifyWebApi({
  redirectUri: "http://localhost:3000",
  clientId: "d03dd28afb3f40d1aad5e6a45d9bff7f",
  clientSecret: "e75eb0904b534609ac65376077d10329"
});

/**
 * List of endpoints:
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
 * /genres
 */

const maxGetLimit = 50;
const maxPostLimit = 100;
let accessToken;
let refreshToken;
let expriresIn;
let userId;
let country;
let premium;

/**
 * Handle Rate Limit
 */
const rateLimit = (err, res) => {
  if (err.statusCode === 429) {
    res.json({
      errorCode: err.statusCode,
      retryAfter: err.headers["retry-after"]
    });
  } else if (err.statusCode === 400) {
    spotifyApi
      .refreshAccessToken()
      .then(data => {
        accessToken = data.body.access_token;
        expriresIn = data.body.expires_in;
        spotifyApi.setAccessToken(accessToken);
        res.json({
          accessToken: accessToken,
          refreshToken: refreshToken,
          expriresIn: expriresIn
        });
      })
      .catch(err => {
        console.log("Something went wrong with refreshing accessToken", err);
      });
  }
};

/**
 * Get Access Token
 */
const login = (req, res) => {
  const code = req.body.code;
  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      accessToken = data.body.access_token;
      refreshToken = data.body.refresh_token;
      expriresIn = data.body.expires_in;
      spotifyApi.setAccessToken(accessToken);
      spotifyApi.setRefreshToken(refreshToken);
      res.json({
        accessToken: accessToken,
        refreshToken: refreshToken,
        expriresIn: expriresIn
      });
    })
    .catch(err => {
      console.log("Something went wrong with accessToken", err);
      rateLimit(err, res);
    });
};

/**
 * Get UserId, display name, and country
 */
const getUser = (req, res) => {
  spotifyApi
    .getMe()
    .then(data => {
      userId = data.body.id;
      country = data.body.country;
      premium = data.body.product === "premium" ? true : false;
      console.log(
        "Some information about the authenticated user:",
        "userId:",
        userId,
        "display_name:",
        data.body.display_name,
        "country:",
        country,
        "premium:",
        premium
      );
      res.json({
        display_name: data.body.display_name,
        premium: premium
      });
    })
    .catch(err => {
      console.log("Something went wrong with user", err);
    });
};

/**
 * Get user's playlists
 */
const getPlaylists = (req, res) => {
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
      rateLimit(err, res);
    });
};

/**
 * Create new playlist
 */
const create = (req, res) => {
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
      rateLimit(err, res);
    });
};

/**
 * Add tracks to a specific position in a playlist
 */
const add = (req, res) => {
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
      rateLimit(err, res);
    });
};

/**
 * Remove all occurances of a track from a playlist
 */
const remove = (req, res) => {
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
    .removeTracksFromPlaylist(playlistId, uris, { snapshot_id: snapshot })
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
      rateLimit(err, res);
    });
};

/**
 * Unfollow a playlist
 */
const unfollow = (req, res) => {
  const playlistId = req.body.playlistId;
  spotifyApi
    .unfollowPlaylist(playlistId)
    .then(data => {
      console.log("Successfully unfollowed playlist");
      res.json("success");
    })
    .catch(err => {
      console.log("Something went wrong with unfollowing the playlist", err);
      rateLimit(err, res);
    });
};

/**
 * Follow a playlist
 */
const follow = (req, res) => {
  const playlistId = req.body.playlistId;
  spotifyApi
    .followPlaylist(playlistId)
    .then(data => {
      console.log("Successfully followed playlist");
      res.json("success");
    })
    .catch(err => {
      console.log("Something went wrong with following the playlist", err);
      rateLimit(err, res);
    });
};

/**
 * Get tracks in a playlist
 */
const getTracks = (req, res) => {
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
      rateLimit(err, res);
    });
};

/**
 * Search general playlists
 */
const searchPlaylists = (req, res) => {
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
      rateLimit(err, res);
    });
};

/**
 * Search general tracks
 */
const searchTracks = (req, res) => {
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
      rateLimit(err, res);
    });
};

module.exports = {
  login,
  getUser,
  getPlaylists,
  getTracks,
  add,
  create,
  remove,
  follow,
  unfollow,
  searchPlaylists,
  searchTracks,
  userId,
  rateLimit
};
