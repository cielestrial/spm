const LastFmNode = require("lastfm").LastFmNode;
const CaN = require("./misc/genreBlacklist.cjs");
const Filter = require("bad-words");
const artistMasterList = new Map();
const {
  userId,
  spotifyApi,
  rateLimit,
  maxGetLimit,
} = require("./spotifyApi.cjs");

const lastFm = new LastFmNode({
  api_key: process.env.LASTFM_API_CLIENT,
  secret: process.env.LASTFM_API_CLIENT,
  useragent: "YSPM/" + userId.value,
});

const filter = new Filter();
filter.addWords(...CaN.country_list);
filter.addWords(...CaN.nationalities);
filter.addWords(...CaN.misc);

/**
 * https://yarnpkg.com/package/lastfm
 */

/**
 * List of endpoints:
 *
 * genres
 * reset-genres
 */

const lowerConfidenceBound = 100;
const top_x = 1;

const getArtistGenres = (req, res) => {
  const artist = req.body.artist;

  if (!artistMasterList.has(artist)) {
    artistMasterList.set(artist, undefined);
    filter.addWords(...req.body.genreBlacklist);

    let confidenceResult = [{}];
    lastFm.request("artist.getTopTags", {
      artist,
      handlers: {
        success: (data) => {
          confidenceResult = data.toptags.tag
            .filter(
              (toptags) =>
                toptags.count >= lowerConfidenceBound &&
                !filter.isProfane(toptags.name.toLowerCase())
            )
            .slice(0, top_x);
          console.log("Genre for", artist, "is ", confidenceResult);
          artistMasterList.set(artist, confidenceResult);
          res.json(confidenceResult);
        },
        error: (err) => {
          console.error("Error getting genre for", artist, "\n", err);
          if (err.statusCode === 429) rateLimit(err, res);
          else res.json(undefined);
        },
      },
    });
  } else res.json(artistMasterList.get(artist));
};

const getArtistsGenres = (req, res) => {
  const artists = req.body.artists;
  spotifyApi
    .getArtists(artists)
    .then((data) => {
      console.log(
        "Artists' genres retrieved",
        "Size:",
        artists.length,
        "Limit:",
        maxGetLimit
      );
      res.json({
        list: data.body.artists
          .filter((artist) => artist.genres.length > 0)
          .map((artist) => ({
            name: artist.name,
            id: artist.id,
            genres: artist.genres,
          })),
      });
    })
    .catch((err) => {
      console.error(
        "Something went wrong with getting artists' genres",
        artists
      );
      rateLimit(err, res);
    });
};

const resetArtistGenres = (req, res) => {
  artistMasterList.clear();
  res.json("success");
};

module.exports = { getArtistGenres, getArtistsGenres, resetArtistGenres };
