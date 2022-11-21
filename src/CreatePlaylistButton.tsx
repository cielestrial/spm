import { Button, Group, Modal, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { QueryObserverResult } from "react-query";
import { playlistType } from "./SpotifyApiClientTypes";

export let createdPlaylistName: string | undefined;
type propsType = {
  create: () => Promise<QueryObserverResult<playlistType | undefined, unknown>>;
  refetchPlaylists: () => Promise<
    QueryObserverResult<
      | {
          total: number;
          list: playlistType[];
        }
      | undefined,
      unknown
    >
  >;
  refetchTracks: () => Promise<
    QueryObserverResult<playlistType | undefined, unknown>
  >;
};
const CreatePlaylistButton = (props: propsType) => {
  const [opened, { close, open }] = useDisclosure(false);
  const form = useForm({
    initialValues: {
      name: ""
    },
    validate: {
      name: value => (value.length > 100 ? "Invalid playlist name" : null)
    }
  });

  return (
    <>
      <Modal
        centered
        opened={opened}
        onClose={() => {
          form.reset();
          close();
        }}
        withCloseButton={false}
        size="auto"
        padding={0}
        styles={theme => ({
          modal: { backgroundColor: "transparent" }
        })}
      >
        <form
          onSubmit={form.onSubmit(values => {
            createdPlaylistName = values.name;
            props.create();
            props.refetchPlaylists();
            form.reset();
            close();
          })}
        >
          <Group position="center" w="60vw" spacing={0}>
            <TextInput
              size="md"
              w="60%"
              autoComplete="off"
              miw="min-content"
              radius="0.33rem 0 0 0.33rem"
              placeholder="Enter Playlist Name"
              variant="filled"
              data-autofocus
              {...form.getInputProps("name")}
            />
            <Button
              compact
              w="15%"
              miw="min-content"
              type="submit"
              variant="filled"
              color="green"
              size="xl"
              styles={theme => ({
                root: {
                  borderRadius: "0 0.33rem 0.33rem 0"
                }
              })}
            >
              Create
            </Button>
          </Group>
        </form>
      </Modal>

      <Button
        w="40%"
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
