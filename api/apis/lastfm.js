const { spotifyApi, rateLimit, maxGetLimit } = require("./spotifyApi.js");

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

module.exports = { getArtistsGenres };
