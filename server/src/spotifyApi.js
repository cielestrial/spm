const SpotifyWebApi = require("spotify-web-api-node");

const redirectUri = "https://yspm-ccnd.onrender.com/"; //http://localhost:3000
const clientId = process.env.SPOTIFY_API_CLIENT;
const clientSecret = process.env.SPOTIFY_API_SECRET;

const spotifyApi = new SpotifyWebApi({
  redirectUri,
  clientId,
  clientSecret,
});

const maxGetLimit = 50;
const maxPostLimit = 100;
const maxOffset = 1000;
let accessToken = { value: "" };
let tokenType = { value: "" };
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
  } else
    res.json({
      errorCode: err.statusCode,
      error: err.message,
    });
};

/**
 * Get Access Token
 */
const login = (req, res) => {
  console.log(req.body);

  accessToken.value = req.body.access_token;
  tokenType.value = req.body.token_type;
  expriresIn.value = req.body.expires_in;
  spotifyApi.setAccessToken(accessToken.value);
  res.json(true);
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
      res.json(err);
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
