import { Button } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { setCode } from "./LandingPage";

const Logout = () => {
  const navigate = useRef(useNavigate());
  return (
    <Button
      fullWidth
      variant="outline"
      color="green"
      radius="xl"
      size="md"
      onClick={() => {
        setCode(null);
        navigate.current("/");
      }}
    >
      Logout
    </Button>
  );
};

export default Logout;
