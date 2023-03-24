import { Button, Stack, Title } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { SlSocialSpotify } from "react-icons/sl";
import { useLocation, useNavigate } from "react-router-dom";
import { StateContext } from "../api/ContextProvider";
import { wakeUp } from "../api/SpotifyApiClientSide";

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
  "&response_type=token" +
  scope +
  "&redirect_uri=https://yspm-ccnd.onrender.com/" + //http://localhost:3000
  "&show_dialog=true";

const LandingPage = () => {
  const context = useContext(StateContext);
  const [isLoading, setLoading] = useState(true);
  const params = useLocation();
  context.navigate.current = useNavigate();

  useEffect(() => {
    (async () => {
      context.setCurrentPage("landing");
      context.setShowHeader(false);

      setLoading(true);
      const message = await wakeUp();
      console.log("server message:", message);
      setLoading(false);

      if (params.hash.length > params.search.length) {
        const auth = params.hash.split(/#|&|=/g);
        for (let i = 0; i < auth.length; i++) {
          if (auth[i] === "access_token")
            context.authRef.current.access_token = auth[i + 1];
          else if (auth[i] === "token_type")
            context.authRef.current.token_type = auth[i + 1];
          else if (auth[i] === "expires_in")
            context.authRef.current.expires_in =
              +auth[i + 1] - context.sessionBuffer;
        }
        context.startSessionTimer();
        context.navigate.current("/loading");
      }
    })();
  }, []);

  return (
    <Stack
      mt="calc(50vh - 60px - 1em)"
      align="center"
      justify="center"
      spacing="lg"
    >
      <Title ta="center" order={1}>
        {isLoading ? "Waking server..." : "Welcome to YSPM"}
      </Title>
      <Button
        variant="filled"
        w="20%"
        miw="fit-content"
        radius="xl"
        size="md"
        component="a"
        disabled={isLoading}
        href={AUTH_URL}
        leftIcon={<SlSocialSpotify size={"24px"} />}
      >
        Log In With Spotify
      </Button>
    </Stack>
  );
};

export default LandingPage;
