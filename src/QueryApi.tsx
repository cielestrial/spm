import { useQuery } from "react-query";
import { token, userInfo } from "./pages/Dashboard";
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
  generalTracksSearch
} from "./SpotifyApiClientSide";
import { playlistsType, playlistType } from "./SpotifyApiClientTypes";

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

// Gets access token
export const tokenQuery = () => useQuery("token", getToken);

// Gets authenticated user info
export const userQuery = () =>
  useQuery(["user", token?.accessToken], getAuthenticatedUserInfo, {
    enabled: token?.accessToken !== undefined
  });

// Gets playlist
export const playlistsQuery = () =>
  useQuery(["playlists", userInfo], getPlaylists, {
    enabled: userInfo !== undefined
  });

// Gets tracks
export const tracksQuery = (selectedPlaylist: playlistType | undefined) =>
  useQuery(
    ["tracks", selectedPlaylist, tracksFlag],
    async () => {
      const res = await getTracks(selectedPlaylist);
      tracksFlag = false;
      return res;
    },
    { enabled: selectedPlaylist !== undefined && tracksFlag }
  );

// Gets all tracks
export const allTracksQuery = (playlists: playlistsType) =>
  useQuery(
    ["allTracks", playlists, allTracksFlag],
    async () => {
      const res = getAllTracks();
      allTracksFlag = false;
      return res;
    },
    { enabled: playlists !== undefined && allTracksFlag }
  );

// Creates playlist with name
export const createQuery = (
  playlistName: string | undefined,
  setSelected: (selected: playlistType | undefined) => void
) =>
  useQuery(
    ["create", playlistName, createFlag],
    async () => {
      const res = await createPlaylist(playlistName);
      setSelected(res);
      createFlag = false;
      return res;
    },
    { enabled: playlistName !== "" && createFlag }
  );

// Unfollows currently selected playlist
export const unfollowQuery = (
  selectedPlaylist: playlistType | undefined,
  setSelected: (selected: playlistType | undefined) => void
) =>
  useQuery(
    ["unfollow", selectedPlaylist],
    async () => {
      const res = await unfollowPlaylist(selectedPlaylist?.id);
      setSelected(undefined);
      return res;
    },
    { enabled: false }
  );

// Follows currently selected playlist
export const followQuery = (
  selectedPlaylist: playlistType | undefined,
  setSelected: (selected: playlistType | undefined) => void
) =>
  useQuery(
    ["follow", selectedPlaylist],
    async () => {
      const res = await followPlaylist(selectedPlaylist?.id);
      setSelected(undefined);
      setSelected(selectedPlaylist);
      return res;
    },
    { enabled: false }
  );

export const generalPlaylistsQuery = (querySearch: string) =>
  useQuery(
    ["generalPlaylists", querySearch],
    () => generalPlaylistsSearch(querySearch),
    { enabled: false }
  );

export const generalTracksQuery = (
  songQuery: string,
  artistQuery: string,
  albumQuery: string
) =>
  useQuery(
    ["generalTracks", songQuery, artistQuery, albumQuery],
    () => {
      let querySearch = "";
      if (songQuery !== "") querySearch += "track:" + songQuery;
      if (artistQuery !== "") querySearch += "artist:" + artistQuery;
      if (albumQuery !== "") querySearch += "album:" + albumQuery;
      return generalTracksSearch(querySearch);
    },
    { enabled: false }
  );

/*
const { isFetching: addingToTimelessRadar, refetch: addToTimelessRadar } =
  useQuery(
    ["addToTimelessRadar"],
    () =>
      addPlaylistToPlaylist(
        playlists?.list.find(playlist => playlist.name === "Release Radar")?.id,
        playlists?.list.find(playlist => playlist.name === "Timeless Radar")?.id
      ),
    { enabled: false }
  );
*/
