import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initAppService } from "./initApplications";
import "./reset.css";
import "./global.css";
import "allotment/dist/style.css";

initAppService();

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
