const defaultWait = 3000;

let retryAfterSpotify = defaultWait;
export const setRetryAfterSpotify = (waitPeriod: number) => {
  retryAfterSpotify = defaultWait + waitPeriod;
};

export async function useSpotifyQuery(
  func: (...args: any[]) => Promise<any>,
  retryCounter: number,
  ...args: any[]
) {
  //console.log(func.name + " is running with args ", ...args);
  if (retryCounter === undefined) retryCounter = 0;
  else if (retryCounter > 3) throw new Error("Retry limit hit");
  let data;
  try {
    data = await func(...args);
    // On success
    retryAfterSpotify = defaultWait;
  } catch (err) {
    console.error(func.name + " is running but failing\n", err);
    setTimeout(
      () => useSpotifyQuery(func, retryCounter + 1, ...args),
      retryAfterSpotify
    );
  }
  return data;
}
