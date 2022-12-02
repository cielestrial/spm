import { MultiSelect, SelectItem } from "@mantine/core";
import { useState } from "react";
import { getWhitelist } from "../api/SpotifyApiClientSide";

const GenreSubscriber = () => {
  const [value, setValue] = useState<string[]>([]);
  const data = getWhitelist();

  const searchFilter = (value: string, selected: boolean, item: SelectItem) =>
    item.label !== undefined && item.label.includes(value.toLocaleLowerCase());

  return (
    <MultiSelect
      data={data}
      value={value}
      onChange={setValue}
      searchable
      placeholder="Select genres for this playlist"
      nothingFound="Genre not found"
      filter={searchFilter}
      size="xs"
    />
  );
};

export default GenreSubscriber;
