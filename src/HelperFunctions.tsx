import { duplicateManager } from "./SpotifyApiClientSide";
import { playlistType, tracksType } from "./SpotifyApiClientTypes";

export const displayMap = (map: Map<string, playlistType>) => {
  const output: string[] = [];
  map.forEach(value => output.push(value.name));
  return output.join(", ");
};

export const inPlaylists = (track: tracksType | undefined) => {
  let output = "None";
  if (track !== undefined) {
    duplicateManager.forEach(uniqueTrack => {
      if (
        uniqueTrack.track.name === track.name &&
        uniqueTrack.track.artists.join() === track.artists.join()
      )
        output = displayMap(uniqueTrack.in_playlists);
    });
  }
  return output;
};

export const generateTrackKey = (track: tracksType) => {
  let uniqueId = "";
  uniqueId += track.name;
  track.artists.forEach(artist => (uniqueId += artist));
  uniqueId = uniqueId.replaceAll(" ", "");
  return uniqueId;
};

export const generatePlaylistKey = (playlist: playlistType) => {
  let uniqueId = "";
  uniqueId += playlist.name;
  uniqueId += playlist.owner;
  uniqueId = uniqueId.replaceAll(" ", "");
  return uniqueId;
};
