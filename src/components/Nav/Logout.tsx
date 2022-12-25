import { Button } from "@mantine/core";
import { useContext } from "react";
import { StateContext } from "../../api/ContextProvider";
import { setCode } from "../../pages/LandingPage";

type propType = {
  height: string | number | undefined;
};

const Logout = (props: propType) => {
  const context = useContext(StateContext);

  return (
    <Button
      color={context.theme.colorScheme === "dark" ? "green.7" : "blue.3"}
      miw="7rem"
      h={props.height}
      compact
      variant="subtle"
      radius={0}
      size="xl"
      component="a"
      onClick={async () => {
        setCode(null);
        context.setUserInfo(null);
        context.setToken(false);
        context.navigate.current("/");
      }}
    >
      Logout
    </Button>
  );
};

export default Logout;
