import { Button } from "@mantine/core";
import { QueryObserverResult } from "react-query";
import { playlistsType, playlistType } from "./SpotifyApiClientTypes";

type propsType = {
  playlists: playlistsType;
  createR: () => Promise<
    QueryObserverResult<playlistType | undefined, unknown>
  >;
  createD: () => Promise<
    QueryObserverResult<playlistType | undefined, unknown>
  >;
  addToR: () => Promise<QueryObserverResult<boolean, unknown>>;
  addToD: () => Promise<QueryObserverResult<boolean, unknown>>;
  unfollowR: () => Promise<QueryObserverResult<boolean, unknown>>;
  unfollowD: () => Promise<QueryObserverResult<boolean, unknown>>;
  refetchTracks: () => Promise<
    QueryObserverResult<playlistType | undefined, unknown>
  >;
};

const TimelessTester = (props: propsType) => {
  return (
    <div>
      <Button
        compact
        variant="filled"
        color="green"
        radius="xl"
        size="md"
        onClick={() => {
          props.createD();
          props.createR();
        }}
      >
        Create Timeless
      </Button>
      <Button
        compact
        variant="outline"
        color="green"
        radius="xl"
        size="md"
        onClick={() => {
          props.unfollowD();
          props.unfollowR();
          props.refetchTracks();
        }}
      >
        Remove Timeless
      </Button>
      <Button
        compact
        variant="filled"
        color="green"
        radius="xl"
        size="md"
        onClick={() => {
          props.addToD();
          props.addToR();
          props.refetchTracks();
        }}
      >
        Update Timeless
      </Button>
    </div>
  );
};

export default TimelessTester;
