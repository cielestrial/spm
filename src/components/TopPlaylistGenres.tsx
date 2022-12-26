import { Badge, Flex } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";

type proptype = {};
const TopPlaylistGenres = (props: proptype) => {
  const context = useContext(StateContext);
  const color = context.theme.colorScheme === "dark" ? "green.7" : "blue.5";

  const topGenres =
    context.isFollowed() &&
    context.selectedPlaylist.current?.topGenres !== undefined &&
    context.selectedPlaylist.current.topGenres.length > 0
      ? context.selectedPlaylist.current.topGenres.map((value) => (
          <Badge
            key={value}
            miw="fit-content"
            size="md"
            variant="outline"
            color={color}
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
