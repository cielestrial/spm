import "../css/dashboard.scss";
import {
  Box,
  Center,
  Flex,
  Group,
  Loader,
  MediaQuery,
  ScrollArea,
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
import UnfollowButton from "../components/UnfollowButton";
import { playlistType, tracksType } from "../api/SpotifyApiClientTypes";
import CreatePlaylistButton from "../components/CreatePlaylistButton";
import FollowButton from "../components/FollowButton";
import { inPlaylists } from "../api/misc/HelperFunctions";
import BackButton from "../components/BackButton";
import Row from "../components/Row";
import ShowTracksButton from "../components/ShowTracksButton";
import GenreSubscriber from "../components/GenreSubscriber";
import PlaylistSubscriber from "../components/PlaylistSubscriber";
import TopPlaylistGenres from "../components/TopPlaylistGenres";
import UpdateAllButton from "../components/UpdateAllButton";
import { StateContext } from "../api/ContextProvider";
import { useSpotifyQuery } from "../api/QueryApi";
import { getTracks } from "../api/SpotifyApiClientSide";
import { GiPlainArrow } from "react-icons/gi";
import { debounceWaitTime } from "../components/SearchBar";

export let loadingAllTracks: boolean = false;

type propType = {};
export type dashboardRefType = {
  setSelectedP: (selected: playlistType | undefined) => Promise<void>;
  setSelectedT: (track: tracksType) => void;
};

const Dashboard = forwardRef<dashboardRefType, propType>((props, ref) => {
  const context = useContext(StateContext);
  const [getSelectedTrack, setSelectedTrack] = useState<tracksType>();
  const [infoIndex, setInfoIndex] = useState(0);
  const [isLoadingP, setLoadingP] = useState(0);
  const [isLoadingT, setLoadingT] = useState(0);
  const tracksQ = useRef<playlistType | undefined>(undefined);

  useEffect(() => {
    if (context.token === null || context.userInfo === null)
      context.navigate.current("/dashboard");
  }, [context.token, context.userInfo]);

  useEffect(() => {
    if (context.playlistsQ.current === undefined)
      context.navigate.current("/dashboard");
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
      <Text className="text">
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
      <Text w="100%" className="text">
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
      direction={{ base: "column", xs: "row" }}
    >
      <Stack miw="min-content" justify="center" align="center" spacing={0}>
        {displayPlaylistsLabel()}
        <ScrollArea.Autosize
          maxHeight={"60vh"}
          type="auto"
          offsetScrollbars
          scrollbarSize={8}
          scrollHideDelay={debounceWaitTime}
          styles={(theme) => ({
            root: {
              borderStyle: "inset outset outset inset",
              borderColor: "rgba(255, 255, 255, 0.66)",
              height: "60vh",
              width: "35vw",
              minWidth: "15rem",
            },
            scrollbar: {
              '&[data-orientation="vertical"] .mantine-ScrollArea-thumb': {
                backgroundColor: "forestgreen",
              },
              '&[data-orientation="horizontal"] .mantine-ScrollArea-thumb': {
                backgroundColor: "forestgreen",
              },
            },
            corner: {
              opacity: 1,
              background:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[0],
            },
          })}
        >
          {displayPlaylists()}
        </ScrollArea.Autosize>
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
            fontSize="5rem"
            style={{ transform: "rotate(-90deg)" }}
          />
        </Center>
      </MediaQuery>

      <Stack miw="min-content" justify="center" align="center" spacing={0}>
        {displayInfoLabel()}
        <ScrollArea.Autosize
          maxHeight={"60vh"}
          type="always"
          offsetScrollbars
          scrollbarSize={8}
          scrollHideDelay={debounceWaitTime}
          styles={(theme) => ({
            root: {
              borderStyle: "inset outset outset inset",
              borderColor: "rgba(255, 255, 255, 0.66)",
              height: "60vh",
              width: "35vw",
              minWidth: "15rem",
            },
            scrollbar: {
              '&[data-orientation="vertical"] .mantine-ScrollArea-thumb': {
                backgroundColor: "forestgreen",
              },
              '&[data-orientation="horizontal"] .mantine-ScrollArea-thumb': {
                backgroundColor: "forestgreen",
              },
            },
            corner: {
              opacity: 1,
              background:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[0],
            },
          })}
        >
          {displayInfo()}
        </ScrollArea.Autosize>
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
