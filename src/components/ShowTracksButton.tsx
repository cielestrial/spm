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
      miw="min-content"
      compact
      variant="outline"
      color="green"
      radius="xl"
      size="sm"
      mt={2}
      onClick={showTracksHandler}
    >
      Expand
    </Button>
  );
};
export default ShowTracksButton;
