import { Button } from "@mantine/core";
import { AUTH_URL } from "../api/SpotifyApiClientSide";

const Login = () => {
  return (
    <Button
      variant="filled"
      w="20%"
      miw="9rem"
      color="green"
      radius="xl"
      size="md"
      component="a"
      href={AUTH_URL}
    >
      Login
    </Button>
  );
};

export default Login;
