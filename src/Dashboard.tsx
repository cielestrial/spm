import "./css/dashboard.scss";
import Logout from "./Logout";
import {
  getToken,
  getTracks,
  getPlaylists,
  createPlaylist,
  unfollowPlaylist,
  addPlaylistToPlaylist
} from "./SpotifyApiClientSide";
import { useQuery } from "react-query";
import { Box, Center, Loader } from "@mantine/core";
import { useRef } from "react";
import UnfollowButton from "./UnfollowButton";
import { playlistType } from "./SpotifyApiClientTypes";
import CreatePlaylistButton, {
  createdPlaylistName
} from "./CreatePlaylistButton";
import { useForceUpdate } from "@mantine/hooks";

const Dashboard = () => {
  let selectedPlaylist: playlistType | undefined;
  const selectedPlaylistState = useRef<playlistType | undefined>(undefined);
  const scrollReset = useRef({} as HTMLDivElement);
  const mutationObserver = new MutationObserver(() => {
    scrollReset.current.scrollTop = 0;
    mutationObserver.disconnect();
  });
  const forceUpdate = useForceUpdate();

  // Gets access token
  const { data: token, isFetching: tokenStatus } = useQuery("token", getToken);

  // Gets playlist
  const {
    data: playlists,
    isFetching: playlistStatus,
    refetch: refetchPlaylists,
    isRefetching: refetchPlaylistStatus
  } = useQuery(["playlists", token], () => getPlaylists(), {
    enabled: token !== undefined
  });

  // Gets tracks
  const {
    data: tracks,
    isFetching: trackStatus,
    refetch: refetchTracks,
    isRefetching: refetchTrackStatus
  } = useQuery(
    ["tracks", selectedPlaylist],
    async () => {
      const res = getTracks(selectedPlaylist?.id);
      forceUpdate();
      return res;
    },
    { enabled: false }
  );

  // Creates playlist with name
  const { isFetching: creating, refetch: refetchCreate } = useQuery(
    ["create", createdPlaylistName],
    async () => {
      const res = await createPlaylist(createdPlaylistName);
      forceUpdate();
      return res;
    },
    { enabled: false }
  );

  // Unfollows currently selected playlist
  let { isFetching: unfollowing, refetch: refetchUnfollow } = useQuery(
    ["unfollow", selectedPlaylistState],
    async () => {
      const res = await unfollowPlaylist(selectedPlaylistState.current?.id);
      selectedPlaylist = undefined;
      selectedPlaylistState.current = selectedPlaylist;
      return res;
    },
    { enabled: false }
  );

  const { isFetching: addingToTimelessRadar, refetch: addToTimelessRadar } =
    useQuery(
      ["addToTimelessRadar"],
      () =>
        addPlaylistToPlaylist(
          playlists?.list.find(playlist => playlist.name === "Release Radar")
            ?.id,
          playlists?.list.find(playlist => playlist.name === "Timeless Radar")
            ?.id
        ),
      { enabled: false }
    );
  const {
    isFetching: addingToTimelessDiscovery,
    refetch: addToTimelessDiscovery
  } = useQuery(
    ["addToTimelessDiscovery"],
    () =>
      addPlaylistToPlaylist(
        playlists?.list.find(playlist => playlist.name === "Discover Weekly")
          ?.id,
        playlists?.list.find(playlist => playlist.name === "Timeless Discovery")
          ?.id
      ),
    { enabled: false }
  );

  const timelessCheck =
    creating ||
    unfollowing ||
    addingToTimelessRadar ||
    addingToTimelessDiscovery;

  const displayPlaylistsCheck =
    playlistStatus || refetchPlaylistStatus || timelessCheck;

  const displayTracksCheck = trackStatus || refetchTrackStatus;

  /**
   * Display list of playlists
   * @returns
   */
  function displayPlaylists() {
    if (displayPlaylistsCheck)
      return (
        <div className="loading container-center">
          <Loader color="green" size="sm" variant="bars" />
        </div>
      );
    if (playlists !== undefined) {
      const dynamicList: JSX.Element[] = [];
      playlists.list.forEach((playlist, index) => {
        dynamicList.push(
          <Box
            className="not-button"
            id={playlist.id}
            key={index}
            onClick={(event: React.MouseEvent) => {
              selectedPlaylist = playlists?.list.find(
                playlist => playlist.id === event.currentTarget.id
              );
              selectedPlaylistState.current = selectedPlaylist;
              mutationObserver.observe(scrollReset.current, {
                childList: true
              });
              refetchTracks();
            }}
          >
            {index + 1 + ". " + playlist.name}
          </Box>
        );
      });
      if (dynamicList.length > 0) return dynamicList;
      else return <p className="error text">No playlists</p>;
    }
  }

  /**
   * Display list of tracks
   * @returns
   */
  function displayTracks() {
    if (displayTracksCheck)
      return (
        <div className="loading container-center">
          <Loader color="green" size="sm" variant="bars" />
        </div>
      );
    if (tracks?.tracks !== undefined) {
      const dynamicList: JSX.Element[] = [];
      tracks.tracks.forEach((track, index) => {
        dynamicList.push(
          <Box className="not-button" id={track.id} key={index}>
            {index + 1 + ". " + track.name}
          </Box>
        );
      });
      if (dynamicList.length > 0) return dynamicList;
      else return <p className="error text">No tracks</p>;
    }
  }

  function displayPlaylistsLabel() {
    const loading = playlists === undefined || displayPlaylistsCheck;
    const number = loading ? "" : playlists?.total;
    const label = playlists?.total === 1 ? "Playlist" : "Playlists";
    return (
      <label className="text">
        {"Your"} {number} {label}
      </label>
    );
  }

  function displayTracksLabel() {
    const loading = tracks === undefined || displayTracksCheck;
    const title = loading ? "" : tracks?.name;
    const number = loading ? "" : tracks?.total;
    const label = tracks?.total === 1 ? "Track" : "Tracks";
    return (
      <label className="text">
        {title}
        <br />
        {number} {label}
      </label>
    );
  }

  if (tokenStatus)
    return (
      <div className="background center loading">
        <Loader color="green" size="lg" variant="bars" />
      </div>
    );
  else
    return (
      <div className="background start">
        <p className="title start column-element">
          Your Spotify Playlist Manager
          <Logout />
        </p>
        <div className="listDisplayArea">
          {displayPlaylistsLabel()}
          {displayTracksLabel()}
          <div className="list">{displayPlaylists()}</div>
          <div className="list" ref={scrollReset}>
            {displayTracks()}
          </div>
          <Center h="100%" mt="lg">
            <CreatePlaylistButton
              create={refetchCreate}
              refetchPlaylists={refetchPlaylists}
              refetchTracks={refetchTracks}
            />
          </Center>
          <Center h="100%" mt="lg">
            <UnfollowButton
              playlist={selectedPlaylistState}
              unfollow={refetchUnfollow}
              refetchTracks={refetchTracks}
            />
          </Center>
        </div>
      </div>
    );
};

export default Dashboard;
