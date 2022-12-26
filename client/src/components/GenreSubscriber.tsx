import { MultiSelect, SelectItem } from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { getWhitelist } from "../api/ApiClientData";
import { StateContext } from "../api/ContextProvider";

type proptype = {};
const GenreSubscriber = (props: proptype) => {
  const context = useContext(StateContext);
  const [genres, setGenres] = useState<string[]>([]);
  const data = getWhitelist().filter(
    (element) =>
      element.value !== "unknown" &&
      element.value !== "local" &&
      element.value !== "unplayable"
  );

  useEffect(() => {
    if (context.selectedPlaylist.current !== undefined)
      setGenres(context.selectedPlaylist.current.genreSubscriptions);
  }, []);

  const searchFilter = (value: string, selected: boolean, item: SelectItem) =>
    item.value !== undefined &&
    !selected &&
    item.value.includes(value.toLocaleLowerCase());

  return (
    <MultiSelect
      variant="default"
      aria-label="Genre Selector"
      data={data}
      value={genres}
      onChange={(e) => {
        setGenres(e);
        if (context.selectedPlaylist.current !== undefined)
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
      maxDropdownHeight={264}
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
