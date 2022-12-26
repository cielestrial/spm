import { Button, Group, Modal, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";
import { useSpotifyQuery } from "../api/QueryApi";
import { unfollowPlaylist } from "../api/SpotifyApiClientPlaylist";
import { playlistType } from "../api/SpotifyApiClientTypes";

type propsType = {
  setSelected: (selected: playlistType | undefined) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
};
const UnfollowButton = (props: propsType) => {
  const context = useContext(StateContext);
  const [opened, { close, open }] = useDisclosure(false);
  const color = context.theme.colorScheme === "dark" ? "green.7" : "blue.5";

  const unfollow = async () => {
    props.setLoading((prev) => prev + 1);
    const unfollowQ = await useSpotifyQuery(
      unfollowPlaylist,
      0,
      context.playlistsQ,
      context.selectedPlaylist.current
    );
    props.setSelected(undefined);
    props.setLoading((prev) => prev - 1);
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
        styles={(theme) => ({
          modal: {
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[1],
          },
        })}
      >
        <Text fs="italic" ta="center">
          Are you sure you want to unfollow
        </Text>
        <Text fs="italic" fw="bold" ta="center">
          {context.selectedPlaylist.current?.name}&#63;
        </Text>
        <Group grow spacing="md" mt="md">
          <Button
            compact
            variant="filled"
            color={
              context.theme.colorScheme === "dark" ? "yellow.6" : "yellow.5"
            }
            radius="xl"
            size="sm"
            onClick={async () => {
              console.log(context.selectedPlaylist.current);
              unfollow();
              close();
            }}
          >
            Yes
          </Button>

          <Button
            compact
            variant="filled"
            color="red.7"
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
        miw="8rem"
        compact
        color={color}
        variant="outline"
        disabled={context.selectedPlaylist.current === undefined}
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
