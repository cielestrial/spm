import {
  Button,
  Center,
  Flex,
  TransferList,
  TransferListData,
  TransferListItem,
} from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { StateContext, token, userInfo } from "../api/ContextProvider";
import { getBlacklist, setBlacklist } from "../api/misc/GenreBlacklist";
import { saveDataToFiles } from "../api/misc/HelperFunctions";
import { getWhitelist, updateWhitelist } from "../api/SpotifyApiClientSide";

const GenreManager = () => {
  const context = useContext(StateContext);
  const [data, setData] = useState<TransferListData>([[], []]);
  useEffect(() => {
    if (token === null || userInfo === null) context.navigate.current("/");
  }, [token, userInfo]);

  useEffect(() => {
    if (context.playlistsQ.current === undefined)
      context.navigate.current("/loading");
  }, [context.playlistsQ.current]);

  useEffect(() => {
    const whitelist: TransferListItem[] = getWhitelist();
    const blacklist: TransferListItem[] = getBlacklist();
    setData([whitelist, blacklist]);
  }, []);

  const searchFilter = (query: string, item: TransferListItem) =>
    item.label.includes(query.toLocaleLowerCase());
  return (
    <>
      <Flex
        gap="xl"
        justify="center"
        align="center"
        direction="row"
        w="100%"
        wrap="wrap"
        mt="xl"
        mb="xl"
      >
        <TransferList
          value={data}
          onChange={(values: TransferListData) => {
            setData(values);
          }}
          searchPlaceholder={"Search Genres"}
          nothingFound={"Genre not found"}
          placeholder={["No Whitelisted Genres", "No Blacklisted Genres"]}
          titles={["Whitelist", "Blacklist"]}
          showTransferAll={false}
          filter={searchFilter}
          limit={20}
          w="80vw"
          h="85vh"
          breakpoint="sm"
          styles={(theme) => ({
            transferListTitle: {
              textAlign: "center",
              fontSize: "1.66rem",
            },
            transferListItems: {
              minHeight: "calc(95% - 2rem)",
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
      </Flex>
      <Center w="100%">
        <Button
          compact
          w="15%"
          h="2.6rem"
          miw="min-content"
          variant="filled"
          color="green"
          radius="md"
          size="xl"
          onClick={async () => {
            updateWhitelist(data[0]);
            setBlacklist(data[1]);
            // Re-pull all genres
            // await useLastfmQuery(getAllTrackGenres, 0);
            await saveDataToFiles(context.playlistsQ);
            context.navigate.current("/dashboard");
          }}
        >
          Save
        </Button>
      </Center>
    </>
  );
};

export default GenreManager;
