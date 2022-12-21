import Login from "../components/Login";
import { useContext, useEffect } from "react";
import { getCode, pageHeight, pagePadding } from "../App";
import { StateContext } from "../api/ContextProvider";
import { Center, Loader, Stack, Title } from "@mantine/core";

export let code: string | null;
export const setCode = (newCode: string | null) => {
  code = newCode;
};

const LandingPage = () => {
  const context = useContext(StateContext);
  useEffect(() => {
    context.setCurrentPage("landing");
    context.setShowHeader(false);
    if (getCode() !== null) {
      setCode(getCode());
      context.navigate.current("/loading");
    }
  }, []);

  if (getCode() !== null) {
    return (
      <Center h={pageHeight} pt={pagePadding} className="loading">
        <Loader size="lg" />
      </Center>
    );
  } else {
    return (
      <Stack
        mt="calc(50vh - 60px - 2rem)"
        align="center"
        justify="center"
        spacing="lg"
      >
        <Title ta="center" order={1}>
          Welcome to YSPM
        </Title>
        <Login />
      </Stack>
    );
  }
};

export default LandingPage;
