import { useQuery } from "react-query";
import { token, userInfo } from "../pages/Dashboard";
import {
  getToken,
  getPlaylists,
  getTracks,
  createPlaylist,
  unfollowPlaylist,
  getAllTracks,
  getAuthenticatedUserInfo,
  generalPlaylistsSearch,
  followPlaylist,
  generalTracksSearch,
  getAllTrackGenres,
  addSubscriptions
} from "./SpotifyApiClientSide";
import { playlistsType, playlistType } from "./SpotifyApiClientTypes";

let retryAfterSpotify = 1000;
export const setRetryAfterSpotify = (waitPeriod: number) => {
  retryAfterSpotify = 1000 + waitPeriod;
};

let retryAfterLastfm = 1000;
export const setRetryAfterLastfm = (waitPeriod: number) => {
  retryAfterLastfm = 1000 + waitPeriod;
};

let tracksFlag = false;
export const refetchTracks = () => {
  tracksFlag = true;
};
let allTracksFlag = true;
export const refetchAllTracks = () => {
  allTracksFlag = true;
};
let createFlag = false;
export const refetchCreate = () => {
  createFlag = true;
};
let playlistsQFlag = false;
export const refetchPlaylistsQ = () => {
  playlistsQFlag = true;
};
let allGenresFlag = true;
export const refetchAllGenres = () => {
  allGenresFlag = true;
};

// Gets access token
export const tokenQuery = () => useQuery("token", getToken);

// Gets authenticated user info
export const userQuery = () =>
  useQuery(["user", token?.accessToken], getAuthenticatedUserInfo, {
    enabled: token?.accessToken !== undefined
  });

// Gets playlist
export const playlistsQuery = () =>
  useQuery(
    ["playlists", retryAfterSpotify, userInfo],
    async () => {
      const res = await getPlaylists();
      return res;
    },
    {
      enabled: userInfo !== undefined,
      retryDelay: retryAfterSpotify,
      onSuccess: () => {
        retryAfterSpotify = 1000;
      }
    }
  );

// Gets tracks
export const tracksQuery = (selectedPlaylist: playlistType | undefined) =>
  useQuery(
    ["tracks", retryAfterSpotify, selectedPlaylist, tracksFlag],
    async () => {
      const res = await getTracks(selectedPlaylist);
      tracksFlag = false;
      return res;
    },
    {
      enabled: selectedPlaylist !== undefined && tracksFlag,
      retryDelay: retryAfterSpotify,
      onSuccess: () => {
        retryAfterSpotify = 1000;
      }
    }
  );

// Gets all tracks
export const allTracksQuery = (playlists: playlistsType) =>
  useQuery(
    ["allTracks", retryAfterSpotify, playlists, allTracksFlag],
    async () => {
      const res = await getAllTracks();
      allTracksFlag = false;
      return res;
    },
    {
      enabled: playlists !== undefined && allTracksFlag,
      retryDelay: retryAfterSpotify,
      onSuccess: () => {
        retryAfterSpotify = 1000;
      }
    }
  );

// Creates playlist with name
export const createQuery = (
  playlistName: string | undefined,
  setSelected: (selected: playlistType | undefined) => void
) =>
  useQuery(
    ["create", retryAfterSpotify, playlistName, createFlag],
    async () => {
      const res = await createPlaylist(playlistName);
      setSelected(res);
      createFlag = false;
      return res;
    },
    {
      enabled: playlistName !== "" && createFlag,
      retryDelay: retryAfterSpotify,
      onSuccess: () => {
        retryAfterSpotify = 1000;
      }
    }
  );

// Unfollows currently selected playlist
export const unfollowQuery = (
  selectedPlaylist: playlistType | undefined,
  setSelected: (selected: playlistType | undefined) => void
) =>
  useQuery(
    ["unfollow", retryAfterSpotify, selectedPlaylist],
    async () => {
      const res = await unfollowPlaylist(selectedPlaylist);
      setSelected(undefined);
      return res;
    },
    {
      enabled: false,
      retryDelay: retryAfterSpotify,
      onSuccess: () => {
        retryAfterSpotify = 1000;
      }
    }
  );

// Follows currently selected playlist
export const followQuery = (
  selectedPlaylist: playlistType | undefined,
  setSelected: (selected: playlistType | undefined) => void
) =>
  useQuery(
    ["follow", retryAfterSpotify, selectedPlaylist],
    async () => {
      const res = await followPlaylist(selectedPlaylist);
      setSelected(undefined);
      setSelected(selectedPlaylist);
      return res;
    },
    {
      enabled: false,
      retryDelay: retryAfterSpotify,
      onSuccess: () => {
        retryAfterSpotify = 1000;
      }
    }
  );

export const generalPlaylistsQuery = (
  querySearch: React.MutableRefObject<string>,
  offset: React.MutableRefObject<number>
) =>
  useQuery(
    ["generalPlaylistsQuery", retryAfterSpotify, querySearch, offset],
    async () => {
      return await generalPlaylistsSearch(querySearch.current, offset.current);
    },
    {
      enabled: false,
      retryDelay: retryAfterSpotify
    }
  );

export const generalTracksQuery = (
  songQuery: string,
  artistQuery: string,
  albumQuery: string,
  offset: React.MutableRefObject<number>
) =>
  useQuery(
    [
      "generalTracks",
      retryAfterSpotify,
      songQuery,
      artistQuery,
      albumQuery,
      offset.current
    ],
    async () => {
      let querySearch = "";
      if (songQuery !== "") querySearch += "track:" + songQuery + " ";
      if (artistQuery !== "") querySearch += "artist:" + artistQuery + " ";
      if (albumQuery !== "") querySearch += "album:" + albumQuery;
      const res = await generalTracksSearch(querySearch, offset.current);
      return res;
    },
    {
      enabled: false,
      retryDelay: retryAfterSpotify,
      onSuccess: () => {
        retryAfterSpotify = 1000;
      }
    }
  );

export const addSubscriptionsQuery = (
  setSelected: (selected: playlistType | undefined) => void
) =>
  useQuery(
    ["addSubscriptions", retryAfterSpotify, retryAfterLastfm],
    async () => {
      const res = await addSubscriptions();
      setSelected(undefined);
      return res;
    },
    {
      enabled: false,
      retryDelay:
        retryAfterSpotify >= retryAfterLastfm
          ? retryAfterSpotify
          : retryAfterLastfm,
      onSuccess: () => {
        if (retryAfterSpotify > 1000) retryAfterSpotify = 1000;
        if (retryAfterLastfm > 1000) retryAfterLastfm = 1000;
      }
    }
  );

// Gets tracks from lastfm
export const trackGenresQuery = () =>
  useQuery(
    ["trackGenres", retryAfterLastfm, allGenresFlag],
    async () => {
      const res = await getAllTrackGenres();
      allGenresFlag = false;
      return res;
    },
    {
      enabled: allGenresFlag,
      retryDelay: retryAfterLastfm,
      onSuccess: () => {
        retryAfterLastfm = 1000;
      }
    }
  );
