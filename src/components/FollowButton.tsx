import { Modal, Group, Button, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";
import { useSpotifyQuery } from "../api/QueryApi";
import { followPlaylist } from "../api/SpotifyApiClientSide";
import { playlistType } from "../api/SpotifyApiClientTypes";

type propsType = {
  setSelected: (selected: playlistType | undefined) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
};

const FollowButton = (props: propsType) => {
  const context = useContext(StateContext);
  const [opened, { close, open }] = useDisclosure(false);

  const follow = async () => {
    props.setLoading((prev) => prev + 1);

    const followQ = await useSpotifyQuery(
      followPlaylist,
      0,
      context.selectedPlaylist.current
    );
    props.setSelected(undefined);
    props.setSelected(context.selectedPlaylist.current);

    props.setLoading((prev) => prev - 1);
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
          {context.selectedPlaylist.current?.name}&#63;
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
        disabled={context.selectedPlaylist.current === undefined}
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
