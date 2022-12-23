import {
  Button,
  Center,
  Loader,
  Stack,
  TransferList,
  TransferListData,
  TransferListItem,
} from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { StateContext } from "../api/ContextProvider";
import { getBlacklist, setBlacklist } from "../api/misc/GenreBlacklist";
import { useLastfmQuery } from "../api/QueryApi";
import {
  getAllTrackGenres,
  getWhitelist,
  resetGenres,
  updateWhitelist,
} from "../api/SpotifyApiClientSide";
import { pageHeight, pagePadding } from "../App";

const GenreManager = () => {
  const context = useContext(StateContext);
  const [data, setData] = useState<TransferListData>([[], []]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (context.token === false || context.userInfo === null)
      context.navigate.current("/");
  }, [context.token, context.userInfo]);

  useEffect(() => {
    if (context.playlistsQ.current === undefined) context.navigate.current("/");
  }, [context.playlistsQ.current]);

  useEffect(() => {
    context.setShowHeader(!isLoading);
  }, [isLoading]);

  useEffect(() => {
    context.setCurrentPage("genres");
    setLoading(true);
    const whitelist: TransferListItem[] = getWhitelist();
    const blacklist: TransferListItem[] = getBlacklist();
    setData([whitelist, blacklist]);
    setLoading(false);
  }, []);

  const searchFilter = (query: string, item: TransferListItem) =>
    item.label.includes(query.toLocaleLowerCase());

  if (isLoading) {
    return (
      <Center h={pageHeight} pt={pagePadding} className="loading">
        <Loader size="lg" />
      </Center>
    );
  } else {
    return (
      <Stack align="center" justify="center">
        <TransferList
          value={data}
          onChange={(values: TransferListData) => {
            updateWhitelist(data[0]);
            setBlacklist(data[1]);
            setData(values);
          }}
          searchPlaceholder={"Search Genres"}
          nothingFound={"Genre not found"}
          placeholder={["No Whitelisted Genres", "No Blacklisted Genres"]}
          titles={["Whitelist", "Blacklist"]}
          showTransferAll={false}
          autoCorrect="off"
          filter={searchFilter}
          breakpoint="md"
          w="75vw"
          miw="10rem"
          listHeight={288}
          styles={(theme) => ({
            transferListTitle: {
              textAlign: "center",
              fontSize: "1.66rem",
              color:
                theme.colorScheme === "dark"
                  ? theme.colors.green[7]
                  : theme.colors.blue[4],
            },
            transferListItems: {
              marginTop: "1rem",
              marginRight: "1rem",
              padding: "0.66rem 0 0.99rem 0.66rem",
              borderStyle: "inset outset outset inset",
              borderColor: "rgba(255, 255, 255, 0.66)",
            },
            transferListBody: {
              padding: "0.33rem 1rem 1.33rem",
            },
          })}
        />
        <Button
          compact
          w="15%"
          h="2.6rem"
          mih="2.6rem"
          miw="9rem"
          variant="filled"
          radius="md"
          size="xl"
          mt="xl"
          onClick={async () => {
            setLoading(true);
            await useLastfmQuery(resetGenres, 0);
            await useLastfmQuery(getAllTrackGenres, 0);
            context.navigate.current("/dashboard");
            setLoading(false);
          }}
        >
          Save
        </Button>
      </Stack>
    );
  }
};

export default GenreManager;
