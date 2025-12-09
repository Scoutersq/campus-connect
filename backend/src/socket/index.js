const { Server } = require("socket.io");
const mongoose = require("mongoose");
const {
  LiveDiscussion,
  LiveDiscussionMessage,
} = require("../models/liveDiscussion.model.js");
const {
  verifySocketAuthToken,
  SessionError,
} = require("../utils/session.js");

const normalizeOrigin = (value = "") => value.replace(/\/?$/, "").trim();

const collectOrigins = (...sources) =>
  sources
    .filter((value) => typeof value === "string" && value.length > 0)
    .flatMap((value) => value.split(","))
    .map(normalizeOrigin)
    .filter(Boolean);

const collectOriginPatterns = (...sources) =>
  sources
    .filter((value) => typeof value === "string" && value.length > 0)
    .flatMap((value) => value.split(","))
    .map((pattern) => pattern.replace(/\/?$/, "").trim())
    .filter(Boolean);

const escapeRegexExceptStar = (value = "") => value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

const compileOriginPattern = (pattern) => {
  const source = pattern.replace(/\/?$/, "").trim();
  if (!source) {
    return null;
  }
  if (!source.includes("*")) {
    return {
      pattern: source,
      regex: new RegExp(`^${escapeRegexExceptStar(source)}$`, "i"),
    };
  }
  const escaped = escapeRegexExceptStar(source).replace(/\\\*/g, ".*");
  return {
    pattern: source,
    regex: new RegExp(`^${escaped}$`, "i"),
  };
};

const defaultOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://localhost:3000",
];

const originPatternSources = collectOriginPatterns(process.env.ALLOWED_ORIGIN_PATTERNS);
const allowedOriginPatterns = originPatternSources
  .map((pattern) => compileOriginPattern(pattern))
  .filter((compiled) => compiled && compiled.regex instanceof RegExp);

const allowedOrigins = [
  ...new Set([
    ...defaultOrigins.map(normalizeOrigin),
    ...collectOrigins(
      process.env.CLIENT_ORIGIN,
      process.env.CLIENT_ORIGINS,
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URLS,
      process.env.ALLOWED_ORIGINS
    ),
  ]),
];

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }
  const normalized = normalizeOrigin(origin);
  if (allowedOrigins.includes(normalized)) {
    return true;
  }
  return allowedOriginPatterns.some(({ regex }) => regex.test(normalized));
};

const roomKey = (discussionId) => `discussion:${discussionId}`;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

async function ensureUserParticipant(discussionId, userId) {
  if (!isValidObjectId(discussionId) || !isValidObjectId(userId)) {
    return false;
  }

  const record = await LiveDiscussion.findOne({
    _id: discussionId,
    isArchived: false,
    "participants.user": userId,
  })
    .select("_id")
    .lean();

  return Boolean(record);
}

async function persistMessage(discussionId, userId, content) {
  const message = await LiveDiscussionMessage.create({
    discussion: discussionId,
    sender: userId,
    content,
  });

  const populated = await LiveDiscussionMessage.findById(message._id)
    .populate("sender", "firstName lastName avatarUrl")
    .lean();

  return populated;
}

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by Socket.IO CORS`));
      },
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    try {
      const { token } = socket.handshake.auth || {};

      const session = await verifySocketAuthToken(token);

      socket.data.userId = session.userId;
      socket.data.sessionId = session.sessionId;
      socket.data.profile = session.profile || {};

      return next();
    } catch (error) {
      const statusCode = error instanceof SessionError ? error.statusCode : 403;
      return next(new Error(statusCode === 401 ? "Authentication required." : "Not authorized."));
    }
  });

  io.on("connection", (socket) => {
    const acknowledgeError = (event, payload = {}) => {
      socket.emit("discussion:error", {
        event,
        ...payload,
      });
    };

    socket.on("discussion:join", async ({ discussionId }) => {
      if (!isValidObjectId(discussionId)) {
        acknowledgeError("discussion:join", { message: "Invalid discussion." });
        return;
      }

      const canJoin = await ensureUserParticipant(discussionId, socket.data.userId);

      if (!canJoin) {
        acknowledgeError("discussion:join", { message: "Join the discussion first." });
        return;
      }

      socket.join(roomKey(discussionId));
      socket.emit("discussion:joined", { discussionId });
    });

    socket.on("discussion:leave", ({ discussionId }) => {
      if (!isValidObjectId(discussionId)) {
        return;
      }
      socket.leave(roomKey(discussionId));
      socket.emit("discussion:left", { discussionId });
    });

    socket.on("discussion:message", async ({ discussionId, content, tempId }) => {
      const trimmedContent = typeof content === "string" ? content.trim() : "";

      if (!isValidObjectId(discussionId) || !trimmedContent) {
        acknowledgeError("discussion:message", {
          message: "Message content required.",
          tempId,
        });
        return;
      }

      const canChat = await ensureUserParticipant(discussionId, socket.data.userId);

      if (!canChat) {
        acknowledgeError("discussion:message", {
          message: "Join the discussion to chat.",
          discussionId,
          tempId,
        });
        return;
      }

      try {
        const stored = await persistMessage(discussionId, socket.data.userId, trimmedContent);

        const payload = {
          id: String(stored._id),
          discussionId: String(stored.discussion),
          content: stored.content,
          createdAt: stored.createdAt,
          sender: {
            id: String(socket.data.userId),
            firstName: socket.data.profile.firstName || stored.sender?.firstName || "",
            lastName: socket.data.profile.lastName || stored.sender?.lastName || "",
            avatarUrl: socket.data.profile.avatarUrl || stored.sender?.avatarUrl || null,
          },
          tempId: tempId || null,
        };

        io.to(roomKey(discussionId)).emit("discussion:message", payload);
      } catch (error) {
        acknowledgeError("discussion:message", {
          message: "Failed to send message.",
          discussionId,
          tempId,
        });
      }
    });
  });

  return io;
}

module.exports = {
  createSocketServer,
};
