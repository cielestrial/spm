import {
  Flex,
  TransferList,
  TransferListData,
  TransferListItem
} from "@mantine/core";
import { useEffect, useState } from "react";
import { getBlacklist, setBlacklist } from "../api/misc/GenreBlackList";
import { getWhitelist, updateWhitelist } from "../api/SpotifyApiClientSide";

const GenreManager = () => {
  const [data, setData] = useState<TransferListData>([[], []]);
  useEffect(() => {
    const whitelist: TransferListItem[] = getWhitelist();
    const blacklist: TransferListItem[] = getBlacklist();
    setData([whitelist, blacklist]);
  }, []);

  const searchFilter = (query: string, item: TransferListItem) =>
    item.label.includes(query.toLocaleLowerCase());
  return (
    <Flex
      gap="xl"
      justify="center"
      align="center"
      direction="row"
      w="100%"
      h="100%"
      wrap="wrap"
      mt="xl"
      mb="xl"
    >
      <TransferList
        value={data}
        onChange={(values: TransferListData) => {
          setData(values);
          updateWhitelist(values[1]);
          setBlacklist(values[1]);
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
        styles={theme => ({
          transferListTitle: {
            textAlign: "center",
            fontSize: "1.66rem"
          },
          transferListItems: {
            minHeight: "calc(95% - 2rem)",
            marginTop: "1rem",
            marginRight: "1rem",
            padding: "0.66rem 0 0.99rem 0.66rem",
            borderStyle: "inset outset outset inset",
            borderColor: "rgba(255, 255, 255, 0.66)"
          },
          transferListBody: {
            padding: "0.33rem 1rem 1.33rem"
          }
        })}
      />
    </Flex>
  );
};

export default GenreManager;
