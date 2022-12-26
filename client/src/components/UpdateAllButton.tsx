import { Button } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";
import { useSpotifyQuery } from "../api/QueryApi";
import {
  addGenreSubscriptions,
  addPlaylistSubscriptions,
} from "../api/SpotifyApiClientPlaylist";
import { playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  setSelected: (selected: playlistType | undefined) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
};

const UpdateAllButton = (props: proptype) => {
  const context = useContext(StateContext);
  const color = context.theme.colorScheme === "dark" ? "green.7" : "blue.5";

  const addSubscriptions = async () => {
    props.setLoading((prev) => prev + 1);
    if (
      context.userInfo?.display_name === undefined ||
      context.userInfo.display_name === null
    ) {
      console.error("Could not read display_name");
      return;
    }
    const resAll = await Promise.allSettled([
      useSpotifyQuery(addPlaylistSubscriptions, 0, context.playlistsQ),
      useSpotifyQuery(addGenreSubscriptions, 0, context.playlistsQ),
    ]);
    props.setSelected(undefined);
    props.setLoading((prev) => prev - 1);
    return resAll;
  };

  const updateHandler = async () => {
    if (
      context.playlistsQ.current === undefined ||
      context.selectedPlaylist.current === undefined
    )
      return;
    await addSubscriptions();
  };

  return (
    <Button
      w="35%"
      miw="8rem"
      compact
      variant="outline"
      disabled={context.playlistsQ.current === undefined}
      color={color}
      radius="xl"
      size="md"
      onClick={updateHandler}
    >
      {"Update All"}
    </Button>
  );
};

export default UpdateAllButton;
