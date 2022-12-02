import { Modal, Group, Button, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { UseQueryResult } from "react-query";
import { playlistType } from "../api/SpotifyApiClientTypes";

type propsType = {
  playlists: UseQueryResult<
    {
      total: number;
      list: Map<string, playlistType>;
    },
    unknown
  >;
  playlist: playlistType | undefined;
  follow: UseQueryResult<boolean, unknown>;
};

const FollowButton = (props: propsType) => {
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
              props.follow.refetch();
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
