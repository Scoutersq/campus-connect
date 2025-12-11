const TOKEN_KEY = "cc_session_token";

const readStorage = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    return window.sessionStorage.getItem(TOKEN_KEY) || undefined;
  } catch (error) {
    console.error("Failed to access session token storage", error);
    return undefined;
  }
};

export function setSessionToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (token && typeof token === "string" && token.trim().length > 0) {
      window.sessionStorage.setItem(TOKEN_KEY, token.trim());
    } else {
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch (error) {
    console.error("Failed to persist session token", error);
  }
}

export function getSessionToken() {
  return readStorage();
}

export function clearSessionToken() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to clear session token", error);
  }
}

export function applySessionToken(headers) {
  const token = getSessionToken();
  if (!token) {
    return headers;
  }

  if (headers instanceof Headers) {
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  }

  const normalized = { ...(headers || {}) };
  const hasAuthHeader = Object.keys(normalized).some(
    (key) => key.toLowerCase() === "authorization"
  );

  if (!hasAuthHeader) {
    normalized.Authorization = `Bearer ${token}`;
  }

  return normalized;
}
