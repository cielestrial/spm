import saveAs from "file-saver";
import JSZip from "jszip";
import {
  artistMasterList,
  duplicateManager,
  genreWhitelist,
  loadArtistsFromFile,
  loadWhitelistFromFile,
} from "../SpotifyApiClientSide";
import {
  definedPlaylistsType,
  genreMasterListType,
  occuranceType,
  playlistsType,
  playlistType,
  tracksType,
} from "../SpotifyApiClientTypes";
import { genreBlacklist, loadBlacklistFromFile } from "./GenreBlacklist";

export const span = "7rem";

export const displayMap = (map: Map<string, occuranceType>) => {
  const output: string[] = [];
  for (const value of map.values()) output.push(value.playlist.name);
  return output.join(", ");
};

export const inPlaylists = (track: tracksType | undefined) => {
  let output = "None";
  if (track !== undefined) {
    for (const uniqueTrack of duplicateManager.values()) {
      if (
        uniqueTrack.track.name === track.name &&
        uniqueTrack.track.artists.join() === track.artists.join()
      ) {
        output = displayMap(uniqueTrack.in_playlists);
        break;
      }
    }
  }
  return output;
};

export const generateTrackKey = (track: tracksType) => {
  let uniqueId = "";
  uniqueId += track.name;
  for (const artist of track.artists) uniqueId += artist;
  uniqueId = uniqueId.replace(/[^a-zA-Z0-9]+/g, "");
  return uniqueId;
};

export const generatePlaylistKey = (playlist: playlistType | undefined) => {
  if (playlist === undefined) return "";
  let uniqueId = "";
  uniqueId += playlist.name;
  uniqueId += playlist.owner;
  uniqueId += playlist.id;
  uniqueId = uniqueId.replace(/[^a-zA-Z0-9]+/g, "");
  return uniqueId;
};

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

export const reviver = (key: string, value: any) => {
  if (typeof value === "object" && value !== null) {
    if (value.dataType === "Map") {
      return new Map(value.value);
    } else if (value.dataType === "Set") {
      return new Set(value.value);
    }
  }
  return value;
};

export const saveDataToFiles = async (
  username: string,
  playlists: React.MutableRefObject<playlistsType>
) => {
  const zip = new JSZip();
  const genreMasterList: genreMasterListType = {
    whitelist: genreWhitelist,
    blacklist: genreBlacklist,
  };
  zip
    .folder(username)
    ?.file(
      "Genre_Master_List.json",
      JSON.stringify(genreMasterList, replacer, 2)
    );
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
      cleanPlaylist = { ...playlist[1], tracks: [] };
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

export const loadDataFromFiles = async (
  file: File,
  username: string,
  playlists: React.MutableRefObject<playlistsType>
) => {
  JSZip.loadAsync(file)
    .then(function (zip) {
      zip
        .folder(username)
        ?.file("Genre_Master_List.json")
        ?.async("string")
        .then((content) => {
          if (content.length > 0) {
            const genreMasterList: genreMasterListType = JSON.parse(
              content,
              reviver
            );
            loadBlacklistFromFile(genreMasterList.blacklist);
            loadWhitelistFromFile(
              genreMasterList.whitelist,
              genreMasterList.blacklist
            );
          }
        })
        .catch((err) => {
          console.error("Failed to load genreMasterList metadata\n", err);
        });

      zip
        .folder(username)
        ?.file("Artist_Master_List.json")
        ?.async("string")
        .then((content) => {
          if (content.length > 0)
            loadArtistsFromFile(JSON.parse(content, reviver));
        })
        .catch((err) => {
          console.error("Failed to load artistMasterList metadata\n", err);
        });

      zip
        .folder(username)
        ?.folder("Playlists")
        ?.file("Playlists.json")
        ?.async("string")
        .then((content) => {
          if (playlists.current !== undefined && content.length > 0) {
            const playlistsMetaData: definedPlaylistsType = JSON.parse(
              content,
              reviver
            );

            for (const playlist of playlists.current.list.entries()) {
              if (playlistsMetaData.list.has(playlist[0])) {
                const playlistMetaData = playlistsMetaData.list.get(
                  playlist[0]
                ) as playlistType;
                playlist[1].genreSubscriptions =
                  playlistMetaData.genreSubscriptions;
                playlist[1].playlistSubscriptions =
                  playlistMetaData.playlistSubscriptions;
                if (playlist[1].snapshot === playlistMetaData.snapshot) {
                  zip
                    .folder(username)
                    ?.folder("Playlists")
                    ?.folder("Tracks")
                    ?.file(playlist[0] + ".json")
                    ?.async("string")
                    .then(async (moreContent) => {
                      if (moreContent.length > 0) {
                        playlist[1].tracks = JSON.parse(moreContent, reviver);
                      }
                    })
                    .catch((err) => {
                      console.error(
                        "Failed to load",
                        playlist[1].name,
                        "track metadata\n",
                        err
                      );
                    });
                }
              }
            }
            // if snapshot matches then read corresponding file from track folder into tracks[]
          }
        })
        .catch((err) => {
          console.error("Failed to load playlists metadata\n", err);
        });
    })
    .catch((err) => {
      console.error("Failed to load data from zip file\n", err);
    });
};
