import { Center, Loader } from "@mantine/core";
import { useContext, useEffect } from "react";
import { StateContext } from "../api/ContextProvider";
import { pageHeight, pagePadding } from "../App";

const Callback = () => {
  const context = useContext(StateContext);
  useEffect(() => {
    context.setCurrentPage("callback");
    context.setShowHeader(false);
  }, []);
  return (
    <Center h={pageHeight} pt={pagePadding} className="loading">
      <Loader size="lg" />
    </Center>
  );
};

export default Callback;
