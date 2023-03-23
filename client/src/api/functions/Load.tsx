import JSZip from "jszip";
import { loadArtistsFromFile } from "../ApiClientData";
import {
  definedPlaylistsType,
  playlistsType,
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
  try {
    const zip = await JSZip.loadAsync(file);
    // Don't load whitelist
    const blacklistContent = await zip
      .folder(username)
      ?.file("Genre_Blacklist.json")
      ?.async("string");
    if (blacklistContent !== undefined && blacklistContent.length > 0)
      loadBlacklistFromFile(JSON.parse(blacklistContent, reviver));

    const artistContent = await zip
      .folder(username)
      ?.file("Artist_Master_List.json")
      ?.async("string");
    if (artistContent !== undefined && artistContent.length > 0)
      loadArtistsFromFile(JSON.parse(artistContent, reviver));

    const playlistsContent = await zip
      .folder(username)
      ?.folder("Playlists")
      ?.file("Playlists.json")
      ?.async("string");
    if (
      playlists.current !== undefined &&
      playlistsContent !== undefined &&
      playlistsContent.length > 0
    ) {
      const playlistsMetaData: definedPlaylistsType = JSON.parse(
        playlistsContent,
        reviver
      );

      for (const playlist of playlists.current.list.entries()) {
        if (playlistsMetaData.list.has(playlist[0])) {
          const playlistMetaData = playlistsMetaData.list.get(
            playlist[0]
          ) as playlistType;
          playlist[1].genreSubscriptions = playlistMetaData.genreSubscriptions;
          playlist[1].playlistSubscriptions =
            playlistMetaData.playlistSubscriptions;
          if (playlist[1].snapshot === playlistMetaData.snapshot) {
            const tracksContent = await zip
              .folder(username)
              ?.folder("Playlists")
              ?.folder("Tracks")
              ?.file(playlist[0] + ".json")
              ?.async("string");
            if (tracksContent !== undefined && tracksContent.length > 0)
              playlist[1].tracks = JSON.parse(tracksContent, reviver);
            else playlist[1].tracks = [];
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to load data from zip file\n", err);
  }
};
