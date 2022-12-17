export type tokenType = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  expiresIn: string | undefined;
};
export type userInfoType = {
  display_name: string | null;
  premium: boolean;
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
  tracks: tracksType[];
  genres: Map<string, number>;
  genreSubscriptions: string[];
  playlistSubscriptions: Map<string, playlistType>;
};
export type playlistsType = definedPlaylistsType | undefined;
export type definedPlaylistsType = {
  total: number;
  list: Map<string, playlistType>;
};
export type tracksType = {
  is_local: boolean;
  id: string;
  name: string;
  uri: string;
  is_playable: boolean;
  linked_from: {
    id: string;
    uri: string;
  };
  duration: number;
  album: string;
  album_artists: string[];
  artists: string[];
  genres: Set<string>;
};
export type uniqueType = {
  track: tracksType;
  total_occurances: number;
  in_playlists: Map<string, occuranceType>;
};
export type duplicateType = {
  uri: string;
};
export type occuranceType = {
  playlist: playlistType;
  occurances: number;
  duplicate_uris: Map<string, duplicateType>;
};

export type genreMasterListType = {
  whitelist: Map<string, number>;
  blacklist: string[];
};
