import { Button, Center, Loader, Stack, Title } from "@mantine/core";
import { useContext, useEffect, useLayoutEffect } from "react";
import { SlSocialSpotify } from "react-icons/sl";
import { StateContext } from "../api/ContextProvider";
import { pageHeight, pagePadding } from "../App";

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
  "&redirect_uri=https://yspm-ccnd.onrender.com" +
  "&state=" +
  crypto.randomUUID() +
  "&show_dialog=true";

const LandingPage = () => {
  const context = useContext(StateContext);
  useEffect(() => {
    context.setCurrentPage("landing");
    context.setShowHeader(false);
  }, []);

  useLayoutEffect(() => {
    const searchParam = new URLSearchParams(window.location.search).get("code");
    if (searchParam !== null) {
      context.codeRef.current = searchParam;
      context.navigate.current("/loading");
    }
  });

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
};

export default LandingPage;
