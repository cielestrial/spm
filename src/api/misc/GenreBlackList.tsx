import { TransferListItem } from "@mantine/core";

export let genreBlacklist: string[] = [];
export const loadBlacklistFromFile = (blacklist: string[]) => {
  genreBlacklist = blacklist;
};

export const getBlacklist = () => {
  return genreBlacklist
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "accent",
        ignorePunctuation: true,
      })
    )
    .map((element) => ({
      value: element,
      label: element,
    }));
};

export const setBlacklist = (genres: TransferListItem[]) => {
  genreBlacklist = genres.map((item) => item.label);
};
