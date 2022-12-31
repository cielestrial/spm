import axios from "axios";
import {
  artistMasterList,
  duplicateManager,
  genreWhitelist,
  getLimit,
  server,
} from "./ApiClientData";
import { genreBlacklist } from "./functions/GenreBlacklist";
import { generateArtistKey } from "./functions/HelperFunctions";
import { rateLimitSpotify } from "./SpotifyApiClientSide";
import { artistInfoType, playlistsType } from "./SpotifyApiClientTypes";

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
