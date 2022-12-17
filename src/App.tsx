import "./css/main.scss";
import Dashboard from "./pages/Dashboard";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import GenreManager from "./pages/GenreManager";
import LoadingPage from "./pages/LoadingPage";
import { StateProvider } from "./api/ContextProvider";

export const getCode = () =>
  new URLSearchParams(window.location.search).get("code");

function App() {
  return (
    <StateProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="loading" element={<LoadingPage />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="genres" element={<GenreManager />} />
      </Routes>
    </StateProvider>
  );
}

export default App;
