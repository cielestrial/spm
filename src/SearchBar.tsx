import { Box, Modal, Text, TextInput } from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { playlistType } from "./SpotifyApiClientTypes";

type propsType = {
  playlists:
    | {
        total: number;
        list: playlistType[];
      }
    | undefined;
};
const SearchBar = (props: propsType) => {
  const [opened, { close, open }] = useDisclosure(false);
  const [value, setValue] = useState("");
  const [debounced] = useDebouncedValue(value, 333, { leading: false });

  function localSearch() {
    const dynamicList: JSX.Element[] = [];
    if (debounced !== "") {
      const results = props.playlists?.list.filter(playlist =>
        playlist.name.toLowerCase().includes(debounced.toLowerCase())
      );
      results?.forEach((playlist, index) => {
        dynamicList.push(
          <Box
            className="not-button"
            id={playlist.id}
            key={index}
            onClick={() => {
              setValue("");
              close();
            }}
          >
            {playlist.name}
          </Box>
        );
      });
    }
    if (dynamicList.length > 0) return dynamicList;
    else
      return (
        <Text fw="bold" color="crimson" ta="center">
          No Playlists Found
        </Text>
      );
  }

  return (
    <>
      <Modal
        opened={opened}
        onClose={() => {
          setValue("");
          close();
        }}
        withCloseButton={false}
        size="auto"
        padding={0}
      >
        <TextInput
          size="sm"
          w="calc(60vw * 0.6)"
          autoComplete="off"
          autoCorrect="false"
          miw="min-content"
          radius="xl"
          placeholder="Search"
          variant="filled"
          data-autofocus
          onChange={event => setValue(event.currentTarget.value)}
          onKeyDown={event => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
              //setValue("");
              //close();
            }
          }}
          value={value}
        />
        {localSearch()}
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
