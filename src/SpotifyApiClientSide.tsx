import axios from "axios";
import { token, userInfo } from "./pages/Dashboard";
import { generatePlaylistKey, generateTrackKey } from "./HelperFunctions";
import { code } from "./pages/LandingPage";
import {
  uniqueType,
  optionsType,
  playlistsType,
  playlistType,
  tokenType,
  tracksType,
  userInfoType,
  duplicateType
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

const server = "http://localhost:8080";
export const duplicateManager = new Map<string, uniqueType>();
let playlists: playlistsType;
const options: optionsType = { offset: 0, limit: 0 };
const getLimit = 50;
const postLimit = 50;
/**
 * Get access token
 * @returns
 */
export const getToken = async () => {
  if (code === null) throw new Error();
  if (token?.accessToken !== undefined) return token;
  let tokenTemp = {} as tokenType;
  try {
    const res = await axios.post(server + "/login", { code });
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
    const res = await axios.post(server + "/user");
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
  options.limit = getLimit;
  try {
    const res = await axios.post(server + "/playlists", {
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
    const res = await axios.post(server + "/playlists", {
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
 * @returns playlistType
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
  options.limit = getLimit;
  for (let i = 0; i < 2; i++) {
    try {
      const res = await axios.post(server + "/tracks", {
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
      // Duplicate manager
      if (playlists?.list.some(pl => pl.id === playlist?.id && i === 0)) {
        getOccurances(playlist);
        if (playlist.owner === userInfo?.display_name) {
          const originals: string[] = await removeDuplicates(playlist);
          if (originals.length > 0) {
            await addTracksToPlaylist(playlist, originals);
          } else break;
        } else break;
      } else break;
    }
  }
  if (playlist.tracks !== undefined) {
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
    const res = await axios.post(server + "/tracks", {
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
 * Records all occurances of a track
 */
const getOccurances = (playlist: playlistType) => {
  let uniqueTrack: uniqueType;
  let trackKey: string;
  let playlistKey = generatePlaylistKey(playlist);

  playlist.tracks?.forEach(track => {
    trackKey = generateTrackKey(track);
    if (!duplicateManager.has(trackKey)) {
      uniqueTrack = {} as uniqueType;
      uniqueTrack.track = track;
      uniqueTrack.occurances = 1;
      uniqueTrack.duplicate_uris = [];
      uniqueTrack.in_playlists = new Map<string, playlistType>();
      uniqueTrack.in_playlists.set(playlistKey, playlist);
      duplicateManager.set(trackKey, uniqueTrack);
    } else {
      uniqueTrack = duplicateManager.get(trackKey) as uniqueType;
      uniqueTrack.occurances++;
      if (!uniqueTrack.in_playlists.has(playlistKey))
        uniqueTrack.in_playlists.set(playlistKey, playlist);
      else uniqueTrack.duplicate_uris.push({ uri: track.uri });
    }
  });
};

/**
 * Check if duplicate or unique
 * @param track The track being tested.
 * @param playlist The playlist the track will belong to.
 * @returns true, if track will be unique in provided playlist. Otherwise, returns false.
 */
const isUnique = (track: tracksType, playlist: playlistType) => {
  return !duplicateManager.has(generateTrackKey(track))
    ? true
    : !(
        duplicateManager.get(generateTrackKey(track)) as uniqueType
      ).in_playlists.has(generatePlaylistKey(playlist));
};

/**
 * Removes duplicates from a playlist.
 * @param playlist The playlist the track belongs to.
 * @returns string[] of unique occurances
 */
export const removeDuplicates = async (playlist: playlistType) => {
  if (playlist === undefined) throw new Error("Playlist not defined");

  //max 100 in one request
  const playlistId = playlist.id;
  const snapshot = playlist.snapshot;
  let allOriginals: string[] = [];
  let allUris: duplicateType[] = [];
  duplicateManager.forEach(uniqueTrack => {
    if (uniqueTrack.duplicate_uris.length > 0) {
      allUris = allUris.concat(uniqueTrack.duplicate_uris);
      uniqueTrack.occurances -= uniqueTrack.duplicate_uris.length;
      uniqueTrack.duplicate_uris = [];
      allOriginals.push(uniqueTrack.track.uri);
    }
  });
  const total = allUris.length;
  if (total === 0) return [];
  let newOffset: Promise<number> | number = 0;
  let uris, res;
  options.limit = postLimit;
  try {
    do {
      options.offset = newOffset;
      uris = allUris.slice(
        newOffset as number,
        (newOffset as number) + postLimit
      );
      res = await axios.post(server + "/remove", {
        playlistId,
        uris,
        total,
        options,
        snapshot
      });
      playlist.snapshot = res.data.snapshot;
      playlist.total -= uris.length;
      newOffset = (newOffset as number) + postLimit;
    } while (0 < newOffset && newOffset < total);
    playlist.total -= allOriginals.length;
  } catch (err) {
    console.log("Something went wrong with removeDuplicates()", err);
  }
  return allOriginals;
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
    const res = await axios.post(server + "/create", {
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
            snapshot: res.data.snapshot,
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
        snapshot: res.data.snapshot,
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
  if (target === undefined) throw new Error("Couldn't find target playlist");

  const tracks = await getTracks(source);
  const uris = tracks?.tracks
    ?.filter(track => isUnique(track, target))
    .map(track => track.uri);
  return await addTracksToPlaylist(target, uris);
};

/**
 * Add tracks to playlist
 * @returns
 */
export const addTracksToPlaylist = async (
  playlist: playlistType,
  allUris: string[] | undefined // Make sure the uris go through duplicate manager filtering
) => {
  let status = false;
  if (allUris === undefined) throw new Error("Couldn't retrieve track uris");
  const playlistId = playlist.id;
  const total = allUris.length;
  if (total === 0) return status;
  let uris, res;
  let newOffset: Promise<number> | number = 0;
  options.limit = postLimit;
  try {
    do {
      options.offset = newOffset;
      uris = allUris.slice(
        newOffset as number,
        (newOffset as number) + postLimit
      );
      res = await axios.post(server + "/add", {
        playlistId,
        uris,
        total,
        options
      });
      playlist.snapshot = res.data.snapshot;
      playlist.total += uris.length;
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
    await axios.post(server + "/unfollow", { playlistId });
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
    await axios.post(server + "/follow", { playlistId });
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
  options.limit = getLimit;
  try {
    const res = await axios.post(server + "/search-playlists", {
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
    const res = await axios.post(server + "/search-playlists", {
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

/**
 * General search for tracks
 * @param querySearch
 * @returns
 */
export const generalTracksSearch = async (querySearch: string) => {
  if (querySearch === "") throw new Error("Invalid query search");
  const maxOffset = 50; // 1000
  let queriedTracks = {} as playlistType;
  let newOffset: Promise<number> | number = 0;
  options.offset = 0;
  options.limit = getLimit;
  try {
    const res = await axios.post(server + "/search-tracks", {
      querySearch,
      options
    });
    queriedTracks.name = "search results";
    queriedTracks.total = res.data.total;
    queriedTracks.tracks = res.data.list;

    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.log("Something went wrong with generalTracksSearch()", err);
  }
  if (queriedTracks !== undefined) {
    while (0 < newOffset && newOffset < maxOffset) {
      console.log("happening");
      newOffset = await appendGeneralTracksSearch(
        querySearch,
        queriedTracks,
        newOffset
      );
    }
    return queriedTracks;
  } else throw new Error("Failed general tracks search");
};

/**
 * Append remaining general searched tracks
 * @returns
 */
const appendGeneralTracksSearch = async (
  querySearch: string,
  queriedTracks: playlistType,
  newOffset: Promise<number> | number
) => {
  options.offset = newOffset;
  try {
    const res = await axios.post(server + "/search-tracks", {
      querySearch,
      options
    });
    res.data.list.forEach((track: tracksType) =>
      queriedTracks?.tracks?.push(track)
    );
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.log("Something went wrong with appendGeneralTracksSearch()", err);
  }
  return newOffset;
};
