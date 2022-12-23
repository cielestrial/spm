const {
  spotifyApi,
  rateLimit,
  country,
  maxGetLimit,
  maxOffset,
} = require("./spotifyApi.cjs");

/**
 * List of endpoints:
 *
 * search-playlists
 * search-tracks
 */

/**
 * Search general playlists
 */
const searchPlaylists = (req, res) => {
  const offset = req.body.options.offset;
  if (offset > maxOffset) res.json(undefined);
  else {
    const query = req.body.querySearch;
    const limit =
      req.body.options.limit < maxGetLimit
        ? req.body.options.limit
        : maxGetLimit;
    spotifyApi
      .searchPlaylists(query, {
        market: country,
        offset: offset,
        limit: limit,
        include_external: "audio",
      })
      .then((data) => {
        console.log("Found playlists", data.body.playlists.total);
        res.json({
          total: data.body.playlists.total,
          list: data.body.playlists.items.map((playlist) => ({
            id: playlist.id,
            name: playlist.name,
            owner: playlist.owner.display_name,
            uri: playlist.uri,
            total: playlist.tracks.total,
          })),
        });
      })
      .catch((err) => {
        console.log("Something went wrong with searching for playlists\n", err);
        rateLimit(err, res);
      });
  }
};

/**
 * Search general tracks
 */
const searchTracks = (req, res) => {
  const offset = req.body.options.offset;
  if (offset > maxOffset) res.json(undefined);
  else {
    const query = req.body.querySearch;
    const limit =
      req.body.options.limit < maxGetLimit
        ? req.body.options.limit
        : maxGetLimit;
    spotifyApi
      .searchTracks(query, {
        market: country,
        offset: offset,
        limit: limit,
        include_external: "audio",
      })
      .then((data) => {
        console.log("Found tracks", data.body.tracks.total);
        res.json({
          total: data.body.tracks.total,
          list: data.body.tracks.items
            .filter((tr) => !tr.is_local && tr.is_playable)
            .map((track) => ({
              is_local: track.is_local,
              is_playable: track.is_playable,
              id: track.id,
              name: track.name,
              uri: track.uri,
              duration: track.duration_ms,
              album: track.album.name,
              album_artists: track.album.artists.map((artist) => artist.name),
              artists: track.artists.map((artist) => artist.name),
            })),
        });
      })
      .catch((err) => {
        console.log("Something went wrong with searching for tracks\n", err);
        rateLimit(err, res);
      });
  }
};

module.exports = {
  searchPlaylists,
  searchTracks,
};
