const { Router } = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const { postModelSchema } = require("../models/discussion.model.js");
const { userMiddleware } = require("../middlewares/user.middleware.js");
const {
  validateBody,
  validateQuery,
  validateParams,
} = require("../utils/validation.js");

const discussionRouter = Router();

const objectIdSchema = z
  .string()
  .trim()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid identifier provided.",
  });

const createPostSchema = z.object({
  title: z.string().trim().min(3).max(120),
  content: z.string().trim().min(1),
  tags: z
    .array(z.string().trim().min(1).max(50))
    .max(10)
    .optional()
    .default([]),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  tag: z.string().trim().optional(),
  search: z.string().trim().max(120).optional(),
  author: objectIdSchema.optional(),
});

const commentBodySchema = z.object({
  text: z.string().trim().min(1).max(500),
});

discussionRouter.post(
  "/create",
  userMiddleware,
  validateBody(createPostSchema),
  async (req, res) => {
    try {
      const uniqueTags = Array.from(new Set(req.body.tags));

      const post = await postModelSchema.create({
        title: req.body.title,
        content: req.body.content,
        tags: uniqueTags,
        author: req.userID,
      });

      const populated = await postModelSchema
        .findById(post._id)
        .populate("author", "firstName lastName email avatarUrl")
        .lean();

      return res.status(201).json({
        success: true,
        message: "Post created successfully.",
        post: {
          ...populated,
          likesCount: populated.likes?.length || 0,
          commentsCount: populated.comments?.length || 0,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to create post.",
        error: error.message,
      });
    }
  }
);

discussionRouter.get(
  "/",
  validateQuery(listQuerySchema),
  async (req, res) => {
    try {
      const { page, limit, tag, search, author } = req.query;
      const skip = (page - 1) * limit;

      const filters = { isDeleted: false };

      if (tag) {
        const tags = tag
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        if (tags.length) {
          filters.tags = { $in: tags };
        }
      }

      if (author) {
        filters.author = author;
      }

      if (search) {
        filters.$text = { $search: search };
      }

      const [posts, total] = await Promise.all([
        postModelSchema
          .find(filters)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("author", "firstName lastName email avatarUrl")
          .lean(),
        postModelSchema.countDocuments(filters),
      ]);

      const transformed = posts.map((post) => ({
        ...post,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
      }));

      return res.status(200).json({
        success: true,
        total,
        page,
        pages: Math.ceil(total / limit),
        posts: transformed,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch posts.",
        error: error.message,
      });
    }
  }
);

discussionRouter.get(
  "/:id",
  validateParams(z.object({ id: objectIdSchema })),
  async (req, res) => {
    try {
      const post = await postModelSchema
        .findOne({ _id: req.params.id, isDeleted: false })
        .populate("author", "firstName lastName email avatarUrl")
        .populate("comments.user", "firstName lastName email avatarUrl")
        .lean();

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found.",
        });
      }

      return res.status(200).json({
        success: true,
        post: {
          ...post,
          likesCount: post.likes?.length || 0,
          commentsCount: post.comments?.length || 0,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch post.",
        error: error.message,
      });
    }
  }
);

discussionRouter.post(
  "/:id/comments",
  userMiddleware,
  validateParams(z.object({ id: objectIdSchema })),
  validateBody(commentBodySchema),
  async (req, res) => {
    try {
      const post = await postModelSchema
        .findOne({ _id: req.params.id, isDeleted: false })
        .populate("comments.user", "firstName lastName email avatarUrl");

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found.",
        });
      }

      post.comments.push({ user: req.userID, text: req.body.text });
      post.updatedAt = new Date();
      await post.save();
      await post.populate("comments.user", "firstName lastName email avatarUrl");

      const latestComment = post.comments[post.comments.length - 1];

      return res.status(201).json({
        success: true,
        message: "Comment added successfully.",
        comment: {
          ...latestComment.toObject(),
          likesCount: latestComment.likes?.length || 0,
        },
        commentsCount: post.comments.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to add comment.",
        error: error.message,
      });
    }
  }
);

discussionRouter.post(
  "/:id/like",
  userMiddleware,
  validateParams(z.object({ id: objectIdSchema })),
  async (req, res) => {
    try {
      const post = await postModelSchema.findOne({
        _id: req.params.id,
        isDeleted: false,
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found.",
        });
      }

      const alreadyLiked = post.likes.some((userId) => userId.equals(req.userID));

      if (alreadyLiked) {
        post.likes.pull(req.userID);
      } else {
        post.likes.push(req.userID);
      }

      post.updatedAt = new Date();
      await post.save();

      return res.status(200).json({
        success: true,
        liked: !alreadyLiked,
        likesCount: post.likes.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update like state.",
        error: error.message,
      });
    }
  }
);

discussionRouter.post(
  "/:id/comments/:commentId/like",
  userMiddleware,
  validateParams(z.object({ id: objectIdSchema, commentId: objectIdSchema })),
  async (req, res) => {
    try {
      const post = await postModelSchema.findOne({
        _id: req.params.id,
        isDeleted: false,
        "comments._id": req.params.commentId,
      });

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Comment not found.",
        });
      }

      const comment = post.comments.id(req.params.commentId);

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found.",
        });
      }

      const alreadyLiked = comment.likes.some((userId) => userId.equals(req.userID));

      // Toggle like state for the comment while keeping ownership intact.
      if (alreadyLiked) {
        comment.likes.pull(req.userID);
      } else {
        comment.likes.push(req.userID);
      }

      post.updatedAt = new Date();
      await post.save();

      return res.status(200).json({
        success: true,
        liked: !alreadyLiked,
        likesCount: comment.likes.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update comment like state.",
        error: error.message,
      });
    }
  }
);

module.exports = {
  discussionRouter,
};