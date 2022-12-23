import { MultiSelect, SelectItem } from "@mantine/core";
import { useContext, useState } from "react";
import { StateContext } from "../api/ContextProvider";
import { getWhitelist } from "../api/SpotifyApiClientData";

type proptype = {};
const GenreSubscriber = (props: proptype) => {
  const context = useContext(StateContext);
  const [genres, setGenres] = useState<string[]>(
    context.selectedPlaylist.current !== undefined
      ? context.selectedPlaylist.current.genreSubscriptions
      : []
  );
  const data = getWhitelist();

  const searchFilter = (value: string, selected: boolean, item: SelectItem) =>
    item.label !== undefined &&
    !selected &&
    item.label.includes(value.toLocaleLowerCase());

  return (
    <MultiSelect
      variant="default"
      aria-label="Genre Selector"
      data={data}
      value={genres}
      onChange={(e) => {
        setGenres(e);
        if (context.selectedPlaylist.current !== undefined && e.length > 0)
          context.selectedPlaylist.current.genreSubscriptions = e;
      }}
      searchable
      autoComplete="off"
      autoCorrect="false"
      placeholder={
        context.isFollowed() && context.isOwned() ? "Select genres" : ""
      }
      nothingFound="Genre not found"
      filter={searchFilter}
      maxDropdownHeight={288}
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

export default GenreSubscriber;
