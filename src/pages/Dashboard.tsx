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
  Text,
} from "@mantine/core";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import UnfollowButton from "../components/UnfollowButton";
import { playlistType, tracksType } from "../api/SpotifyApiClientTypes";
import CreatePlaylistButton from "../components/CreatePlaylistButton";
import SearchBar from "../components/SearchBar";
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
import { StateContext, token, userInfo } from "../api/ContextProvider";
import { useSpotifyQuery } from "../api/QueryApi";
import { getTracks } from "../api/SpotifyApiClientSide";

export let loadingAllTracks: boolean = false;

const Dashboard = () => {
  const context = useContext(StateContext);
  const [getSelectedTrack, setSelectedTrack] = useState<tracksType>();
  const [infoIndex, setInfoIndex] = useState(0);
  const [isLoadingP, setLoadingP] = useState(0);
  const [isLoadingT, setLoadingT] = useState(0);
  const tracksQ = useRef<playlistType | undefined>(undefined);

  useEffect(() => {
    if (token === null || userInfo === null) context.navigate.current("/");
  }, [token, userInfo]);

  useEffect(() => {
    if (context.playlistsQ.current === undefined)
      context.navigate.current("/loading");
  }, [context.playlistsQ.current]);

  /**
   *
   */
  const setSelectedP = useCallback(
    async (selected: playlistType | undefined) => {
      if (selected === undefined || isLoadingT) return;
      context.selectedPlaylist.current = selected;
      setInfoIndex(0);
      setLoadingT((prev) => prev + 1);

      tracksQ.current = await useSpotifyQuery(
        getTracks,
        0,
        context.selectedPlaylist.current
      );

      setLoadingT((prev) => prev - 1);
    },
    [isLoadingT]
  );

  /**
   *
   */
  const setSelectedT = useCallback((track: tracksType) => {
    setSelectedTrack(track);
    setInfoIndex(2);
  }, []);

  /**
   * Display list of playlists
   * @returns
   */
  const displayPlaylists = () => {
    if (isLoadingP)
      return (
        <Center h="100%" className="loading">
          <Loader color="green" size="sm" variant="bars" />
        </Center>
      );
    if (context.playlistsQ.current !== undefined) {
      const dynamicList: JSX.Element[] = [];
      let index = 0;
      for (const playlist of context.playlistsQ.current.list.values()) {
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
    if (isLoadingT)
      return (
        <Center h="100%" className="loading">
          <Loader color="green" size="sm" variant="bars" />
        </Center>
      );
    if (infoIndex === 0 && context.selectedPlaylist.current !== undefined) {
      return (
        <SimpleGrid
          h="100%"
          mih="max-content"
          miw="fit-content"
          cols={1}
          verticalSpacing={0}
        >
          <Box className="info-card">
            <Row
              label={"Name:"}
              value={context.selectedPlaylist.current.name}
            />
            <Space h="md" />
            <Row
              label={"Owned By:"}
              value={context.selectedPlaylist.current.owner}
            />
            <Space h="md" />
            <Flex wrap="wrap" gap="sm">
              <Row
                label={"Songs:"}
                value={context.selectedPlaylist.current.total}
              />
              <ShowTracksButton setInfoIndex={setInfoIndex} />
            </Flex>
            <Space h="xs" />
            <Row label={"Top Genres:"} value={null} />
            <TopPlaylistGenres />
            <Space h="xs" />
            <Group spacing={0}>
              <Row label={"Subscribed Genres:"} value={null} />
              <GenreSubscriber />
            </Group>
            <Space h="md" />
            <Group spacing={0}>
              <Row label={"Subscribed Playlists:"} value={null} />
              <PlaylistSubscriber />
            </Group>
          </Box>
        </SimpleGrid>
      );
    } else if (
      infoIndex === 1 &&
      context.selectedPlaylist.current?.tracks !== undefined
    ) {
      const dynamicList: JSX.Element[] = [];
      let index = 0;
      for (const track of context.selectedPlaylist.current.tracks.values()) {
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
          <Row
            label={"Genres:"}
            value={Array.from(getSelectedTrack.genres).join(", ")}
          />
          <Space h="md" />
          <Row label={"Playlists:"} value={inPlaylists(getSelectedTrack)} />
        </Box>
      );
    }
  };

  const displayPlaylistsLabel = () => {
    const loading = context.playlistsQ.current === undefined || isLoadingP;
    const number = loading ? "" : context.playlistsQ.current?.total;
    const label =
      context.playlistsQ.current?.total === 1 ? "Playlist" : "Playlists";
    return (
      <Text w="100%" className="text">
        {"Your"} {number} {label}
      </Text>
    );
  };

  const displayInfoLabel = () => {
    const loading =
      context.selectedPlaylist.current === undefined || isLoadingT;
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
    return (
      <Text w="100%" className="text">
        {title}
      </Text>
    );
  };

  const displayUserName = () => {
    if (userInfo !== undefined && userInfo !== null) {
      if (userInfo.display_name !== null) return ": " + userInfo.display_name;
    }
    return "";
  };

  /**
   * Decides whether to display the follow or unfollow button
   */
  const displayFollowOrUnfollow = () => {
    let decider = context.isFollowed();
    if (decider)
      return (
        <UnfollowButton setSelected={setSelectedP} setLoading={setLoadingP} />
      );
    else
      return (
        <FollowButton setSelected={setSelectedP} setLoading={setLoadingP} />
      );
  };
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

      <Flex
        gap="xl"
        justify="center"
        align="center"
        direction="row"
        wrap="wrap"
        w="100%"
        mt="xl"
        mb="xl"
      >
        <Group miw="min-content" position="center" spacing={0}>
          {displayPlaylistsLabel()}
          <div id="playlistsDisplay" className="list">
            {displayPlaylists()}
          </div>
          <Flex
            align="center"
            justify="space-evenly"
            w="80%"
            h="100%"
            mt="lg"
            wrap="nowrap"
          >
            <CreatePlaylistButton
              setSelected={setSelectedP}
              setLoading={setLoadingP}
            />
            <UpdateAllButton
              setSelected={setSelectedP}
              setLoading={setLoadingT}
            />
          </Flex>
        </Group>

        <Group miw="min-content" position="center" spacing={0}>
          {displayInfoLabel()}
          <div id="infoDisplay" className="list">
            {displayInfo()}
          </div>
          <Flex
            align="center"
            justify="space-evenly"
            w="80%"
            h="100%"
            mt="lg"
            wrap="nowrap"
          >
            <BackButton infoIndex={infoIndex} setInfoIndex={setInfoIndex} />
            {displayFollowOrUnfollow()}
          </Flex>
        </Group>
      </Flex>
    </div>
  );
};

export default Dashboard;
