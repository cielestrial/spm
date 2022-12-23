const SpotifyWebApi = require("spotify-web-api-node");
const spotifyApi = new SpotifyWebApi({
  redirectUri: "http://localhost:3000",
  clientId: process.env.SPOTIFY_API_CLIENT,
  clientSecret: process.env.SPOTIFY_API_SECRET,
});

const maxGetLimit = 50;
const maxPostLimit = 100;
const maxOffset = 1000;
let accessToken;
let refreshToken;
let expriresIn;
let userId;
let country;
let premium;

/**
 * List of endpoints:
 *
 * login
 * user
 */

/**
 * Handle Rate Limit
 */
const rateLimit = (err, res) => {
  if (err.statusCode === 429) {
    console.log(err.headers["retry-after"]);
    res.json({
      errorCode: err.statusCode,
      retryAfter: err.headers["retry-after"],
    });
  } else if (err.statusCode === 400 || err.statusCode === 401) {
    spotifyApi
      .refreshAccessToken()
      .then((data) => {
        accessToken = data.body.access_token;
        expriresIn = data.body.expires_in;
        spotifyApi.setAccessToken(accessToken);
        res.json(true);
      })
      .catch((err) => {
        console.error(
          "Something went wrong with refreshing accessToken\n",
          err
        );
        res.json({
          errorCode: err.statusCode,
        });
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
    .then((data) => {
      accessToken = data.body.access_token;
      refreshToken = data.body.refresh_token;
      expriresIn = data.body.expires_in;
      spotifyApi.setAccessToken(accessToken);
      spotifyApi.setRefreshToken(refreshToken);
      res.json(true);
    })
    .catch((err) => {
      rateLimit(err, res);
    });
};

/**
 * Get UserId, display name, and country
 */
const getUser = (req, res) => {
  spotifyApi
    .getMe()
    .then((data) => {
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
        premium,
        "image:",
        data.body.images[0].url
      );
      res.json({
        display_name: data.body.display_name,
        display_image: data.body.images[0].url,
        premium: premium,
      });
    })
    .catch((err) => {
      console.error("Something went wrong with user\n", err);
    });
};

module.exports = {
  login,
  getUser,
  rateLimit,
  spotifyApi,
  userId,
  country,
  maxGetLimit,
  maxPostLimit,
  maxOffset,
};
