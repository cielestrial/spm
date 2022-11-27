import {
  Box,
  Center,
  Flex,
  Group,
  Loader,
  Modal,
  NativeSelect,
  SimpleGrid,
  Text,
  TextInput
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useRef, useState } from "react";
import { displayMap, inPlaylists } from "../HelperFunctions";
import {
  generalPlaylistsQuery,
  generalTracksQuery,
  playlistsQuery
} from "../QueryApi";
import { duplicateManager } from "../SpotifyApiClientSide";
import { playlistType, uniqueType } from "../SpotifyApiClientTypes";
import { TrackDialogType } from "./TrackDialog";

type propsType = {
  setSelected: (selected: playlistType | undefined) => void;
  trackDialog: React.RefObject<TrackDialogType>;
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
  const playlistResults = useRef<playlistType[] | undefined>();
  const trackResults = useRef<uniqueType[] | undefined>();

  // Misc
  const indexRef = useRef(0);
  const timeout = useRef<NodeJS.Timeout>();
  const waitTime = 666;
  const span = "5rem";

  const displayLoader = () => {
    return [
      <Center key={"loader"} className="loading" h="calc(66vh - 2rem)">
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
    playlistResults.current = [];
    playlistResults.current = libraryPlaylistsQ.data?.list.filter(pl =>
      pl.name.toLocaleLowerCase().includes(playlistValue.toLocaleLowerCase())
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
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Name:"}
            </Text>
            <Text>{playlist.name}</Text>
          </Group>
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Owner:"}
            </Text>
            <Text>{playlist.owner}</Text>
          </Group>
        </Box>
      );
    });
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
    duplicateManager.forEach(uniqueTrack => {
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
    });
    trackResults.current?.forEach(uniqueTrack => {
      dynamicList.current.push(
        <Box
          className="not-button"
          id={uniqueTrack.track.id}
          key={indexRef.current++}
          onClick={() => {
            props.trackDialog.current?.openTrackDialog(uniqueTrack.track);
            closeHandler();
          }}
        >
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Name:"}
            </Text>
            <Text>{uniqueTrack.track.name}</Text>
          </Group>
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Artists:"}
            </Text>
            <Text>{uniqueTrack.track.artists.join(", ")}</Text>
          </Group>
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Album:"}
            </Text>
            <Text>{uniqueTrack.track.album}</Text>
          </Group>
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Playlists:"}
            </Text>
            <Text>{displayMap(uniqueTrack.in_playlists)}</Text>
          </Group>
        </Box>
      );
    });
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
    playlistResults.current = [];
    const res = await generalPlaylistsQ.refetch();
    playlistResults.current = res.data?.list;
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
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Name:"}
            </Text>
            <Text>{playlist.name}</Text>
          </Group>
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Owner:"}
            </Text>
            <Text>{playlist.owner}</Text>
          </Group>
        </Box>
      );
    });
    if (res.data?.list.length === 0) {
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
    res.data?.tracks?.forEach((track, index) => {
      dynamicList.current.push(
        <Box
          className="not-button"
          id={track.id}
          key={index}
          onClick={() => {
            props.trackDialog.current?.openTrackDialog(track);
            closeHandler();
          }}
        >
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Name:"}
            </Text>
            <Text>{track.name}</Text>
          </Group>
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Artists:"}
            </Text>
            <Text>{track.artists.join(", ")}</Text>
          </Group>
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Album:"}
            </Text>
            <Text>{track.album}</Text>
          </Group>
          <Group spacing={0}>
            <Text miw={span} color={"green"}>
              {"Playlists:"}
            </Text>
            <Text>{inPlaylists(track)}</Text>
          </Group>
        </Box>
      );
    });
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
          styles={theme => ({
            label: {
              marginLeft: "0.33rem" // same as border-radius
            }
          })}
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
            styles={theme => ({
              label: {
                marginLeft: "0.33rem" // same as border-radius
              }
            })}
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
            styles={theme => ({
              label: {
                marginLeft: "0.33rem" // same as border-radius
              }
            })}
          />

          <TextInput
            ref={albumSearchBar}
            size="sm"
            autoComplete="off"
            autoCorrect="false"
            aria-label="Album Search Bar"
            miw="fit-content"
            radius="xl"
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
            styles={theme => ({
              label: {
                marginLeft: "0.33rem" // same as border-radius
              }
            })}
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
            maxHeight: "85vh",
            overflow: "clip"
          }
        })}
      >
        <Flex
          gap="lg"
          justify="center"
          align="end"
          direction="row"
          wrap="wrap-reverse"
          mt="lg"
          mb="xl"
        >
          {displaySearchBars()}
          <Flex
            miw="fit-content"
            gap="md"
            justify="center"
            direction="row"
            wrap="wrap-reverse"
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
              styles={theme => ({
                label: {
                  marginLeft: "0.33rem" // Same as border-radius
                }
              })}
            />
          </Flex>
        </Flex>
        <div ref={scrollReset} className="searchlist">
          {isLoading ? (
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
        miw="min-content"
        radius="xl"
        placeholder="Search"
        variant="filled"
        onClick={open}
        readOnly
        defaultValue={""}
      />
    </>
  );
};

export default SearchBar;
