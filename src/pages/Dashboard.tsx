import "../css/dashboard.scss";
import Logout from "../components/Logout";
import {
  Box,
  Button,
  Center,
  Flex,
  Loader,
  SimpleGrid,
  Text
} from "@mantine/core";
import { useCallback, useRef, useState } from "react";
import UnfollowButton from "../components/UnfollowButton";
import {
  playlistType,
  tokenType,
  tracksType,
  userInfoType
} from "../api/SpotifyApiClientTypes";
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
} from "../api/QueryApi";
import FollowButton from "../components/FollowButton";
import { generatePlaylistKey, inPlaylists } from "../api/misc/HelperFunctions";
import GenreTestButton from "../components/GenreTestButton";
import BackButton from "../components/BackButton";
import Row from "../components/Row";
import ShowTracksButton from "../components/ShowTracksButton";
import GenreSubscriber from "../components/GenreSubscriber";

export let token: tokenType | undefined;
export let userInfo: userInfoType | undefined;
export let loadingAllTracks: boolean = false;

const Dashboard = () => {
  const [getSelectedPlaylist, setSelectedPlaylist] = useState<playlistType>();
  const [getSelectedTrack, setSelectedTrack] = useState<tracksType>();
  const [getCreatedPlaylistName, setCreatedPlaylistName] = useState("");
  const [infoIndex, setInfoIndex] = useState(0);

  const { data: tokenData, isFetching: tokenStatus } = tokenQuery();
  token = tokenData;
  const { data: userData, isFetching: userStatus } = userQuery();
  userInfo = userData;
  const playlistsQ = playlistsQuery();
  const libraryTracksQ = allTracksQuery(playlistsQ.data);
  loadingAllTracks = libraryTracksQ.isFetching;
  const tracksQ = tracksQuery(getSelectedPlaylist);

  const displayTracksCheck = tracksQ.isFetching || libraryTracksQ.isFetching;

  const setSelectedP = useCallback(
    (selected: playlistType | undefined) => {
      if (selected === undefined || displayTracksCheck) return;
      setInfoIndex(0);
      setSelectedPlaylist(selected);
      refetchTracks();
    },
    [displayTracksCheck]
  );

  const setSelectedT = useCallback((track: tracksType) => {
    setSelectedTrack(track);
    setInfoIndex(2);
  }, []);

  const createQ = createQuery(getCreatedPlaylistName, setSelectedP);
  const unfollowQ = unfollowQuery(getSelectedPlaylist, setSelectedP);
  const followQ = followQuery(getSelectedPlaylist, setSelectedP);
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
            onClick={() => setSelectedP(playlist)}
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
  const displayInfo = () => {
    if (displayTracksCheck)
      return (
        <div className="loading container-center">
          <Loader color="green" size="sm" variant="bars" />
        </div>
      );
    if (infoIndex === 0 && getSelectedPlaylist !== undefined) {
      return (
        <Box className="info-card">
          <Row label={"Name:"} value={getSelectedPlaylist.name} />
          <Row label={"Owned By:"} value={getSelectedPlaylist.owner} />
          <Row label={"Songs:"} value={getSelectedPlaylist.total} />
          <Center mt="sm">
            <ShowTracksButton setInfoIndex={setInfoIndex} />
          </Center>
          <Row label={"Top Genres:"} value={null} />
          {"Black Rock Shooter"}
          <Row label={"Subscriptions:"} value={null} />
          <GenreSubscriber />
        </Box>
      );
    } else if (infoIndex === 1 && getSelectedPlaylist?.tracks !== undefined) {
      const dynamicList: JSX.Element[] = [];
      let index = 0;
      for (const track of getSelectedPlaylist.tracks.values()) {
        dynamicList.push(
          <Box
            className="not-button"
            id={track.id}
            key={index++}
            onClick={() => {
              setSelectedT(track);
            }}
          >
            {index + 1}
            {". "}
            {track.name}
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
            <Text className="text">No Tracks</Text>
          </Center>
        );
    }
    if (infoIndex === 2 && getSelectedTrack !== undefined) {
      return (
        <Box className="info-card">
          <Row label={"Name:"} value={getSelectedTrack.name} />
          <Row label={"Artists:"} value={getSelectedTrack.artists.join(", ")} />
          <Row label={"Album:"} value={getSelectedTrack.album} />
          <Row label={"Playlists:"} value={inPlaylists(getSelectedTrack)} />
        </Box>
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

  const displayInfoLabel = () => {
    const loading = getSelectedPlaylist === undefined || displayTracksCheck;
    const title = loading ? "" : "Playlist Info";
    const number = loading ? "" : getSelectedPlaylist?.total;
    const label = getSelectedPlaylist?.total === 1 ? "Track" : "Tracks";
    return <Text className="text">{title}</Text>;
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
          <SearchBar setSelectedP={setSelectedP} setSelectedT={setSelectedT} />
          <Logout />
          <GenreTestButton />
        </Flex>

        <div className="listDisplayArea">
          {displayPlaylistsLabel()}
          {displayInfoLabel()}
          <div id="playlistsDisplay" className="list">
            {displayPlaylists()}
          </div>
          <div id="infoDisplay" className="list">
            {displayInfo()}
          </div>
          <Center h="100%" mt="lg">
            <CreatePlaylistButton
              playlists={playlistsQ}
              setName={setCreatedPlaylistName}
            />
          </Center>
          <Flex
            align="center"
            justify="space-evenly"
            h="100%"
            mt="lg"
            wrap="nowrap"
          >
            <BackButton infoIndex={infoIndex} setInfoIndex={setInfoIndex} />
            {displayFollowOrUnfollow()}
          </Flex>
        </div>
      </div>
    );
  }
};

export default Dashboard;
