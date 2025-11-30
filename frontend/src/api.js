import { getPortalRole } from "./utils/portalRole";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://campus-connect-1-w95c.onrender.com";

export async function apiFetch(endpoint, options = {}) {
	const headers = new Headers(options.headers || {});
	const role = getPortalRole();
	if (role && !headers.has("X-Portal-Role")) {
		headers.set("X-Portal-Role", role);
	}

	const response = await fetch(`${API_BASE_URL}${endpoint}`, {
		credentials: "include",
		...options,
		headers,
	});
	return response;
}
