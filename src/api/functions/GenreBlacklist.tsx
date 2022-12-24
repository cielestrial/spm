import { TransferListItem } from "@mantine/core";

export let genreBlacklist: string[] = [
  "3",
  "a dal",
  "african",
  "antifa",
  "beatmaker",
  "better than selena gomez",
  "boyfriend stomper",
  "britpop",
  "canada",
  "california",
  "cinematic",
  "deutschland",
  "disney",
  "doujin",
  "duo",
  "east coast rap",
  "florida",
  "jackson",
  "kawaii metal",
  "los angeles",
  "lukas rossi",
  "memphis",
  "miami",
  "misc",
  "mkit rain",
  "multiple artists",
  "need to scrobble",
  "oi",
  "playboi carti",
  "polskie",
  "rac",
  "seen live",
  "seiyuu",
  "singer songwriter",
  "sleep",
  "slow",
  "sonic mania",
  "the new thing",
  "the voice",
  "toronto",
  "trap dance house electro reggaeton",
  "troll",
  "turkce pop",
  "uk",
  "uk hardcore",
  "under 100 listeners",
  "united states",
  "usa",
  "vocal",
  "x3",
  "youtube",
];
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
