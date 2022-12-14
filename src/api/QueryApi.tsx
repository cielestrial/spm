let retryAfterSpotify = 1000;
export const setRetryAfterSpotify = (waitPeriod: number) => {
  retryAfterSpotify = 1000 + waitPeriod;
};

let retryAfterLastfm = 1000;
export const setRetryAfterLastfm = (waitPeriod: number) => {
  retryAfterLastfm = 1000 + waitPeriod;
};

export async function useSpotifyQuery(
  func: (...args: any[]) => Promise<any>,
  retryCounter: number,
  ...args: any[]
) {
  console.log(func.name + " is running with args ", ...args);
  if (retryCounter === undefined) retryCounter = 0;
  else if (retryCounter > 3) throw new Error("Retry limit hit");
  let data;
  try {
    data = await func(...args);
    // On success goes here
    retryAfterSpotify = 1000;
  } catch (err) {
    console.log(func.name + " is running but failing", err);
    setTimeout(
      () => useSpotifyQuery(func, retryCounter + 1, ...args),
      retryAfterSpotify
    );
  }
  return data;
}

/*

// Gets all tracks
export const allTracksQuery = (playlists: playlistsType) =>
  useSWRImmutable(
    [playlists !== undefined ? "allTracks" : null],
    async () => {
      const res = await getAllTracks();
      return res;
    },
    {
      errorRetryInterval: retryAfterSpotify,
      onSuccess: () => {
        retryAfterSpotify = 1000;
      }
    }
  );

export const addSubscriptionsQuery = (
  setSelected: (selected: playlistType | undefined) => void
) =>
  useSWRImmutable(
    ["addSubscriptions"],
    async () => {
      const res = await addSubscriptions();
      setSelected(undefined);
      return res;
    },
    {
      errorRetryInterval:
        retryAfterSpotify >= retryAfterLastfm
          ? retryAfterSpotify
          : retryAfterLastfm,
      onSuccess: () => {
        if (retryAfterSpotify > 1000) retryAfterSpotify = 1000;
        if (retryAfterLastfm > 1000) retryAfterLastfm = 1000;
      }
    }
  );

// Gets tracks from lastfm
export const trackGenresQuery = () =>
  {
    async () => {
      const res = await getAllTrackGenres();
      return res;
    },
    {
      errorRetryInterval: retryAfterLastfm,
      onSuccess: () => {
        retryAfterLastfm = 1000;
      }
    }
  }
*/
