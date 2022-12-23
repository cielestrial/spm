import "../css/dashboard.scss";
import {
  Box,
  Center,
  Flex,
  Group,
  Loader,
  MediaQuery,
  SimpleGrid,
  Space,
  Stack,
  Text,
} from "@mantine/core";
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import BackButton from "../components/BackButton";
import CreatePlaylistButton from "../components/CreatePlaylistButton";
import FollowButton from "../components/FollowButton";
import GenreSubscriber from "../components/GenreSubscriber";
import MyScrollArea from "../components/MyScrollArea";
import PlaylistSubscriber from "../components/PlaylistSubscriber";
import Row from "../components/Row";
import ShowTracksButton from "../components/ShowTracksButton";
import TopPlaylistGenres from "../components/TopPlaylistGenres";
import UnfollowButton from "../components/UnfollowButton";
import UpdateAllButton from "../components/UpdateAllButton";

import { inPlaylists } from "../api/functions/HelperFunctions";
import {
  dashboardRefType,
  playlistType,
  tracksType,
} from "../api/SpotifyApiClientTypes";
import { StateContext } from "../api/ContextProvider";
import { useSpotifyQuery } from "../api/QueryApi";
import { GiPlainArrow } from "react-icons/gi";
import { getTracks } from "../api/SpotifyApiClientSide";

type propType = {};

const Dashboard = forwardRef<dashboardRefType, propType>((props, ref) => {
  const context = useContext(StateContext);
  const [getSelectedTrack, setSelectedTrack] = useState<tracksType>();
  const [infoIndex, setInfoIndex] = useState(0);
  const [isLoadingP, setLoadingP] = useState(0);
  const [isLoadingT, setLoadingT] = useState(0);
  const tracksQ = useRef<playlistType | undefined>(undefined);
  const color =
    context.theme.colorScheme === "dark"
      ? context.theme.colors.green[7]
      : context.theme.colors.blue[4];

  useEffect(() => {
    if (context.token === false || context.userInfo === null)
      context.navigate.current("/");
  }, [context.token, context.userInfo]);

  useEffect(() => {
    if (context.playlistsQ.current === undefined) context.navigate.current("/");
  }, [context.playlistsQ.current]);

  useEffect(() => {
    context.setCurrentPage("dashboard");
    context.setShowHeader(true);
  }, []);

  /**
   *
   */
  const setSelectedP = useCallback(
    async (selected: playlistType | undefined) => {
      if (selected === undefined || isLoadingT) return;
      context.selectedPlaylist.current = selected;
      setInfoIndex(0);
      setLoadingT((prev) => prev + 1);
      if (
        context.userInfo?.display_name !== undefined &&
        context.userInfo.display_name !== null
      )
        tracksQ.current = await useSpotifyQuery(
          getTracks,
          0,
          context.selectedPlaylist.current,
          context.userInfo.display_name
        );
      else console.error("Could not read display_name");
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

  useImperativeHandle(
    ref,
    () => ({
      setSelectedP,
      setSelectedT,
    }),
    []
  );

  /**
   * Display list of playlists
   * @returns
   */
  const displayPlaylists = () => {
    if (isLoadingP)
      return (
        <Center h="100%" className="loading">
          <Loader size="sm" />
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
            <Group>
              <Text color={color}>{`${index + 1}. `}</Text>
              <Text>{playlist.name}</Text>
            </Group>
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
          <Loader size="sm" />
        </Center>
      );
    if (infoIndex === 0 && context.selectedPlaylist.current !== undefined) {
      return (
        <Box className="info-card">
          <Row label={"Name:"} value={context.selectedPlaylist.current.name} />
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
            <Row label={"Subscribed Playlists:"} value={null} />
            <PlaylistSubscriber />
          </Group>
          <Space h="md" />
          <Group spacing={0}>
            <Row label={"Subscribed Genres:"} value={null} />
            <GenreSubscriber />
          </Group>
        </Box>
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
            <Group>
              <Text color={color}>{`${index + 1}. `}</Text>
              <Text>{track.name}</Text>
            </Group>
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
      <Text color={color} className="text">
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
        label = "Playlist Details";
        break;
      case 1:
        label = "Playlist Songs";
        break;
      case 2:
        label = "Track Details";
        break;
      default:
        label = "Details";
    }
    const title = loading ? "Details" : label;
    return (
      <Text color={color} w="100%" className="text">
        {title}
      </Text>
    );
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

  //
  return (
    <Flex
      align="center"
      justify="center"
      gap={0}
      direction={{ base: "column", sm: "row" }}
    >
      <Stack miw="min-content" justify="center" align="center" spacing={0}>
        {displayPlaylistsLabel()}
        <MyScrollArea
          maxHeight={"60vh"}
          type={"hover"}
          styles={{
            root: {
              borderStyle: "inset outset outset inset",
              borderColor: "rgba(255, 255, 255, 0.66)",
              height: "60vh",
              width: "35vw",
              minWidth: "15rem",
            },
          }}
        >
          {displayPlaylists()}
        </MyScrollArea>
        <Flex
          align="center"
          justify="space-evenly"
          w="35vw"
          gap="xs"
          mt="lg"
          wrap="wrap"
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
      </Stack>

      {/* Arrow */}
      <MediaQuery smallerThan="xs" styles={{ transform: "rotate(90deg)" }}>
        <Center mt="lg" mx="xl" h="100%">
          <GiPlainArrow
            color={color}
            fontSize="5rem"
            style={{ transform: "rotate(-90deg)" }}
          />
        </Center>
      </MediaQuery>

      <Stack miw="min-content" justify="center" align="center" spacing={0}>
        {displayInfoLabel()}
        <MyScrollArea
          maxHeight={"60vh"}
          type={"hover"}
          styles={{
            root: {
              borderStyle: "inset outset outset inset",
              borderColor: "rgba(255, 255, 255, 0.66)",
              height: "60vh",
              width: "35vw",
              minWidth: "15rem",
            },
          }}
        >
          {displayInfo()}
        </MyScrollArea>
        <Flex
          align="center"
          justify="space-evenly"
          w="35vw"
          gap="xs"
          mt="lg"
          wrap="wrap"
        >
          <BackButton infoIndex={infoIndex} setInfoIndex={setInfoIndex} />
          {displayFollowOrUnfollow()}
        </Flex>
      </Stack>
    </Flex>
  );
});

export default Dashboard;
