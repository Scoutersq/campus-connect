const { Router } = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const {
  LiveDiscussion,
  LiveDiscussionMessage,
} = require("../../models/liveDiscussion.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const {
  validateBody,
  validateParams,
  validateQuery,
} = require("../../utils/validation.js");
const {
  extractTokenFromRequest,
  resolveUserIdFromToken,
  createSocketAuthToken,
  SessionError,
} = require("../../utils/session.js");

const router = Router();

const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid identifier provided.",
  });

const createDiscussionSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  topicTag: z.string().trim().max(50).optional().default(""),
});

const listQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  tag: z.string().trim().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

const messagesQuerySchema = z.object({
  before: z
    .string()
    .datetime({ offset: true })
    .optional()
    .transform((value) => (value ? new Date(value) : undefined)),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

const mapDiscussion = (discussion, currentUserId) => {
  const participants = Array.isArray(discussion.participants)
    ? discussion.participants
    : [];

  const isJoined = currentUserId
    ? participants.some((entry) => {
        const participantId = entry?.user?._id || entry?.user;
        return participantId
          ? String(participantId) === String(currentUserId)
          : false;
      })
    : false;

  return {
    id: String(discussion._id),
    title: discussion.title,
    description: discussion.description,
    topicTag: discussion.topicTag || "",
    participantsCount: participants.length,
    createdAt: discussion.createdAt,
    updatedAt: discussion.updatedAt,
    isJoined,
    creator: discussion.creator
      ? {
          id: String(discussion.creator._id),
          firstName: discussion.creator.firstName,
          lastName: discussion.creator.lastName,
          avatarUrl: discussion.creator.avatarUrl || null,
        }
      : null,
  };
};

const mapMessage = (message) => ({
  id: String(message._id),
  discussionId: String(message.discussion),
  content: message.content,
  createdAt: message.createdAt,
  sender: message.sender
    ? {
        id: String(message.sender._id),
        firstName: message.sender.firstName,
        lastName: message.sender.lastName,
        avatarUrl: message.sender.avatarUrl || null,
      }
    : null,
});

const resolveOptionalUserId = async (req) => {
  try {
    const token = extractTokenFromRequest(req, "user");
    return await resolveUserIdFromToken(token);
  } catch (_error) {
    return null;
  }
};

router.get(
  "/",
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { search, tag, limit } = req.query;

      const filters = { isArchived: false };

      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filters.$or = [
          { title: { $regex: safeSearch, $options: "i" } },
          { description: { $regex: safeSearch, $options: "i" } },
        ];
      }

      if (tag) {
        const safeTag = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filters.topicTag = { $regex: `^${safeTag}$`, $options: "i" };
      }

      const currentUserId = await resolveOptionalUserId(req);

      const discussions = await LiveDiscussion.find(filters)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("creator", "firstName lastName avatarUrl")
        .select("title description topicTag participants createdAt updatedAt creator")
        .lean();

      const normalized = discussions.map((discussion) =>
        mapDiscussion(discussion, currentUserId)
      );

      return res.status(200).json({
        success: true,
        discussions: normalized,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch live discussions.",
        error: error.message,
      });
    }
  }
);

