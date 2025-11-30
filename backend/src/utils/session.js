const jwt = require("jsonwebtoken");
const { userModel } = require("../models/user.model.js");
const { adminModel } = require("../models/admin.model.js");

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class SessionError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "SessionError";
    this.statusCode = statusCode;
  }
}

const roleModelMap = {
  user: userModel,
  admin: adminModel,
};

function parseOriginsFromEnv(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function shouldUseSecureCookies() {
  if (process.env.COOKIE_SECURE === "true") {
    return true;
  }

  if (process.env.COOKIE_SECURE === "false") {
    return false;
  }

  if (process.env.NODE_ENV === "production") {
    return true;
  }

  const httpsOrigins = [
    ...parseOriginsFromEnv(process.env.FRONTEND_URL),
    ...parseOriginsFromEnv(process.env.CLIENT_ORIGIN),
    ...parseOriginsFromEnv(process.env.CLIENT_ORIGINS),
  ];

  return httpsOrigins.some((origin) => /^https:\/\//i.test(origin));
}

function getBaseCookieOptions() {
  const secure = shouldUseSecureCookies();

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  };
}

function normalizeRoleHint(value) {
  if (!value) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "user" || normalized === "admin") {
    return normalized;
  }

  return null;
}

function extractTokenFromRequest(req, preferredRole) {
  const cookies = req?.cookies || {};
  const headerRole =
    normalizeRoleHint(preferredRole) ||
    normalizeRoleHint(req?.headers?.["x-portal-role"]) ||
    normalizeRoleHint(req?.headers?.["x-auth-role"]);

  const tokenCandidates = [];

  const pushCandidate = (value) => {
    if (typeof value === "string" && value.trim().length > 0 && !tokenCandidates.includes(value)) {
      tokenCandidates.push(value.trim());
    }
  };

  if (headerRole === "user") {
    pushCandidate(cookies.user_token);
    pushCandidate(cookies.token);
  } else if (headerRole === "admin") {
    pushCandidate(cookies.admin_token);
    pushCandidate(cookies.token);
  }

  pushCandidate(cookies.user_token);
  pushCandidate(cookies.admin_token);
  pushCandidate(cookies.token);

  const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
  if (typeof authHeader === "string" && authHeader.toLowerCase().startsWith("bearer ")) {
    pushCandidate(authHeader.slice(7).trim());
  }

  return tokenCandidates.length > 0 ? tokenCandidates[0] : null;
}

async function verifySessionToken(token, { expectedRole } = {}) {
  if (!token) {
    throw new SessionError(401, "Authentication required.");
  }

  let decoded;
  let role = null;

  try {
    decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
    role = "user";
  } catch (userError) {
    try {
      decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
      role = "admin";
    } catch (adminError) {
      throw new SessionError(403, "Invalid or expired token.");
    }
  }

  if (expectedRole && role !== expectedRole) {
    throw new SessionError(403, "Access denied.");
  }

  if (!decoded?.sid) {
    throw new SessionError(403, "Session invalid. Please sign in again.");
  }

  const Model = roleModelMap[role];

  if (!Model) {
    throw new SessionError(403, "Access denied.");
  }

  const record = await Model.findById(decoded.id).select("activeSessionId sessionExpiresAt");

  if (!record || !record.activeSessionId) {
    throw new SessionError(403, "Session expired. Please sign in again.");
  }

  if (String(record.activeSessionId) !== String(decoded.sid)) {
    throw new SessionError(403, "This account has been signed in elsewhere. Please sign in again.");
  }

  if (record.sessionExpiresAt && record.sessionExpiresAt < new Date()) {
    await Model.updateOne(
      { _id: decoded.id },
      { $set: { activeSessionId: null, sessionExpiresAt: null } }
    );
    throw new SessionError(403, "Session expired. Please sign in again.");
  }

  return {
    role,
    id: decoded.id,
    sessionId: decoded.sid,
  };
}

async function clearActiveSession({ role, id, sessionId }) {
  const Model = roleModelMap[role];
  if (!Model || !id) {
    return;
  }

  const filter = { _id: id };
  if (sessionId) {
    filter.activeSessionId = sessionId;
  }

  await Model.updateOne(filter, {
    $set: { activeSessionId: null, sessionExpiresAt: null },
  });
}

async function resolveUserIdFromToken(token) {
  try {
    const session = await verifySessionToken(token, { expectedRole: "user" });
    return session.id;
  } catch (_error) {
    return null;
  }
}

module.exports = {
  SESSION_TTL_MS,
  verifySessionToken,
  SessionError,
  clearActiveSession,
  resolveUserIdFromToken,
  extractTokenFromRequest,
  getBaseCookieOptions,
};
