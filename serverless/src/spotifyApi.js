const { json } = require("body-parser");
const SpotifyWebApi = require("spotify-web-api-node");
const spotifyApi = new SpotifyWebApi({
  redirectUri: "https://yspm-ccnd.onrender.com/index.html",
  clientId: process.env.SPOTIFY_API_CLIENT,
  clientSecret: process.env.SPOTIFY_API_SECRET,
});

const maxGetLimit = 50;
const maxPostLimit = 100;
const maxOffset = 1000;
let accessToken = { value: "" };
let refreshToken = { value: "" };
let expriresIn = { value: "" };
let userId = { value: "" };
let country = { value: "" };
let premium = { value: "" };

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
        accessToken.value = data.body.access_token;
        expriresIn.value = data.body.expires_in;
        spotifyApi.setAccessToken(accessToken.value);
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
      accessToken.value = data.body.access_token;
      refreshToken.value = data.body.refresh_token;
      expriresIn.value = data.body.expires_in;
      spotifyApi.setAccessToken(accessToken.value);
      spotifyApi.setRefreshToken(refreshToken.value);
      res.json(true);
    })
    .catch((err) => {
      console.error("Something went wrong with auth\n", err);
      res.json(err);
    });
};

/**
 * Get UserId, display name, and country
 */
const getUser = (req, res) => {
  spotifyApi
    .getMe()
    .then((data) => {
      userId.value = data.body.id;
      country.value = data.body.country;
      premium.value = data.body.product === "premium" ? true : false;
      console.log(
        "Some information about the authenticated user:",
        "userId:",
        userId.value,
        "display_name:",
        data.body.display_name,
        "country:",
        country.value,
        "premium:",
        premium.value,
        "image:",
        data.body.images[0].url
      );
      res.json({
        display_name: data.body.display_name,
        display_image: data.body.images[0].url,
        premium: premium.value,
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
  country,
  maxGetLimit,
  maxPostLimit,
  maxOffset,
};
