import { MantineTheme, useMantineTheme } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { formatTime, generatePlaylistKey } from "./functions/HelperFunctions";
import {
  playlistsType,
  playlistType,
  userInfoType,
} from "./SpotifyApiClientTypes";

export type pagesType =
  | "landing"
  | "callback"
  | "loading"
  | "dashboard"
  | "genres";

export const StateContext = createContext({} as stateContextType);

type stateContextType = {
  theme: MantineTheme;
  authRef: React.MutableRefObject<implicit_grant>;
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
  token: boolean | undefined;
  setToken: React.Dispatch<React.SetStateAction<boolean | undefined>>;
  startSessionTimer(): void;
  sessionBuffer: number;
  sessionAlert: string;
  dialogOpened: boolean;
  openDialog: () => void;
  closeDialog: () => void;
};

export type implicit_grant = {
  access_token: string | null;
  token_type: string | null;
  expires_in: number | null;
};

type StateProviderProps = {
  children: React.ReactNode;
};

export function StateProvider({ children }: StateProviderProps) {
  const theme = useMantineTheme();
  const navigate = useRef(useNavigate());
  const authRef = useRef<implicit_grant>({
    access_token: null,
    token_type: null,
    expires_in: null,
  });
  const playlistsQ = useRef<playlistsType>(undefined);
  const selectedPlaylist = useRef<playlistType>();
  const [showHeader, setShowHeader] = useState(false);
  const [currentPage, setCurrentPage] = useState<pagesType>("landing");
  const [userInfo, setUserInfo] = useState<userInfoType | undefined | null>(
    undefined
  );
  const [token, setToken] = useState<boolean | undefined>(undefined);
  const sessionTimer = useRef<NodeJS.Timer>();
  const sessionBuffer = 0;

  const [dialogOpened, { open: openDialog, close: closeDialog }] =
    useDisclosure(false);
  const [sessionAlert, setSessionAlert] = useState("");

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

  /**
   * Tracks remaining time in current session.
   * @param expires_in Time in seconds.
   */
  function startSessionTimer() {
    if (authRef.current.expires_in !== null) {
      setSessionAlert(
        "Session ends in " + formatTime(authRef.current.expires_in) + "."
      );
      openDialog();

      clearInterval(sessionTimer.current);
      sessionTimer.current = setInterval(function () {
        if (
          authRef.current.expires_in !== null &&
          authRef.current.expires_in > 0
        ) {
          authRef.current.expires_in--;
          setSessionAlert(
            "Session ends in " + formatTime(authRef.current.expires_in) + "."
          );
        }
      }, 1000);
    }
  }

  useEffect(() => {
    if (authRef.current.expires_in !== null) {
      // Low time remaining
      if (authRef.current.expires_in === 300) openDialog();
      // End
      else if (authRef.current.expires_in === 0) {
        clearInterval(sessionTimer.current);
        setSessionAlert("Session ended.");
        openDialog();

        setUserInfo(null);
        setToken(false);
        authRef.current = {
          access_token: null,
          token_type: null,
          expires_in: null,
        };
        navigate.current("/");
      }
    }
  }, [authRef.current.expires_in]);

  return (
    <StateContext.Provider
      value={{
        theme,
        authRef,
        navigate,
        token,
        setToken,
        startSessionTimer,
        sessionBuffer,
        sessionAlert,
        dialogOpened,
        openDialog,
        closeDialog,
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
