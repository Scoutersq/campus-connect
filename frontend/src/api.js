const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "https://campus-connect-1-w95c.onrender.com";

export async function apiFetch(endpoint, options = {}) {
	const response = await fetch(`${API_URL}${endpoint}`, {
		credentials: "include",
		...options,
	});
	return response;
}
