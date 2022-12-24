import { SelectItem, MultiSelect } from "@mantine/core";
import { useDebouncedValue, useForceUpdate } from "@mantine/hooks";
import { useContext, useEffect, useRef, useState } from "react";
import { StateContext } from "../api/ContextProvider";
import { generatePlaylistKey } from "../api/functions/HelperFunctions";
import { useSpotifyQuery } from "../api/QueryApi";
import { debounceWaitTime, waitTime } from "../api/ApiClientData";
import { playlistsType, playlistType } from "../api/SpotifyApiClientTypes";
import { generalPlaylistsSearch } from "../api/SpotifyApiClientSearch";

type proptype = {};
type dataArrayType = dataType[];
type dataType = {
  value: string;
  label: string;
};
const PlaylistSubscriber = (props: proptype) => {
  const context = useContext(StateContext);
  const [isLoading, setLoading] = useState(false);
  const [subscribedPlaylists, setSubscribedPlaylists] = useState<string[]>(
    context.selectedPlaylist.current !== undefined
      ? Array.from(
          context.selectedPlaylist.current.playlistSubscriptions.keys()
        )
      : []
  );

  const forceUpdate = useForceUpdate();
  const [searchValue, onSearchChange] = useState("");
  const [debouncedSearchValue] = useDebouncedValue(
    searchValue,
    debounceWaitTime
  );
  const searchValueRef = useRef("");
  const timeout = useRef<NodeJS.Timeout>();
  const queryHolder = useRef<playlistsType>();

  useEffect(() => {
    clearTimeout(timeout.current);
    if (debouncedSearchValue !== "")
      timeout.current = setTimeout(updateData, waitTime);
    else resetData();
    return () => clearTimeout(timeout.current);
  }, [debouncedSearchValue]);

  const searchGeneralPlaylists = async () => {
    const generalPlaylistsQ = (await useSpotifyQuery(
      generalPlaylistsSearch,
      0,
      searchValueRef.current,
      0
    )) as playlistsType;
    return generalPlaylistsQ;
  };

  const key = generatePlaylistKey(context.selectedPlaylist.current);
  let data1 = context.playlistsQ.current?.list
    ? Array.from(context.playlistsQ.current.list.entries()).map((value) => ({
        value: value[0],
        label: value[1].name,
      }))
    : [];
  data1 = data1.concat(
    context.selectedPlaylist.current
      ? Array.from(
          context.selectedPlaylist.current.playlistSubscriptions.entries()
        ).map((value) => ({
          value: value[0],
          label: value[1].name,
        }))
      : []
  );

  data1.splice(
    data1.findIndex(
      (value) => value.label === context.selectedPlaylist.current?.name
    ),
    1
  );

  const [data, onDataChange] = useState(data1);
  const setData = (newData: dataArrayType) => {
    onDataChange(newData);
    forceUpdate();
  };

  const updateData = async () => {
    if (debouncedSearchValue !== "") {
      searchValueRef.current = debouncedSearchValue;
      let data2: dataArrayType = {} as dataArrayType;
      const tempData = await searchGeneralPlaylists();
      if (tempData !== undefined) {
        if (tempData.list.has(key)) tempData.list.delete(key);
        for (const item of data1)
          if (tempData.list.has(item.value)) tempData.list.delete(item.value);
        queryHolder.current = tempData;
        data2 = Array.from(tempData.list.entries()).map((value) => ({
          value: value[0],
          label: value[1].name,
        }));
      }
      setData(data1.concat(data2));
    }
    setLoading(false);
  };

  const inFollowedPlaylists = (item: dataType) => {
    let found = false;
    if (data1 !== undefined && data1.length > 0)
      for (const followedPlaylists of data1) {
        if (followedPlaylists.value === item.value) {
          found = true;
          break;
        }
      }
    return found;
  };

  const inSubscribedPlaylists = (item: dataType) => {
    let found = false;
    if (subscribedPlaylists !== undefined && subscribedPlaylists.length > 0)
      for (const value of subscribedPlaylists) {
        if (value === item.value) {
          found = true;
          break;
        }
      }
    return found;
  };

  const resetData = () => {
    const tempData = data.filter(
      (item) => inFollowedPlaylists(item) || inSubscribedPlaylists(item)
    );
    setData(tempData);
  };

  const updateSubscriptionList = (subbedPlaylistKeys: string[]) => {
    const updatedSubscriptionList: [string, playlistType][] = [];
    if (context.selectedPlaylist.current !== undefined) {
      for (const subbedPlaylistKey of subbedPlaylistKeys) {
        if (
          context.selectedPlaylist.current.playlistSubscriptions.has(
            subbedPlaylistKey
          )
        )
          updatedSubscriptionList.push([
            subbedPlaylistKey,
            context.selectedPlaylist.current.playlistSubscriptions.get(
              subbedPlaylistKey
            ) as playlistType,
          ]);
        else {
          if (
            context.playlistsQ.current !== undefined &&
            context.playlistsQ.current.list.has(subbedPlaylistKey)
          )
            updatedSubscriptionList.push([
              subbedPlaylistKey,
              context.playlistsQ.current.list.get(
                subbedPlaylistKey
              ) as playlistType,
            ]);
          else if (
            queryHolder.current !== undefined &&
            queryHolder.current.list.has(subbedPlaylistKey)
          )
            updatedSubscriptionList.push([
              subbedPlaylistKey,
              queryHolder.current.list.get(subbedPlaylistKey) as playlistType,
            ]);
        }
      }
      context.selectedPlaylist.current.playlistSubscriptions = new Map<
        string,
        playlistType
      >(updatedSubscriptionList);
    }
  };

  const searchFilter = (value: string, selected: boolean, item: SelectItem) =>
    item.label !== undefined &&
    !selected &&
    item.label.toLowerCase().includes(value.toLocaleLowerCase());

  return (
    <MultiSelect
      variant="default"
      aria-label="Playlist Selector"
      data={data}
      value={subscribedPlaylists}
      onChange={(e) => {
        setSubscribedPlaylists(e);
        updateSubscriptionList(e);
      }}
      clearSearchOnChange
      searchable
      searchValue={searchValue}
      onSearchChange={(e) => {
        onSearchChange(e);
        if (e !== "") setLoading(true);
      }}
      autoComplete="off"
      autoCorrect="false"
      placeholder={
        context.isFollowed() && context.isOwned() ? "Select playlists" : ""
      }
      nothingFound={isLoading ? "Searching..." : "Playlist not found"}
      filter={searchFilter}
      maxDropdownHeight={220}
      dropdownPosition="top"
      disabled={!context.isFollowed() || !context.isOwned()}
      size="sm"
      w="100%"
      styles={(theme) => ({
        value: {
          fontWeight: "bold",
        },
        item: {
          borderStyle: "inset outset outset inset",
          borderColor: "rgba(255, 255, 255, 0.66)",
        },
      })}
    />
  );
};
export default PlaylistSubscriber;
