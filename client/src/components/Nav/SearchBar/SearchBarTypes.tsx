import { playlistType, tracksType } from "../../../api/SpotifyApiClientTypes";

export type dashboardRefType = {
  setSelectedP: (selected: playlistType | undefined) => Promise<void>;
  setSelectedT: (track: tracksType) => void;
};

export type searchCategoryType = "Playlists" | "Tracks";
export type searchAreaType = "Library" | "General";
