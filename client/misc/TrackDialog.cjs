import { Dialog } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { forwardRef, useImperativeHandle } from "react";

const TrackDialog = forwardRef((props, ref) => {
  const [opened, { close, open }] = useDisclosure(false);

  useImperativeHandle(
    ref,
    () => ({
      openTrackDialog: () => {
        if (opened) close();
        open();
      },
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
