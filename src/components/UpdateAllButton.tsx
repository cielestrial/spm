import { Button } from "@mantine/core";
import { generatePlaylistKey } from "../api/misc/HelperFunctions";
import { playlistsType, playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  selectedPlaylist: playlistType | undefined;
  playlists: React.MutableRefObject<playlistsType>;
};

const UpdateAllButton = (props: proptype) => {
  const updateHandler = async () => {
    if (
      props.playlists.current === undefined ||
      props.selectedPlaylist === undefined
    )
      return;
    console.log(generatePlaylistKey(props.selectedPlaylist));
    //props.addSubscriptions.mutate();
  };

  return (
    <Button
      w="35%"
      miw="min-content"
      compact
      variant="outline"
      //disabled={props.infoIndex === 0}
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
