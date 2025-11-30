import { API_BASE_URL } from "../api";
import { getPortalRole } from "./portalRole";

const API_BASE = API_BASE_URL;

export const buildApiUrl = (url) => {
  if (!url) return API_BASE;
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  const normalized = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE}${normalized}`;
};

export async function fetchResource(url, fallback, options = {}) {
  const requestUrl = buildApiUrl(url);
  try {
    const headers = new Headers(options.headers || {});
    const role = getPortalRole();
    if (role && !headers.has("X-Portal-Role")) {
      headers.set("X-Portal-Role", role);
    }

    const response = await fetch(requestUrl, {
      credentials: "include",
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: fallback, error: null };
      }

      let message = `Failed to fetch ${requestUrl}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          message = errorBody.message;
        }
      } catch {
        // ignore JSON parse issues
      }

      return { data: fallback, error: message };
    }

    const parsed = await response.json();
    return { data: parsed, error: null };
  } catch (error) {
    if (error.name === "AbortError") {
      return { data: fallback, error: null };
    }
    return { data: fallback, error: error.message || `Failed to fetch ${requestUrl}` };
  }
}
