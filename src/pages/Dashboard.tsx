import "../css/dashboard.scss";
import Logout from "../components/Logout";
import {
  Box,
  Center,
  Flex,
  Group,
  Loader,
  SimpleGrid,
  Space,
  Text
} from "@mantine/core";
import { useCallback, useEffect, useRef, useState } from "react";
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
  addSubscriptionsQuery,
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
import PlaylistSubscriber from "../components/PlaylistSubscriber";
import TopPlaylistGenres from "../components/TopPlaylistGenres";
import UpdateAllButton from "../components/UpdateAllButton";
import { useNavigate } from "react-router-dom";

export let token: tokenType | undefined | null;
export let userInfo: userInfoType | undefined;
export let loadingAllTracks: boolean = false;

const Dashboard = () => {
  const navigate = useRef(useNavigate());
  const [getSelectedPlaylist, setSelectedPlaylist] = useState<playlistType>();
  const [getSelectedTrack, setSelectedTrack] = useState<tracksType>();
  const [getCreatedPlaylistName, setCreatedPlaylistName] = useState("");
  const [infoIndex, setInfoIndex] = useState(0);

  const { data: tokenData, isFetching: tokenStatus } = tokenQuery();
  token = tokenData;
  useEffect(() => {
    if (tokenData === null) navigate.current("/");
  }, [tokenData]);

  const { data: userData, isFetching: userStatus } = userQuery();
  userInfo = userData;
  const playlistsQ = playlistsQuery();
  const libraryTracksQ = allTracksQuery(playlistsQ.data);
  loadingAllTracks = libraryTracksQ.isFetching;
  const tracksQ = tracksQuery(getSelectedPlaylist);
  let displayTracksCheck = tracksQ.isFetching || libraryTracksQ.isFetching;
  let displayPlaylistsCheck = playlistsQ.isFetching;

  const setSelectedP = useCallback(
    (selected: playlistType | undefined) => {
      if (selected === undefined || displayTracksCheck) return;
      console.log(selected);
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

  const isFollowed = useCallback(() => {
    if (getSelectedPlaylist !== undefined && playlistsQ.data !== undefined) {
      return playlistsQ.data.list.has(generatePlaylistKey(getSelectedPlaylist));
    } else return false;
  }, [getSelectedPlaylist, playlistsQ.data]);

  const isOwned = useCallback(() => {
    if (
      getSelectedPlaylist !== undefined &&
      userInfo !== undefined &&
      getSelectedPlaylist.owner === userInfo.display_name
    )
      return true;
    else return false;
  }, [getSelectedPlaylist, userInfo]);

  const createQ = createQuery(getCreatedPlaylistName, setSelectedP);
  const unfollowQ = unfollowQuery(getSelectedPlaylist, setSelectedP);
  const followQ = followQuery(getSelectedPlaylist, setSelectedP);
  const addSubscriptionsQ = addSubscriptionsQuery(setSelectedP);

  displayTracksCheck = displayTracksCheck || addSubscriptionsQ.isFetching;
  displayPlaylistsCheck =
    displayPlaylistsCheck || createQ.isFetching || unfollowQ.isFetching;

  /**
   * Display list of playlists
   * @returns
   */
  const displayPlaylists = () => {
    if (displayPlaylistsCheck)
      return (
        <Center h="100%" className="loading">
          <Loader color="green" size="sm" variant="bars" />
        </Center>
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
        <Center h="100%" className="loading">
          <Loader color="green" size="sm" variant="bars" />
        </Center>
      );
    if (infoIndex === 0 && getSelectedPlaylist !== undefined) {
      return (
        <SimpleGrid
          h="100%"
          mih="max-content"
          miw="fit-content"
          cols={1}
          verticalSpacing={0}
        >
          <Box className="info-card">
            <Row label={"Name:"} value={getSelectedPlaylist.name} />
            <Space h="md" />
            <Row label={"Owned By:"} value={getSelectedPlaylist.owner} />
            <Space h="md" />
            <Flex wrap="wrap" gap="sm">
              <Row label={"Songs:"} value={getSelectedPlaylist.total} />
              <ShowTracksButton setInfoIndex={setInfoIndex} />
            </Flex>
            <Space h="xs" />
            <Row label={"Top Genres:"} value={null} />
            <TopPlaylistGenres
              selectedPlaylist={getSelectedPlaylist}
              isFollowed={isFollowed}
            />
            <Space h="xs" />
            <Group spacing={0}>
              <Row label={"Subscribed Genres:"} value={null} />
              <GenreSubscriber
                selectedPlaylist={getSelectedPlaylist}
                isFollowed={isFollowed}
                isOwned={isOwned}
              />
            </Group>
            <Space h="md" />
            <Group spacing={0}>
              <Row label={"Subscribed Playlists:"} value={null} />
              <PlaylistSubscriber
                playlists={playlistsQ.data?.list}
                selectedPlaylist={getSelectedPlaylist}
                isFollowed={isFollowed}
                isOwned={isOwned}
              />
            </Group>
          </Box>
        </SimpleGrid>
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
          <Space h="md" />
          <Row label={"Artists:"} value={getSelectedTrack.artists.join(", ")} />
          <Space h="md" />
          <Row label={"Album:"} value={getSelectedTrack.album} />
          <Space h="md" />
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
    let label: string;
    switch (infoIndex) {
      case 0:
        label = "Playlist Info";
        break;
      case 1:
        label = "Playlist Songs";
        break;
      case 2:
        label = "Track Info";
        break;
      default:
        label = "";
    }
    const title = loading ? "" : label;
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
    let decider = isFollowed();
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
          <Flex
            align="center"
            justify="space-evenly"
            h="100%"
            mt="lg"
            wrap="nowrap"
          >
            <CreatePlaylistButton
              playlists={playlistsQ}
              setName={setCreatedPlaylistName}
            />
            <UpdateAllButton
              selectedPlaylist={getSelectedPlaylist}
              playlists={playlistsQ}
              addSubscriptions={addSubscriptionsQ}
            />
          </Flex>
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
