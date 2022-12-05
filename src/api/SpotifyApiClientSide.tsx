import axios, { AxiosResponse } from "axios";
import { token, userInfo } from "../pages/Dashboard";
import { generatePlaylistKey, generateTrackKey } from "./misc/HelperFunctions";
import { code } from "../pages/LandingPage";
import {
  uniqueType,
  optionsType,
  playlistsType,
  playlistType,
  tokenType,
  tracksType,
  userInfoType,
  duplicateType,
  occuranceType
} from "./SpotifyApiClientTypes";
import { genreBlackList } from "./misc/GenreBlackList";
import { TransferListItem } from "@mantine/core";
import { setRetryAfterLastfm, setRetryAfterSpotify } from "./QueryApi";
const scope =
  "&scope=" +
  "playlist-read-private" +
  "%20" +
  "playlist-modify-private" +
  "%20" +
  "playlist-modify-public" +
  "%20" +
  "playlist-read-collaborative" +
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
export const genreMasterList = new Map<string, number>();
export const updateWhitelist = (genres: TransferListItem[]) => {
  for (let i = genres.length - 1; i <= 0; i--)
    if (genreMasterList.has(genres[i].label))
      genreMasterList.delete(genres[i].label);
};
export const getWhitelist = () => {
  return Array.from(genreMasterList.entries())
    .sort((a, b) =>
      a[0].localeCompare(b[0], undefined, {
        sensitivity: "accent",
        ignorePunctuation: true
      })
    )
    .map(element => ({
      value: element[0],
      label: element[0]
    }));
};

let playlists: playlistsType;
const options: optionsType = { offset: 0, limit: 0 };
const getLimit = 50;
const postLimit = 100;

/**
 * Handle Rate limit Spotify
 */
const rateLimitSpotify = (res: AxiosResponse<any, any>) => {
  if (res.data.errorCode === 429) {
    setRetryAfterSpotify(res.data.retryAfter);
    throw new Error("Rate limit hit. Wait for " + res.data.retryAfter);
  }
};

/**
 * Handle Rate limit lastfm
 */
