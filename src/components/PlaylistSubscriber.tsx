import { SelectItem, MultiSelect } from "@mantine/core";
import { useState } from "react";
import { getBlacklist } from "../api/misc/GenreBlackList";
import { playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  selectedPlaylist: playlistType | undefined;
  isFollowed: () => boolean;
};
const PlaylistSubscriber = (props: proptype) => {
  const [value, setValue] = useState<string[]>(
    props.selectedPlaylist !== undefined
      ? props.selectedPlaylist.playlistSubscriptions
      : []
  );
  const [searchValue, onSearchChange] = useState("");
  const data = getBlacklist();

  const searchFilter = (value: string, selected: boolean, item: SelectItem) =>
    item.label !== undefined &&
    !selected &&
    item.label.includes(value.toLocaleLowerCase());

  return (
    <MultiSelect
      variant="filled"
      aria-label="Playlist Selector"
      data={data}
      value={value}
      onChange={e => {
        setValue(e);
        if (props.selectedPlaylist !== undefined)
          props.selectedPlaylist.playlistSubscriptions = e;
      }}
      searchable
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      autoComplete="off"
      autoCorrect="false"
      placeholder={props.isFollowed() ? "Select playlists" : ""}
      nothingFound="Playlist not found"
      filter={searchFilter}
      maxDropdownHeight={112}
      dropdownPosition="flip"
      disabled={!props.isFollowed()}
      size="sm"
      w="100%"
      styles={theme => ({
        value: {
          fontWeight: "bold"
        }
      })}
    />
  );
};
export default PlaylistSubscriber;
