import { duplicateManager } from "./SpotifyApiClientSide";
import {
  occuranceType,
  playlistType,
  tracksType
} from "./SpotifyApiClientTypes";

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

export const generatePlaylistKey = (playlist: playlistType) => {
  let uniqueId = "";
  uniqueId += playlist.name;
  uniqueId += playlist.owner;
  uniqueId += playlist.id;
  uniqueId = uniqueId.replaceAll(" ", "");
  return uniqueId;
};
