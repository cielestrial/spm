import { Button } from "@mantine/core";
import { trackGenresQuery } from "../QueryApi";

const GenreTestButton = () => {
  const trackGenresQ = trackGenresQuery();
  return (
    <Button
      w="40%"
      miw="min-content"
      compact
      variant="outline"
      color="green"
      radius="xl"
      size="md"
      onClick={() => trackGenresQ.refetch()}
    >
      Genre
    </Button>
  );
};

export default GenreTestButton;
