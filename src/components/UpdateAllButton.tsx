import { Button } from "@mantine/core";
import { UseQueryResult } from "react-query";
import { generatePlaylistKey } from "../api/misc/HelperFunctions";
import { playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  selectedPlaylist: playlistType | undefined;
  playlists: UseQueryResult<
    {
      total: number;
      list: Map<string, playlistType>;
    },
    unknown
  >;
  addSubscriptions: UseQueryResult<void, unknown>;
};

const UpdateAllButton = (props: proptype) => {
  const updateHandler = async () => {
    if (
      props.playlists.data === undefined ||
      props.selectedPlaylist === undefined
    )
      return;
    console.log(generatePlaylistKey(props.selectedPlaylist));
    props.addSubscriptions.refetch();
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
