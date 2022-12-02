import { Button } from "@mantine/core";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

const GenreTestButton = () => {
  const navigate = useRef(useNavigate());

  return (
    <Button
      w="40%"
      miw="min-content"
      compact
      variant="outline"
      color="green"
      radius="xl"
      size="md"
      component="a"
      onClick={() => {
        navigate.current("/genres");
      }}
    >
      Genre
    </Button>
  );
};

export default GenreTestButton;
