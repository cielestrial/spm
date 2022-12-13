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
  TextInput
} from "@mantine/core";
import { useDisclosure, useForceUpdate } from "@mantine/hooks";
import { useCallback, useRef, useState } from "react";
import {
  displayMap,
  generatePlaylistKey,
  inPlaylists
} from "../api/misc/HelperFunctions";
import { loadingAllTracks } from "../pages/Dashboard";
import { playlistsQuery } from "../api/QueryApi";
import {
  duplicateManager,
  generalPlaylistsSearch,
  generalTracksSearch
} from "../api/SpotifyApiClientSide";
import {
  occuranceType,
  playlistType,
  tracksType,
  uniqueType
} from "../api/SpotifyApiClientTypes";
import Row from "./Row";
import LoadMoreLibraryButton from "./LoadMoreLibraryButton";
import LoadMoreGeneralButton from "./LoadMoreGeneralButton";

type propsType = {
  setSelectedP: (selected: playlistType | undefined) => void;
  setSelectedT: (track: tracksType) => void;
};
export type searchCategoryType = "Playlists" | "Tracks";
export type searchAreaType = "Library" | "General";
export const resultLimit = 50;

const SearchBar = (props: propsType) => {
  // UI stuff
  const [opened, { close, open }] = useDisclosure(false);
  const [playlistValue, setPlaylistValue] = useState("");
  const playlistValueRef = useRef("");
  const [songValue, setSongValue] = useState("");
  const songValueRef = useRef("");
  const [artistValue, setArtistValue] = useState("");
  const artistValueRef = useRef("");
  const [albumValue, setAlbumValue] = useState("");
  const albumValueRef = useRef("");
  const selectedCategory = useRef<searchCategoryType>("Playlists");
  const searchCategorySelect: searchCategoryType[] = ["Playlists", "Tracks"];
  const [selectedSearchCategory, setSelectedSearchCategory] =
    useState<searchCategoryType>("Playlists");
  const selectedArea = useRef<searchAreaType>("Library");
  const searchAreaSelect: searchAreaType[] = ["Library", "General"];
  const [selectedSearchArea, setSelectedSearchArea] =
    useState<searchAreaType>("Library");
  const scrollReset = useRef<HTMLDivElement>(null);
  const nameSearchBar = useRef<HTMLInputElement>(null);
  const artistSearchBar = useRef<HTMLInputElement>(null);
  const albumSearchBar = useRef<HTMLInputElement>(null);

  const mutationObserver = new MutationObserver(() => {
    if (scrollReset.current !== null) scrollReset.current.scrollTop = 0;
    mutationObserver.disconnect();
  });

  // Query stuff
  const libraryPlaylistsQ = playlistsQuery();
  const playlistsOffsetRef = useRef(0);
  const tracksOffsetRef = useRef(0);

  // Display query result stuff
  const [searchResults, setSearchResults] = useState<JSX.Element[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dynamicList = useRef<JSX.Element[]>([]);
  const playlistResults = useRef<Map<string, playlistType>[] | undefined>();
  const trackResults = useRef<Set<uniqueType>[] | undefined>();
  const forceUpdate = useForceUpdate();

  // Misc
  const indexRef = useRef(0);
  const pageRef = useRef(0);
  const totalPageRef = useRef(0);
  const counterRef = useRef(0);
  const timeout = useRef<NodeJS.Timeout>();
  const waitTime = 666;

  const displayLoader = () => {
    return [
      <Center key={"loader"} className="loading" h="100%">
        <Loader color="green" size="md" variant="bars" />
      </Center>
    ];
  };

  const search = () => {
    asyncSearch()
      .then(res => {
        setSearchResults(res);
      })
      .finally(() => setIsLoading(false));
  };

  const asyncSearch = async () => {
    if (
      playlistValueRef.current !== "" ||
      songValueRef.current !== "" ||
      artistValueRef.current !== "" ||
      albumValueRef.current !== ""
    ) {
      if (scrollReset.current !== null)
        mutationObserver.observe(scrollReset.current, {
          childList: true
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
                props.setSelectedP(playlist);
                closeHandler();
              }}
            >
              <Row label={"Name:"} value={playlist.name} />
              <Space h={5} />
              <Row label={"Owned By:"} value={playlist.owner} />
              <Space h={5} />
              <Row
                label={"Log:"}
                value={
                  "index " +
                  (indexRef.current + 1) +
                  " of " +
                  counterRef.current
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
                offset={playlistsOffsetRef}
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
    playlistsOffsetRef.current
  ]);

  const searchLibraryPlaylists = async () => {
    dynamicList.current = [];
    playlistResults.current = [];
    indexRef.current = 0;
    pageRef.current = 0;
    totalPageRef.current = 0;
    counterRef.current = 0;

    if (libraryPlaylistsQ.data !== undefined) {
      playlistResults.current.push(new Map<string, playlistType>());
      for (const pl of libraryPlaylistsQ.data.list.values()) {
        if (
          pl.name
            .toLocaleLowerCase()
            .includes(playlistValueRef.current.toLocaleLowerCase())
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
        </Center>
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
                props.setSelectedT(uniqueTrack.track);
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
                label={"Playlists:"}
                value={
                  uniqueTrack.in_playlists.size > 0
                    ? displayMap(uniqueTrack.in_playlists)
                    : inPlaylists(uniqueTrack.track)
                }
              />
              <Space h={5} />
              <Row
                label={"Log:"}
                value={
                  "index " +
                  (indexRef.current + 1) +
                  " of " +
                  counterRef.current
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
                offset={tracksOffsetRef}
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
    tracksOffsetRef.current
  ]);

  const searchLibraryTracks = async () => {
    dynamicList.current = [];
    trackResults.current = [];
    pageRef.current = 0;
    indexRef.current = 0;
    totalPageRef.current = 0;
    counterRef.current = 0;
    if (duplicateManager.size > 0) {
      trackResults.current.push(new Set<uniqueType>());
      for (const uniqueTrack of duplicateManager.values()) {
        if (
          !uniqueTrack.track.is_local &&
          uniqueTrack.track.is_playable &&
          uniqueTrack.track.name
            .toLocaleLowerCase()
            .includes(songValueRef.current.toLocaleLowerCase()) &&
          uniqueTrack.track.album
            .toLocaleLowerCase()
            .includes(albumValueRef.current.toLocaleLowerCase()) &&
          uniqueTrack.track.artists.some(artist =>
            artist
              .toLocaleLowerCase()
              .includes(artistValueRef.current.toLocaleLowerCase())
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
        </Center>
      ];
    } else return dynamicList.current;
  };

  const getGeneralResultsP = useCallback(async () => {
    const data = await generalPlaylistsSearch(
      playlistValueRef.current,
      playlistsOffsetRef.current
    );
    if (data !== undefined && playlistResults.current !== undefined) {
      console.log("res", data.list);
      playlistResults.current[pageRef.current] = data.list;
      totalPageRef.current = data.total;
      counterRef.current = totalPageRef.current;
      addToResultListP();
    } else console.log("right here", data);
  }, [playlistResults.current, pageRef.current]);

  const searchGeneralPlaylists = async () => {
    dynamicList.current = [];
    playlistResults.current = [];
    playlistsOffsetRef.current = 0;
    indexRef.current = 0;
    pageRef.current = 0;
    totalPageRef.current = 0;
    counterRef.current = 0;
    await getGeneralResultsP();

    if (totalPageRef.current === 0) {
      return [
        <Center key="No Playlists" h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Playlists Found
          </Text>
        </Center>
      ];
    } else return dynamicList.current;
  };

  const getGeneralResultsT = useCallback(async () => {
    if (trackResults.current !== undefined) {
      let querySearch = "";
      if (songValueRef.current !== "")
        querySearch += "track:" + songValueRef.current + " ";
      if (artistValueRef.current !== "")
        querySearch += "artist:" + artistValueRef.current + " ";
      if (albumValueRef.current !== "")
        querySearch += "album:" + albumValueRef.current;
      console.log(querySearch);
      const data = await generalTracksSearch(
        querySearch,
        tracksOffsetRef.current
      );
      if (data !== undefined) {
        trackResults.current[pageRef.current] = new Set<uniqueType>(
          data.tracks.map(track => ({
            track: track,
            total_occurances: 1,
            in_playlists: new Map<string, occuranceType>()
          }))
        );
        totalPageRef.current = data.total;
        counterRef.current = totalPageRef.current;
        addToResultListT();
      }
    }
  }, [trackResults.current, pageRef.current, tracksOffsetRef.current]);

  const searchGeneralTracks = async () => {
    dynamicList.current = [];
    trackResults.current = [];
    tracksOffsetRef.current = 0;
    indexRef.current = 0;
    pageRef.current = 0;
    totalPageRef.current = 0;
    counterRef.current = 0;

    await getGeneralResultsT();
    if (totalPageRef.current === 0) {
      return [
        <Center key="No Tracks" h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Tracks Found
          </Text>
        </Center>
      ];
    } else return dynamicList.current;
  };

  const timer = () => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true
      });
      nameSearchBar.current?.dispatchEvent(event);
    }, waitTime);
  };

  const resetHandler = () => {
    setPlaylistValue("");
    playlistValueRef.current = "";

    setSongValue("");
    songValueRef.current = "";

    setArtistValue("");
    artistValueRef.current = "";

    setAlbumValue("");
    albumValueRef.current = "";

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
        <TextInput
          ref={nameSearchBar}
          size="sm"
          w="52.5%"
          autoComplete="off"
          autoCorrect="false"
          aria-label="Playlist Search Bar"
          miw="fit-content"
          radius="xl"
          placeholder="Search Playlists"
          variant="filled"
          mt="md"
          mx="xl"
          data-autofocus
          onChange={event => {
            setPlaylistValue(event.currentTarget.value);
            playlistValueRef.current = event.currentTarget.value;
            setIsLoading(true);
            timer();
          }}
          onKeyDown={event => {
            if (event.key === "Enter") search();
          }}
          value={playlistValue}
        />
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
            ref={nameSearchBar}
            size="sm"
            autoComplete="off"
            autoCorrect="false"
            aria-label="Song Search Bar"
            miw="fit-content"
            radius="xl"
            placeholder="Search Songs"
            variant="filled"
            data-autofocus
            onChange={event => {
              setSongValue(event.currentTarget.value);
              songValueRef.current = event.currentTarget.value;
              setIsLoading(true);
              timer();
            }}
            onKeyDown={event => {
              if (event.key === "Enter") search();
            }}
            value={songValue}
          />

          <TextInput
            ref={artistSearchBar}
            size="sm"
            autoComplete="off"
            autoCorrect="false"
            aria-label="Artist Search Bar"
            miw="fit-content"
            radius="xl"
            placeholder="Search Artists"
            variant="filled"
            onChange={event => {
              setArtistValue(event.currentTarget.value);
              artistValueRef.current = event.currentTarget.value;
              setIsLoading(true);
              timer();
            }}
            onKeyDown={event => {
              if (event.key === "Enter") search();
            }}
            value={artistValue}
          />

          <TextInput
            ref={albumSearchBar}
            size="sm"
            autoComplete="off"
            autoCorrect="false"
            aria-label="Album Search Bar"
            miw="fit-content"
            radius="xl"
            mt="xs"
            placeholder="Search Albums"
            variant="filled"
            onChange={event => {
              setAlbumValue(event.currentTarget.value);
              albumValueRef.current = event.currentTarget.value;
              setIsLoading(true);
              timer();
            }}
            onKeyDown={event => {
              if (event.key === "Enter") search();
            }}
            value={albumValue}
          />
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
        styles={theme => ({
          modal: {
            width: "80vw",
            minHeight: "fit-content"
          }
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
              onChange={e => {
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
              onChange={e => {
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
        size="sm"
        w="60%"
        autoComplete="off"
        miw="max-content"
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
