import {
  Button,
  Center,
  FileInput,
  Flex,
  Group,
  Loader,
  Text,
} from "@mantine/core";
import { useState, useEffect, useRef, useContext } from "react";
import {
  setToken,
  setUserInfo,
  StateContext,
  token,
  userInfo,
} from "../api/ContextProvider";
import { loadDataFromFiles } from "../api/misc/HelperFunctions";
import { useLastfmQuery, useSpotifyQuery } from "../api/QueryApi";
import {
  getToken,
  getAuthenticatedUserInfo,
  getPlaylists,
  getAllTracks,
  getAllTrackGenres,
} from "../api/SpotifyApiClientSide";
import {
  tokenType,
  userInfoType,
  playlistsType,
} from "../api/SpotifyApiClientTypes";

const LoadingPage = () => {
  const context = useContext(StateContext);
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const start = async () => {
      setLoading(true);

      const tokenData = (await useSpotifyQuery(getToken, 0)) as
        | tokenType
        | undefined
        | null;
      if (tokenData !== undefined && tokenData !== null) {
        setToken(tokenData);
        const userData = (await useSpotifyQuery(
          getAuthenticatedUserInfo,
          0
        )) as userInfoType | undefined | null;
        if (userData !== undefined && userData !== null) {
          setUserInfo(userData);

          context.playlistsQ.current = (await useSpotifyQuery(
            getPlaylists,
            0
          )) as playlistsType;
        } else setUserInfo(null);
      } else setToken(null);

      setLoading(false);
    };

    start();
  }, []);

  useEffect(() => {
    if (token === null || userInfo === null) context.navigate.current("/");
  }, [token, userInfo]);

  if (isLoading) {
    return (
      <div className="background center loading">
        <Loader color="green" size="lg" variant="bars" />
      </div>
    );
  } else {
    return (
      <Center h="100vh">
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
          <Group w="100%" spacing={0} position="center" align="end">
            <FileInput
              ref={inputRef}
              placeholder="Upload your yspm.zip file"
              aria-label="Upload Select"
              size="md"
              w="35%"
              miw="min-content"
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
                  borderRadius: "0.33rem 0 0 0.33rem",
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
              miw="min-content"
              variant="filled"
              color="green"
              size="xl"
              disabled={file?.name !== "yspm.zip"}
              onClick={async () => {
                if (file?.name === "yspm.zip") {
                  setLoading(true);

                  await loadDataFromFiles(file, context.playlistsQ);
                  context.navigate.current("/dashboard");

                  setLoading(false);
                }
              }}
              styles={(theme) => ({
                root: {
                  borderRadius: "0 0.33rem 0.33rem 0",
                },
              })}
            >
              Upload
            </Button>
          </Group>
          <Text align="center" w="100%" size="xl" color="green" fw="bold">
            OR
          </Text>
          <Button
            compact
            w="15%"
            h="2.6rem"
            miw="min-content"
            variant="filled"
            color="green"
            radius="md"
            size="xl"
            disabled={file?.name === "yspm.zip"}
            data-autofocus
            onClick={async () => {
              setLoading(true);

              await useSpotifyQuery(getAllTracks, 0);
              await useLastfmQuery(getAllTrackGenres, 0);
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
