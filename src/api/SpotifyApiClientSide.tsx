import axios, { AxiosResponse } from "axios";
import { server } from "./ApiClientData";
import { setRetryAfterSpotify } from "./QueryApi";
import { userInfoType } from "./SpotifyApiClientTypes";

/**
 * Handle Rate limit Spotify
 */
export const rateLimitSpotify = async (res: AxiosResponse<any, any>) => {
  if (res.data.errorCode === 429) {
    setRetryAfterSpotify(res.data.retryAfter);
    throw new Error(
      "Rate limit hit for spotify. Wait for " + res.data.retryAfter
    );
  } else if (res.data.errorCode === 400 || res.data.errorCode === 401) {
    throw new Error(
      "Token expired and could not be refreshed." +
        "\n" +
        "Returning to landing page."
    );
  }
};

/**
 * Get access token
 * @returns
 */
export const getToken = async (code: string | null) => {
  if (code === null) throw new Error();
  try {
    const res = await axios.post(server + "/login", { code });
    if (res.data !== true) return false;
  } catch (err) {
    console.error("Something went wrong with getToken()\n", err);
    return false;
  }
  return true;
};

/**
 * Get the authenticated user info
 * @returns
 */
export const getAuthenticatedUserInfo = async () => {
  let userInfo: userInfoType | undefined | null = null;
  try {
    const res = await axios.post(server + "/user");
    if (res.data === undefined || res.data.display_name === undefined)
      return null;
    userInfo = {
      display_name: res.data.display_name,
      display_image: res.data.display_image,
      premium: res.data.premium,
    };
  } catch (err) {
    console.error(
      "Something went wrong with getAuthenticatedUserInfo()\n",
      err
    );
    return null;
  }
  return userInfo;
};

//export const playTrack = () => {};
