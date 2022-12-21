import { MantineTheme, useMantineTheme } from "@mantine/core";
import { createContext, useCallback, useRef, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { generatePlaylistKey } from "./misc/HelperFunctions";
import {
  playlistsType,
  playlistType,
  tokenType,
  userInfoType,
} from "./SpotifyApiClientTypes";

export type pagesType = "landing" | "loading" | "dashboard" | "genres";

export const StateContext = createContext({} as stateContextType);

type stateContextType = {
  theme: MantineTheme;
  navigate: React.MutableRefObject<NavigateFunction>;
  playlistsQ: React.MutableRefObject<playlistsType>;
  selectedPlaylist: React.MutableRefObject<playlistType | undefined>;
  isOwned: () => boolean;
  isFollowed: () => boolean;
  showHeader: boolean;
  setShowHeader: React.Dispatch<React.SetStateAction<boolean>>;
  currentPage: pagesType;
  setCurrentPage: React.Dispatch<React.SetStateAction<pagesType>>;
  userInfo: userInfoType | undefined | null;
  setUserInfo: React.Dispatch<
    React.SetStateAction<userInfoType | null | undefined>
  >;
  token: tokenType | null | undefined;
  setToken: React.Dispatch<React.SetStateAction<tokenType | null | undefined>>;
};

type StateProviderProps = {
  children: React.ReactNode;
};

export function StateProvider({ children }: StateProviderProps) {
  const theme = useMantineTheme();
  const navigate = useRef(useNavigate());
  const playlistsQ = useRef<playlistsType>(undefined);
  const selectedPlaylist = useRef<playlistType>();

  const [showHeader, setShowHeader] = useState(false);
  const [currentPage, setCurrentPage] = useState<pagesType>("landing");
  const [userInfo, setUserInfo] = useState<userInfoType | undefined | null>(
    undefined
  );
  const [token, setToken] = useState<tokenType | undefined | null>(undefined);

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
        theme,
        navigate,
        token,
        setToken,
        userInfo,
        setUserInfo,
        showHeader,
        setShowHeader,
        currentPage,
        setCurrentPage,
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
