import { Button, Group, Modal, Text } from "@mantine/core";
import { useDisclosure, useForceUpdate } from "@mantine/hooks";
import { useSpotifyQuery } from "../api/QueryApi";
import { unfollowPlaylist } from "../api/SpotifyApiClientSide";
import { playlistsType, playlistType } from "../api/SpotifyApiClientTypes";

type propsType = {
  playlists: React.MutableRefObject<playlistsType>;
  playlist: playlistType | undefined;
  setSelected: (selected: playlistType | undefined) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
};
const UnfollowButton = (props: propsType) => {
  const [opened, { close, open }] = useDisclosure(false);
  const forceUpdate = useForceUpdate();

  const unfollow = async () => {
    props.setLoading(prev => prev + 1);
    const unfollowQ = await useSpotifyQuery(
      async (selectedPlaylist, setSelected) => {
        console.log("trying to unfollow", selectedPlaylist?.name);
        const res = await unfollowPlaylist(selectedPlaylist);
        setSelected(undefined);
        return res;
      },
      0,
      props.playlist,
      props.setSelected
    );
    props.setLoading(prev => prev - 1);
    return unfollowQ;
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
          Are you sure you want to unfollow
        </Text>
        <Text fs="italic" fw="bold" ta="center">
          {props.playlist?.name}&#63;
        </Text>
        <Group grow spacing="md" mt="md">
          <Button
            compact
            variant="filled"
            color="yellow"
            radius="xl"
            size="sm"
            onClick={async () => {
              console.log(props.playlist);
              unfollow();
              //await props.playlists.mutate();
              //forceUpdate();
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
        Unfollow
      </Button>
    </>
  );
};

export default UnfollowButton;
