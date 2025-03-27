import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

import "./reset.css";
import "./global.css";
import "allotment/dist/style.css";
import { ApplicationService } from "./services/appService/mod";
import { monacoApplication } from "./applications/monaco";

const appService = ApplicationService.getInstance();
appService.registerApplication(monacoApplication);

const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
