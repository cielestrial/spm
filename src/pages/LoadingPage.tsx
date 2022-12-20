import {
  Button,
  Center,
  FileInput,
  Flex,
  Group,
  Loader,
  Text,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useState, useEffect, useRef, useContext } from "react";
import { StateContext } from "../api/ContextProvider";
import { loadDataFromFiles } from "../api/misc/HelperFunctions";
import { useLastfmQuery, useSpotifyQuery } from "../api/QueryApi";
import {
  getToken,
  getAuthenticatedUserInfo,
  getPlaylists,
  getAllTracks,
  getAllTrackGenres,
  getTopPlaylistGenres,
} from "../api/SpotifyApiClientSide";
import {
  tokenType,
  userInfoType,
  playlistsType,
} from "../api/SpotifyApiClientTypes";
import { pageHeight, pagePadding } from "../App";
import { breakpoints } from "../components/NavBar";

const LoadingPage = () => {
  const context = useContext(StateContext);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setLoading] = useState(true);
  const smMediaQuery = useMediaQuery(`(min-width: ${breakpoints.sm})`);
  const xsMediaQuery = useMediaQuery(`(min-width: ${breakpoints.xs})`);

  useEffect(() => {
    context.setCurrentPage("loading");
    context.setShowHeader(false);
    (async () => {
      setLoading(true);
      const tokenData = (await useSpotifyQuery(getToken, 0)) as
        | tokenType
        | undefined
        | null;
      if (tokenData !== undefined && tokenData !== null) {
        context.setToken(tokenData);
        const userData = (await useSpotifyQuery(
          getAuthenticatedUserInfo,
          0
        )) as userInfoType | undefined | null;
        if (userData !== undefined && userData !== null) {
          context.setUserInfo(userData);

          context.playlistsQ.current = (await useSpotifyQuery(
            getPlaylists,
            0
          )) as playlistsType;
        } else context.setUserInfo(null);
      } else context.setToken(null);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (context.token === null || context.userInfo === null)
      context.navigate.current("/");
  }, [context.token, context.userInfo]);

  const getAll = async () => {
    if (
      context.userInfo?.display_name !== undefined &&
      context.userInfo.display_name !== null
    ) {
      await useSpotifyQuery(getAllTracks, 0, context.userInfo.display_name);
      await useLastfmQuery(getAllTrackGenres, 0);
      await useLastfmQuery(getTopPlaylistGenres, 0);
    } else console.error("Could not read display_name");
  };

  if (isLoading) {
    return (
      <Center h={pageHeight} pt={pagePadding} className="loading">
        <Loader color="green" size="lg" variant="bars" />
      </Center>
    );
  } else {
    return (
      <Center h={pageHeight} pt={pagePadding}>
        <Flex
          gap="md"
          justify="center"
          align="end"
          direction="row"
          wrap="wrap"
          mt="lg"
          mb="xl"
          w="100%"
        >
          <Flex
            w="100%"
            direction={{ base: "column", sm: "row" }}
            gap={0}
            justify="center"
            align="center"
          >
            <FileInput
              ref={inputRef}
              placeholder="Upload your yspm.zip file"
              aria-label="Upload Select"
              size="md"
              w={smMediaQuery ? "35%" : xsMediaQuery ? "max-content" : "9rem"}
              miw="9rem"
              clearable
              accept="application/zip"
              value={file}
              onChange={(e) => {
                if (e !== null && e.name !== "yspm.zip") {
                  console.error("Invalid file:", e.name);
                  setFile(null);
                } else setFile(e);
                inputRef.current?.blur();
              }}
              styles={(theme) => ({
                input: {
                  borderRadius: smMediaQuery
                    ? "0.33rem 0 0 0.33rem"
                    : "0.33rem",
                },
                placeholder: {
                  color: "mediumseagreen",
                  fontWeight: "bold",
                  marginLeft: "0.33em",
                },
              })}
            />
            <Button
              compact
              w="15%"
              h="2.1em"
              miw="9rem"
              variant="filled"
              color="green"
              size="xl"
              disabled={file?.name !== "yspm.zip"}
              onClick={async () => {
                if (file?.name === "yspm.zip") {
                  setLoading(true);
                  if (
                    context.userInfo?.display_name !== undefined &&
                    context.userInfo.display_name !== null
                  )
                    await loadDataFromFiles(
                      file,
                      context.userInfo.display_name,
                      context.playlistsQ
                    );
                  else console.error("Could not read display_name");
                  await getAll();
                  context.navigate.current("/dashboard");
                  setLoading(false);
                }
              }}
              styles={(theme) => ({
                root: {
                  borderRadius: smMediaQuery
                    ? "0 0.33rem 0.33rem 0"
                    : "0.33rem",
                },
              })}
            >
              Upload
            </Button>
          </Flex>
          <Text align="center" w="100%" size="xl" color="green" fw="bold">
            OR
          </Text>
          <Button
            compact
            w="15%"
            h="2.6rem"
            miw="9rem"
            variant="filled"
            color="green"
            radius="md"
            size="xl"
            disabled={file?.name === "yspm.zip"}
            data-autofocus
            onClick={async () => {
              setLoading(true);
              await getAll();
              context.navigate.current("/dashboard");
              setLoading(false);
            }}
          >
            Fresh Start
          </Button>
        </Flex>
      </Center>
    );
  }
};

export default LoadingPage;
