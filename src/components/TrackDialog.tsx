import { Dialog, Group, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { forwardRef, useImperativeHandle, useState } from "react";
import { inPlaylists } from "../api/misc/HelperFunctions";
import { tracksType } from "../api/SpotifyApiClientTypes";
import Row from "./Row";

export type TrackDialogType = {
  openTrackDialog: (selectedTrack: tracksType) => void;
};
type propsType = {};

const TrackDialog = forwardRef<TrackDialogType, propsType>((props, ref) => {
  const [opened, { close, open }] = useDisclosure(false);

  useImperativeHandle(
    ref,
    () => ({
      openTrackDialog: (selectedTrack: tracksType) => {
        if (opened) close();
        open();
      }
    }),
    []
  );
  if ("getSelectedTrack" !== undefined)
    return (
      <Dialog
        opened={opened}
        withCloseButton
        onClose={close}
        size="lg"
        radius="md"
      ></Dialog>
    );
  else return null;
});

export default TrackDialog;
