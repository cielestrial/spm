import axios, { AxiosResponse } from "axios";
import {
  artistMasterList,
  duplicateManager,
  genreWhitelist,
  getLimit,
  server,
} from "./ApiClientData";
import { genreBlacklist } from "./functions/GenreBlacklist";
import { generateArtistKey } from "./functions/HelperFunctions";
import { setRetryAfterLastfm } from "./QueryApi";
import { rateLimitSpotify } from "./SpotifyApiClientSide";
import { artistInfoType, playlistsType } from "./SpotifyApiClientTypes";

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
 * Get genres for all artists
 * @returns true on success and false otherwise
 */
export const getAllArtistGenres = async () => {
  if (artistMasterList.size === 0) {
    console.warn("Empty artistMasterList");
    return false;
  }
  const bundle = getLimit;
  try {
    let i = 1;
    let res;
    let artists: string[] = [];
    for (const artist of artistMasterList.entries()) {
      artists.push(artist[1].id);
      if (i % bundle === 0) {
        res = await axios.post(server + "/genres", { artists });
        await rateLimitSpotify(res);
        if (res.data !== undefined && res.data.list.length > 0)
          for (const artistInfo of res.data.list)
            artistMasterList.set(generateArtistKey(artistInfo), artistInfo);
        artists = [];
      }
      i++;
    }
    if (artists.length > 0) {
      res = await axios.post(server + "/genres", { artists });
      await rateLimitSpotify(res);
      if (res.data !== undefined && res.data.list.length > 0)
        for (const artistInfo of res.data.list)
          artistMasterList.set(generateArtistKey(artistInfo), artistInfo);
    }
  } catch (err) {
    console.error("Something went wrong with getAllArtistGenres()\n", err);
    return false;
  }
  return true;
};

/**
 * Add track genres to unique tracks in duplicate manager
 * @returns true on success and false otherwise
 */
export const getAllTrackGenres = () => {
  if (duplicateManager.size === 0) {
    console.warn("Empty duplicateManager");
    return false;
  }
  let key: string;
  for (const uniqueTrack of duplicateManager.values()) {
    if (uniqueTrack.track.isLocal) {
      uniqueTrack.track.genres.add("local");
      addToWhitelist("local");
    } else if (!uniqueTrack.track.isPlayable) {
      uniqueTrack.track.genres.add("unplayable");
      addToWhitelist("unplayable");
    } else {
      for (const artist of uniqueTrack.track.artists) {
        key = generateArtistKey(artist);
        if (artistMasterList.has(key)) {
          const artistGenres = artistMasterList.get(key) as artistInfoType;
          if (artistGenres.genres.length > 0) {
            for (const genre of artistGenres.genres) {
              if (!uniqueTrack.track.genres.has(genre))
                uniqueTrack.track.genres.add(genre);
              for (const playlist of uniqueTrack.in_playlists.values()) {
                if (!playlist.playlist.genres.has(genre))
                  playlist.playlist.genres.set(genre, 1);
                else {
                  let frequency = playlist.playlist.genres.get(genre) as number;
                  playlist.playlist.genres.set(genre, frequency + 1);
                }
              }
            }
          }
        }
      }
      if (uniqueTrack.track.genres.size === 0) {
        uniqueTrack.track.genres.add("unknown");
        addToWhitelist("unknown");
      } else if (uniqueTrack.track.genres.has("unknown"))
        addToWhitelist("unknown");
    }
  }
  return true;
};

/**
 * populate genre whitelist
 * @returns true on success and false otherwise
 */
export const populateGenreWhitelist = () => {
  if (artistMasterList.size === 0) {
    console.warn("Empty artistMasterList");
    return false;
  }
  //genreWhitelist.clear();
  for (const artist of artistMasterList.values()) {
    for (const genre of artist.genres) {
      if (
        genreBlacklist.some(
          (value) => value.toLocaleLowerCase() === genre.toLocaleLowerCase()
        )
      )
        console.warn(genre, "is in blacklist");
      addToWhitelist(genre);
    }
  }
  return true;
};

const addToWhitelist = (genre: string) => {
  if (!genreWhitelist.has(genre)) genreWhitelist.set(genre, 1);
  else {
    let frequency = genreWhitelist.get(genre) as number;
    genreWhitelist.set(genre, frequency + 1);
  }
};

/**
 * Get genres for a single track
 * @returns
 
const getTrackGenres = async (uniqueTrack: uniqueType) => {
  let popularity: number;

  if (!uniqueTrack.track.isPlayable) {
    uniqueTrack.track.genres.add("unplayable");
    if (!genreWhitelist.has("unplayable")) genreWhitelist.set("unplayable", 1);
    return true;
  }
  if (uniqueTrack.track.isLocal) {
    uniqueTrack.track.genres.add("local");
    if (!genreWhitelist.has("local")) genreWhitelist.set("local", 1);
    return true;
  }
  let genreList: string[] | undefined = [];
  // Only primary artist atm
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
    return true;
  } else {
    try {
      const genreBlacklist = (await import("./functions/GenreBlacklist"))
        .genreBlacklist;
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
      return false;
    }
    return true;
  }
};*/

export const resetGenres = async (
  playlists: React.MutableRefObject<playlistsType>
) => {
  if (playlists.current === undefined) return;
  try {
    await axios.post(server + "/reset-genres");

    for (const playlist of playlists.current.list.values()) {
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
