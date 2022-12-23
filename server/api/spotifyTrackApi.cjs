const {
  spotifyApi,
  rateLimit,
  country,
  maxGetLimit,
  maxPostLimit,
} = require("./spotifyApi.cjs");
/**
 * List of endpoints:
 *
 * add
 * remove
 * tracks
 */

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
    .then((data) => {
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
    .catch((err) => {
      console.error(
        "Something went wrong with adding songs to playlist\n",
        err
      );
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
    .then((data) => {
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
    .catch((err) => {
      console.error(
        "Something went wrong with removing songs from playlist",
        err
      );
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
        "offset, total",
    })
    .then((data) => {
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
        list: data.body.items.map((track) => ({
          is_local: track.is_local,
          is_playable: track.track.is_playable,
          id: track.track.id,
          name: track.track.name,
          uri: track.track.uri,
          linked_from:
            track.track.linked_from !== undefined
              ? {
                  id: track.track.linked_from.id,
                  uri: track.track.linked_from.uri,
                }
              : undefined,
          duration: track.track.duration_ms,
          album: track.track.album.name,
          album_artists: track.track.album.artists.map((artist) => artist.name),
          artists: track.track.artists.map((artist) => artist.name),
        })),
      });
    })
    .catch((err) => {
      console.error("Something went wrong with retrieving tracks\n", err);
      rateLimit(err, res);
    });
};

module.exports = {
  add,
  remove,
  getTracks,
};
