import "./css/main.scss";
import Dashboard, { dashboardRefType } from "./pages/Dashboard";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import GenreManager from "./pages/GenreManager";
import LoadingPage from "./pages/LoadingPage";
import { AppShell, Header, ScrollArea } from "@mantine/core";
import { useContext, useRef } from "react";
import { StateContext } from "./api/ContextProvider";
import NavBar from "./components/NavBar";
import { debounceWaitTime } from "./components/SearchBar";

export const getCode = () =>
  new URLSearchParams(window.location.search).get("code");

export const pageHeight = "calc(85vh - 60px)";
export const pagePadding = "60px";

function App() {
  const context = useContext(StateContext);
  const dashboardRef = useRef<dashboardRefType>(null);

  return (
    <AppShell
      padding="md"
      header={
        // Add transition
        context.showHeader ? (
          <Header fixed withBorder height={60} p={0}>
            <NavBar dashboardRef={dashboardRef} />
          </Header>
        ) : undefined
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
          alignSelf: "end",
        },
      })}
    >
      <ScrollArea.Autosize
        className="App"
        maxHeight={"80vh"}
        type="auto"
        offsetScrollbars
        scrollbarSize={8}
        scrollHideDelay={debounceWaitTime}
        styles={(theme) => ({
          scrollbar: {
            '&[data-orientation="vertical"] .mantine-ScrollArea-thumb': {
              backgroundColor: "forestgreen",
            },
          },
          corner: {
            opacity: 1,
            background:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[0],
          },
        })}
      >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="loading" element={<LoadingPage />} />
          <Route path="dashboard" element={<Dashboard ref={dashboardRef} />} />
          <Route path="genres" element={<GenreManager />} />
        </Routes>
      </ScrollArea.Autosize>
    </AppShell>
  );
}

export default App;