const rateLimitLastfm = (res: AxiosResponse<any, any>) => {
  if (res.data.errorCode === 429) {
    setRetryAfterLastfm(res.data.retryAfter);
    throw new Error("Rate limit hit. Wait for " + res.data.retryAfter);
  }
};

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
    return null;
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
      display_name: res.data.display_name,
      premium: res.data.premium
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
  if (playlists !== undefined && playlists.total === playlists.list.size) {
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
    rateLimitSpotify(res);
    playlists = {
      total: res.data.total,
      list: new Map<string, playlistType>(
        res.data.list.map((playlist: playlistType) => [
          generatePlaylistKey(playlist),
          playlist
        ])
      )
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
    rateLimitSpotify(res);
    for (const playlist of res.data.list)
      playlists?.list.set(generatePlaylistKey(playlist), playlist);
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
  for (let i = 0; i < 2; i++) {
    const playlistId = playlist.id;
    let newOffset: Promise<number> | number = 0;
    options.offset = 0;
    options.limit = getLimit;
    try {
      const res = await axios.post(server + "/tracks", {
        playlistId,
        options
      });
      rateLimitSpotify(res);
      playlist.tracks = res.data.list;
      if (playlist.genres === undefined)
        playlist.genres = new Map<string, number>();
      if (playlist.genreSubscriptions === undefined)
        playlist.genreSubscriptions = [];
      if (playlist.playlistSubscriptions === undefined)
        playlist.playlistSubscriptions = [];
      newOffset = (newOffset as number) + getLimit;
    } catch (err) {
      console.log("Something went wrong with getTracks()", err);
    }
    if (playlist.tracks !== undefined) {
      while (0 < newOffset && newOffset < playlist.total) {
        newOffset = await appendTracks(playlistId, playlist, newOffset);
      }
      // Duplicate manager
      if (playlists?.list.has(generatePlaylistKey(playlist)) && i === 0) {
        await getOccurances(playlist);
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
    playlist.total = playlist.tracks.length;
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
    rateLimitSpotify(res);
    for (const track of res.data.list) playlist.tracks?.push(track);
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
  const promises = [];
  try {
    /*
    for (const playlist of playlists.list.values())
      promises.push(getTracks(playlist));
    await Promise.all(promises);
    */
  } catch (err) {
    console.log(err);
    resStatus = false;
  }
  return resStatus;
};

/**
 * Records all occurances of a track
 */
const getOccurances = async (playlist: playlistType) => {
  let uniqueTrack: uniqueType;
  let trackKey: string;
  let duplicate: occuranceType | undefined;
  let playlistKey = generatePlaylistKey(playlist);
  if (playlist.tracks !== undefined) {
    for (const track of playlist.tracks) {
      trackKey = generateTrackKey(track);
      if (!duplicateManager.has(trackKey)) {
        uniqueTrack = {} as uniqueType;
        uniqueTrack.track = track;
        uniqueTrack.track.genres = new Set<string>();
        uniqueTrack.total_occurances = 1;
        uniqueTrack.in_playlists = new Map<string, occuranceType>().set(
          playlistKey,
          {
            playlist,
            occurances: 1,
            duplicate_uris:
              track.linked_from !== undefined
                ? new Map<string, duplicateType>()
                    .set(track.uri, { uri: track.uri })
                    .set(track.linked_from.uri, { uri: track.linked_from.uri })
                : new Map<string, duplicateType>()
          }
        );
        duplicateManager.set(trackKey, uniqueTrack);
      } else {
        uniqueTrack = duplicateManager.get(trackKey) as uniqueType;
        uniqueTrack.total_occurances++;
        if (!uniqueTrack.in_playlists.has(playlistKey)) {
          uniqueTrack.in_playlists.set(playlistKey, {
            playlist,
            occurances: 1,
            duplicate_uris:
              track.linked_from !== undefined
                ? new Map<string, duplicateType>()
                    .set(track.uri, { uri: track.uri })
                    .set(track.linked_from.uri, { uri: track.linked_from.uri })
                : new Map<string, duplicateType>()
          });
        } else {
          duplicate = uniqueTrack.in_playlists.get(
            playlistKey
          ) as occuranceType;
          duplicate.occurances++;
          if (!duplicate.duplicate_uris.has(track.uri))
            duplicate.duplicate_uris.set(track.uri, { uri: track.uri });
          if (
            track.linked_from !== undefined &&
            !duplicate.duplicate_uris.has(track.linked_from.uri)
          )
            duplicate.duplicate_uris.set(track.linked_from.uri, {
              uri: track.linked_from.uri
            });
        }
      }
    }
  }
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
  let duplicate: occuranceType | undefined;
  for (const uniqueTrack of duplicateManager.values()) {
    duplicate = uniqueTrack.in_playlists.get(generatePlaylistKey(playlist));
    if (duplicate !== undefined && duplicate.duplicate_uris.size > 0) {
      for (const uri of duplicate.duplicate_uris.values()) allUris.push(uri);
      uniqueTrack.total_occurances -= duplicate.occurances - 1;
      duplicate.occurances = 1;
      duplicate.duplicate_uris.clear();
      allOriginals.push(uniqueTrack.track.uri);
    }
  }
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
      rateLimitSpotify(res);
      playlist.snapshot = res.data.snapshot;
      newOffset = (newOffset as number) + postLimit;
    } while (0 < newOffset && newOffset < total);
    playlist.total -= total;
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
  for (const pl of playlists.list.values()) {
    if (
      name?.localeCompare(pl.name, undefined, {
        sensitivity: "accent",
        ignorePunctuation: true
      }) === 0
    ) {
      playlist = pl;
      break;
    }
  }
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
    rateLimitSpotify(res);
    playlist = {
      id: res.data.id,
      name: res.data.name,
      uri: res.data.uri,
      owner: res.data.owner,
      snapshot: res.data.snapshot,
      total: res.data.total,
      tracks: [],
      genres: new Map<string, number>(),
      genreSubscriptions: [],
      playlistSubscriptions: []
    };
    if (playlists === undefined) {
      playlists = {
        total: 0,
        list: new Map<string, playlistType>()
      };
    }
    playlists.list.set(generatePlaylistKey(playlist), playlist);
    playlists.total++;
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
const addTracksToPlaylist = async (
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
      rateLimitSpotify(res);
      playlist.snapshot = res.data.snapshot;
      newOffset = (newOffset as number) + postLimit;
    } while (0 < newOffset && newOffset < total);
    status = true;
    playlist.total += total;
  } catch (err) {
    console.log("Something went wrong with addTracksToPlaylist()", err);
  }
  return status;
};

/**
 * Unfollow a playlist
 * @returns
 */
export const unfollowPlaylist = async (playlist: playlistType | undefined) => {
  if (playlist === undefined) throw new Error("Playlist undefined");
  let status = false;
  const playlistId = playlist.id;
  try {
    const res = await axios.post(server + "/unfollow", { playlistId });
    rateLimitSpotify(res);
    if (playlists !== undefined) {
      status = playlists.list.delete(generatePlaylistKey(playlist));
      if (status) playlists.total--;
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
export const followPlaylist = async (playlist: playlistType | undefined) => {
  if (playlist === undefined) throw new Error("Playlist  undefined");
  let status = false;
  const playlistId = playlist.id;
  try {
    const res = await axios.post(server + "/follow", { playlistId });
    rateLimitSpotify(res);
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
export const generalPlaylistsSearch = async (
  querySearch: string,
  limit: number
) => {
  if (querySearch === "") throw new Error("Invalid query search");
  const maxOffset = 50; // 1000
  let queriedPlaylists: playlistsType = undefined;
  let newOffset: Promise<number> | number = 0;
  options.offset = 0;
  if (limit === 0 || limit > getLimit) limit = getLimit;
  options.limit = limit;
  try {
    const res = await axios.post(server + "/search-playlists", {
      querySearch,
      options
    });
    rateLimitSpotify(res);
    queriedPlaylists = {
      total: res.data.total,
      list: new Map<string, playlistType>(
        res.data.list.map((playlist: playlistType) => [
          generatePlaylistKey(playlist),
          playlist
        ])
      )
    };
    newOffset = (newOffset as number) + options.limit;
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
    rateLimitSpotify(res);
    for (const playlist of res.data.list)
      queriedPlaylists?.list.set(generatePlaylistKey(playlist), playlist);
    newOffset = (newOffset as number) + options.limit;
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
export const generalTracksSearch = async (
  querySearch: string,
  limit: number
) => {
  if (querySearch === "") throw new Error("Invalid query search");
  const maxOffset = 50; // 1000
  let queriedTracks = {} as playlistType;
  let newOffset: Promise<number> | number = 0;
  options.offset = 0;
  if (limit === 0 || limit > getLimit) limit = getLimit;
  options.limit = limit;
  try {
    const res = await axios.post(server + "/search-tracks", {
      querySearch,
      options
    });
    rateLimitSpotify(res);
    queriedTracks.name = "search results";
    queriedTracks.total = res.data.total;
    queriedTracks.tracks = res.data.list;

    newOffset = (newOffset as number) + options.limit;
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
    rateLimitSpotify(res);
    for (const track of res.data.list) queriedTracks?.tracks?.push(track);
    newOffset = (newOffset as number) + options.limit;
  } catch (err) {
    console.log("Something went wrong with appendGeneralTracksSearch()", err);
  }
  return newOffset;
};

/**
 * Get genres for all tracks
 */
export const getAllTrackGenres = async () => {
  if (duplicateManager.size === 0)
    throw new Error("No tracks in duplicate manager");
  const promises = [];
  try {
    for (const uniqueTrack of duplicateManager.values())
      promises.push(getTrackGenres(uniqueTrack));
    await Promise.all(promises);
    console.log(duplicateManager);
    console.log(genreMasterList);
  } catch (err) {
    console.log(err);
  }
  return genreMasterList;
};

/**
 * Get genres for a single track
 * @returns
 */
export const getTrackGenres = async (uniqueTrack: uniqueType) => {
  let status = true;
  let artists: string[] = [];
  let popularity: number;

  if (!uniqueTrack.track.is_playable) {
    uniqueTrack.track.genres.add("unplayable");
    if (!genreMasterList.has("unplayable"))
      genreMasterList.set("unplayable", 1);
    return status;
  }
  if (uniqueTrack.track.is_local) {
    uniqueTrack.track.genres.add("local");
    if (!genreMasterList.has("local")) genreMasterList.set("local", 1);
    return status;
  }

  artists = uniqueTrack.track.artists;
  for (const artist of artists) {
    try {
      const res = await axios.post(server + "/genres", {
        artist,
        genreBlackList
      });
      rateLimitLastfm(res);
      // Keep track of genre popularity with count and genreMasterList <genre, popularityCount>
      // Also look into how count is calculated
      if (res.data !== undefined) {
        for (const data of res.data) {
          const genre = data.name.toLowerCase();
          if (!uniqueTrack.track.genres.has(genre))
            uniqueTrack.track.genres.add(genre);
          for (const occurance of uniqueTrack.in_playlists.values()) {
            if (occurance.playlist.genres === undefined)
              occurance.playlist.genres = new Map<string, number>();
            if (!occurance.playlist.genres.has(genre))
              occurance.playlist.genres.set(genre, 1);
            else {
              popularity = occurance.playlist.genres.get(genre) as number;
              popularity++;
              occurance.playlist.genres.set(genre, popularity);
            }
          }
          uniqueTrack.track.genres.add(genre);
          if (!genreMasterList.has(genre)) genreMasterList.set(genre, 1);
          else {
            popularity = genreMasterList.get(genre) as number;
            popularity++;
            genreMasterList.set(genre, popularity);
          }
        }
      }
    } catch (err) {
      console.log("Something went wrong with getTrackGenres()", err);
      status = false;
    }
  }
  return status;
};

/**
 * Add subscriptions
 */
export const addSubscriptions = async () => {
  if (playlists === undefined) return;
  const promises = [];
  for (const playlist of playlists.list.values()) {
    const target = playlist;
    // playlist subscriptions
    if (target.playlistSubscriptions !== undefined) {
      for (const playlistSub of target.playlistSubscriptions) {
        const source = playlists.list.get(playlistSub) as playlistType;
        promises.push(addPlaylistToPlaylist(source, target));
      }
    }
    // genre subscriptions
    if (target.genreSubscriptions !== undefined) {
      for (const genreSub of target.genreSubscriptions) {
        const allUris: string[] = [];
        for (const uniqueTrack of duplicateManager.values()) {
          if (uniqueTrack.track.genres.has(genreSub))
            allUris.push(uniqueTrack.track.uri);
        }
        promises.push(addTracksToPlaylist(target, allUris));
      }
    }
  }
  await Promise.all(promises);
};

//export const playTrack = () => {};
