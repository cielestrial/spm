import { TransferListItem } from "@mantine/core";
import { uniqueType } from "./SpotifyApiClientTypes";

export const server = "http://localhost:8080";
export const getLimit = 50;
export const postLimit = 100;
export const maxOffset = 1000;
export const waitTime = 750;
export const debounceWaitTime = Math.round(0.67 * waitTime);
export const duplicateManager = new Map<string, uniqueType>();

export let genreWhitelist = new Map<string, number>();
export const loadWhitelistFromFile = (
  whitelist: Map<string, number>,
  blacklist: string[]
) => {
  for (let i = 0; i < blacklist.length; i++) {
    if (whitelist.has(blacklist[i])) whitelist.delete(blacklist[i]);
  }
  genreWhitelist = whitelist;
};
export const updateWhitelist = (genres: TransferListItem[]) => {
  genreWhitelist = new Map<string, number>(
    genres.map((item) => {
      if (genreWhitelist.has(item.label)) {
        const value = genreWhitelist.get(item.label);
        if (value !== undefined) return [item.label, value];
      }
      return [item.label, 0];
    })
  );
};
export const getWhitelist = () => {
  return Array.from(genreWhitelist.entries())
    .sort(
      (a, b) => b[1] - a[1]

      /*
      a[0].localeCompare(b[0], undefined, {
        sensitivity: "accent",
        ignorePunctuation: true,
      })
      */
    )
    .map((element) => ({
      value: element[0],
      label: element[0],
    }));
};

export let artistMasterList = new Map<string, string[]>();
export const loadArtistsFromFile = (artists: Map<string, string[]>) => {
  artistMasterList = artists;
};
