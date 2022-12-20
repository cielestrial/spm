import {
  Box,
  Center,
  Flex,
  Loader,
  Modal,
  NativeSelect,
  SimpleGrid,
  Space,
  Text,
  TextInput,
} from "@mantine/core";
import {
  useDebouncedValue,
  useDisclosure,
  useForceUpdate,
} from "@mantine/hooks";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  displayMap,
  generatePlaylistKey,
  inPlaylists,
} from "../api/misc/HelperFunctions";
import { dashboardRefType, loadingAllTracks } from "../pages/Dashboard";
import {
  duplicateManager,
  generalPlaylistsSearch,
  generalTracksSearch,
} from "../api/SpotifyApiClientSide";
import {
  occuranceType,
  playlistsType,
  playlistType,
  tracksType,
  uniqueType,
} from "../api/SpotifyApiClientTypes";
import Row from "./Row";
import LoadMoreLibraryButton from "./LoadMoreLibraryButton";
import LoadMoreGeneralButton from "./LoadMoreGeneralButton";
import { useSpotifyQuery } from "../api/QueryApi";
import { StateContext } from "../api/ContextProvider";

type propsType = {
  dashboardRef: React.RefObject<dashboardRefType>;
};
export type searchCategoryType = "Playlists" | "Tracks";
export type searchAreaType = "Library" | "General";
export const resultLimit = 50;
export const waitTime = 750;
export const debounceWaitTime = Math.round(0.67 * waitTime);

