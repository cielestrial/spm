import { Button, Loader } from "@mantine/core";
import { useState } from "react";
import { maxOffset } from "../api/SpotifyApiClientSide";
import { resultLimit } from "./SearchBar";

type propType = {
  offset: React.MutableRefObject<number>;
  page: React.MutableRefObject<number>;
  total: React.MutableRefObject<number>;
  getResults: () => Promise<void>;
};

const LoadMoreGeneralButton = (props: propType) => {
  const [isLoading, setLoading] = useState(false);
  const loadMore = async () => {
    if (
      props.offset.current <= maxOffset &&
      props.offset.current < props.total.current
    ) {
      setLoading(true);
      props.page.current++;
      props.offset.current += resultLimit;
      await props.getResults();
      console.log("offset", props.offset.current, "total", props.total.current);
      setLoading(false);
    }
  };
  if (isLoading)
    return <Loader color="green" my="sm" size="md" variant="bars" />;
  else
    return (
      <Button
        w="35%"
        miw="min-content"
        my="xs"
        variant="filled"
        disabled={props.offset.current + resultLimit > maxOffset}
        color="green"
        radius="xl"
        size="md"
        onClick={async () => {
          await loadMore();
        }}
        styles={theme => ({
          root: {
            display:
              props.offset.current + resultLimit > maxOffset ||
              props.offset.current + resultLimit >= props.total.current
                ? "none"
                : "initial"
          }
        })}
      >
        Load More
      </Button>
    );
};

export default LoadMoreGeneralButton;
