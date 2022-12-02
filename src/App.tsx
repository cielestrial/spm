import "./css/main.scss";
import Dashboard from "./pages/Dashboard";
import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import GenreManager from "./pages/GenreManager";

export const getCode = () =>
  new URLSearchParams(window.location.search).get("code");

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="genres" element={<GenreManager />} />
    </Routes>
  );
}

export default App;
