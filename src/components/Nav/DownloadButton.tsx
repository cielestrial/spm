import { Button } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../../api/ContextProvider";
import { saveDataToFiles } from "../../api/misc/HelperFunctions";

type propType = {
  height: string | number | undefined;
};

const DownloadButton = (props: propType) => {
  const context = useContext(StateContext);
  return (
    <Button
      color={context.theme.colorScheme === "dark" ? "green.7" : "blue.3"}
      miw="7rem"
      h={props.height}
      compact
      variant="subtle"
      radius={0}
      size="xl"
      onClick={async () => {
        if (
          context.userInfo?.display_name !== undefined &&
          context.userInfo.display_name !== null
        )
          await saveDataToFiles(
            context.userInfo.display_name,
            context.playlistsQ
          );
        else console.error("Could not read display_name");
      }}
    >
      Download
    </Button>
  );
};

export default DownloadButton;
