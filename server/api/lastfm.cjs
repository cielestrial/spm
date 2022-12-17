const LastFmNode = require("lastfm").LastFmNode;
const CaN = require("./misc/countriesAndNationalities.cjs");
const Filter = require("bad-words");
const { userId, rateLimit } = require("./spotifyApi.cjs");
const artistGenreMasterList = new Map();

const lastFm = new LastFmNode({
  api_key: "8439b97f6094e7c5bc2f90150fa9e090",
  secret: "2b124e2c7dd8dc3fa7496ef1574d9030",
  useragent: "YSPM/" + userId,
});

const filter = new Filter();
filter.addWords(...CaN.country_list);
filter.addWords(...CaN.nationalities);
filter.addWords(...CaN.misc);

/**
 * https://yarnpkg.com/package/lastfm
 */

const lowerConfidenceBound = 50;
const top_x = 3;

const getArtistGenres = (req, res) => {
  const artist = req.body.artist;

  if (!artistGenreMasterList.has(artist)) {
    artistGenreMasterList.set(artist, undefined);
    filter.addWords(...req.body.genreBlackList);

    let confidenceResult = [{}];
    lastFm.request("artist.getTopTags", {
      artist,
      handlers: {
        success: (data) => {
          confidenceResult = data.toptags.tag
            .filter(
              (toptags) =>
                toptags.count >= lowerConfidenceBound &&
                !filter.isProfane(toptags.name)
            )
            .slice(0, top_x);
          console.log("Genre for", artist, "is ", confidenceResult);
          artistGenreMasterList.set(artist, confidenceResult);
          res.json(confidenceResult);
        },
        error: (err) => {
          console.error("Error getting genre for", artist, "\n", err);
          if (err.statusCode === 429) rateLimit(err, res);
          else res.json(undefined);
        },
      },
    });
  } else res.json(artistGenreMasterList.get(artist));
};

const resetArtistGenres = (req, res) => {
  artistGenreMasterList.clear();
  res.json("success");
};

module.exports = { getArtistGenres, resetArtistGenres };
