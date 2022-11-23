import "./css/dashboard.scss";
import Logout from "./Logout";
import { Box, Center, Group, Loader, Text } from "@mantine/core";
import { useCallback, useRef, useState } from "react";
import UnfollowButton from "./UnfollowButton";
import { playlistType, tokenType } from "./SpotifyApiClientTypes";
import CreatePlaylistButton from "./CreatePlaylistButton";
import SearchBar from "./SearchBar";
import {
  createQuery,
  playlistsQuery,
  refetchTracks,
  tokenQuery,
  tracksQuery,
  unfollowQuery
} from "./QueryApi";

export let token: tokenType | undefined;

const Dashboard = () => {
  //const [playlists, setPlaylists] = useState<playlistsType>();
  const [getSelectedPlaylist, setSelectedPlaylist] = useState<playlistType>();
  const [getCreatedPlaylistName, setCreatedPlaylistName] = useState("");
  const scrollReset = useRef({} as HTMLDivElement);
  const mutationObserver = new MutationObserver(() => {
    scrollReset.current.scrollTop = 0;
    mutationObserver.disconnect();
  });
  const setSelected = useCallback((selected: playlistType | undefined) => {
    setSelectedPlaylist(selected);
    mutationObserver.observe(scrollReset.current, {
      childList: true
    });
    refetchTracks();
  }, []);

  const { data, isFetching: tokenStatus } = tokenQuery();
  token = data;
  const playlistsQ = playlistsQuery();
  const tracksQ = tracksQuery(getSelectedPlaylist);
  const createQ = createQuery(getCreatedPlaylistName, setSelected);
  const unfollowQ = unfollowQuery(getSelectedPlaylist, setSelected);
  const displayPlaylistsCheck =
    playlistsQ.isFetching || createQ.isFetching || unfollowQ.isFetching;
  const displayTracksCheck = tracksQ.isFetching;

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
    if (playlistsQ.data !== undefined) {
      const dynamicList: JSX.Element[] = [];
      playlistsQ.data.list.forEach((playlist, index) => {
        dynamicList.push(
          <Box
            className="not-button"
            id={playlist.id}
            key={index}
            onClick={(event: React.MouseEvent) => {
              refetchTracks();
              setSelectedPlaylist(
                playlistsQ.data?.list.find(
                  playlist => playlist.id === event.currentTarget.id
                )
              );
              mutationObserver.observe(scrollReset.current, {
                childList: true
              });
            }}
          >
            {index + 1 + ". " + playlist.name}
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
    if (getSelectedPlaylist?.tracks !== undefined) {
      const dynamicList: JSX.Element[] = [];
      getSelectedPlaylist.tracks.forEach((track, index) => {
        dynamicList.push(
          <Box className="not-button" id={track.id} key={index}>
            {index + 1 + ". " + track.name}
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
  }

  function displayPlaylistsLabel() {
    const loading = playlistsQ.data === undefined || displayPlaylistsCheck;
    const number = loading ? "" : playlistsQ.data?.total;
    const label = playlistsQ.data?.total === 1 ? "Playlist" : "Playlists";
    return (
      <label className="text">
        {"Your"} {number} {label}
      </label>
    );
  }

  function displayTracksLabel() {
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
        <Group position="center" spacing="xs">
          <p className="title column-element">YSPM</p>
          <SearchBar playlists={playlistsQ} setSelected={setSelected} />
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
            <UnfollowButton
              playlists={playlistsQ}
              playlist={getSelectedPlaylist}
              unfollow={unfollowQ}
            />
          </Center>
        </div>
      </div>
    );
};

export default Dashboard;
