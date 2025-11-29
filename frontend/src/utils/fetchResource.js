const API_BASE = (
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://campus-connect-1-w95c.onrender.com"
);

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
    const response = await fetch(requestUrl, { credentials: "include", ...options });

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
