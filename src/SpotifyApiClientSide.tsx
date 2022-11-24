import axios from "axios";
import { token } from "./Dashboard";
import { code } from "./LandingPage";
import {
  duplicateType,
  optionsType,
  playlistsType,
  playlistType,
  tokenType,
  tracksType,
  userInfoType
} from "./SpotifyApiClientTypes";

const scope =
  "&scope=" +
  "playlist-read-private" +
  "%20" +
  "playlist-modify-private" +
  "%20" +
  "playlist-modify-public" +
  "%20" +
  "user-library-modify" +
  "%20" +
  "user-library-read" +
  "%20" +
  "user-read-private";
export const AUTH_URL =
  "https://accounts.spotify.com/authorize?" +
  "client_id=d03dd28afb3f40d1aad5e6a45d9bff7f" +
  "&response_type=code" +
  scope +
  "&redirect_uri=http://localhost:3000" +
  "&state=" +
  crypto.randomUUID() +
  "&show_dialog=true";
let playlists: playlistsType;
let duplicateManager: duplicateType[];
const options: optionsType = { offset: 0 };
const getLimit = 50;
const postLimit = 15;
/**
 * Get access token
 * @returns
 */
export const getToken = async () => {
  if (code === null) throw new Error();
  if (token?.accessToken !== undefined) return token;
  let tokenTemp = {} as tokenType;
  try {
    const res = await axios.post("http://localhost:8080/login", { code });
    tokenTemp.accessToken = res.data.accessToken;
    tokenTemp.refreshToken = res.data.refreshToken;
    tokenTemp.expiresIn = res.data.expriresIn;
  } catch (err) {
    console.log("Something went wrong with getToken()", err);
  }
  return tokenTemp;
};

/**
 * Get the authenticated user info
 * @returns
 */
export const getAuthenticatedUserInfo = async () => {
  let userInfo: userInfoType | undefined = undefined;
  try {
    const res = await axios.post("http://localhost:8080/user");
    userInfo = {
      display_name: res.data.display_name
    };
  } catch (err) {
    console.log("Something went wrong with getAuthenticatedUserInfo()", err);
  }
  return userInfo;
};

/**
 * Get a user's playlists
 * @returns
 */
export const getPlaylists = async () => {
  if (playlists !== undefined && playlists.total === playlists.list.length) {
    console.log("Playlists retrieved from client");
    return playlists;
  }
  let newOffset: Promise<number> | number = 0;
  options.offset = 0;
  try {
    const res = await axios.post("http://localhost:8080/playlists", {
      options
    });
    playlists = {
      total: res.data.total,
      list: res.data.list
    };
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.log("Something went wrong with getPlaylists()", err);
  }
  if (playlists !== undefined) {
    while (0 < newOffset && newOffset < playlists.total) {
      console.log("happening");
      newOffset = await appendPlaylists(newOffset);
    }
    console.log("Playlists retrieved from server");
    return playlists;
  } else throw new Error("Failed to retrieve playlists");
};
/**
 * Append remaining playlists
 * @returns
 */
const appendPlaylists = async (newOffset: Promise<number> | number) => {
  options.offset = newOffset;
  try {
    const res = await axios.post("http://localhost:8080/playlists", {
      options
    });
    res.data.list.forEach((playlist: playlistType) =>
      playlists?.list.push(playlist)
    );
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.log("Something went wrong with appendPlaylists()", err);
  }
  return newOffset;
};

/**
 * Get tracks in a playlist
 * @returns
 */
export const getTracks = async (playlist: playlistType | undefined) => {
  if (playlist === undefined) throw new Error("Playlist not defined");
  if (
    playlist.tracks !== undefined &&
    playlist.total === playlist.tracks.length
  ) {
    console.log("Tracks retrieved from client");
    return playlist;
  }
  const playlistId = playlist.id;
  let newOffset: Promise<number> | number = 0;
  options.offset = 0;
  try {
    const res = await axios.post("http://localhost:8080/tracks", {
      playlistId,
      options
    });
    playlist.tracks = res.data.list;
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.log("Something went wrong with getTracks()", err);
  }
  if (playlist.tracks !== undefined) {
    while (0 < newOffset && newOffset < playlist.total) {
      newOffset = await appendTracks(playlistId, playlist, newOffset);
    }
    console.log("Tracks retrieved from server");
    return playlist;
  } else throw new Error("Failed to retrieve tracks");
};

/**
 * Append remaining tracks
 * @returns
 */
const appendTracks = async (
  playlistId: string | undefined,
  playlist: playlistType,
  newOffset: Promise<number> | number
) => {
  options.offset = newOffset;
  try {
    const res = await axios.post("http://localhost:8080/tracks", {
      playlistId,
      options
    });
    res.data.list.forEach((track: tracksType) => playlist.tracks?.push(track));
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.log("Something went wrong with appendTracks()", err);
  }
  return newOffset;
};

/**
 * Get all tracks
 */
export const getAllTracks = async () => {
  if (playlists === undefined)
    throw new Error("Playlists has not been defined");
  let resStatus = true;
  try {
    playlists.list.forEach(async playlist => {
      await getTracks(playlist);
    });
  } catch (err) {
    resStatus = false;
  }
  return resStatus;
};

/**
 * Playlist exists check
 * @param name
 * @returns
 */
