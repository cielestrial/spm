import {
  Box,
  Center,
  Group,
  Loader,
  Modal,
  NativeSelect,
  Text,
  TextInput
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRef, useState } from "react";
import { arrayToString } from "./HelperFunctions";
import { allTracksQuery, playlistsQuery } from "./QueryApi";
import { playlistType, tracksType } from "./SpotifyApiClientTypes";

type propsType = {
  setSelected: (selected: playlistType | undefined) => void;
};
type searchCategoryType = "Playlists" | "Tracks";
type searchAreaType = "Library" | "General";
const SearchBar = (props: propsType) => {
  const [opened, { close, open }] = useDisclosure(false);
  const [value, setValue] = useState("");
  const selectedCategory = useRef<searchCategoryType>("Playlists");
  const searchCategorySelect: searchCategoryType[] = ["Playlists", "Tracks"];
  const [selectedSearchCategory, setSelectedSearchCategory] =
    useState<searchCategoryType>("Playlists");
  const selectedArea = useRef<searchAreaType>("Library");
  const searchAreaSelect: searchAreaType[] = ["Library", "General"];
  const [selectedSearchArea, setSelectedSearchArea] =
    useState<searchAreaType>("Library");
  const scrollReset = useRef({} as HTMLDivElement);
  const searchBar = useRef<HTMLInputElement>(null);
  const mutationObserver = new MutationObserver(() => {
    scrollReset.current.scrollTop = 0;
    mutationObserver.disconnect();
  });
  const allPlaylistsFlag = useRef(true);
  const allTracksFlag = useRef(true);
  const allTracksQ = allTracksQuery();
  const allPlaylistsQ = playlistsQuery();
  const [searchResults, setSearchResults] = useState<JSX.Element[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dynamicList = useRef<JSX.Element[]>([]);
  const playlistResults = useRef<playlistType[] | undefined>();
  const trackResults = useRef<tracksType[] | undefined>();
  const timeout = useRef<NodeJS.Timeout>();
  const waitTime = 666;

  const getLibrary = () => {
    if (selectedArea.current === "Library") {
      if (
        selectedCategory.current === "Playlists" &&
        allPlaylistsFlag.current
      ) {
        allPlaylistsQ.refetch();
        allPlaylistsFlag.current = false;
      } else if (
        selectedCategory.current === "Tracks" &&
        allTracksFlag.current
      ) {
        allTracksQ.refetch();
        allTracksFlag.current = false;
      }
    }
  };

  const displayLoader = () => {
    return [
      <Center key={"loader"} className="loading" h="calc(66vh - 2rem)">
        <Loader color="green" size="md" variant="bars" />
      </Center>
    ];
  };

  const search = async () => {
    if (value !== "") {
      mutationObserver.observe(scrollReset.current, {
        childList: true
      });
      if (selectedSearchCategory === "Playlists") {
        return await searchLocalPlaylists();
      } else if (selectedSearchCategory === "Tracks") {
        return await searchLocalTracks();
      }
    }
    return [];
  };

  const searchLocalPlaylists = async () => {
    dynamicList.current = [];
    playlistResults.current = [];
    playlistResults.current = allPlaylistsQ.data?.list.filter(pl =>
      pl.name.toLocaleLowerCase().includes(value.toLocaleLowerCase())
    );
    playlistResults.current?.forEach((playlist, index) => {
      dynamicList.current.push(
        <Box
          className="not-button"
          id={playlist.id}
          key={index}
          onClick={() => {
            props.setSelected(playlist);
            closeHandler();
          }}
        >
          {playlist.name}
        </Box>
      );
    });
    // Search public?
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

  const searchLocalTracks = async () => {
    dynamicList.current = [];
    trackResults.current = [];
    let index = 0;
    allPlaylistsQ.data?.list.forEach(pl => {
      trackResults.current = pl.tracks?.filter(tr => {
        return (
          !tr.is_local &&
          tr.is_playable &&
          (tr.name.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
            tr.album.toLocaleLowerCase().includes(value.toLocaleLowerCase()) ||
            tr.artists.some(artist =>
              artist.toLocaleLowerCase().includes(value.toLocaleLowerCase())
            ))
        );
      });
      trackResults.current?.forEach(track => {
        dynamicList.current.push(
          <Box
            className="not-button"
            id={track.id}
            key={index++}
            onClick={() => {
              //closeHandler();
            }}
          >
            {track.name}
            <br />
            {arrayToString(track.artists)}
            <br />
            {pl.name}
            <br />
          </Box>
        );
      });
    });
    // Search public?
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

  const timer = () => {
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true
      });
      if (searchBar.current === null) console.log("why?");
      searchBar.current?.dispatchEvent(event);
    }, waitTime);
  };

  const resetHandler = () => {
    setValue("");
    setSearchResults([]);
    setIsLoading(false);
  };

  const closeHandler = () => {
    resetHandler();
    allPlaylistsFlag.current = true;
    allTracksFlag.current = true;
    close();
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          closeHandler();
        }}
        withCloseButton={false}
        size="75vw"
        padding={0}
        styles={theme => ({
          modal: {
            minWidth: "fit-content",
            width: "75vw",
            minHeight: "fit-content",
            maxHeight: "85vh"
          }
        })}
      >
        <Group
          position="center"
          align="end"
          w="75vw"
          miw="fit-content"
          spacing="xs"
          my="lg"
        >
          <TextInput
            ref={searchBar}
            size="sm"
            w="52.5%"
            autoComplete="off"
            autoCorrect="false"
            aria-label="Search Bar"
            miw="min-content"
            radius="xl"
            placeholder="Search"
            variant="filled"
            data-autofocus
            onChange={event => {
              setValue(event.currentTarget.value);
              setIsLoading(true);
              timer();
            }}
            onKeyDown={event => {
              if (event.key === "Enter") {
                //event.currentTarget.blur();
                search()
                  .then(res => {
                    setSearchResults(res);
                  })
                  .finally(() => setIsLoading(false));
              }
            }}
            value={value}
            styles={theme => ({
              label: {
                marginLeft: "0.33rem" // same as border-radius
              }
            })}
          />
          <Group
            w="40%"
            miw="fit-content"
            position="center"
            align="end"
            grow
            spacing="xs"
          >
            <NativeSelect
              id="category"
              label="Search Category"
              data={searchCategorySelect}
              variant="filled"
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
                getLibrary();
              }}
              styles={theme => ({
                label: {
                  marginLeft: "0.33rem" // Same as border-radius
                }
              })}
            />
            <NativeSelect
              id="area"
              label="Search Area"
              data={searchAreaSelect}
              variant="filled"
              radius="xl"
              size="sm"
              value={selectedSearchArea}
              onClick={() => {
                resetHandler();
              }}
              onChange={e => {
                selectedArea.current = e.currentTarget.value as searchAreaType;
                setSelectedSearchArea(e.currentTarget.value as searchAreaType);
                getLibrary();
              }}
              styles={theme => ({
                label: {
                  marginLeft: "0.33rem" // Same as border-radius
                }
              })}
            />
          </Group>
        </Group>
        <div ref={scrollReset} className="searchlist">
          {isLoading ? displayLoader() : searchResults}
        </div>
      </Modal>

      <TextInput
        size="sm"
        w="60%"
        autoComplete="off"
        miw="min-content"
        radius="xl"
        placeholder="Search"
        variant="filled"
        onClick={open}
        readOnly
        value={value}
      />
    </>
  );
};

export default SearchBar;