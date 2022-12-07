import { Badge, Flex } from "@mantine/core";
import { playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  selectedPlaylist: playlistType | undefined;
  isFollowed: () => boolean;
};
const TopPlaylistGenres = (props: proptype) => {
  const minOccurance =
    props.selectedPlaylist !== undefined
      ? Math.floor(props.selectedPlaylist.total * 0.17)
      : 2;
  const top_x = 3;

  const topGenres =
    props.selectedPlaylist?.genres !== undefined && props.isFollowed()
      ? Array.from(props.selectedPlaylist.genres.entries())
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
