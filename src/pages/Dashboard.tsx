import "../css/dashboard.scss";
import Logout from "../components/Logout";
import { Box, Center, Flex, Loader, SimpleGrid, Text } from "@mantine/core";
import { useCallback, useRef, useState } from "react";
import UnfollowButton from "../components/UnfollowButton";
import {
  playlistType,
  tokenType,
  userInfoType
} from "../SpotifyApiClientTypes";
import CreatePlaylistButton from "../components/CreatePlaylistButton";
import SearchBar from "../components/SearchBar";
import {
  allTracksQuery,
  createQuery,
  followQuery,
  playlistsQuery,
  refetchTracks,
  tokenQuery,
  tracksQuery,
  unfollowQuery,
  userQuery
} from "../QueryApi";
import FollowButton from "../components/FollowButton";
import TrackDialog, { TrackDialogType } from "../components/TrackDialog";
import { generatePlaylistKey } from "../HelperFunctions";

export let token: tokenType | undefined;
export let userInfo: userInfoType | undefined;
export let loadingAllTracks: boolean = false;

const Dashboard = () => {
  const [getSelectedPlaylist, setSelectedPlaylist] = useState<playlistType>();
  const [getCreatedPlaylistName, setCreatedPlaylistName] = useState("");
  const trackDialog = useRef<TrackDialogType>(null);

  const scrollReset = useRef<HTMLDivElement>(null);
  const mutationObserver = new MutationObserver(() => {
    if (scrollReset.current !== null) scrollReset.current.scrollTop = 0;
    mutationObserver.disconnect();
  });

  const { data: tokenData, isFetching: tokenStatus } = tokenQuery();
  token = tokenData;
  const { data: userData, isFetching: userStatus } = userQuery();
  userInfo = userData;
  const playlistsQ = playlistsQuery();
  const libraryTracksQ = allTracksQuery(playlistsQ.data);
  loadingAllTracks = libraryTracksQ.isFetching;
  const tracksQ = tracksQuery(getSelectedPlaylist);

  const displayTracksCheck = tracksQ.isFetching || libraryTracksQ.isFetching;

  const setSelected = useCallback(
    (selected: playlistType | undefined) => {
      if (selected === undefined || displayTracksCheck) return;
      setSelectedPlaylist(selected);
      if (scrollReset.current !== null)
        mutationObserver.observe(scrollReset.current, {
          childList: true
        });
      refetchTracks();
    },
    [displayTracksCheck]
  );

  const createQ = createQuery(getCreatedPlaylistName, setSelected);
  const unfollowQ = unfollowQuery(getSelectedPlaylist, setSelected);
  const followQ = followQuery(getSelectedPlaylist, setSelected);
  const displayPlaylistsCheck =
    playlistsQ.isFetching || createQ.isFetching || unfollowQ.isFetching;

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
      let index = 0;
      for (const playlist of playlistsQ.data.list.values()) {
        dynamicList.push(
          <Box
            className="not-button"
            id={playlist.id}
            key={index++}
            onClick={() => setSelected(playlist)}
          >
            {index + 1}
            {". "}
            {playlist.name}
          </Box>
        );
      }
      if (dynamicList.length > 0)
        return (
          <SimpleGrid miw={"max-content"} cols={1} verticalSpacing={0}>
            {dynamicList}
          </SimpleGrid>
        );
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
      let index = 0;
      for (const track of getSelectedPlaylist.tracks.values()) {
        dynamicList.push(
          <Box
            className="not-button"
            id={track.id}
            key={index++}
            onClick={() => trackDialog.current?.openTrackDialog(track)}
          >
            {index + 1}
            {". "}
            {track.name}
          </Box>
        );
      }
      if (dynamicList.length > 0)
        return (
          <SimpleGrid
            ref={scrollReset}
            miw={"max-content"}
            cols={1}
            verticalSpacing={0}
          >
            {dynamicList}
          </SimpleGrid>
        );
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
      <Text className="text">
        {"Your"} {number} {label}
      </Text>
    );
  };

  const displayTracksLabel = () => {
    const loading = getSelectedPlaylist === undefined || displayTracksCheck;
    const title = loading ? "" : getSelectedPlaylist?.name;
    const number = loading ? "" : getSelectedPlaylist?.total;
    const label = getSelectedPlaylist?.total === 1 ? "Track" : "Tracks";
    return (
      <Text className="text">
        {title}
        {title !== "" ? <br /> : null}
        {number} {label}
      </Text>
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
    let decider = false;
    if (getSelectedPlaylist !== undefined && playlistsQ.data !== undefined) {
      decider = playlistsQ.data.list.has(
        generatePlaylistKey(getSelectedPlaylist)
      );
    }
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
        <Flex
          my="xl"
          gap="xl"
          justify="center"
          align="center"
          direction="row"
          wrap="nowrap"
        >
          <Center>
            <p className="title column-element">YSPM{displayUserName()}</p>
          </Center>
          <SearchBar setSelected={setSelected} trackDialog={trackDialog} />
          <Logout />
        </Flex>

        <div className="listDisplayArea">
          {displayPlaylistsLabel()}
          {displayTracksLabel()}
          <div id="playlistsDisplay" className="list">
            {displayPlaylists()}
          </div>
          <div id="tracksDisplay" className="list" ref={scrollReset}>
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
        <TrackDialog ref={trackDialog} />
      </div>
    );
  }
};

export default Dashboard;
