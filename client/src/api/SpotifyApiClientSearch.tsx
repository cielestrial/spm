import axios from "axios";
import { getLimit, maxOffset, options, server } from "./ApiClientData";
import { generatePlaylistKey } from "./functions/HelperFunctions";
import { rateLimitSpotify } from "./SpotifyApiClientSide";
import { playlistsType, playlistType } from "./SpotifyApiClientTypes";

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
  options.limit = getLimit;

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
  options.limit = getLimit;
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
