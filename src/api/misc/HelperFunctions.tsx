import saveAs from "file-saver";
import JSZip from "jszip";
import { duplicateManager } from "../SpotifyApiClientSide";
import {
  definedPlaylistsType,
  occuranceType,
  playlistsType,
  playlistType,
  tracksType,
  userInfoType,
} from "../SpotifyApiClientTypes";

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
  uniqueId = uniqueId.replaceAll(" ", "");
  return uniqueId;
};

export const generatePlaylistKey = (playlist: playlistType | undefined) => {
  if (playlist === undefined) return "";
  let uniqueId = "";
  uniqueId += playlist.name;
  uniqueId += playlist.owner;
  uniqueId += playlist.id;
  uniqueId = uniqueId.replaceAll(" ", "");
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

export const savePlaylistsToFiles = async (
  userInfo: userInfoType,
  playlists: definedPlaylistsType
) => {
  if (userInfo.display_name === null) return false;
  const playlistMetaData = generatePlaylistMetaData(playlists);
  const zip = new JSZip();
  for (let i = 0; i < playlistMetaData.length; i++) {
    if (i === 0)
      zip
        .folder(userInfo.display_name)
        ?.file("Playlists.json", playlistMetaData[0]);
    else zip.folder(userInfo.display_name)?.file(".json", playlistMetaData[i]);
  }
  zip
    .generateAsync({ type: "blob" })
    .then(function (content) {
      // FileSaver.js
      saveAs(content, "yspm.zip");
    })
    .catch((err) => {
      console.log("Failed to save zip file\n", err);
    });
  return true;
};

const generatePlaylistMetaData = (playlists: definedPlaylistsType) => {
  let output: string[] = [""];
  let cleanPlaylist = {} as playlistType;
  for (const playlist of playlists.list.entries()) {
    cleanPlaylist = { ...playlist[1], tracks: [] };
    output[0] += JSON.stringify([playlist[0], cleanPlaylist], replacer) + "\n";
    output.push(JSON.stringify(playlist[1].tracks, replacer));
  }
  return output;
};
