export async function fetchResource(url, fallback, options = {}) {
  try {
    const response = await fetch(url, { credentials: "include", ...options });

    if (!response.ok) {
      if (response.status === 404) {
        return { data: fallback, error: null };
      }

      let message = `Failed to fetch ${url}`;
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
    return { data: fallback, error: error.message || `Failed to fetch ${url}` };
  }
}
