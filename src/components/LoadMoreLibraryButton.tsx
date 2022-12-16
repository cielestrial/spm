import { Button } from "@mantine/core";

type propType = {
  page: React.MutableRefObject<number>;
  totalPages: number;
  addToResultList: () => void;
};

const LoadMoreLibraryButton = (props: propType) => {
  const loadMore = () => {
    if (props.page.current < props.totalPages) {
      props.page.current++;
      props.addToResultList();
    } else console.log("else");
    console.log("page", props.page.current, "total pages", props.totalPages);
  };
  return (
    <Button
      w="35%"
      miw="min-content"
      my="xs"
      variant="filled"
      disabled={props.page.current >= props.totalPages}
      color="green"
      radius="xl"
      size="md"
      onClick={loadMore}
      styles={(theme) => ({
        root: {
          display: props.page.current >= props.totalPages ? "none" : "initial",
        },
      })}
    >
      Load More
    </Button>
  );
};

export default LoadMoreLibraryButton;
