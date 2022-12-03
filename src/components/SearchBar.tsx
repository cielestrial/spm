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
import { useDisclosure } from "@mantine/hooks";
import { useRef, useState } from "react";
import {
  displayMap,
  generatePlaylistKey,
  inPlaylists
} from "../api/misc/HelperFunctions";
import { loadingAllTracks } from "../pages/Dashboard";
import {
  generalPlaylistsQuery,
  generalTracksQuery,
  playlistsQuery
} from "../api/QueryApi";
import { duplicateManager } from "../api/SpotifyApiClientSide";
import {
  playlistType,
  tracksType,
  uniqueType
} from "../api/SpotifyApiClientTypes";
import Row from "./Row";

type propsType = {
  setSelectedP: (selected: playlistType | undefined) => void;
  setSelectedT: (track: tracksType) => void;
};
export type searchCategoryType = "Playlists" | "Tracks";
export type searchAreaType = "Library" | "General";

const SearchBar = (props: propsType) => {
  // UI stuff
  const [opened, { close, open }] = useDisclosure(false);
  const [playlistValue, setPlaylistValue] = useState("");
  const [songValue, setSongValue] = useState("");
  const [artistValue, setArtistValue] = useState("");
  const [albumValue, setAlbumValue] = useState("");
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
  const generalPlaylistsQ = generalPlaylistsQuery(playlistValue);
  const generalTracksQ = generalTracksQuery(songValue, artistValue, albumValue);

  // Display query result stuff
  const [searchResults, setSearchResults] = useState<JSX.Element[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dynamicList = useRef<JSX.Element[]>([]);
  const playlistResults = useRef<Map<string, playlistType> | undefined>();
  const trackResults = useRef<uniqueType[] | undefined>();

  // Misc
  const indexRef = useRef(0);
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
      playlistValue !== "" ||
      songValue !== "" ||
      artistValue !== "" ||
      albumValue !== ""
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

  const searchLibraryPlaylists = async () => {
    dynamicList.current = [];
    playlistResults.current = new Map<string, playlistType>();
    if (libraryPlaylistsQ.data !== undefined) {
      for (const pl of libraryPlaylistsQ.data.list.values()) {
        if (
          pl.name
            .toLocaleLowerCase()
            .includes(playlistValue.toLocaleLowerCase())
        )
          playlistResults.current.set(generatePlaylistKey(pl), pl);
      }
    }
    let index = 0;
    if (playlistResults.current !== undefined) {
      for (const playlist of playlistResults.current.values()) {
        dynamicList.current.push(
          <Box
            className="not-button"
            id={playlist.id}
            key={index++}
            onClick={() => {
              props.setSelectedP(playlist);
              closeHandler();
            }}
          >
            <Row label={"Name:"} value={playlist.name} />
            <Space h={5} />
            <Row label={"Owned By:"} value={playlist.owner} />
          </Box>
        );
      }
    }
    if (dynamicList.current.length === 0) {
      return [
        <Center key={"No Playlists"} h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Playlists Found
          </Text>
        </Center>
      ];
    } else return dynamicList.current;
  };

  const searchLibraryTracks = async () => {
    dynamicList.current = [];
    trackResults.current = [];
    indexRef.current = 0;
    for (const uniqueTrack of duplicateManager.values()) {
      if (
        !uniqueTrack.track.is_local &&
        uniqueTrack.track.is_playable &&
        uniqueTrack.track.name
          .toLocaleLowerCase()
          .includes(songValue.toLocaleLowerCase()) &&
        uniqueTrack.track.album
          .toLocaleLowerCase()
          .includes(albumValue.toLocaleLowerCase()) &&
        uniqueTrack.track.artists.some(artist =>
          artist.toLocaleLowerCase().includes(artistValue.toLocaleLowerCase())
        )
      )
        trackResults.current?.push(uniqueTrack);
    }
    for (const uniqueTrack of trackResults.current) {
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
            value={displayMap(uniqueTrack.in_playlists)}
          />
        </Box>
      );
    }
    if (dynamicList.current.length === 0) {
      return [
        <Center key={"No Tracks"} h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Tracks Found
          </Text>
        </Center>
      ];
    } else return dynamicList.current;
  };

  const searchGeneralPlaylists = async () => {
    dynamicList.current = [];
    playlistResults.current = new Map<string, playlistType>();
    const res = await generalPlaylistsQ.refetch();
    playlistResults.current = res.data?.list;
    if (playlistResults.current !== undefined) {
      let index = 0;
      for (const playlist of playlistResults.current.values()) {
        dynamicList.current.push(
          <Box
            className="not-button"
            id={playlist.id}
            key={index++}
            onClick={() => {
              props.setSelectedP(playlist);
              closeHandler();
            }}
          >
            <Row label={"Name:"} value={playlist.name} />
            <Space h={5} />
            <Row label={"Owned By:"} value={playlist.owner} />
          </Box>
        );
      }
    }
    if (res.data?.list.size === 0) {
      return [
        <Center key={"No Playlists"} h="calc(66vh - 2rem)">
          <Text fw="bold" color="crimson">
            No Playlists Found
          </Text>
        </Center>
      ];
    } else return dynamicList.current;
  };

  // track:Alright artist:Kendrick Lamar
  const searchGeneralTracks = async () => {
    dynamicList.current = [];
    trackResults.current = [];
    const res = await generalTracksQ.refetch();
    if (res.data?.tracks !== undefined) {
      let index = 0;
      for (const track of res.data.tracks.values()) {
        dynamicList.current.push(
          <Box
            className="not-button"
            id={track.id}
            key={index++}
            onClick={() => {
              props.setSelectedT(track);
              closeHandler();
            }}
          >
            <Row label={"Name:"} value={track.name} />
            <Space h={5} />
            <Row label={"Artists:"} value={track.artists.join(", ")} />
            <Space h={5} />
            <Row label={"Album:"} value={track.album} />
            <Space h={5} />
            <Row label={"Playlists:"} value={inPlaylists(track)} />
          </Box>
        );
      }
    }
    if (res.data?.tracks?.length === 0) {
      return [
        <Center key={"No Tracks"} h="calc(66vh - 2rem)">
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
    setSongValue("");
    setArtistValue("");
    setAlbumValue("");
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
            minHeight: "min-content",
            height: "85vh",
            overflow: "clip"
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
              onClick={() => {
                resetHandler();
              }}
              onChange={e => {
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
              onClick={() => {
                resetHandler();
              }}
              onChange={e => {
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
