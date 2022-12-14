import { Modal, Group, Button, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useSpotifyQuery } from "../api/QueryApi";
import { followPlaylist } from "../api/SpotifyApiClientSide";
import { playlistsType, playlistType } from "../api/SpotifyApiClientTypes";

type propsType = {
  playlists: React.MutableRefObject<playlistsType>;
  playlist: playlistType | undefined;
  setSelected: (selected: playlistType | undefined) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
};

const FollowButton = (props: propsType) => {
  const [opened, { close, open }] = useDisclosure(false);

  const follow = async () => {
    props.setLoading(prev => prev + 1);
    const followQ = await useSpotifyQuery(
      async (selectedPlaylist, setSelected) => {
        const res = await followPlaylist(selectedPlaylist);
        setSelected(undefined);
        setSelected(selectedPlaylist);
        return res;
      },
      0,
      props.playlist,
      props.setSelected
    );
    props.setLoading(prev => prev - 1);
    return followQ;
  };

  return (
    <>
      <Modal
        centered
        opened={opened}
        onClose={close}
        withCloseButton={false}
        size="xs"
      >
        <Text fs="italic" ta="center">
          Would you like to follow
        </Text>
        <Text fs="italic" fw="bold" ta="center">
          {props.playlist?.name}&#63;
        </Text>
        <Group grow spacing="md" mt="md">
          <Button
            compact
            variant="filled"
            color="green"
            radius="xl"
            size="sm"
            onClick={() => {
              follow();
              close();
            }}
          >
            Yes
          </Button>

          <Button
            compact
            variant="filled"
            color="red"
            radius="xl"
            size="sm"
            data-autofocus
            onClick={close}
          >
            No
          </Button>
        </Group>
      </Modal>

      <Button
        w="35%"
        miw="min-content"
        compact
        variant="outline"
        disabled={props.playlist === undefined}
        color="green"
        radius="xl"
        size="md"
        onClick={open}
      >
        Follow
      </Button>
    </>
  );
};

export default FollowButton;
