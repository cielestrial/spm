const { spotifyApi, rateLimit, maxGetLimit } = require("./spotifyApi.js");

/**
 * List of endpoints:
 *
 * playlists
 * create
 * follow
 * unfollow
 */

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
      limit: limit,
    })
    .then((data) => {
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
        list: data.body.items.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          owner: playlist.owner.display_name,
          uri: playlist.uri,
          snapshot: playlist.snapshot_id,
          total: playlist.tracks.total,
        })),
      });
    })
    .catch((err) => {
      console.error("Something went wrong with retrieving playlists\n", err);
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
    .then((data) => {
      console.log("Successfully created playlists", data.body.name);
      res.json({
        id: data.body.id,
        name: data.body.name,
        owner: data.body.owner.display_name,
        uri: data.body.uri,
        snapshot: data.body.snapshot_id,
        total: data.body.tracks.total,
      });
    })
    .catch((err) => {
      console.error("Something went wrong with playlist creation\n", err);
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
    .then((data) => {
      console.log("Successfully unfollowed playlist");
      res.json(true);
    })
    .catch((err) => {
      console.error(
        "Something went wrong with unfollowing the playlist\n",
        err
      );
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
    .then((data) => {
      console.log("Successfully followed playlist");
      res.json(true);
    })
    .catch((err) => {
      console.error("Something went wrong with following the playlist\n", err);
      rateLimit(err, res);
    });
};

module.exports = {
  getPlaylists,
  create,
  follow,
  unfollow,
};
