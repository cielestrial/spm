import { Button, Center, FileButton, Flex, Loader, Title } from "@mantine/core";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { StateContext } from "../api/ContextProvider";
import { loadDataFromFiles } from "../api/functions/Load";
import {
  getAllArtistGenres,
  getAllTrackGenres,
  populateGenreWhitelist,
} from "../api/LastfmApiClientSide";
import { useSpotifyQuery } from "../api/QueryApi";
import {
  getPlaylists,
  getTopPlaylistGenres,
} from "../api/SpotifyApiClientPlaylist";
import {
  getAuthenticatedUserInfo,
  getToken,
} from "../api/SpotifyApiClientSide";
import { getAllTracks, manageDuplicates } from "../api/SpotifyApiClientTrack";
import { userInfoType } from "../api/SpotifyApiClientTypes";
import { pageHeight, pagePadding } from "../App";
import { custom_ease_out, shake } from "../css/Keyframes";

const LoadingPage = () => {
  const context = useContext(StateContext);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const resetRef = useRef<() => void>(null);
  const timer = useRef<NodeJS.Timeout>();
  const animationDuration = 0.25;

  useEffect(() => {
    context.setCurrentPage("loading");
    context.setShowHeader(false);
    (async () => {
      setLoading(true);
      console.log(context.codeRef.current);
      const tokenData = (await useSpotifyQuery(
        getToken,
        0,
        context.codeRef
      )) as boolean | undefined;
      if (tokenData !== undefined && tokenData !== false) {
        context.setToken(tokenData);
        const userData = (await useSpotifyQuery(
          getAuthenticatedUserInfo,
          0
        )) as userInfoType | undefined | null;
        if (userData !== undefined && userData !== null) {
          context.setUserInfo(userData);
          await useSpotifyQuery(getPlaylists, 0, context.playlistsQ);
        } else context.setUserInfo(null);
      } else context.setToken(false);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (context.token === false || context.userInfo === null) {
      console.log("its me");
      context.navigate.current("/");
    }
  }, [context.token, context.userInfo]);

  const getAll = useCallback(async () => {
    if (
      context.userInfo?.display_name !== undefined &&
      context.userInfo.display_name !== null
    ) {
      await useSpotifyQuery(getAllTracks, 0, context.playlistsQ);
      await manageDuplicates(context.playlistsQ, context.userInfo.display_name);
      await useSpotifyQuery(getAllArtistGenres, 0);
      getAllTrackGenres();
      populateGenreWhitelist();
      getTopPlaylistGenres(context.playlistsQ);
    } else console.error("Could not read display_name");
  }, [context.playlistsQ.current]);

  const playErrorAnimation = () => {
    setError(true);
    timer.current = setTimeout(() => setError(false), animationDuration * 1000);
  };

  if (isLoading) {
    return (
      <Center h={pageHeight} pt={pagePadding} className="loading">
        <Loader size="lg" />
      </Center>
    );
  } else {
    return (
      <Flex
        gap="2.3rem"
        justify="center"
        align="center"
        direction={{ base: "column-reverse", xs: "row" }}
        h={pageHeight}
        pt={pagePadding}
      >
        <Button
          compact
          w="15%"
          h="2.6rem"
          miw="12rem"
          variant="filled"
          radius="md"
          size="xl"
          disabled={file?.name === "yspm.zip"}
          data-autofocus
          onClick={async () => {
            setLoading(true);
            await getAll();
            context.navigate.current("/dashboard");
            context.setShowHeader(true);
            setLoading(false);
          }}
        >
          Fresh Start
        </Button>

        <Title ta="center" order={1}>
          OR
        </Title>

        <FileButton
          resetRef={resetRef}
          accept="application/zip"
          onChange={async (e) => {
            if (e !== null && e.name !== "yspm.zip") {
              playErrorAnimation();
              console.error("Invalid file:", e.name);
              setFile(null);
              resetRef.current?.();
            } else if (e !== null) {
              setFile(e);
              setLoading(true);
              if (
                context.userInfo?.display_name !== undefined &&
                context.userInfo.display_name !== null
              )
                await loadDataFromFiles(
                  e,
                  context.userInfo.display_name,
                  context.playlistsQ
                );
              else console.error("Could not read display_name");
              await getAll();
              setLoading(false);
              context.navigate.current("/dashboard");
            }
          }}
        >
          {(props) => (
            <Button
              {...props}
              compact
              w="15%"
              h="2.6rem"
              miw="12rem"
              variant="filled"
              radius="md"
              size="xl"
              styles={{
                root: {
                  animation: error
                    ? `${shake(10)} ${animationDuration}s ${custom_ease_out}`
                    : undefined,
                },
              }}
            >
              Upload yspm.zip
            </Button>
          )}
        </FileButton>
      </Flex>
    );
  }
};

export default LoadingPage;
