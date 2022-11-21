import axios from "axios";
import { code } from "./LandingPage";
import {
  optionsType,
  playlistsType,
  playlistType,
  tracksType
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
  "user-library-read";
export const AUTH_URL =
  "https://accounts.spotify.com/authorize?" +
  "client_id=d03dd28afb3f40d1aad5e6a45d9bff7f" +
  "&response_type=code" +
  scope +
  "&redirect_uri=http://localhost:3000" +
  "&state=" +
  crypto.randomUUID() +
  "&show_dialog=true";
export let accessToken: string | undefined;
export let refreshToken: string | undefined;
export let expiresIn: string | undefined;
let playlists: playlistsType;
const options: optionsType = { offset: 0 };
const getLimit = 50;
const postLimit = 15;
/**
 * Get access token
 * @returns
 */
export const getToken = async () => {
  if (code === null) return undefined;
  if (accessToken !== undefined) return accessToken;
  try {
    const res = await axios.post("http://localhost:8080/login", { code });
    accessToken = res.data.accessToken;
    refreshToken = res.data.refreshToken;
    expiresIn = res.data.expriresIn;
  } catch (err) {
    console.log("Something went wrong with getToken()", err);
  }
  return accessToken;
};

/**
 * Get a user's playlists
 * @returns
 */
export const getPlaylists = async () => {
  if (playlists !== undefined) {
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
  } else {
    console.log("Failed to retrieve playlists");
    return undefined;
  }
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
export const getTracks = async (playlistId: string | undefined) => {
  const playlist = playlists?.list.find(playlist => playlist.id === playlistId);
  if (playlist === undefined) {
    console.log("Couldn't find playlist with id:", playlistId);
    return undefined;
  }
  if (
    playlist.tracks !== undefined &&
    playlist.total === playlist.tracks.length
  ) {
    console.log("Tracks retrieved from client");
    return playlist;
  }
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
  } else {
    console.log("Failed to retrieve tracks");
    return undefined;
  }
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
 * Playlist exists check
 * @param name
 * @returns
 */
export const checkIfPlaylistExists = (name: string) => {
  if (playlists === undefined) return undefined;
  let playlist: playlistType | undefined;
  if (
    !playlists.list.some(pl => {
      playlist = pl;
      return (
        name.localeCompare(pl.name, undefined, {
          sensitivity: "accent",
          ignorePunctuation: true
        }) === 0
      );
    })
  )
    playlist = undefined;
  return playlist;
};

/**
 * Create a playlist
 * @param name
 * @returns
 */
export const createPlaylist = async (name: string | undefined) => {
  if (name === "" || name === undefined) {
    console.log("Invalid playlist name");
    return undefined;
  }
  let playlist = checkIfPlaylistExists(name);
  if (playlist !== undefined) {
    console.log("Playlist", name, "already exists");
    return playlist;
  }
  try {
    const res = await axios.post("http://localhost:8080/create", {
      name,
      description: "Generated by YSPM."
    });
    if (playlists === undefined)
      playlists = {
        total: 0,
        list: [
          {
            id: res.data.id,
            name: res.data.name,
            uri: res.data.uri,
            total: res.data.total,
            tracks: undefined
          }
        ]
      };
    else {
      playlists.list.unshift({
        id: res.data.id,
        name: res.data.name,
        uri: res.data.uri,
        total: res.data.total,
        tracks: undefined
      });
    }
    playlists.total = playlists.list.length;
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
  sourceId: string | undefined,
  targetId: string | undefined
) => {
  if (sourceId === undefined) {
    console.log("Couldn't find playlist with id:", sourceId);
    return false;
  }
  const tracks = await getTracks(sourceId);
  const uris = tracks?.tracks?.map(track => track.uri);
  return await addTracksToPlaylist(targetId, uris);
};

/**
 * Add tracks to playlist
 * @returns
 */
export const addTracksToPlaylist = async (
  playlistId: string | undefined,
  allUris: string[] | undefined
) => {
  let status = false;
  const playlist = playlists?.list.find(playlist => playlist.id === playlistId);
  if (playlist === undefined) {
    console.log("Couldn't find playlist with id:", playlistId);
    return status;
  }
  if (allUris === undefined) {
    console.log("Couldn't retrieve track uris");
    return status;
  }
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
  if (playlistId === undefined) {
    console.log("Playlist id undefined");
    return false;
  }
  try {
    await axios.post("http://localhost:8080/unfollow", { playlistId });
    if (playlists !== undefined) {
      const index = playlists.list.findIndex(pl => pl.id === playlistId);
      if (index > -1) {
        playlists.list.splice(index, 1);
        playlists.total = playlists.list.length;
      }
    }
  } catch (err) {
    console.log("Something went wrong with unfollowPlaylist()", err);
  }
  if (playlists !== undefined) {
    return true;
  } else return false;
};

/**
 * Get the authenticated user
 * @returns

export const getAuthenticatedUser = async () => {
  try {
  const res = await axios
    .post("http://localhost:8080/user");
userId = res.data.userId;
  }catch(err) {
      console.log("Something went wrong with getAuthenticatedUser()", err);
    };

  return userId;
};
 */
