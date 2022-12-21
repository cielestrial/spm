import { Button } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../api/ContextProvider";

type proptype = {
  infoIndex: number;
  setInfoIndex: React.Dispatch<React.SetStateAction<number>>;
};
const BackButton = (props: proptype) => {
  const context = useContext(StateContext);
  const color = context.theme.colorScheme === "dark" ? "green.7" : "blue.5";
  const backHandler = () => {
    if (props.infoIndex > 0) props.setInfoIndex(props.infoIndex - 1);
  };
  return (
    <Button
      w="35%"
      miw="8rem"
      compact
      variant="outline"
      disabled={props.infoIndex === 0}
      color={color}
      radius="xl"
      size="md"
      onClick={backHandler}
    >
      Back
    </Button>
  );
};

export default BackButton;
