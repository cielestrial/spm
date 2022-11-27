import { Dialog, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { forwardRef, useImperativeHandle, useState } from "react";
import { inPlaylists } from "../HelperFunctions";
import { tracksType } from "../SpotifyApiClientTypes";

export type TrackDialogType = {
  openTrackDialog: (selectedTrack: tracksType) => void;
};
type propsType = {};

const TrackDialog = forwardRef<TrackDialogType, propsType>((props, ref) => {
  const [opened, { close, open }] = useDisclosure(false);
  const [getSelectedTrack, setSelectedTrack] = useState<tracksType>();
  const span = "5rem";

  useImperativeHandle(
    ref,
    () => ({
      openTrackDialog: (selectedTrack: tracksType) => {
        setSelectedTrack(selectedTrack);
        if (opened) close();
        open();
      }
    }),
    []
  );

  return (
    <Dialog
      opened={opened}
      withCloseButton
      onClose={close}
      size="lg"
      radius="md"
    >
      <Text>
        <Group spacing={0}>
          <Text miw={span} color={"green"}>
            {"Name:"}
          </Text>
          <Text>{getSelectedTrack?.name}</Text>
        </Group>
        <Group spacing={0}>
          <Text miw={span} color={"green"}>
            {"Artists:"}
          </Text>
          <Text>{getSelectedTrack?.artists.join(", ")}</Text>
        </Group>
        <Group spacing={0}>
          <Text miw={span} color={"green"}>
            {"Album:"}
          </Text>
          <Text>{getSelectedTrack?.album}</Text>
        </Group>
        <Group spacing={0}>
          <Text miw={span} color={"green"}>
            {"Playlists:"}
          </Text>
          <Text>{inPlaylists(getSelectedTrack)}</Text>
        </Group>
      </Text>
    </Dialog>
  );
});

export default TrackDialog;
