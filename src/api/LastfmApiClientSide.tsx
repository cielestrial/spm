import axios, { AxiosResponse } from "axios";
import { setRetryAfterLastfm } from "./QueryApi";
import {
  artistMasterList,
  duplicateManager,
  genreWhitelist,
  postLimit,
  server,
} from "./ApiClientData";
import { playlistsType, uniqueType } from "./SpotifyApiClientTypes";

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
};

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
