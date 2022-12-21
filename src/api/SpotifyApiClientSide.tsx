import axios, { AxiosResponse } from "axios";
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
  occuranceType,
} from "./SpotifyApiClientTypes";
import { genreBlacklist } from "./misc/GenreBlacklist";
import { TransferListItem } from "@mantine/core";
import {
  setRetryAfterLastfm,
  setRetryAfterSpotify,
  useSpotifyQuery,
} from "./QueryApi";
import { resultLimit } from "../components/Nav/SearchBar";
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

export let genreWhitelist = new Map<string, number>();
export const loadWhitelistFromFile = (
  whitelist: Map<string, number>,
  blacklist: string[]
) => {
  for (let i = 0; i < blacklist.length; i++) {
    if (whitelist.has(blacklist[i])) whitelist.delete(blacklist[i]);
  }
  genreWhitelist = whitelist;
};
export const updateWhitelist = (genres: TransferListItem[]) => {
  genreWhitelist = new Map<string, number>(
    genres.map((item) => {
      if (genreWhitelist.has(item.label)) {
        const value = genreWhitelist.get(item.label);
        if (value !== undefined) return [item.label, value];
      }
      return [item.label, 0];
    })
  );
};
export const getWhitelist = () => {
  return Array.from(genreWhitelist.entries())
    .sort(
      (a, b) => b[1] - a[1]

      /*
      a[0].localeCompare(b[0], undefined, {
        sensitivity: "accent",
        ignorePunctuation: true,
      })
      */
    )
    .map((element) => ({
      value: element[0],
      label: element[0],
    }));
};

export let artistMasterList = new Map<string, string[]>();
export const loadArtistsFromFile = (artists: Map<string, string[]>) => {
  artistMasterList = artists;
};

let playlists: playlistsType;
const options: optionsType = { offset: 0, limit: 0 };
const getLimit = 50;
const postLimit = 100;
export const maxOffset = 1000;
/**
 * Handle Rate limit Spotify
 */
const rateLimitSpotify = async (res: AxiosResponse<any, any>) => {
  if (res.data.errorCode === 429) {
    setRetryAfterSpotify(res.data.retryAfter);
    throw new Error(
      "Rate limit hit for spotify. Wait for " + res.data.retryAfter
    );
  } else if (res.data.errorCode === 400 || res.data.errorCode === 401) {
    await getToken();
    throw new Error(
      "Token expired and could not be refreshed." +
        "\n" +
        "Returning to landing page."
    );
  }
};

/**
 * Handle Rate limit lastfm
 */
const rateLimitLastfm = async (res: AxiosResponse<any, any>) => {
  if (res.data.errorCode === 429) {
    setRetryAfterLastfm(res.data.retryAfter);
    throw new Error(
      "Rate limit hit for lastfm." + "\n" + "Wait for " + res.data.retryAfter
    );
  }
};

/**
 * Get access token
 * @returns
 */
export const getToken = async () => {
  if (code === null) throw new Error();
  let tokenTemp = {} as tokenType;
  try {
    const res = await axios.post(server + "/login", { code });
    if (res.data === undefined || res.data.accessToken === undefined)
      return null;
    tokenTemp.accessToken = res.data.accessToken;
    tokenTemp.refreshToken = res.data.refreshToken;
    tokenTemp.expiresIn = res.data.expriresIn;
  } catch (err) {
    console.error("Something went wrong with getToken()\n", err);
    return null;
  }
  return tokenTemp;
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
      options,
    });
    await rateLimitSpotify(res);
    playlists = {
      total: res.data.total,
      list: new Map<string, playlistType>(
        res.data.list.map((playlist: playlistType) => [
          generatePlaylistKey(playlist),
          playlist,
        ])
      ),
    };
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.error("Something went wrong with getPlaylists()\n", err);
  }
  if (playlists !== undefined) {
    while (0 < newOffset && newOffset < playlists.total) {
      console.log("happening");
      newOffset = await appendPlaylists(newOffset);
    }
    console.log("Playlists retrieved from server");
    return playlists;
  } else {
    throw new Error("Failed to retrieve playlists");
  }
};

