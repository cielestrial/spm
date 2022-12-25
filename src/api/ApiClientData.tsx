import { TransferListItem } from "@mantine/core";
import { getGenreFromLabel } from "./functions/HelperFunctions";
import {
  artistInfoType,
  optionsType,
  uniqueType,
} from "./SpotifyApiClientTypes";

export const server = "http://localhost:8080";
export const getLimit = 50;
export const postLimit = 100;
export const maxOffset = 1000;
export const waitTime = 750;
export const debounceWaitTime = Math.round(0.67 * waitTime);
export const duplicateManager = new Map<string, uniqueType>();

export const options: optionsType = { offset: 0, limit: 1 };

export let genreWhitelist = new Map<string, number>();

export const updateWhitelist = (genres: TransferListItem[]) => {
  genreWhitelist = new Map<string, number>(
    genres.map((item) => {
      const genre = getGenreFromLabel(item.label);
      if (genreWhitelist.has(genre)) {
        const value = genreWhitelist.get(genre);
        if (value !== undefined) return [genre, value];
      }
      return [genre, 0];
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
      label: element[0] + ", frequency: " + element[1],
    }));
};

// Check
export let artistMasterList = new Map<string, artistInfoType>();
export const loadArtistsFromFile = (artists: Map<string, artistInfoType>) => {
  artistMasterList = artists;
};
