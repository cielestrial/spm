import { createContext, useCallback, useRef, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { generatePlaylistKey } from "./misc/HelperFunctions";
import { useSpotifyQuery } from "./QueryApi";
import { getTracks } from "./SpotifyApiClientSide";
import {
  playlistsType,
  playlistType,
  tokenType,
  tracksType,
  userInfoType,
} from "./SpotifyApiClientTypes";

export let token: tokenType | undefined | null;
export const setToken = (tokenValue: tokenType | undefined | null) => {
  token = tokenValue;
};
export let userInfo: userInfoType | undefined | null;
export const setUserInfo = (userData: userInfoType | undefined | null) => {
  userInfo = userData;
};

export const StateContext = createContext({} as stateContextType);

type stateContextType = {
  navigate: React.MutableRefObject<NavigateFunction>;
  playlistsQ: React.MutableRefObject<playlistsType>;
  selectedPlaylist: React.MutableRefObject<playlistType | undefined>;
  isOwned: () => boolean;
  isFollowed: () => boolean;
};

type StateProviderProps = {
  children: React.ReactNode;
};

export function StateProvider({ children }: StateProviderProps) {
  const navigate = useRef(useNavigate());
  const playlistsQ = useRef<playlistsType>(undefined);
  const selectedPlaylist = useRef<playlistType>();

  const isFollowed = useCallback(() => {
    if (
      selectedPlaylist.current !== undefined &&
      playlistsQ.current !== undefined
    ) {
      return playlistsQ.current.list.has(
        generatePlaylistKey(selectedPlaylist.current)
      );
    } else return false;
  }, [selectedPlaylist.current, playlistsQ.current]);

  const isOwned = useCallback(() => {
    if (
      selectedPlaylist.current !== undefined &&
      userInfo !== undefined &&
      userInfo !== null &&
      selectedPlaylist.current.owner === userInfo.display_name
    )
      return true;
    else return false;
  }, [selectedPlaylist.current, userInfo]);

  return (
    <StateContext.Provider
      value={{
        navigate,
        playlistsQ,
        selectedPlaylist,
        isFollowed,
        isOwned,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}