/**
 * Append remaining playlists
 * @returns
 */
const appendPlaylists = async (newOffset: Promise<number> | number) => {
  options.offset = newOffset;
  try {
    const res = await axios.post(server + "/playlists", {
      options,
    });
    await rateLimitSpotify(res);
    for (const playlist of res.data.list)
      playlists?.list.set(generatePlaylistKey(playlist), playlist);
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.error("Something went wrong with appendPlaylists()\n", err);
  }
  return newOffset;
};

/**
 * Get tracks in a playlist
 * @returns playlistType
 */
export const getTracks = async (
  playlist: playlistType | undefined,
  username: string
) => {
  if (playlist === undefined) throw new Error("Playlist not defined");

  if (playlist.genres === undefined)
    playlist.genres = new Map<string, number>();
  if (playlist.topGenres === undefined) playlist.topGenres = [];
  // Can be loaded from file
  if (playlist.genreSubscriptions === undefined)
    playlist.genreSubscriptions = [];
  // Can be loaded from file
  if (playlist.playlistSubscriptions === undefined)
    playlist.playlistSubscriptions = new Map<string, playlistType>();
  if (playlist.total === 0) return playlist;
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
        options,
      });
      await rateLimitSpotify(res);
      playlist.tracks = res.data.list;
      newOffset = (newOffset as number) + getLimit;
    } catch (err) {
      console.error("Something went wrong with getTracks()\n", err);
    }
    if (playlist.tracks !== undefined) {
      while (0 < newOffset && newOffset < playlist.total) {
        newOffset = await appendTracks(playlistId, playlist, newOffset);
      }
      // Duplicate manager
      if (playlists?.list.has(generatePlaylistKey(playlist)) && i === 0) {
        await getOccurances(playlist);
        if (playlist.owner === username) {
          const originals: tracksType[] = await removeDuplicates(playlist);
          if (originals.length > 0) {
            const tempPlaylist = {} as playlistType;
            tempPlaylist.total = originals.length;
            tempPlaylist.tracks = originals;
            await addPlaylistToPlaylist(tempPlaylist, playlist, username); //source = from, target = to
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
      options,
    });
    await rateLimitSpotify(res);
    playlist.tracks?.push(...res.data.list);
    newOffset = (newOffset as number) + getLimit;
  } catch (err) {
    console.error("Something went wrong with appendTracks()\n", err);
  }
  return newOffset;
};

/**
 * Get all tracks
 */
