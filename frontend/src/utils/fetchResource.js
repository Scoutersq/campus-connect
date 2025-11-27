const isAbsoluteUrl = (value = "") => /^https?:\/\//i.test(value);

const resolveBaseUrl = () => {
  const processBase =
    typeof process !== "undefined" ? process.env?.REACT_APP_API_URL : undefined;
  const importMetaBase =
    typeof import.meta !== "undefined" ? import.meta.env?.REACT_APP_API_URL : undefined;
  const viteBase =
    typeof import.meta !== "undefined" ? import.meta.env?.VITE_API_URL : undefined;

  const chosen = processBase || importMetaBase || viteBase || "";
  return typeof chosen === "string" ? chosen.replace(/\/$/, "") : "";
};

const API_BASE_URL = resolveBaseUrl();

export const getApiBaseUrl = () => API_BASE_URL;

export const resolveApiUrl = (endpoint = "") => {
  if (!endpoint) {
    return API_BASE_URL;
  }

  if (isAbsoluteUrl(endpoint) || !API_BASE_URL) {
    return endpoint;
  }

  const sanitizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${sanitizedEndpoint}`;
};

export async function apiFetch(endpoint, options = {}) {
  const url = resolveApiUrl(endpoint);
  const requestOptions = { ...options, credentials: "include" };
  return fetch(url, requestOptions);
}

export async function fetchResource(endpoint, fallback, options = {}) {
  try {
    const response = await apiFetch(endpoint, options);

    if (!response.ok) {
      if (response.status === 404) {
        return { data: fallback, error: null };
      }

      let message = `Failed to fetch ${endpoint}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.message) {
          message = errorBody.message;
        }
      } catch {
        // ignore JSON parse issues when building the error message
      }

      return { data: fallback, error: message };
    }

    const text = await response.text();
    if (!text) {
      return { data: fallback, error: null };
    }

    try {
      const parsed = JSON.parse(text);
      return { data: parsed, error: null };
    } catch {
      return { data: fallback, error: null };
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      return { data: fallback, error: null };
    }
    return { data: fallback, error: error?.message || `Failed to fetch ${endpoint}` };
  }
}
