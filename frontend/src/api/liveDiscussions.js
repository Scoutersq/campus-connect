import { apiFetch } from "../api";

async function parseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorMessage = data?.message || "Request failed.";
    const error = new Error(errorMessage);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }
    searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export async function getLiveDiscussions(params = {}) {
  const response = await apiFetch(
    `/api/discussions/live${buildQuery(params)}`,
    {
      method: "GET",
    }
  );

  return parseJson(response);
}

export async function createLiveDiscussion(payload) {
  const response = await apiFetch("/api/discussions/live", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson(response);
}

export async function getLiveDiscussion(discussionId) {
  const response = await apiFetch(`/api/discussions/live/${discussionId}`, {
    method: "GET",
  });

  return parseJson(response);
}

export async function joinLiveDiscussion(discussionId) {
  const response = await apiFetch(`/api/discussions/live/${discussionId}/join`, {
    method: "POST",
  });

  return parseJson(response);
}

export async function leaveLiveDiscussion(discussionId) {
  const response = await apiFetch(`/api/discussions/live/${discussionId}/leave`, {
    method: "POST",
  });

  return parseJson(response);
}

export async function getLiveDiscussionMessages(discussionId, params = {}) {
  const response = await apiFetch(
    `/api/discussions/live/${discussionId}/messages${buildQuery(params)}`,
    {
      method: "GET",
    }
  );

  return parseJson(response);
}

export async function requestLiveDiscussionSocketToken() {
  const response = await apiFetch("/api/discussions/live/socket-token", {
    method: "POST",
  });

  return parseJson(response);
}
