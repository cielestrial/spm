import saveAs from "file-saver";
import JSZip from "jszip";
import { userInfo } from "../../pages/Dashboard";
import {
  artistMasterList,
  duplicateManager,
  genreMasterList,
} from "../SpotifyApiClientSide";
import {
  occuranceType,
  playlistsType,
  playlistType,
  tracksType,
} from "../SpotifyApiClientTypes";
import { genreBlackList } from "./GenreBlackList";

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
  playlists: React.MutableRefObject<playlistsType>
) => {
  if (
    userInfo === undefined ||
    userInfo === null ||
    userInfo.display_name === null
  )
    return false;
  const zip = new JSZip();

  zip
    .folder(userInfo.display_name)
    ?.file(
      "Genre_Master_List.json",
      JSON.stringify({ whitelist: { genreMasterList } }, replacer, 2) +
        "\n\n" +
        JSON.stringify({ blacklist: { value: genreBlackList } }, replacer, 2)
    );
  zip
    .folder(userInfo.display_name)
    ?.file(
      "Artist_Master_List.json",
      JSON.stringify(artistMasterList, replacer, 2)
    );

  zip
    .folder(userInfo.display_name)
    ?.folder("Playlists")
    ?.file(
      "Playlists.json",
      JSON.stringify(
        {
          dataType: "Map",
          value: "placeholder",
        },
        replacer,
        2
      ).replace(
        '"placeholder"',
        generatePlaylistsMetaData(zip, userInfo.display_name, playlists)
      )
    );

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

const generatePlaylistsMetaData = (
  zip: JSZip,
  username: string,
  playlists: React.MutableRefObject<playlistsType>
) => {
  let output: string = "";
  let cleanPlaylist = {} as playlistType;
  if (playlists.current !== undefined && playlists.current.list !== undefined)
    for (const playlist of playlists.current.list.entries()) {
      cleanPlaylist = { ...playlist[1], tracks: [] };
      output += JSON.stringify([playlist[0], cleanPlaylist], replacer, 2);

      zip
        .folder(username)
        ?.folder("Playlists")
        ?.folder("Tracks")
        ?.file(
          playlist[0] + ".json",
          JSON.stringify(playlist[1].tracks, replacer, 2)
        );
    }
  return output;
};

export const loadDataFromFiles = async () => {
  let fileReader = new FileReader();
  /*
  fileReader.onload = function (loadedFile) {
    let storedData = loadedFile.target.result;
    // Debug
    // console.log(storedData);
    parseData(storedData);
    graphData(storedData.charAt(0));
  };
  fileReader.onerror = function (loadedFile) {
    alert(
      "Failed to read file." +
        "\n" +
        "Please make sure you are inputting the correct file." +
        "\n" +
        "Example filename: D;2021_8.txt"
    );
  };
  fileReader.readAsText(fileName);
  */
  // genre_master_list.json (white list into genreMasterList and black list into genreBlacklist
  // then call updateWhiteList)

  //artist_master_list.json into artistMAsterList

  // read playlists.json into a new map
  // carry over subscribed genres and subscribed playlists
  // then perform a consistency check against playlist
  // if snapshot matches then read corresponding file from track folder into tracks[]
  return true;
};
