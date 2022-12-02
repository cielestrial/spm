import { Button } from "@mantine/core";

type proptype = {
  setInfoIndex: React.Dispatch<React.SetStateAction<number>>;
};
const ShowTracksButton = (props: proptype) => {
  const showTracksHandler = () => {
    props.setInfoIndex(1);
  };
  return (
    <Button
      w="35%"
      miw="min-content"
      compact
      variant="outline"
      color="gray"
      radius="xl"
      size="md"
      onClick={showTracksHandler}
    >
      Show Songs
    </Button>
  );
};
export default ShowTracksButton;
