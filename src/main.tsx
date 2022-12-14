import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./css/prestyling.scss";
import { BrowserRouter as Router } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { myTheme } from "./css/Theme";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>
);
