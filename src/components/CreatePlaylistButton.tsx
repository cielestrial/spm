import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { playlistType } from "../api/SpotifyApiClientTypes";
import { useSpotifyQuery } from "../api/QueryApi";
import { useContext, useRef, useState } from "react";
import { StateContext } from "../api/ContextProvider";
import { createPlaylist } from "../api/SpotifyApiClientPlaylist";

type propsType = {
  setSelected: (selected: playlistType | undefined) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
};

const CreatePlaylistButton = (props: propsType) => {
  const context = useContext(StateContext);
  const [opened, { close, open }] = useDisclosure(false);
  const [name, setName] = useState("");
  const playlistName = useRef("");
  const color = context.theme.colorScheme === "dark" ? "green.7" : "blue.5";

  const create = async () => {
    props.setLoading((prev) => prev + 1);
    const createQ = (await useSpotifyQuery(
      createPlaylist,
      0,
      context.playlistsQ,
      playlistName.current
    )) as playlistType | undefined;
    props.setSelected(createQ);
    props.setLoading((prev) => prev - 1);
    return createQ;
  };

  return (
    <>
      <Modal
        centered
        opened={opened}
        onClose={() => {
          setName("");
          close();
        }}
        withCloseButton={false}
        size="auto"
        padding={0}
        styles={(theme) => ({
          modal: { backgroundColor: "transparent" },
        })}
      >
        <Group position="center" w="60vw" spacing={0}>
          <TextInput
            size="md"
            w="60%"
            miw="min-content"
            autoComplete="off"
            autoCorrect="false"
            placeholder="Enter Playlist Name"
            variant="filled"
            data-autofocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                create();
                setName("");
                close();
              }
            }}
            value={name}
            onChange={(e) => {
              if (name.length > 100) {
                console.error("Playlist name too long");
                setName("");
              } else {
                setName(e.currentTarget.value);
                playlistName.current = e.currentTarget.value;
              }
            }}
            styles={(theme) => ({
              input: {
                borderRadius: "0.33rem 0 0 0.33rem",
              },
            })}
          />
          <Button
            compact
            w="15%"
            h="2.6rem"
            miw="7rem"
            variant="filled"
            size="xl"
            onClick={() => {
              create();
              setName("");
              close();
            }}
            styles={(theme) => ({
              root: {
                borderRadius: "0 0.33rem 0.33rem 0",
              },
            })}
          >
            Create
          </Button>
        </Group>
      </Modal>

      <Button
        w="35%"
        miw="8rem"
        compact
        color={color}
        variant="outline"
        radius="xl"
        size="md"
        onClick={open}
      >
        New Playlist
      </Button>
    </>
  );
};

export default CreatePlaylistButton;
