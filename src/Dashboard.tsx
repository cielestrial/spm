import "./css/dashboard.scss";
import Logout from "./Logout";
import { Box, Center, Group, Loader, Text } from "@mantine/core";
import { useCallback, useRef, useState } from "react";
import UnfollowButton from "./UnfollowButton";
import { playlistType, tokenType, userInfoType } from "./SpotifyApiClientTypes";
import CreatePlaylistButton from "./CreatePlaylistButton";
import SearchBar from "./SearchBar";
import {
  createQuery,
  followQuery,
  playlistsQuery,
  refetchTracks,
  tokenQuery,
  tracksQuery,
  unfollowQuery,
  userQuery
} from "./QueryApi";
import FollowButton from "./FollowButton";
import { useForceUpdate } from "@mantine/hooks";

export let token: tokenType | undefined;
export let userInfo: userInfoType | undefined;

const Dashboard = () => {
  //const [playlists, setPlaylists] = useState<playlistsType>();
  const [getSelectedPlaylist, setSelectedPlaylist] = useState<playlistType>();
  const [getCreatedPlaylistName, setCreatedPlaylistName] = useState("");
  const scrollReset = useRef({} as HTMLDivElement);
  const mutationObserver = new MutationObserver(() => {
    scrollReset.current.scrollTop = 0;
    mutationObserver.disconnect();
  });
  const forceUpdate = useForceUpdate();
  const setSelected = useCallback((selected: playlistType | undefined) => {
    setSelectedPlaylist(selected);
    mutationObserver.observe(scrollReset.current, {
      childList: true
    });
    refetchTracks();
    playlistsQ.refetch();
  }, []);

  const { data: tokenData, isFetching: tokenStatus } = tokenQuery();
  token = tokenData;
  const { data: userData, isFetching: userStatus } = userQuery();
  userInfo = userData;
  const playlistsQ = playlistsQuery();
  const tracksQ = tracksQuery(getSelectedPlaylist);
  const createQ = createQuery(getCreatedPlaylistName, setSelected);
  const unfollowQ = unfollowQuery(getSelectedPlaylist, setSelected);
  const followQ = followQuery(getSelectedPlaylist, setSelected);
  const displayPlaylistsCheck =
    playlistsQ.isFetching || createQ.isFetching || unfollowQ.isFetching;
  const displayTracksCheck = tracksQ.isLoading;

  /**
   * Display list of playlists
   * @returns
   */
  const displayPlaylists = () => {
    if (displayPlaylistsCheck)
      return (
        <div className="loading container-center">
          <Loader color="green" size="sm" variant="bars" />
        </div>
      );
    if (playlistsQ.data !== undefined) {
      const dynamicList: JSX.Element[] = [];
      playlistsQ.data.list.forEach((playlist, index) => {
        dynamicList.push(
          <Box
            className="not-button"
            id={playlist.id}
            key={index}
            onClick={(e: React.MouseEvent) => {
              setSelected(
                playlistsQ.data?.list.find(pl => pl.id === e.currentTarget.id)
              );
            }}
          >
            {playlist.name}
          </Box>
        );
      });
      if (dynamicList.length > 0) return dynamicList;
      else
        return (
          <Center h="100%">
            <Text className="text">No Playlists</Text>
          </Center>
        );
    }
  };

  /**
   * Display list of tracks
   * @returns
   */
  const displayTracks = () => {
    if (displayTracksCheck)
      return (
        <div className="loading container-center">
          <Loader color="green" size="sm" variant="bars" />
        </div>
      );
    if (getSelectedPlaylist?.tracks !== undefined) {
      const dynamicList: JSX.Element[] = [];
      getSelectedPlaylist.tracks.forEach((track, index) => {
        dynamicList.push(
          <Box className="not-button" id={track.id} key={index}>
            {track.name}
          </Box>
        );
      });
      if (dynamicList.length > 0) return dynamicList;
      else
        return (
          <Center h="100%">
            <Text className="text">No Tracks</Text>
          </Center>
        );
    }
  };

  const displayPlaylistsLabel = () => {
    const loading = playlistsQ.data === undefined || displayPlaylistsCheck;
    const number = loading ? "" : playlistsQ.data?.total;
    const label = playlistsQ.data?.total === 1 ? "Playlist" : "Playlists";
    return (
      <label className="text">
        {"Your"} {number} {label}
      </label>
    );
  };

  const displayTracksLabel = () => {
    const loading = getSelectedPlaylist === undefined || displayTracksCheck;
    const title = loading ? "" : getSelectedPlaylist?.name;
    const number = loading ? "" : getSelectedPlaylist?.total;
    const label = getSelectedPlaylist?.total === 1 ? "Track" : "Tracks";
    return (
      <label className="text">
        {title}
        <br />
        {number} {label}
      </label>
    );
  };

  const displayUserName = () => {
    if (userInfo !== undefined) {
      if (userInfo.display_name !== null) return ": " + userInfo.display_name;
    }
    return "";
  };

  /**
   * Decides whether to display the follow or unfollow button
   */
  const displayFollowOrUnfollow = () => {
    const decider = playlistsQ.data?.list.some(
      pl => pl.id === getSelectedPlaylist?.id
    );
    if (decider)
      return (
        <UnfollowButton
          playlists={playlistsQ}
          playlist={getSelectedPlaylist}
          unfollow={unfollowQ}
        />
      );
    else
      return (
        <FollowButton
          playlists={playlistsQ}
          playlist={getSelectedPlaylist}
          follow={followQ}
        />
      );
  };

  if (tokenStatus || userStatus) {
    return (
      <div className="background center loading">
        <Loader color="green" size="lg" variant="bars" />
      </div>
    );
  } else {
    return (
      <div className="background start">
        <Group position="center" spacing="xs">
          <p className="title column-element">YSPM{displayUserName()}</p>
          <SearchBar setSelected={setSelected} />
          <Logout />
        </Group>

        <div className="listDisplayArea">
          {displayPlaylistsLabel()}
          {displayTracksLabel()}
          <div className="list">{displayPlaylists()}</div>
          <div className="list" ref={scrollReset}>
            {displayTracks()}
          </div>
          <Center h="100%" mt="lg">
            <CreatePlaylistButton
              playlists={playlistsQ}
              setName={setCreatedPlaylistName}
            />
          </Center>
          <Center h="100%" mt="lg">
            {displayFollowOrUnfollow()}
          </Center>
        </div>
      </div>
    );
  }
};

export default Dashboard;
