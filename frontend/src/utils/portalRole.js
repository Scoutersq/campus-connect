const ROLE_KEY = "cc_role";

const normalizeRole = (value) => {
  if (!value) {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "admin" || normalized === "user") {
    return normalized;
  }
  return undefined;
};

export function setPortalRole(role) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalized = normalizeRole(role);
    if (normalized) {
      window.sessionStorage.setItem(ROLE_KEY, normalized);
    } else {
      window.sessionStorage.removeItem(ROLE_KEY);
    }
    // Remove legacy storage to avoid cross-tab role leakage.
    window.localStorage.removeItem(ROLE_KEY);
  } catch (error) {
    console.error("Failed to persist portal role", error);
  }
}

export function getPortalRole({ fallbackToLegacy = false } = {}) {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const sessionValue = window.sessionStorage.getItem(ROLE_KEY);
    const normalizedSession = normalizeRole(sessionValue);
    if (normalizedSession) {
      return normalizedSession;
    }

    if (fallbackToLegacy) {
      const legacyValue = window.localStorage.getItem(ROLE_KEY);
      const normalizedLegacy = normalizeRole(legacyValue);
      if (normalizedLegacy) {
        return normalizedLegacy;
      }
    }
  } catch (error) {
    console.error("Failed to read portal role", error);
  }

  return undefined;
}

export function clearPortalRole() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(ROLE_KEY);
    window.localStorage.removeItem(ROLE_KEY);
  } catch (error) {
    console.error("Failed to clear portal role", error);
  }
}
