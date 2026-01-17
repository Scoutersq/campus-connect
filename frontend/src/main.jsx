import React from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import faviconUrl from "./assets/favicon.png";
import App from "./App";
import { API_BASE_URL } from "./api";
import { getPortalRole } from "./utils/portalRole";

// Ensure favicon loads from bundled asset path (works in dev and production)
if (typeof document !== "undefined") {
  const existing = document.querySelector('link[rel="icon"]');
  const link = existing || document.createElement("link");
  link.setAttribute("rel", "icon");
  link.setAttribute("type", "image/png");
  link.href = faviconUrl;
  if (!existing) {
    document.head.appendChild(link);
  }
}

if (typeof window !== "undefined" && typeof window.fetch === "function") {
  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    const role = getPortalRole();
    if (!role) {
      return originalFetch(input, init);
    }

    let url = "";
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof Request) {
      url = input.url ?? "";
    }

    const shouldAttachHeader =
      !url ||
      url.startsWith("/") ||
      (typeof API_BASE_URL === "string" && url.startsWith(API_BASE_URL));

    if (!shouldAttachHeader) {
      return originalFetch(input, init);
    }

    const baseHeaders =
      init?.headers || (input instanceof Request ? input.headers : undefined) || {};
    const headers = new Headers(baseHeaders);

    if (!headers.has("X-Portal-Role")) {
      headers.set("X-Portal-Role", role);
    }

    const finalInit = {
      ...init,
      headers,
    };

    if (input instanceof Request) {
      const request = new Request(input, finalInit);
      return originalFetch(request);
    }

    return originalFetch(input, finalInit);
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
  </React.StrictMode>
);
