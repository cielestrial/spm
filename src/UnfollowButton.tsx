import { Button, Group, Modal, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { QueryObserverResult } from "react-query";
import { playlistType } from "./SpotifyApiClientTypes";

type propsType = {
  playlist: React.MutableRefObject<playlistType | undefined>;
  unfollow: () => Promise<QueryObserverResult<boolean, unknown>>;
  refetchTracks: () => Promise<
    QueryObserverResult<playlistType | undefined, unknown>
  >;
};
const UnfollowButton = (props: propsType) => {
  const [opened, { close, open }] = useDisclosure(false);

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
          {props.playlist.current?.name}&#63;
        </Text>
        <Group grow spacing="md" mt="md">
          <Button
            compact
            variant="filled"
            color="yellow"
            radius="xl"
            size="sm"
            onClick={() => {
              props.unfollow();
              props.refetchTracks();
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
        w="40%"
        miw="min-content"
        compact
        variant="outline"
        disabled={props.playlist.current === undefined}
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
