import { TransferListItem } from "@mantine/core";

export let genreBlackList = [
  "seen live",
  "female vocalists",
  "singer-songwriter",
  "united states",
];

export const getBlacklist = () => {
  return genreBlackList
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
  genreBlackList = genres.map((item) => item.label);
};
