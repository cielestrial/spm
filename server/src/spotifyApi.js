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
      const display_name =
        data.body.display_name === undefined || data.body.display_name === null
          ? "Anon"
          : data.body.display_name;
      const display_image =
        data.body.images === undefined || data.body.images?.length === 0
          ? null
          : data.body.images[0].url;
      console.log(
        "Some information about the authenticated user:",
        "userId:",
        userId.value,
        "display_name:",
        display_name,
        "country:",
        country.value,
        "premium:",
        premium.value,
        "image:",
        display_image
      );
      res.json({
        display_name: display_name,
        display_image: display_image,
        premium: premium.value,
      });
    })
    .catch((err) => {
      console.error("Something went wrong with user\n", err);
      res.json({ status: "error", error: err });
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
