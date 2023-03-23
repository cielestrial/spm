import { AppShell, Center, Header, Loader } from "@mantine/core";
import { lazy, Suspense, useContext, useRef } from "react";
import { Route, Routes } from "react-router-dom";
import { StateContext } from "./api/ContextProvider";
import "./css/main.scss";

import MyScrollArea from "./components/MyScrollArea";
import LandingPage from "./pages/LandingPage";
import LoadingPage from "./pages/LoadingPage";

const NavBar = lazy(() => import("./components/Nav/NavBar"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const GenreManager = lazy(() => import("./pages/GenreManager"));

import { dashboardRefType } from "./components/Nav/SearchBar/SearchBarTypes";
import { fadeIn, slideDown } from "./css/Keyframes";

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
      <MyScrollArea maxHeight={"80vh"} type={"auto"}>
        <Suspense
          fallback={
            <Center h={pageHeight} pt={pagePadding} className="loading">
              <Loader size="lg" />
            </Center>
          }
        >
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/index.html" element={<LandingPage />} />
            <Route path="loading" element={<LoadingPage />} />
            <Route
              path="dashboard"
              element={<Dashboard ref={dashboardRef} />}
            />
            <Route path="genres" element={<GenreManager />} />
          </Routes>
        </Suspense>
      </MyScrollArea>
    </AppShell>
  );
}

export default App;
