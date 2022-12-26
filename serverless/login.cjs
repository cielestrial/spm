const SpotifyWebApi = require("spotify-web-api-node");
const spotifyApi = new SpotifyWebApi({
  redirectUri: "https://yspm.netlify.app",
  clientId: process.env.SPOTIFY_API_CLIENT,
  clientSecret: process.env.SPOTIFY_API_SECRET,
});

let accessToken;
let refreshToken;
let expriresIn;
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

module.exports.handler = login;
