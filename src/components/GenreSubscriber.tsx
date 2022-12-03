import { MultiSelect, SelectItem } from "@mantine/core";
import { useState } from "react";
import { getWhitelist } from "../api/SpotifyApiClientSide";
import { playlistType } from "../api/SpotifyApiClientTypes";

type proptype = {
  selectedPlaylist: playlistType | undefined;
  isFollowed: () => boolean;
};
const GenreSubscriber = (props: proptype) => {
  const [value, setValue] = useState<string[]>(
    props.selectedPlaylist !== undefined
      ? props.selectedPlaylist.genreSubscriptions
      : []
  );
  const data = getWhitelist();

  const searchFilter = (value: string, selected: boolean, item: SelectItem) =>
    item.label !== undefined &&
    !selected &&
    item.label.includes(value.toLocaleLowerCase());

  return (
    <MultiSelect
      variant="filled"
      aria-label="Genre Selector"
      data={data}
      value={value}
      onChange={e => {
        setValue(e);
        if (props.selectedPlaylist !== undefined)
          props.selectedPlaylist.genreSubscriptions = e;
      }}
      searchable
      autoComplete="off"
      autoCorrect="false"
      placeholder={props.isFollowed() ? "Select genres" : ""}
      nothingFound="Genre not found"
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

export default GenreSubscriber;
