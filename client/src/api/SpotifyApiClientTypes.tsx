export type userInfoType = {
  display_name: string | null;
  display_image: string;
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
  topGenres: string[];
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
  isLocal: boolean;
  id: string;
  name: string;
  uri: string;
  isPlayable: boolean;
  linkedFrom?: {
    id: string;
    uri: string;
  };
  duration: number;
  album: string;
  album_artists: artistInfoType[];
  artists: artistInfoType[];
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

export type artistMasterListType = Map<string, artistInfoType>;

export type artistInfoType = {
  name: string;
  id: string;
  genres: string[];
};