const SearchBar = (props: propsType) => {
  // UI stuff
  const [opened, { close, open }] = useDisclosure(false);
  const [playlistValue, setPlaylistValue] = useState("");
  const [debouncedPlaylistValue] = useDebouncedValue(
    playlistValue,
    debounceWaitTime
  );
  const playlistValueRef = useRef("");
  const [songValue, setSongValue] = useState("");
  const [debouncedSongValue] = useDebouncedValue(songValue, debounceWaitTime);
  const songValueRef = useRef("");
  const [artistValue, setArtistValue] = useState("");
  const [debouncedArtistValue] = useDebouncedValue(
    artistValue,
    debounceWaitTime
  );
  const artistValueRef = useRef("");
  const [albumValue, setAlbumValue] = useState("");
  const [debouncedAlbumValue] = useDebouncedValue(albumValue, debounceWaitTime);
  const albumValueRef = useRef("");

  const [genreValue, setGenreValue] = useState("");
  const [debouncedGenreValue] = useDebouncedValue(genreValue, debounceWaitTime);

  const selectedCategory = useRef<searchCategoryType>("Playlists");
  const searchCategorySelect: searchCategoryType[] = ["Playlists", "Tracks"];
  const [selectedSearchCategory, setSelectedSearchCategory] =
    useState<searchCategoryType>("Playlists");
  const selectedArea = useRef<searchAreaType>("Library");
  const searchAreaSelect: searchAreaType[] = ["Library", "General"];
  const [selectedSearchArea, setSelectedSearchArea] =
    useState<searchAreaType>("Library");
  const scrollReset = useRef<HTMLDivElement>(null);
  //const nameSearchBar = useRef<HTMLInputElement>(null);
  //const artistSearchBar = useRef<HTMLInputElement>(null);
  //const albumSearchBar = useRef<HTMLInputElement>(null);

  const mutationObserver = new MutationObserver(() => {
    if (scrollReset.current !== null) scrollReset.current.scrollTop = 0;
    mutationObserver.disconnect();
  });

  // Query stuff
  const offsetRef = useRef(0);
  async function generalPlaylistsQ() {
    const results = (await useSpotifyQuery(
      generalPlaylistsSearch,
      0,
      playlistValueRef.current,
      offsetRef.current
    )) as playlistsType;
    return results;
  }
  const trackValueRef = useRef("");
  const generalTracksQ = async () => {
    const results = (await useSpotifyQuery(
      generalTracksSearch,
      0,
      trackValueRef.current,
      offsetRef.current
    )) as playlistType | undefined;
    return results;
  };

  const getFullTrackQueryValue = () => {
    songValueRef.current = debouncedSongValue;
    artistValueRef.current = debouncedArtistValue;
    albumValueRef.current = debouncedAlbumValue;

    let querySearch = "";
    if (songValueRef.current !== "")
      querySearch += "track:" + songValueRef.current + " ";
    if (artistValueRef.current !== "")
      querySearch += "artist:" + artistValueRef.current + " ";
    if (albumValueRef.current !== "")
      querySearch += "album:" + albumValueRef.current;
    return querySearch;
  };

  // Display query result stuff
  const [searchResults, setSearchResults] = useState<JSX.Element[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dynamicList = useRef<JSX.Element[]>([]);
  const playlistResults = useRef<Map<string, playlistType>[] | undefined>();
  const trackResults = useRef<Set<uniqueType>[] | undefined>();
  const forceUpdate = useForceUpdate();

  // Misc
  const context = useContext(StateContext);
  const indexRef = useRef(0);
  const pageRef = useRef(0);
  const totalPageRef = useRef(0);
  const counterRef = useRef(0); // For debug
  const timeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(search, waitTime);
    return () => clearTimeout(timeout.current);
  }, [
    debouncedPlaylistValue,
    debouncedSongValue,
    debouncedArtistValue,
    debouncedAlbumValue,
    debouncedGenreValue,
  ]);

  const displayLoader = () => {
    return [
      <Center key={"loader"} className="loading" h="100%">
        <Loader color="green" size="md" variant="bars" />
      </Center>,
    ];
  };

  const search = () => {
    asyncSearch()
      .then((res) => {
        setSearchResults(res);
      })
      .finally(() => setIsLoading(false));
  };

  const asyncSearch = async () => {
    if (
      !(debouncedPlaylistValue === "" && debouncedGenreValue === "") ||
      !(
        debouncedSongValue === "" &&
        debouncedArtistValue === "" &&
        debouncedAlbumValue === "" &&
        debouncedGenreValue === ""
      )
    ) {
      if (scrollReset.current !== null)
        mutationObserver.observe(scrollReset.current, {
          childList: true,
        });
      if (selectedSearchCategory === "Playlists") {
        if (selectedSearchArea === "Library")
          return await searchLibraryPlaylists();
        else return await searchGeneralPlaylists();
      } else {
        if (selectedSearchArea === "Library")
          return await searchLibraryTracks();
        else return await searchGeneralTracks();
      }
    }
    return [];
  };

  const addToResultListP = useCallback(() => {
    if (
      playlistResults.current !== undefined &&
      playlistResults.current.length > 0
    ) {
      if (
        dynamicList.current.length > 0 &&
        dynamicList.current[dynamicList.current.length - 1].key === "loadMore"
      )
        dynamicList.current.pop();
      if (playlistResults.current[pageRef.current].size > 0) {
        for (const playlist of playlistResults.current[
          pageRef.current
        ].values()) {
          dynamicList.current.push(
            <Box
              className="not-button"
              id={playlist.id}
              key={indexRef.current++}
              onClick={() => {
                if (props.dashboardRef.current !== null)
                  props.dashboardRef.current.setSelectedP(playlist);
                closeHandler();
              }}
            >
              <Row label={"Name:"} value={playlist.name} />
              <Space h={5} />
              <Row label={"Owned By:"} value={playlist.owner} />
              <Space h={5} />
              <Row
                label={"Top Genres:"}
                value={
                  playlist.topGenres !== undefined &&
                  playlist.topGenres.length > 0
                    ? playlist.topGenres.join(", ")
                    : null
                }
              />
            </Box>
          );
        }
        if (selectedArea.current === "Library")
          dynamicList.current.push(
            <Center key="loadMore" w="calc(80vw - 2rem)">
              <LoadMoreLibraryButton
                page={pageRef}
                totalPages={totalPageRef.current}
                addToResultList={addToResultListP}
              />
            </Center>
          );
        else
          dynamicList.current.push(
            <Center key="loadMore" w="calc(80vw - 2rem)">
              <LoadMoreGeneralButton
                offset={offsetRef}
                page={pageRef}
                total={totalPageRef}
                getResults={getGeneralResultsP}
              />
            </Center>
          );
        forceUpdate();
      }
    }
  }, [
    playlistResults.current,
    dynamicList.current,
    indexRef.current,
    pageRef.current,
    offsetRef.current,
  ]);

  const searchLibraryPlaylists = async () => {
    dynamicList.current = [];
    playlistResults.current = [];
    indexRef.current = 0;
    pageRef.current = 0;
    totalPageRef.current = 0;
    counterRef.current = 0;

    if (context.playlistsQ.current !== undefined) {
      playlistResults.current.push(new Map<string, playlistType>());
      for (const pl of context.playlistsQ.current.list.values()) {
        if (
          pl.name
            .toLocaleLowerCase()
            .includes(debouncedPlaylistValue.toLocaleLowerCase()) &&
          pl.topGenres?.some((genre) =>
            genre
              .toLocaleLowerCase()
              .includes(debouncedGenreValue.toLocaleLowerCase())
          )
        ) {
          playlistResults.current[totalPageRef.current].set(
            generatePlaylistKey(pl),
            pl
          );
          indexRef.current++;
          counterRef.current++;
          if (indexRef.current % resultLimit === 0) {
            totalPageRef.current++;
            indexRef.current = 0;
            playlistResults.current.push(new Map<string, playlistType>());
          }
        }
      }
    }

    indexRef.current = 0;
    addToResultListP();
    if (dynamicList.current.length === 0) {
      return [
        <Center key="No Playlists" h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Playlists Found
          </Text>
        </Center>,
      ];
    } else return dynamicList.current;
  };

  const addToResultListT = useCallback(() => {
    if (trackResults.current !== undefined && trackResults.current.length > 0) {
      if (
        dynamicList.current.length > 0 &&
        dynamicList.current[dynamicList.current.length - 1].key === "loadMore"
      )
        dynamicList.current.pop();
      if (trackResults.current[pageRef.current].size > 0) {
        for (const uniqueTrack of trackResults.current[
          pageRef.current
        ].values()) {
          dynamicList.current.push(
            <Box
              className="not-button"
              id={uniqueTrack.track.id}
              key={indexRef.current++}
              onClick={() => {
                if (props.dashboardRef.current !== null)
                  props.dashboardRef.current.setSelectedT(uniqueTrack.track);
                closeHandler();
              }}
            >
              <Row label={"Name:"} value={uniqueTrack.track.name} />
              <Space h={5} />
              <Row
                label={"Artists:"}
                value={uniqueTrack.track.artists.join(", ")}
              />
              <Space h={5} />
              <Row label={"Album:"} value={uniqueTrack.track.album} />
              <Space h={5} />
              <Row
                label={"Genre:"}
                value={
                  uniqueTrack.track.genres !== undefined &&
                  uniqueTrack.track.genres.size > 0
                    ? Array.from(uniqueTrack.track.genres).join(", ")
                    : null
                }
              />
              <Space h={5} />
              <Row
                label={"Playlists:"}
                value={
                  uniqueTrack.in_playlists.size > 0
                    ? displayMap(uniqueTrack.in_playlists)
                    : inPlaylists(uniqueTrack.track)
                }
              />
            </Box>
          );
        }

        if (selectedArea.current === "Library")
          dynamicList.current.push(
            <Center key="loadMore" w="calc(80vw - 2rem)">
              <LoadMoreLibraryButton
                page={pageRef}
                totalPages={totalPageRef.current}
                addToResultList={addToResultListT}
              />
            </Center>
          );
        else
          dynamicList.current.push(
            <Center key="loadMore" w="calc(80vw - 2rem)">
              <LoadMoreGeneralButton
                offset={offsetRef}
                page={pageRef}
                total={totalPageRef}
                getResults={getGeneralResultsT}
              />
            </Center>
          );
        forceUpdate();
      }
    }
  }, [
    trackResults.current,
    dynamicList.current,
    indexRef.current,
    pageRef.current,
    offsetRef.current,
  ]);

  const searchLibraryTracks = async () => {
    dynamicList.current = [];
    trackResults.current = [];
    pageRef.current = 0;
    indexRef.current = 0;
    totalPageRef.current = 0;
    counterRef.current = 0;
    console.log(duplicateManager.size);
    if (duplicateManager.size > 0) {
      trackResults.current.push(new Set<uniqueType>());
      for (const uniqueTrack of duplicateManager.values()) {
        if (
          !uniqueTrack.track.is_local &&
          uniqueTrack.track.is_playable &&
          uniqueTrack.track.name
            .toLocaleLowerCase()
            .includes(debouncedSongValue.toLocaleLowerCase()) &&
          uniqueTrack.track.album
            .toLocaleLowerCase()
            .includes(debouncedAlbumValue.toLocaleLowerCase()) &&
          uniqueTrack.track.artists.some((artist) =>
            artist
              .toLocaleLowerCase()
              .includes(debouncedArtistValue.toLocaleLowerCase())
          ) &&
          Array.from(uniqueTrack.track.genres).some((genre) =>
            genre
              .toLocaleLowerCase()
              .includes(debouncedGenreValue.toLocaleLowerCase())
          )
        ) {
          trackResults.current[totalPageRef.current].add(uniqueTrack);
          indexRef.current++;
          counterRef.current++;
          if (indexRef.current % resultLimit === 0) {
            totalPageRef.current++;
            indexRef.current = 0;
            trackResults.current.push(new Set<uniqueType>());
          }
        }
      }

      indexRef.current = 0;
      addToResultListT();
    }
    if (dynamicList.current.length === 0) {
      return [
        <Center key="No Tracks" h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Tracks Found
          </Text>
        </Center>,
      ];
    } else return dynamicList.current;
  };

  const getGeneralResultsP = useCallback(async () => {
    const data = await generalPlaylistsQ();
    if (data !== undefined && playlistResults.current !== undefined) {
      playlistResults.current[pageRef.current] = data.list;
      totalPageRef.current = data.total;
      counterRef.current = totalPageRef.current;
      addToResultListP();
    }
  }, [
    playlistResults.current,
    pageRef.current,
    playlistValueRef.current,
    offsetRef.current,
  ]);

  const searchGeneralPlaylists = async () => {
    dynamicList.current = [];
    playlistResults.current = [];
    offsetRef.current = 0;
    indexRef.current = 0;
    pageRef.current = 0;
    totalPageRef.current = 0;
    counterRef.current = 0;

    playlistValueRef.current = debouncedPlaylistValue;
    await getGeneralResultsP();

    if (totalPageRef.current === 0) {
      return [
        <Center key="No Playlists" h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Playlists Found
          </Text>
        </Center>,
      ];
    } else return dynamicList.current;
  };

  const getGeneralResultsT = useCallback(async () => {
    const data = await generalTracksQ();
    if (data !== undefined && trackResults.current !== undefined) {
      trackResults.current[pageRef.current] = new Set<uniqueType>(
        data.tracks.map((track) => ({
          track: track,
          total_occurances: 1,
          in_playlists: new Map<string, occuranceType>(),
        }))
      );
      totalPageRef.current = data.total;
      counterRef.current = totalPageRef.current;
      addToResultListT();
    }
  }, [
    trackValueRef.current,
    trackResults.current,
    pageRef.current,
    offsetRef.current,
  ]);

  const searchGeneralTracks = async () => {
    dynamicList.current = [];
    trackResults.current = [];
    offsetRef.current = 0;
    indexRef.current = 0;
    pageRef.current = 0;
    totalPageRef.current = 0;
    counterRef.current = 0;

    trackValueRef.current = getFullTrackQueryValue();
    await getGeneralResultsT();
    if (totalPageRef.current === 0) {
      return [
        <Center key="No Tracks" h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Tracks Found
          </Text>
        </Center>,
      ];
    } else return dynamicList.current;
  };

  const resetHandler = () => {
    setPlaylistValue("");
    setSongValue("");
    setArtistValue("");
    setAlbumValue("");
    setGenreValue("");
    setSearchResults([]);
    setIsLoading(false);
  };

  const closeHandler = () => {
    resetHandler();
    close();
  };

  const displaySearchBars = () => {
    if (selectedCategory.current === "Playlists") {
      return (
        <Flex
          gap="lg"
          align="end"
          justify="center"
          direction="row"
          wrap="wrap-reverse"
          miw="fit-content"
          w="52.5%"
          mt="xs"
          mx="xl"
        >
          <TextInput
            size="sm"
            w={selectedArea.current !== "Library" ? "100%" : "45%"}
            autoComplete="off"
            autoCorrect="false"
            aria-label="Playlist Search Bar"
            miw="fit-content"
            radius="xl"
            placeholder="Search Playlists"
            variant="filled"
            data-autofocus
            onChange={(event) => {
              setPlaylistValue(event.currentTarget.value);
              setIsLoading(true);
            }}
            value={playlistValue}
          />
          {selectedArea.current !== "Library" ? null : (
            <TextInput
              size="sm"
              w="45%"
              autoComplete="off"
              autoCorrect="false"
              aria-label="Top Genres Search Bar"
              miw="fit-content"
              radius="xl"
              mt="xs"
              placeholder="Search Top Genres"
              variant="filled"
              onChange={(event) => {
                setGenreValue(event.currentTarget.value);
                setIsLoading(true);
              }}
              value={genreValue}
            />
          )}
        </Flex>
      );
    } else {
      return (
        <Flex
          gap="lg"
          align="end"
          justify="center"
          direction="row"
          wrap="wrap-reverse"
          miw="fit-content"
          mt="xs"
          mx="xl"
        >
          <TextInput
            size="sm"
            autoComplete="off"
            autoCorrect="false"
            aria-label="Song Search Bar"
            miw="fit-content"
            radius="xl"
            placeholder="Search Songs"
            variant="filled"
            data-autofocus
            onChange={(event) => {
              setSongValue(event.currentTarget.value);
              setIsLoading(true);
            }}
            value={songValue}
          />

          <TextInput
            size="sm"
            autoComplete="off"
            autoCorrect="false"
            aria-label="Artist Search Bar"
            miw="fit-content"
            radius="xl"
            placeholder="Search Artists"
            variant="filled"
            onChange={(event) => {
              setArtistValue(event.currentTarget.value);
              setIsLoading(true);
            }}
            value={artistValue}
          />

          <TextInput
            size="sm"
            autoComplete="off"
            autoCorrect="false"
            aria-label="Album Search Bar"
            miw="fit-content"
            radius="xl"
            mt="xs"
            placeholder="Search Albums"
            variant="filled"
            onChange={(event) => {
              setAlbumValue(event.currentTarget.value);
              setIsLoading(true);
            }}
            value={albumValue}
          />
          {selectedArea.current !== "Library" ? null : (
            <TextInput
              size="sm"
              autoComplete="off"
              autoCorrect="false"
              aria-label="Top Genres Search Bar"
              miw="fit-content"
              radius="xl"
              mt="xs"
              placeholder="Search Top Genres"
              variant="filled"
              onChange={(event) => {
                setGenreValue(event.currentTarget.value);
                setIsLoading(true);
              }}
              value={genreValue}
            />
          )}
        </Flex>
      );
    }
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          closeHandler();
        }}
        withCloseButton={false}
        padding={0}
        styles={(theme) => ({
          modal: {
            width: "80vw",
            minHeight: "fit-content",
          },
        })}
      >
        <Flex
          gap={0}
          justify="center"
          align="end"
          direction="row-reverse"
          wrap="wrap-reverse"
          mt="lg"
          mb="xl"
        >
          {displaySearchBars()}
          <Flex
            miw="fit-content"
            gap="xl"
            justify="center"
            direction="row"
            wrap="wrap-reverse"
            mx="xl"
          >
            <NativeSelect
              id="category"
              label="Search Category"
              data={searchCategorySelect}
              variant="filled"
              miw="fit-content"
              radius="xl"
              size="sm"
              value={selectedSearchCategory}
              onChange={(e) => {
                resetHandler();
                selectedCategory.current = e.currentTarget
                  .value as searchCategoryType;
                setSelectedSearchCategory(
                  e.currentTarget.value as searchCategoryType
                );
              }}
            />
            <NativeSelect
              id="area"
              label="Search Area"
              data={searchAreaSelect}
              variant="filled"
              radius="xl"
              miw="fit-content"
              size="sm"
              value={selectedSearchArea}
              onChange={(e) => {
                resetHandler();
                selectedArea.current = e.currentTarget.value as searchAreaType;
                setSelectedSearchArea(e.currentTarget.value as searchAreaType);
              }}
            />
          </Flex>
        </Flex>
        <div ref={scrollReset} className="searchlist">
          {isLoading ||
          (loadingAllTracks && selectedSearchCategory === "Tracks") ? (
            displayLoader()
          ) : (
            <SimpleGrid miw={"max-content"} cols={1} verticalSpacing={0}>
              {searchResults}
            </SimpleGrid>
          )}
        </div>
      </Modal>

      <TextInput
        size="xs"
        w="80%"
        mt={6}
        autoComplete="off"
        miw="7rem"
        radius="xl"
        placeholder="Search"
        variant="filled"
        onClick={open}
        readOnly
        value={""}
      />
    </>
  );
};

export default SearchBar;
