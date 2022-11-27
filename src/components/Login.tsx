import { Button } from "@mantine/core";
import { AUTH_URL } from "../SpotifyApiClientSide";

const Login = () => {
  return (
    <Button
      fullWidth
      variant="filled"
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
