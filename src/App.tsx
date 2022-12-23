import "./css/main.scss";
import Dashboard, { dashboardRefType } from "./pages/Dashboard";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import GenreManager from "./pages/GenreManager";
import LoadingPage from "./pages/LoadingPage";
import { AppShell, Header, ScrollArea } from "@mantine/core";
import { useContext, useRef } from "react";
import { StateContext } from "./api/ContextProvider";
import NavBar from "./components/Nav/NavBar";
import { debounceWaitTime } from "./components/Nav/SearchBar";
import { fadeIn, slideDown } from "./css/Keyframes";

export const getCode = () =>
  new URLSearchParams(window.location.search).get("code");

export const pageHeight = "calc(85vh - 60px)";
export const pagePadding = "calc(60px + 2em)";

function App() {
  const context = useContext(StateContext);
  const dashboardRef = useRef<dashboardRefType>(null);

  return (
    <AppShell
      padding="md"
      header={
        context.showHeader ? (
          <Header
            fixed
            withBorder
            height={60}
            p={0}
            styles={(theme) => ({
              root: {
                "> *": { animation: `${fadeIn} 1s 0.5s ease-in-out backwards` },
                animation: `${slideDown} 1s ease-in-out forwards`,
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[5]
                    : theme.colors.gray[0],
                boxShadow:
                  theme.colorScheme === "dark"
                    ? "0 0.33rem 1rem -0.3rem" + theme.colors.dark[8]
                    : "0 0.33rem 1rem -0.33rem" + theme.colors.gray[6],
              },
            })}
          >
            <NavBar dashboardRef={dashboardRef} />
          </Header>
        ) : undefined
      }
      styles={(theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === "dark"
              ? theme.colors.dark[6]
              : theme.colors.gray[1],
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
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.green
                  : theme.colors.blue[5],
            },
            '&[data-orientation="horizontal"] .mantine-ScrollArea-thumb': {
              backgroundColor:
                theme.colorScheme === "dark"
                  ? theme.colors.green
                  : theme.colors.blue[5],
            },
            "&, &:hover": {
              background:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[6]
                  : theme.colors.gray[1],
            },
          },
          corner: {
            opacity: 1,
            background:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[1],
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
