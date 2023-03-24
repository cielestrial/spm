import axios, { AxiosResponse } from "axios";
import { server } from "./ApiClientData";
import { implicit_grant } from "./ContextProvider";
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
export const sendToken = async (
  authRef: React.MutableRefObject<implicit_grant>
) => {
  if (authRef.current.access_token === null) throw new Error("No access token");
  try {
    const res = await axios.post(server + "/login", authRef.current);
    if (res.data !== true) {
      console.error("Could not send token\n", res.data);
      return false;
    }
  } catch (err) {
    console.error("Something went wrong with sendToken()\n", err);
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
      console.error(
        "Failed to get user info",
        "\ndisplay_name: " + res.data.display_name,
        "\nresponse data: " + res.data
      );
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
