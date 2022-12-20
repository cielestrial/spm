import { Button } from "@mantine/core";
import { useContext, useState } from "react";
import { StateContext } from "../api/ContextProvider";

type propType = {
  height: string | number | undefined;
};

const PageNavigatorButton = (props: propType) => {
  const context = useContext(StateContext);
  const [display, setDisplay] = useState(
    context.currentPage === "dashboard" ? "Genres" : "Playlists"
  );

  return (
    <Button
      miw="7rem"
      h={props.height}
      w={props.height === "100%" ? "5.5em" : undefined}
      compact
      variant="subtle"
      color="green"
      size="xl"
      component="a"
      onClick={() => {
        if (context.currentPage === "dashboard") {
          setDisplay("Playlists");
          context.navigate.current("/genres");
        } else {
          setDisplay("Genres");
          context.navigate.current("/dashboard");
        }
      }}
    >
      {display}
    </Button>
  );
};

export default PageNavigatorButton;
