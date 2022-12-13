import { Button } from "@mantine/core";
import { maxOffset } from "../api/SpotifyApiClientSide";
import { resultLimit } from "./SearchBar";

type propType = {
  offset: React.MutableRefObject<number>;
  page: React.MutableRefObject<number>;
  total: React.MutableRefObject<number>;
  getResults: () => void;
};

const LoadMoreGeneralButton = (props: propType) => {
  const loadMore = () => {
    if (
      props.offset.current <= maxOffset &&
      props.offset.current < props.total.current
    ) {
      props.page.current++;
      props.offset.current += resultLimit;
      props.getResults();
      console.log("offset", props.offset.current, "total", props.total.current);
    }
  };
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
      onClick={() => {
        loadMore();
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
      Load More General
    </Button>
  );
};

export default LoadMoreGeneralButton;
