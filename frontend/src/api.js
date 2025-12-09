import { getPortalRole } from "./utils/portalRole";

const sanitizeBase = (value = "") => value.replace(/\/+$/, "").trim();

const explicitBase = sanitizeBase(import.meta.env.VITE_API_URL || "");
const isBrowser = typeof window !== "undefined";
const browserOrigin = isBrowser ? sanitizeBase(window.location.origin) : "";
const isVercelHost = isBrowser && /\.vercel\.app$/i.test(window.location.hostname);

export const API_BASE_URL = isVercelHost
	? browserOrigin
	: explicitBase || "https://campus-connect-1-w95c.onrender.com";

const explicitSocketBase = sanitizeBase(import.meta.env.VITE_SOCKET_URL || explicitBase);

export const SOCKET_BASE_URL = explicitSocketBase || API_BASE_URL;

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
