import { Button } from "@mantine/core";
import { useContext, useState } from "react";
import { StateContext } from "../../api/ContextProvider";

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
      color={context.theme.colorScheme === "dark" ? "green.7" : "blue.3"}
      miw="7rem"
      h={props.height}
      w={props.height === "100%" ? "5.5em" : undefined}
      compact
      radius={0}
      variant="subtle"
      size="xl"
      component="a"
      onClick={() => {
        if (context.currentPage === "dashboard") {
          setDisplay("Playlists");
          context.navigate.current("/stats");
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
