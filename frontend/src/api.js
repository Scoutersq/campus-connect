const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch(endpoint, options = {}) {
	const response = await fetch(`${API_URL}${endpoint}`, {
		credentials: "include",
		...options,
	});
	return response;
}
