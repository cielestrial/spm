import { Badge, Flex } from "@mantine/core";
import { playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  selectedPlaylist: React.MutableRefObject<playlistType | undefined>;
  isFollowed: () => boolean;
};
const TopPlaylistGenres = (props: proptype) => {
  const minOccurance =
    props.selectedPlaylist.current !== undefined
      ? // 1/3 of 50% of the total number of songs is the minimum cutoff
        Math.round(props.selectedPlaylist.current.total * (0.5 / 3))
      : 2;
  const top_x = 3;

  const topGenres =
    props.selectedPlaylist.current?.genres !== undefined && props.isFollowed()
      ? Array.from(props.selectedPlaylist.current.genres.entries())
          .filter(value => value[1] >= minOccurance)
          .sort((a, b) => b[1] - a[1])
          .slice(0, top_x)
          .map(value => (
            <Badge key={value[0]} color="green" size="md" variant="outline">
              {value[0]}
            </Badge>
          ))
      : [];

  return (
    <Flex wrap="wrap" gap="xs" mt={props.isFollowed() ? "xs" : 0}>
      {topGenres}
    </Flex>
  );
};

export default TopPlaylistGenres;
