import { Badge, Flex } from "@mantine/core";
import { playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  selectedPlaylist: playlistType | undefined;
  isFollowed: () => boolean;
};
const TopPlaylistGenres = (props: proptype) => {
  const minOccurance = 1;
  const topGenres =
    props.selectedPlaylist !== undefined && props.isFollowed()
      ? Array.from(props.selectedPlaylist.genres.entries())
          .filter(value => value[1] > minOccurance)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(value => (
            <Badge key={value[0]} color="green" size="lg" variant="outline">
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
