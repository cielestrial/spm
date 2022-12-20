import { Badge, Flex } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";

type proptype = {};
const TopPlaylistGenres = (props: proptype) => {
  const context = useContext(StateContext);

  const topGenres =
    context.isFollowed() &&
    context.selectedPlaylist.current?.topGenres !== undefined &&
    context.selectedPlaylist.current.topGenres.length > 0
      ? context.selectedPlaylist.current.topGenres.map((value) => (
          <Badge
            key={value}
            miw="fit-content"
            color="green"
            size="md"
            variant="outline"
          >
            {value}
          </Badge>
        ))
      : [];

  return (
    <Flex wrap="wrap" gap="xs" mt={context.isFollowed() ? "xs" : 0}>
      {topGenres}
    </Flex>
  );
};

export default TopPlaylistGenres;