export const getAllTracks = async (username: string) => {
  if (playlists === undefined) {
    throw new Error("Playlists has not been defined");
  }
  let promises = [];
  let i = 1;
  const bundle = postLimit;
  try {
    for (const playlist of playlists.list.values()) {
      promises.push(getTracks(playlist, username));
      if (i % bundle === 0) {
        await Promise.all(promises);
        promises = [];
      }
      i++;
    }
    if (promises.length > 0) {
      await Promise.all(promises);
      promises = [];
      i = 1;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
};

/**
 * Records all occurances of a track
 */
export const getOccurances = async (playlist: playlistType) => {
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
                : new Map<string, duplicateType>(),
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
                : new Map<string, duplicateType>(),
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
              uri: track.linked_from.uri,
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
  let allOriginals: tracksType[] = [];
  let allUris: duplicateType[] = [];
  let duplicate: occuranceType | undefined;
  for (const uniqueTrack of duplicateManager.values()) {
    duplicate = uniqueTrack.in_playlists.get(generatePlaylistKey(playlist));
    if (
      duplicate !== undefined &&
      duplicate.occurances > 1 &&
      duplicate.duplicate_uris.size > 0
    ) {
      console.log(uniqueTrack);
      for (const uri of duplicate.duplicate_uris.values()) {
        console.warn(
          uniqueTrack.track.name,
          "in",
          duplicate.playlist.name,
          "is being deleted"
        );

        allUris.push(uri);
      }
      uniqueTrack.total_occurances -= duplicate.occurances - 1;
      duplicate.occurances = 1;
      duplicate.duplicate_uris.clear();
      allOriginals.push(uniqueTrack.track);
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
        snapshot,
      });
      await rateLimitSpotify(res);
      playlist.snapshot = res.data.snapshot;
      newOffset = (newOffset as number) + postLimit;
    } while (0 < newOffset && newOffset < total);
    playlist.total -= total;
  } catch (err) {
    console.error("Something went wrong with removeDuplicates()\n", err);
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
        ignorePunctuation: true,
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
      description: "Generated by YSPM.",
    });
    await rateLimitSpotify(res);
    playlist = {
      id: res.data.id,
      name: res.data.name,
      uri: res.data.uri,
      owner: res.data.owner,
      snapshot: res.data.snapshot,
      total: res.data.total,
      tracks: [],
      genres: new Map<string, number>(),
      topGenres: [],
      genreSubscriptions: [],
      playlistSubscriptions: new Map<string, playlistType>(),
    };
    if (playlists === undefined) {
      playlists = {
        total: 0,
        list: new Map<string, playlistType>(),
      };
      playlists.list.set(generatePlaylistKey(playlist), playlist);
    } else
      playlists.list = new Map<string, playlistType>([
        [generatePlaylistKey(playlist), playlist],
        ...playlists.list,
      ]);
    playlists.total++;
  } catch (err) {
    console.error("Something went wrong with createPlaylist()\n", err);
  }
  return playlist;
};

/**
 * Add playlist to playlist
 * @returns
 */
