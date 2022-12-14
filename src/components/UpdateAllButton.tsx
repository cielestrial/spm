import { Button } from "@mantine/core";
import { generatePlaylistKey } from "../api/misc/HelperFunctions";
import { useSpotifyQuery } from "../api/QueryApi";
import {
  addGenreSubscriptions,
  addPlaylistSubscriptions
} from "../api/SpotifyApiClientSide";
import { playlistsType, playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  selectedPlaylist: React.MutableRefObject<playlistType | undefined>;
  playlists: React.MutableRefObject<playlistsType>;
  setSelected: (selected: playlistType | undefined) => Promise<void>;
  setLoading: React.Dispatch<React.SetStateAction<number>>;
};

const UpdateAllButton = (props: proptype) => {
  const addSubscriptions = async () => {
    props.setLoading(prev => prev + 1);

    const resAll = await Promise.allSettled([
      useSpotifyQuery(addPlaylistSubscriptions, 0),
      useSpotifyQuery(addGenreSubscriptions, 0)
    ]);
    props.setSelected(undefined);

    props.setLoading(prev => prev - 1);
    return resAll;
  };

  const updateHandler = async () => {
    if (
      props.playlists.current === undefined ||
      props.selectedPlaylist.current === undefined
    )
      return;
    console.log(generatePlaylistKey(props.selectedPlaylist.current));
    await addSubscriptions();
  };

  return (
    <Button
      w="35%"
      miw="min-content"
      compact
      variant="outline"
      disabled={props.playlists === undefined}
      color="green"
      radius="xl"
      size="md"
      onClick={updateHandler}
    >
      {"Update All"}
    </Button>
  );
};

export default UpdateAllButton;
