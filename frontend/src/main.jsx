import React from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
  </React.StrictMode>
);