const addPlaylistToPlaylist = async (
  source: playlistType,
  target: playlistType,
  username: string
) => {
  if (source === undefined) throw new Error("Couldn't find source playlist");
  if (target === undefined) throw new Error("Couldn't find target playlist");

  const tracks = await getTracks(source, username);
  const uris = tracks?.tracks
    ?.filter((track) => isUnique(track, target))
    .map((track) => track.uri);

  /**
   * Add tracks to playlist
   * Does not have duplicate protection.
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
          options,
        });
        await rateLimitSpotify(res);
        playlist.snapshot = res.data.snapshot;
        newOffset = (newOffset as number) + postLimit;
      } while (0 < newOffset && newOffset < total);
      status = true;
      playlist.total += total;
    } catch (err) {
      console.error("Something went wrong with addTracksToPlaylist()\n", err);
    }
    return status;
  };

  return await useSpotifyQuery(addTracksToPlaylist, 0, target, uris);
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
    await rateLimitSpotify(res);
    if (playlists !== undefined) {
      status = playlists.list.delete(generatePlaylistKey(playlist));
      if (status) playlists.total--;
    }
  } catch (err) {
    console.error("Something went wrong with unfollowPlaylist()\n", err);
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
    await rateLimitSpotify(res);
    if (playlists !== undefined) {
      playlists.total++;
      status = true;
    }
  } catch (err) {
    console.error("Something went wrong with followPlaylist()\n", err);
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
  offset: number
) => {
  if (querySearch === "") throw new Error("Invalid query search");
  let queriedPlaylists: playlistsType = undefined;
  if (offset > maxOffset) return queriedPlaylists;
  options.offset = offset;
  let limit = resultLimit;
  if (limit === 0 || limit > getLimit) limit = getLimit;
  options.limit = limit;

  try {
    const res = await axios.post(server + "/search-playlists", {
      querySearch,
      options,
    });
    await rateLimitSpotify(res);
    if (res.data !== undefined) {
      queriedPlaylists = {
        total: res.data.total,
        list: new Map<string, playlistType>(
          res.data.list.map((playlist: playlistType) => [
            generatePlaylistKey(playlist),
            playlist,
          ])
        ),
      };
    }
  } catch (err) {
    console.error("Something went wrong with generalPlaylistsSearch()\n", err);
  }
  if (queriedPlaylists !== undefined) {
    return queriedPlaylists;
  } else throw new Error("Failed general playlists search");
};

/**
 * General search for tracks
 * @param querySearch
 * @returns
 */
export const generalTracksSearch = async (
  querySearch: string,
  offset: number
) => {
  if (querySearch === "") throw new Error("Invalid query search");
  let queriedTracks = {} as playlistType;
  if (offset > maxOffset) return queriedTracks;
  options.offset = offset;
  let limit = resultLimit;
  if (limit === 0 || limit > getLimit) limit = getLimit;
  options.limit = limit;
  try {
    const res = await axios.post(server + "/search-tracks", {
      querySearch,
      options,
    });
    await rateLimitSpotify(res);
    if (res.data !== undefined) {
      queriedTracks.name = "search results";
      queriedTracks.total = res.data.total;
      queriedTracks.tracks = res.data.list;
    }
  } catch (err) {
    console.error("Something went wrong with generalTracksSearch()\n", err);
  }
  if (queriedTracks !== undefined) {
    return queriedTracks;
  } else throw new Error("Failed general tracks search");
};

/**
 * Get genres for all tracks
 */
export const getAllTrackGenres = async () => {
  if (duplicateManager.size === 0) {
    console.log("Empty duplicate manager");
    return genreWhitelist;
  }
  let promises = [];
  let i = 1;
  const bundle = postLimit;
  try {
    for (const uniqueTrack of duplicateManager.values()) {
      promises.push(getTrackGenres(uniqueTrack));
      if (i % bundle === 0) {
        await Promise.all(promises);
        promises = [];
      }
      i++;
    }
    if (promises.length > 0) {
      await Promise.all(promises);
      promises = [];
      i = 1;
    }
  } catch (err) {
    console.error(err);
  }
  return genreWhitelist;
};

/**
 * Get genres for a single track
 * @returns
 */
export const getTrackGenres = async (uniqueTrack: uniqueType) => {
  let status = true;
  let popularity: number;

  if (!uniqueTrack.track.is_playable) {
    uniqueTrack.track.genres.add("unplayable");
    if (!genreWhitelist.has("unplayable")) genreWhitelist.set("unplayable", 1);
    return status;
  }
  if (uniqueTrack.track.is_local) {
    uniqueTrack.track.genres.add("local");
    if (!genreWhitelist.has("local")) genreWhitelist.set("local", 1);
    return status;
  }
  let genreList: string[] | undefined = [];
  const artist = uniqueTrack.track.artists[0];
  if (artistMasterList.has(artist)) {
    genreList = artistMasterList.get(artist);
    if (genreList !== undefined) {
      for (let genre of genreList) {
        genre = genre.toLowerCase();
        if (!uniqueTrack.track.genres.has(genre))
          uniqueTrack.track.genres.add(genre);
        for (const occurance of uniqueTrack.in_playlists.values()) {
          if (!occurance.playlist.genres.has(genre))
            occurance.playlist.genres.set(genre, 1);
          else {
            popularity = occurance.playlist.genres.get(genre) as number;
            popularity++;
            occurance.playlist.genres.set(genre, popularity);
          }
        }
        popularity = genreWhitelist.get(genre) as number;
        popularity++;
        genreWhitelist.set(genre, popularity);
      }
    }
    console.log("Genres retrieved from client");
  }
  try {
    const res = await axios.post(server + "/genres", {
      artist,
      genreBlacklist,
    });
    await rateLimitLastfm(res);
    // Keep track of genre popularity with count and genreWhitelist <genre, popularityCount>
    // Also look into how count is calculated
    if (res.data !== undefined) {
      genreList = [];
      for (const data of res.data) {
        const genre = data.name.toLowerCase();
        genreList.push(genre);
        if (!uniqueTrack.track.genres.has(genre))
          uniqueTrack.track.genres.add(genre);
        for (const occurance of uniqueTrack.in_playlists.values()) {
          if (!occurance.playlist.genres.has(genre))
            occurance.playlist.genres.set(genre, 1);
          else {
            popularity = occurance.playlist.genres.get(genre) as number;
            popularity++;
            occurance.playlist.genres.set(genre, popularity);
          }
        }
        if (!genreWhitelist.has(genre)) genreWhitelist.set(genre, 1);
        else {
          popularity = genreWhitelist.get(genre) as number;
          popularity++;
          genreWhitelist.set(genre, popularity);
        }
      }
      artistMasterList.set(artist, genreList);
      console.log("Genres retrieved from server");
    }
  } catch (err) {
    console.error("Something went wrong with getTrackGenres()\n", err);
    status = false;
  }
  return status;
};

export const getTopPlaylistGenres = async () => {
  if (playlists === undefined) return;
  const top_x = 3;
  let minOccurance = 2;
  for (const playlist of playlists.list.values()) {
    if (playlist.genres !== undefined && playlist.genres.size > 0) {
      minOccurance = Math.round(playlist.total * (0.5 / 3));
      playlist.topGenres = Array.from(playlist.genres.entries())
        .filter((value) => value[1] >= minOccurance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, top_x)
        .map((value) => value[0]);
    }
  }
};

export const resetGenres = async () => {
  if (playlists === undefined) return;
  try {
    await axios.post(server + "/reset-genres");

    for (const playlist of playlists.list.values()) {
      playlist.genres.clear();
    }
    if (duplicateManager.size > 0)
      for (const uniqueTrack of duplicateManager.values())
        uniqueTrack.track.genres.clear();

    artistMasterList.clear();
    genreWhitelist.clear();
  } catch (err) {
    console.error("Something went wrong with resetGenres()\n", err);
    return false;
  }
  return true;
};

/**
 * Add playlist subscriptions
 */
export const addPlaylistSubscriptions = async (username: string) => {
  if (playlists === undefined) return false;
  let status = true;
  let tempPlaylist: playlistType;
  try {
    for (const target of playlists.list.values()) {
      if (target.playlistSubscriptions !== undefined) {
        tempPlaylist = {} as playlistType;
        tempPlaylist.total = 0;
        tempPlaylist.tracks = [];
        for (const playlistSub of target.playlistSubscriptions.values()) {
          tempPlaylist.total += playlistSub.total;
          tempPlaylist.tracks.push(...playlistSub.tracks);
        }
        useSpotifyQuery(
          addPlaylistToPlaylist,
          0,
          tempPlaylist,
          target,
          username
        );
      }
    }
  } catch (err) {
    console.error(
      "Something went wrong with addPlaylistSubscriptions()\n",
      err
    );
    status = false;
  }
  return status;
};

/**
 * Add genre subscriptions
 */
export const addGenreSubscriptions = async (username: string) => {
  if (playlists === undefined) return false;
  if (duplicateManager.size === 0) {
    console.log("Empty duplicate manager");
    return true;
  }
  let status = true;
  let tempPlaylist: playlistType;
  try {
    for (const target of playlists.list.values()) {
      if (target.genreSubscriptions !== undefined) {
        const allTracks: tracksType[] = [];
        for (const genreSub of target.genreSubscriptions) {
          for (const uniqueTrack of duplicateManager.values()) {
            if (uniqueTrack.track.genres.has(genreSub))
              allTracks.push(uniqueTrack.track);
          }
        }
        tempPlaylist = {} as playlistType;
        tempPlaylist.total = allTracks.length;
        tempPlaylist.tracks = allTracks;
        useSpotifyQuery(
          addPlaylistToPlaylist,
          0,
          tempPlaylist,
          target,
          username
        );
      }
    }
  } catch (err) {
    console.error("Something went wrong with addGenreSubscriptions()\n", err);
    status = false;
  }
  return status;
};

//export const playTrack = () => {};
