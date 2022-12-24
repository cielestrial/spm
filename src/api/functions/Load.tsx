import JSZip from "jszip";
import { loadWhitelistFromFile, loadArtistsFromFile } from "../ApiClientData";
import {
  playlistsType,
  genreMasterListType,
  definedPlaylistsType,
  playlistType,
} from "../SpotifyApiClientTypes";
import { loadBlacklistFromFile } from "./GenreBlacklist";

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
                    .then((moreContent) => {
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
