import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { PortalProvider } from "./context";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PortalProvider>
      <App />
    </PortalProvider>
  </React.StrictMode>
);
