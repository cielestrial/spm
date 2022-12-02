import { Button } from "@mantine/core";

type proptype = {
  infoIndex: number;
  setInfoIndex: React.Dispatch<React.SetStateAction<number>>;
};
const BackButton = (props: proptype) => {
  const backHandler = () => {
    if (props.infoIndex > 0) props.setInfoIndex(props.infoIndex - 1);
  };
  return (
    <Button
      w="35%"
      miw="min-content"
      compact
      variant="outline"
      disabled={props.infoIndex === 0}
      color="green"
      radius="xl"
      size="md"
      onClick={backHandler}
    >
      Back
    </Button>
  );
};

export default BackButton;