export const checkIfPlaylistExists = (name: string | undefined) => {
  if (playlists === undefined) return undefined;
  let playlist: playlistType | undefined = undefined;
  if (
    !playlists.list.some(pl => {
      playlist = pl;
      return (
        name?.localeCompare(pl.name, undefined, {
          sensitivity: "accent",
          ignorePunctuation: true
        }) === 0
      );
    })
  )
    return undefined;
  return playlist;
};

/**
 * Create a playlist
 * @param name
 * @returns
 */
export const createPlaylist = async (name: string | undefined) => {
  if (name === "" || name === undefined)
    throw new Error("Invalid playlist name");

  let playlist: playlistType | undefined = checkIfPlaylistExists(name);
  if (playlist !== undefined) {
    console.log("Playlist", name, "already exists");
    return playlist;
  }
  try {
    const res = await axios.post("http://localhost:8080/create", {
      name,
      description: "Generated by YSPM."
    });
    if (playlists === undefined) {
      playlists = {
        total: 0,
        list: [
          {
            id: res.data.id,
            name: res.data.name,
            uri: res.data.uri,
            owner: res.data.owner,
            total: res.data.total,
            tracks: undefined
          }
        ]
      };
    } else {
      playlists.list.unshift({
        id: res.data.id,
        name: res.data.name,
        uri: res.data.uri,
        owner: res.data.owner,
        total: res.data.total,
        tracks: undefined
      });
    }
    playlists.total++;
    playlist = playlists.list.find(pl => pl.name === name);
  } catch (err) {
    console.log("Something went wrong with createPlaylist()", err);
  }
  return playlist;
};

/**
 * Add playlist to playlist
 * @returns
 */
export const addPlaylistToPlaylist = async (
  source: playlistType,
  target: playlistType
) => {
  if (source === undefined) throw new Error("Couldn't find source playlist");

  const tracks = await getTracks(source);
  const uris = tracks?.tracks?.map(track => track.uri);
  return await addTracksToPlaylist(target, uris);
};

/**
 * Add tracks to playlist
 * @returns
 */
export const addTracksToPlaylist = async (
  playlist: playlistType,
  allUris: string[] | undefined
) => {
  let status = false;
  if (playlist === undefined) throw new Error("Couldn't find target playlist");

  if (allUris === undefined) throw new Error("Couldn't retrieve track uris");
  const playlistId = playlist.id;
  const total = allUris.length;
  console.log("total", total);
  let uris,
    newOffset: Promise<number> | number = 0;
  try {
    do {
      options.offset = newOffset;
      uris = allUris.slice(
        newOffset as number,
        (newOffset as number) + postLimit
      );
      await axios.post("http://localhost:8080/add", {
        playlistId,
        uris,
        total,
        options
      });
      playlist.total = playlist.total + uris.length;
      newOffset = (newOffset as number) + postLimit;
    } while (0 < newOffset && newOffset < total);
    status = true;
  } catch (err) {
    console.log("Something went wrong with addTracksToPlaylist()", err);
  }
  return status;
};

/**
 * Unfollow a playlist
 * @returns
 */
export const unfollowPlaylist = async (playlistId: string | undefined) => {
  if (playlistId === undefined) throw new Error("Playlist id undefined");
  let status = false;
  try {
    await axios.post("http://localhost:8080/unfollow", { playlistId });
    if (playlists !== undefined) {
      const index = playlists.list.findIndex(pl => pl.id === playlistId);
      if (index > -1) {
        playlists.list.splice(index, 1);
        playlists.total--;
        status = true;
      }
    }
  } catch (err) {
    console.log("Something went wrong with unfollowPlaylist()", err);
  }
  return status;
};

/**
 * Follow a playlist
 * @returns
 */
export const followPlaylist = async (playlistId: string | undefined) => {
  if (playlistId === undefined) throw new Error("Playlist id undefined");
  let status = false;
  try {
    await axios.post("http://localhost:8080/follow", { playlistId });
    if (playlists !== undefined) {
      playlists.total++;
      status = true;
    }
  } catch (err) {
    console.log("Something went wrong with followPlaylist()", err);
  }
  return status;
};

/**
 * General search for playlists
 * @param querySearch
 * @returns
 */
export const generalPlaylistsSearch = async (querySearch: string) => {
  if (querySearch === "") throw new Error("Invalid query search");
  const maxOffset = 50; // 1000
  let queriedPlaylists: playlistsType = undefined;
  let newOffset: Promise<number> | number = 0;
  options.offset = 0;
  try {
    const res = await axios.post("http://localhost:8080/search-playlists", {
      querySearch,
      options
    });
    queriedPlaylists = {
      total: res.data.total,
      list: res.data.list
    };
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.log("Something went wrong with generalPlaylistsSearch()", err);
  }
  if (queriedPlaylists !== undefined) {
    while (0 < newOffset && newOffset < maxOffset) {
      console.log("happening");
      newOffset = await appendGeneralPlaylistsSearch(
        querySearch,
        queriedPlaylists,
        newOffset
      );
    }
    return queriedPlaylists;
  } else throw new Error("Failed general playlists search");
};

/**
 * Append remaining general searched playlists
 * @returns
 */
const appendGeneralPlaylistsSearch = async (
  querySearch: string,
  queriedPlaylists: playlistsType,
  newOffset: Promise<number> | number
) => {
  options.offset = newOffset;
  try {
    const res = await axios.post("http://localhost:8080/search-playlists", {
      querySearch,
      options
    });
    res.data.list.forEach((playlist: playlistType) =>
      queriedPlaylists?.list.push(playlist)
    );
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.log(
      "Something went wrong with appendGeneralPlaylistsSearch()",
      err
    );
  }
  return newOffset;
};
