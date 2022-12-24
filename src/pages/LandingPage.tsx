import { useContext, useEffect } from "react";
import { getCode, pageHeight, pagePadding } from "../App";
import { StateContext } from "../api/ContextProvider";
import { Button, Center, Loader, Stack, Title } from "@mantine/core";
import { SlSocialSpotify } from "react-icons/sl";

const scope =
  "&scope=" +
  "playlist-read-private" +
  "%20" +
  "playlist-modify-private" +
  "%20" +
  "playlist-modify-public" +
  "%20" +
  "playlist-read-collaborative" +
  "%20" +
  "user-library-modify" +
  "%20" +
  "user-library-read" +
  "%20" +
  "user-read-private";
const AUTH_URL =
  "https://accounts.spotify.com/authorize?" +
  "client_id=d03dd28afb3f40d1aad5e6a45d9bff7f" +
  "&response_type=code" +
  scope +
  "&redirect_uri=http://localhost:3000" +
  "&state=" +
  crypto.randomUUID() +
  "&show_dialog=true";

export let code: string | null;
export const setCode = (newCode: string | null) => {
  code = newCode;
};

const LandingPage = () => {
  const context = useContext(StateContext);
  useEffect(() => {
    context.setCurrentPage("landing");
    context.setShowHeader(false);
    if (getCode() !== null) {
      setCode(getCode());
      context.navigate.current("/loading");
    }
  }, []);

  if (getCode() !== null) {
    return (
      <Center h={pageHeight} pt={pagePadding} className="loading">
        <Loader size="lg" />
      </Center>
    );
  } else {
    return (
      <Stack
        mt="calc(50vh - 60px - 1em)"
        align="center"
        justify="center"
        spacing="lg"
      >
        <Title ta="center" order={1}>
          Welcome to YSPM
        </Title>
        <Button
          variant="filled"
          w="20%"
          miw="fit-content"
          radius="xl"
          size="md"
          component="a"
          href={AUTH_URL}
          leftIcon={<SlSocialSpotify size={"24px"} />}
        >
          Log In With Spotify
        </Button>
      </Stack>
    );
  }
};

export default LandingPage;
