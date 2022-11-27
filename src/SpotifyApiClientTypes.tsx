export type tokenType = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  expiresIn: string | undefined;
};
export type userInfoType = {
  display_name: string | null;
};
export type optionsType = {
  offset: Promise<number> | number;
  limit: number;
};
export type playlistType = {
  id: string;
  name: string;
  owner: string | null;
  uri: string;
  snapshot: string;
  total: number;
  tracks: tracksType[] | undefined; // map?
};
export type playlistsType =
  | {
      total: number;
      list: playlistType[]; // map?
    }
  | undefined;
export type tracksType = {
  is_local: boolean;
  id: string;
  name: string;
  uri: string;
  is_playable: boolean;
  duration: number;
  album: string;
  album_artists: string[];
  artists: string[];
};
export type uniqueType = {
  track: tracksType;
  occurances: number;
  duplicate_uris: duplicateType[];
  in_playlists: Map<string, playlistType>;
};
export type duplicateType = {
  uri: string;
};
