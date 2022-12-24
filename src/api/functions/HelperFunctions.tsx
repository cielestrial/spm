import { duplicateManager } from "../ApiClientData";
import {
  artistInfoType,
  occuranceType,
  playlistType,
  tracksType,
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
  for (const artist of track.artists) uniqueId += artist.name;
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

export const generateArtistKey = (artist: artistInfoType) => {
  let uniqueId = "";
  uniqueId += artist.name;
  uniqueId += artist.id;
  uniqueId = uniqueId.replace(/[^a-zA-Z0-9]+/g, "");
  return uniqueId;
};
