import saveAs from "file-saver";
import JSZip from "jszip";
import { genreWhitelist, artistMasterList } from "../ApiClientData";
import {
  playlistsType,
  definedPlaylistsType,
  playlistType,
} from "../SpotifyApiClientTypes";
import { genreBlacklist } from "./GenreBlacklist";

export const replacer = (key: string, value: any) => {
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else if (value instanceof Set) {
    return {
      dataType: "Set",
      value: Array.from(value.entries()), // or with spread: value: [...value]
    };
  } else {
    return value;
  }
};

export const saveDataToFiles = async (
  username: string,
  playlists: React.MutableRefObject<playlistsType>
) => {
  const zip = new JSZip();
  zip
    .folder(username)
    ?.file("Genre_Blacklist.json", JSON.stringify(genreBlacklist, replacer, 2));

  zip
    .folder(username)
    ?.file("Genre_Whitelist.json", JSON.stringify(genreWhitelist, replacer, 2));

  zip
    .folder(username)
    ?.file(
      "Artist_Master_List.json",
      JSON.stringify(artistMasterList, replacer, 2)
    );

  zip
    .folder(username)
    ?.folder("Playlists")
    ?.file(
      "Playlists.json",
      JSON.stringify(
        generatePlaylistsMetaData(zip, username, playlists),
        replacer,
        2
      )
    );

  zip
    .generateAsync({ type: "blob" })
    .then(function (content) {
      // FileSaver.js
      saveAs(content, "yspm.zip");
    })
    .catch((err) => {
      console.error("Failed to save zip file\n", err);
    });
  return true;
};

const generatePlaylistsMetaData = (
  zip: JSZip,
  username: string,
  playlists: React.MutableRefObject<playlistsType>
) => {
  if (playlists.current !== undefined && playlists.current.list !== undefined) {
    const playlistsMetaData = {} as definedPlaylistsType;
    playlistsMetaData.total = playlists.current.total;
    playlistsMetaData.list = new Map<string, playlistType>();

    let cleanPlaylist = {} as playlistType;
    for (const playlist of playlists.current.list.entries()) {
      cleanPlaylist = {
        ...playlist[1],
        tracks: [],
        topGenres: [],
        genres: new Map(),
      };
      playlistsMetaData.list.set(playlist[0], cleanPlaylist);
      if (playlist[1].tracks !== undefined && playlist[1].tracks.length > 0) {
        zip
          .folder(username)
          ?.folder("Playlists")
          ?.folder("Tracks")
          ?.file(
            playlist[0] + ".json",
            JSON.stringify(playlist[1].tracks, replacer, 2)
          );
      }
    }
    return playlistsMetaData;
  }
  return undefined;
};
