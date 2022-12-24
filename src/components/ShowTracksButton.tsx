import { Button } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";

type proptype = {
  setInfoIndex: React.Dispatch<React.SetStateAction<number>>;
};
const ShowTracksButton = (props: proptype) => {
  const context = useContext(StateContext);
  const showTracksHandler = () => {
    props.setInfoIndex(1);
  };
  const color = context.theme.colorScheme === "dark" ? "green.7" : "blue.5";
  return (
    <Button
      miw="min-content"
      compact
      color={color}
      variant="outline"
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
