import { SelectItem, MultiSelect } from "@mantine/core";
import { useDebouncedValue, useForceUpdate } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { generatePlaylistKey } from "../api/misc/HelperFunctions";
import { useSpotifyQuery } from "../api/QueryApi";
import { generalPlaylistsSearch } from "../api/SpotifyApiClientSide";
import { playlistsType, playlistType } from "../api/SpotifyApiClientTypes";
import { debounceWaitTime, waitTime } from "./SearchBar";

type proptype = {
  playlists: React.MutableRefObject<playlistsType>;
  selectedPlaylist: React.MutableRefObject<playlistType | undefined>;
  isFollowed: () => boolean;
  isOwned: () => boolean;
};
type dataArrayType = dataType[];
type dataType = {
  value: string;
  label: string;
};
const PlaylistSubscriber = (props: proptype) => {
  const [isLoading, setLoading] = useState(false);
  const [subscribedPlaylists, setSubscribedPlaylists] = useState<string[]>(
    props.selectedPlaylist.current !== undefined
      ? Array.from(props.selectedPlaylist.current.playlistSubscriptions.keys())
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

  const key = generatePlaylistKey(props.selectedPlaylist.current);
  let data1 = props.playlists.current?.list
    ? Array.from(props.playlists.current.list.entries()).map((value) => ({
        value: value[0],
        label: value[1].name,
      }))
    : [];
  data1 = data1.concat(
    props.selectedPlaylist.current
      ? Array.from(
          props.selectedPlaylist.current.playlistSubscriptions.entries()
        ).map((value) => ({
          value: value[0],
          label: value[1].name,
        }))
      : []
  );

  data1.splice(
    data1.findIndex(
      (value) => value.label === props.selectedPlaylist.current?.name
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
    if (props.selectedPlaylist.current !== undefined) {
      for (const subbedPlaylistKey of subbedPlaylistKeys) {
        if (
          props.selectedPlaylist.current.playlistSubscriptions.has(
            subbedPlaylistKey
          )
        )
          updatedSubscriptionList.push([
            subbedPlaylistKey,
            props.selectedPlaylist.current.playlistSubscriptions.get(
              subbedPlaylistKey
            ) as playlistType,
          ]);
        else {
          if (
            props.playlists.current !== undefined &&
            props.playlists.current.list.has(subbedPlaylistKey)
          )
            updatedSubscriptionList.push([
              subbedPlaylistKey,
              props.playlists.current.list.get(
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
      props.selectedPlaylist.current.playlistSubscriptions = new Map<
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
      variant="filled"
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
        props.isFollowed() && props.isOwned() ? "Select playlists" : ""
      }
      nothingFound={isLoading ? "Searching..." : "Playlist not found"}
      filter={searchFilter}
      maxDropdownHeight={288}
      dropdownPosition="top"
      disabled={!props.isFollowed() || !props.isOwned()}
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
