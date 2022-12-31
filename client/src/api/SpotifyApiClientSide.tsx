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

export const wakeUp = async () => {
  try {
    const res = await axios.get(server + "/wakeup");
    return res.data;
  } catch (err) {
    console.error("Something went wrong with wakeUp()\n", err);
    return "Failed to wake";
  }
};

/**
 * Get access token
 * @returns
 */
export const getToken = async (
  codeRef: React.MutableRefObject<string | null>
) => {
  if (codeRef.current === null) throw new Error("Null code");
  try {
    const res = await axios.post(server + "/login", { code: codeRef.current });
    if (res.data !== true) {
      console.error("Could not get token\n", res.data);
      return false;
    }
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
    if (res.data === undefined || res.data.display_name === undefined) {
      console.error("Failed to get user info\n", res.data);
      return null;
    }
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