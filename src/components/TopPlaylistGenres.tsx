import { Badge, Flex } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";

type proptype = {};
const TopPlaylistGenres = (props: proptype) => {
  const context = useContext(StateContext);
  const minOccurance =
    context.selectedPlaylist.current !== undefined
      ? // 1/3 of 50% of the total number of songs is the minimum cutoff
        Math.round(context.selectedPlaylist.current.total * (0.5 / 3))
      : 2;
  const top_x = 3;

  const topGenres =
    context.selectedPlaylist.current?.genres !== undefined &&
    context.isFollowed()
      ? Array.from(context.selectedPlaylist.current.genres.entries())
          .filter((value) => value[1] >= minOccurance)
          .sort((a, b) => b[1] - a[1])
          .slice(0, top_x)
          .map((value) => (
            <Badge key={value[0]} color="green" size="md" variant="outline">
              {value[0]}
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
