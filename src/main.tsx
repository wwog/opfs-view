import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

import "./editor/initMonaco";
import "./reset.css";
import "./global.css";
import "allotment/dist/style.css";

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