router.post(
  "/",
  userMiddleware,
  validateBody(createDiscussionSchema),
  async (req, res) => {
    try {
      const discussion = await LiveDiscussion.create({
        title: req.body.title,
        description: req.body.description,
        topicTag: req.body.topicTag || "",
        creator: req.userID,
        participants: [{ user: req.userID }],
      });

      const populated = await LiveDiscussion.findById(discussion._id)
        .populate("creator", "firstName lastName avatarUrl")
        .select("title description topicTag participants createdAt updatedAt creator")
        .lean();

      return res.status(201).json({
        success: true,
        message: "Discussion created successfully.",
        discussion: mapDiscussion(populated, req.userID),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create discussion.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/:discussionId",
  validateParams(z.object({ discussionId: objectIdSchema })),
  async (req, res) => {
    try {
      const currentUserId = await resolveOptionalUserId(req);

      const discussion = await LiveDiscussion.findOne({
        _id: req.params.discussionId,
        isArchived: false,
      })
        .populate("creator", "firstName lastName avatarUrl")
        .populate("participants.user", "firstName lastName avatarUrl")
        .lean();

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found.",
        });
      }

      const isJoined = currentUserId
        ? discussion.participants.some(
            (entry) => String(entry.user._id || entry.user) === String(currentUserId)
          )
        : false;

      return res.status(200).json({
        success: true,
        discussion: {
          ...mapDiscussion(discussion, currentUserId),
          participants: discussion.participants.map((entry) => ({
            id: String(entry.user?._id || entry.user),
            firstName:
              entry.user && typeof entry.user === "object"
                ? entry.user.firstName || ""
                : "",
            lastName:
              entry.user && typeof entry.user === "object"
                ? entry.user.lastName || ""
                : "",
            avatarUrl:
              entry.user && typeof entry.user === "object"
                ? entry.user.avatarUrl || null
                : null,
            joinedAt: entry.joinedAt,
          })),
          isJoined,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch discussion.",
        error: error.message,
      });
    }
  }
);

router.get(
  "/:discussionId/messages",
  validateParams(z.object({ discussionId: objectIdSchema })),
  validateQuery(messagesQuerySchema),
  async (req, res) => {
    try {
      const { before, limit } = req.query;

      const filters = { discussion: req.params.discussionId };

      if (before) {
        filters.createdAt = { $lt: before };
      }

      const messages = await LiveDiscussionMessage.find(filters)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("sender", "firstName lastName avatarUrl")
        .lean();

      const ordered = messages.reverse().map((message) => mapMessage(message));

      return res.status(200).json({
        success: true,
        messages: ordered,
        hasMore: messages.length === limit,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch discussion messages.",
        error: error.message,
      });
    }
  }
);

router.post(
  "/:discussionId/join",
  userMiddleware,
  validateParams(z.object({ discussionId: objectIdSchema })),
  async (req, res) => {
    try {
      const joinFilter = {
        _id: req.params.discussionId,
        isArchived: false,
        $nor: [{ "participants.user": req.userID }],
      };

      const joinUpdate = {
        $push: { participants: { user: req.userID, joinedAt: new Date() } },
      };

      let joinedNow = false;

      let discussion = await LiveDiscussion.findOneAndUpdate(joinFilter, joinUpdate, {
        new: true,
      })
        .populate("creator", "firstName lastName avatarUrl")
        .lean();

      if (!discussion) {
        discussion = await LiveDiscussion.findOne({
          _id: req.params.discussionId,
          isArchived: false,
        })
          .populate("creator", "firstName lastName avatarUrl")
          .lean();

        if (!discussion) {
          return res.status(404).json({
            success: false,
            message: "Discussion not found.",
          });
        }
      } else {
        joinedNow = true;
      }

      const responseDiscussion = mapDiscussion(discussion, req.userID);

      return res.status(200).json({
        success: true,
        message: joinedNow
          ? "Joined discussion successfully."
          : "Already a participant.",
        discussion: responseDiscussion,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to join discussion.",
        error: error.message,
      });
    }
  }
);

router.post(
  "/:discussionId/leave",
  userMiddleware,
  validateParams(z.object({ discussionId: objectIdSchema })),
  async (req, res) => {
    try {
      const discussion = await LiveDiscussion.findOneAndUpdate(
        {
          _id: req.params.discussionId,
          isArchived: false,
        },
        { $pull: { participants: { user: req.userID } } },
        { new: true }
      )
        .populate("creator", "firstName lastName avatarUrl")
        .lean();

      if (!discussion) {
        return res.status(404).json({
          success: false,
          message: "Discussion not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Left discussion successfully.",
        discussion: mapDiscussion(discussion, req.userID),
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to leave discussion.",
        error: error.message,
      });
    }
  }
);

router.post("/socket-token", userMiddleware, async (req, res) => {
  try {
    const token = createSocketAuthToken({
      userId: req.userID,
      sessionId: req.sessionId,
    });

    return res.status(200).json({
      success: true,
      token,
      expiresIn: 300,
      userId: String(req.userID),
    });
  } catch (error) {
    const statusCode =
      error instanceof SessionError && error.statusCode ? error.statusCode : 500;
    return res.status(statusCode).json({
      success: false,
      message: "Failed to issue socket token.",
      error: error.message,
    });
  }
});

module.exports = {
  liveDiscussionsRouter: router,
  mapDiscussion,
  mapMessage,
};
