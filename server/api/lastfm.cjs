const LastFmNode = require("lastfm").LastFmNode;
const CaN = require("./misc/genreBlacklist.cjs");
const Filter = require("bad-words");
const { userId, rateLimit } = require("./spotifyApi.cjs");
const artistMasterList = new Map();

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

const resetArtistGenres = (req, res) => {
  artistMasterList.clear();
  res.json("success");
};

module.exports = { getArtistGenres, resetArtistGenres };
