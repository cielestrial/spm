export type tokenType = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  expiresIn: string | undefined;
};
export type optionsType = {
  offset: Promise<number> | number;
};
export type playlistType = {
  id: string;
  name: string;
  uri: string;
  total: number;
  tracks: tracksType[] | undefined;
};
export type playlistsType =
  | {
      total: number;
      list: playlistType[];
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
