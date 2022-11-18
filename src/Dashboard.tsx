import "./css/dashboard.scss";
import Logout from "./Logout";
import {
  getToken,
  getTracks,
  getPlaylists,
  createPlaylist,
  unfollowPlaylist,
  addPlaylistToPlaylist
} from "./SpotifyApiClientSide";
import { useQuery } from "react-query";
import { Box } from "@mantine/core";
import { useRef } from "react";
import TimelessTester from "./TimelessTester";

const Dashboard = () => {
  let selectedId: string | undefined;
  const scrollReset = useRef({} as HTMLDivElement);
  const mutationObserver = new MutationObserver(() => {
    scrollReset.current.scrollTop = 0;
    mutationObserver.disconnect();
  });

  // Gets access token
  const { data: token, isFetching: tokenStatus } = useQuery("token", getToken);

  // Gets playlist
  const { data: playlists, isFetching: playlistStatus } = useQuery(
    ["playlists", token],
    () => getPlaylists(),
    {
      enabled: token !== undefined
    }
  );

  // Gets tracks
  const {
    data: tracks,
    isFetching: trackStatus,
    refetch: refetchTracks,
    isRefetching: refetchTrackStatus
  } = useQuery(["tracks"], () => getTracks(selectedId), {
    enabled: false
  });

  const {
    data: timelessRadar,
    isFetching: creatingTimelessRadar,
    refetch: createTimelessRadar
  } = useQuery(["timelessRadar"], () => createPlaylist("Timeless Radar"), {
    enabled: false
  });
  const {
    data: timelessDiscovery,
    isFetching: creatingTimelessDiscovery,
    refetch: createTimelessDiscovery
  } = useQuery(
    ["timelessDiscovery"],
    () => createPlaylist("Timeless Discovery"),
    { enabled: false }
  );
  const {
    isFetching: unfollowingTimelessRadar,
    refetch: unfollowTimelessRadar
  } = useQuery(
    ["unfollowTimelessRadar"],
    () =>
      unfollowPlaylist(
        playlists?.list.find(playlist => playlist.name === "Timeless Radar")?.id
      ),
    { enabled: false }
  );
  const {
    isFetching: unfollowingTimelessDiscovery,
    refetch: unfollowTimelessDiscovery
  } = useQuery(
    ["unfollowTimelessDiscovery"],
    () =>
      unfollowPlaylist(
        playlists?.list.find(playlist => playlist.name === "Timeless Discovery")
          ?.id
      ),
    { enabled: false }
  );
  const { isFetching: addingToTimelessRadar, refetch: addToTimelessRadar } =
    useQuery(
      ["addToTimelessRadar"],
      () =>
        addPlaylistToPlaylist(
          playlists?.list.find(playlist => playlist.name === "Release Radar")
            ?.id,
          playlists?.list.find(playlist => playlist.name === "Timeless Radar")
            ?.id
        ),
      { enabled: false }
    );
  const {
    isFetching: addingToTimelessDiscovery,
    refetch: addToTimelessDiscovery
  } = useQuery(
    ["addToTimelessDiscovery"],
    () =>
      addPlaylistToPlaylist(
        playlists?.list.find(playlist => playlist.name === "Discover Weekly")
          ?.id,
        playlists?.list.find(playlist => playlist.name === "Timeless Discovery")
          ?.id
      ),
    { enabled: false }
  );

  const timelessCheck =
    creatingTimelessDiscovery ||
    creatingTimelessRadar ||
    unfollowingTimelessDiscovery ||
    unfollowingTimelessRadar ||
    addingToTimelessRadar ||
    addingToTimelessDiscovery;

  const displayPlaylistsCheck = playlistStatus || timelessCheck;

  const displayTracksCheck = trackStatus || refetchTrackStatus;

  /**
   * Display list of playlists
   * @returns
   */
  function displayPlaylists() {
    if (displayPlaylistsCheck)
      return <div className="loading text">Loading...</div>;
    if (playlists !== undefined) {
      const dynamicList: JSX.Element[] = [];
      playlists.list.forEach((playlist, index) => {
        dynamicList.push(
          <Box
            className="not-button"
            id={playlist.id}
            key={index}
            onClick={(event: React.MouseEvent) => {
              selectedId = event.currentTarget.id;
              mutationObserver.observe(scrollReset.current, {
                childList: true
              });
              refetchTracks();
            }}
          >
            {index + 1 + ". " + playlist.name}
          </Box>
        );
      });
      if (dynamicList.length > 0) return dynamicList;
      else return <p className="error text">No playlists</p>;
    }
  }

  /**
   * Display list of tracks
   * @returns
   */
  function displayTracks() {
    if (displayTracksCheck)
      return <div className="loading text">Loading...</div>;
    if (tracks?.tracks !== undefined) {
      const dynamicList: JSX.Element[] = [];
      tracks.tracks.forEach((track, index) => {
        dynamicList.push(
          <Box className="not-button" id={track.id} key={index}>
            {index + 1 + ". " + track.name}
          </Box>
        );
      });
      if (dynamicList.length > 0) return dynamicList;
      else return <p className="error text">No tracks</p>;
    }
  }

  function displayPlaylistsLabel() {
    const loading = playlists === undefined || displayPlaylistsCheck;
    const number = loading ? "" : playlists?.total;
    const label = playlists?.total === 1 ? "Playlist" : "Playlists";
    return (
      <label className="text">
        {number} {label}
      </label>
    );
  }

  function displayTracksLabel() {
    const loading = tracks === undefined || displayTracksCheck;
    const title = loading ? "" : tracks?.name;
    const number = loading ? "" : tracks?.total;
    const label = tracks?.total === 1 ? "Track" : "Tracks";
    return (
      <label className="text">
        {title}
        <br />
        {number} {label}
      </label>
    );
  }

  if (tokenStatus)
    return (
      <div className="background center">
        <p className="loading title">Loading...</p>
      </div>
    );
  else
    return (
      <div className="background start">
        <p className="title start column-element">
          Your Spotify Playlist Manager
        </p>
        <div className="listDisplayArea">
          {displayPlaylistsLabel()}
          {displayTracksLabel()}
          <div className="list">{displayPlaylists()}</div>
          <div className="list" ref={scrollReset}>
            {displayTracks()}
          </div>
        </div>
        <div className="button column-element">
          <TimelessTester
            playlists={playlists}
            createR={createTimelessRadar}
            createD={createTimelessDiscovery}
            addToR={addToTimelessRadar}
            addToD={addToTimelessDiscovery}
            unfollowR={unfollowTimelessRadar}
            unfollowD={unfollowTimelessDiscovery}
            refetchTracks={refetchTracks}
          />
          <Logout />
        </div>
      </div>
    );
};

export default Dashboard;
