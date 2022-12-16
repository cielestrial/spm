import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { playlistsType, playlistType } from "../api/SpotifyApiClientTypes";
import { useSpotifyQuery } from "../api/QueryApi";
import { createPlaylist } from "../api/SpotifyApiClientSide";
import { useRef, useState } from "react";

type propsType = {
  playlists: React.MutableRefObject<playlistsType>;
  setSelected: (selected: playlistType | undefined) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
};

const CreatePlaylistButton = (props: propsType) => {
  const [opened, { close, open }] = useDisclosure(false);
  const [name, setName] = useState("");
  const playlistName = useRef("");

  const create = async () => {
    props.setLoading((prev) => prev + 1);

    const createQ = (await useSpotifyQuery(
      createPlaylist,
      0,
      playlistName.current,
      props.setSelected
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
            autoComplete="off"
            autoCorrect="false"
            miw="min-content"
            placeholder="Enter Playlist Name"
            variant="filled"
            data-autofocus
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
              playlistName.current = e.currentTarget.value;
            }}
            error={name.length > 100 ? "Playlist name too long" : null}
            styles={(theme) => ({
              root: {
                borderRadius: "0.33rem 0 0 0.33rem",
              },
            })}
          />
          <Button
            compact
            w="15%"
            miw="min-content"
            type="submit"
            variant="filled"
            color="green"
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
        miw="min-content"
        compact
        variant="outline"
        color="green"
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
