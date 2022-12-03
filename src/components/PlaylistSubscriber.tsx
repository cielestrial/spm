import { SelectItem, MultiSelect } from "@mantine/core";
import { useForceUpdate } from "@mantine/hooks";
import { useRef, useState } from "react";
import { generalPlaylistsQuery } from "../api/QueryApi";
import { playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  playlists: Map<string, playlistType> | undefined;
  selectedPlaylist: playlistType | undefined;
  isFollowed: () => boolean;
};
const PlaylistSubscriber = (props: proptype) => {
  const [selectValue, setSelectValue] = useState<string[]>(
    props.selectedPlaylist !== undefined
      ? props.selectedPlaylist.playlistSubscriptions
      : []
  );
  const forceUpdate = useForceUpdate();
  const [searchValue, onSearchChange] = useState("");
  const resultLimit = 30;
  const generalPlaylistsQ = generalPlaylistsQuery(searchValue, resultLimit);

  const data1 = props.playlists
    ? Array.from(props.playlists.entries()).map(value => ({
        value: value[0],
        label: value[1].name
      }))
    : [];

  const [data, setData] = useState(data1);

  const updateData = async () => {
    if (searchValue !== "") {
      const res = await generalPlaylistsQ.refetch();
      for (const item of data1) {
        if (res.data?.list.has(item.value)) res.data.list.delete(item.value);
      }
      const data2 = res.data
        ? Array.from(res.data.list.entries()).map(value => ({
            value: value[0],
            label: value[1].name
          }))
        : [];
      setData(data1.concat(data2));
      forceUpdate();
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
      value={selectValue}
      onChange={e => {
        setSelectValue(e);
        if (props.selectedPlaylist !== undefined)
          props.selectedPlaylist.playlistSubscriptions = e;
      }}
      searchable
      searchValue={searchValue}
      onSearchChange={e => {
        onSearchChange(e);
        updateData();
      }}
      autoComplete="off"
      autoCorrect="false"
      placeholder={props.isFollowed() ? "Select playlists" : ""}
      nothingFound="Playlist not found"
      filter={searchFilter}
      maxDropdownHeight={288}
      dropdownPosition="top"
      disabled={!props.isFollowed()}
      size="sm"
      w="100%"
      styles={theme => ({
        value: {
          fontWeight: "bold"
        },
        item: {
          borderStyle: "inset outset outset inset",
          borderColor: "rgba(255, 255, 255, 0.66)"
        }
      })}
    />
  );
};
export default PlaylistSubscriber;
