import axios from "axios";
import {
  artistMasterList,
  duplicateManager,
  getLimit,
  options,
  postLimit,
  server,
} from "./ApiClientData";
import {
  generateArtistKey,
  generatePlaylistKey,
  generateTrackKey,
} from "./functions/HelperFunctions";
import { useSpotifyQuery } from "./QueryApi";
import { rateLimitSpotify } from "./SpotifyApiClientSide";
import {
  duplicateType,
  occuranceType,
  playlistsType,
  playlistType,
  tracksType,
  uniqueType,
} from "./SpotifyApiClientTypes";

/**
 * Get tracks in a playlist
 * @returns playlistType
 */
export const getTracks = async (playlist: playlistType | undefined) => {
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
  if (playlist.total === 0) {
    playlist.tracks = [];
    return playlist;
  }
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
export const getAllTracks = async (
  playlists: React.MutableRefObject<playlistsType>
) => {
  if (playlists.current === undefined) {
    throw new Error("Playlists has not been defined");
  }
  try {
    for (const playlist of playlists.current.list.values())
      await useSpotifyQuery(getTracks, 0, playlist);
  } catch (err) {
    console.error(err);
    return false;
  }
  return true;
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
  const playlistKey = generatePlaylistKey(target);
  let uniqueTrack: uniqueType;
  const uris = tracks?.tracks
    ?.filter(
      (track) => !track.isLocal && track.isPlayable && isUnique(track, target)
    )
    .map((track) => {
      const key = generateTrackKey(track);
      if (duplicateManager.has(key)) {
        uniqueTrack = duplicateManager.get(key) as uniqueType;
        uniqueTrack.total_occurances++;
        uniqueTrack.in_playlists.set(playlistKey, {
          playlist: target,
          occurances: 1,
          duplicate_uris:
            track.linkedFrom !== undefined
              ? new Map<string, duplicateType>()
                  .set(track.uri, { uri: track.uri })
                  .set(track.linkedFrom.uri, { uri: track.linkedFrom.uri })
              : new Map<string, duplicateType>(),
        });
      } else {
        duplicateManager.set(
          key,
          createUniqueTrack(track, target, playlistKey)
        );
      }
      return track.uri;
    });

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
 * Populate duplicate manager and remove duplicates
 * @param playlists
 * @param username
 */
export const manageDuplicates = async (
  playlists: React.MutableRefObject<playlistsType>,
  username: string
) => {
  if (playlists.current === undefined) {
    throw new Error("Playlists has not been defined");
  }
  for (const playlist of playlists.current.list.values()) {
    await getOccurances(playlist);
    if (playlist.owner === username) {
      const originals: tracksType[] = await removeDuplicates(playlist);
      if (originals.length > 0) {
        const tempPlaylist = {} as playlistType;
        tempPlaylist.total = originals.length;
        tempPlaylist.tracks = originals;
        //source = from, target = to
        await addPlaylistToPlaylist(tempPlaylist, playlist);
      }
    }
  }
};

const createUniqueTrack = (
  track: tracksType,
  playlist: playlistType,
  playlistKey: string
) => {
  let uniqueTrack = {} as uniqueType;
  uniqueTrack.track = track;
  if (track.genres === undefined) track.genres = new Set<string>();
  uniqueTrack.track.genres = track.genres;
  uniqueTrack.total_occurances = 1;
  uniqueTrack.in_playlists = new Map<string, occuranceType>().set(playlistKey, {
    playlist,
    occurances: 1,
    duplicate_uris:
      track.linkedFrom !== undefined
        ? new Map<string, duplicateType>()
            .set(track.uri, { uri: track.uri })
            .set(track.linkedFrom.uri, { uri: track.linkedFrom.uri })
        : new Map<string, duplicateType>(),
  });
  return uniqueTrack;
};

/**
 * Records all occurances of a track
 */
const getOccurances = async (playlist: playlistType) => {
  if (playlist.tracks !== undefined) {
    for (const track of playlist.tracks) {
      populateDuplicateManager(track, playlist);
      populateArtistMasterList(track);
    }
  }
};

/**
 * Duplicate Manager
 * @param track
 * @param playlist
 */
const populateDuplicateManager = (
  track: tracksType,
  playlist: playlistType
) => {
  const playlistKey = generatePlaylistKey(playlist);
  let trackKey: string;
  let duplicate: occuranceType | undefined;
  let uniqueTrack = {} as uniqueType;
  trackKey = generateTrackKey(track);
  if (!duplicateManager.has(trackKey))
    duplicateManager.set(
      trackKey,
      createUniqueTrack(track, playlist, playlistKey)
    );
  else {
    uniqueTrack = duplicateManager.get(trackKey) as uniqueType;
    uniqueTrack.total_occurances++;
    if (!uniqueTrack.in_playlists.has(playlistKey)) {
      uniqueTrack.in_playlists.set(playlistKey, {
        playlist: playlist,
        occurances: 1,
        duplicate_uris:
          track.linkedFrom !== undefined
            ? new Map<string, duplicateType>()
                .set(track.uri, { uri: track.uri })
                .set(track.linkedFrom.uri, { uri: track.linkedFrom.uri })
            : new Map<string, duplicateType>(),
      });
    } else {
      duplicate = uniqueTrack.in_playlists.get(playlistKey) as occuranceType;
      duplicate.occurances++;
      if (!duplicate.duplicate_uris.has(track.uri))
        duplicate.duplicate_uris.set(track.uri, { uri: track.uri });
      if (
        track.linkedFrom !== undefined &&
        !duplicate.duplicate_uris.has(track.linkedFrom.uri)
      )
        duplicate.duplicate_uris.set(track.linkedFrom.uri, {
          uri: track.linkedFrom.uri,
        });
    }
  }
};

/**
 * Artist Master List
 * @param track
 */
const populateArtistMasterList = (track: tracksType) => {
  // ArtistMasterList
  if (!track.isLocal && track.isPlayable) {
    for (const artist of track.artists) {
      if (artist.id !== undefined && artist.id !== null && artist.id !== "") {
        const key = generateArtistKey(artist);
        if (!artistMasterList.has(key))
          artistMasterList.set(key, {
            name: artist.name,
            id: artist.id,
            genres: [],
          });
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
const removeDuplicates = async (playlist: playlistType) => {
  if (playlist === undefined) throw new Error("Playlist not defined");

  //max 100 in one request
  const playlistId = playlist.id;
  const snapshot = playlist.snapshot;
  let allOriginals: tracksType[] = [];
  let allUris: duplicateType[] = [];
  let duplicate: occuranceType | undefined;
  for (const uniqueTrack of duplicateManager.values()) {
    if (uniqueTrack.track.isLocal) continue;
    duplicate = uniqueTrack.in_playlists.get(generatePlaylistKey(playlist));
    if (
      duplicate !== undefined &&
      duplicate.occurances > 1 &&
      duplicate.duplicate_uris.size > 0
    ) {
      console.log("has duplicates:", uniqueTrack);
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
