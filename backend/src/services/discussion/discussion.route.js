const { Router } = require("express");
const mongoose = require("mongoose");
const { z } = require("zod");
const { postModelSchema } = require("../../models/discussion.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const {
  validateBody,
  validateQuery,
  validateParams,
} = require("../../utils/validation.js");

const postsRouter = Router();
const commentsRouter = Router();

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

const updatePostSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    content: z.string().trim().min(1).optional(),
    tags: z
      .array(z.string().trim().min(1).max(50))
      .max(10)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the post.",
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

postsRouter.post(
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

postsRouter.put(
  "/:postId",
  userMiddleware,
  validateParams(z.object({ postId: objectIdSchema })),
  validateBody(updatePostSchema),
  async (req, res) => {
    try {
      const fieldsToUpdate = {};

      if (req.body.title !== undefined) {
        fieldsToUpdate.title = req.body.title;
      }

      if (req.body.content !== undefined) {
        fieldsToUpdate.content = req.body.content;
      }

      if (req.body.tags !== undefined) {
        fieldsToUpdate.tags = Array.from(new Set(req.body.tags));
      }

      fieldsToUpdate.updatedAt = new Date();

      const updated = await postModelSchema
        .findOneAndUpdate(
          { _id: req.params.postId, author: req.userID, isDeleted: false },
          { $set: fieldsToUpdate },
          { new: true }
        )
        .populate("author", "firstName lastName email avatarUrl")
        .lean();

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: "Post not found or you are not authorized to update it.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Post updated successfully.",
        post: {
          ...updated,
          likesCount: updated.likes?.length || 0,
          commentsCount: updated.comments?.length || 0,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to update post.",
        error: error.message,
      });
    }
  }
);

postsRouter.delete(
  "/:postId",
  userMiddleware,
  validateParams(z.object({ postId: objectIdSchema })),
  async (req, res) => {
    try {
      const deleted = await postModelSchema.findOneAndUpdate(
        { _id: req.params.postId, author: req.userID, isDeleted: false },
        { $set: { isDeleted: true, updatedAt: new Date() } },
        { new: true }
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Post not found or you are not authorized to delete it.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Post deleted successfully.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete post.",
        error: error.message,
      });
    }
  }
);

postsRouter.get(
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

postsRouter.get(
  "/:postId/likes",
  validateParams(z.object({ postId: objectIdSchema })),
  async (req, res) => {
    try {
      const post = await postModelSchema
        .findOne({ _id: req.params.postId, isDeleted: false })
        .populate("likes", "firstName lastName email avatarUrl")
        .select("likes")
        .lean();

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found.",
        });
      }

      return res.status(200).json({
        success: true,
        likesCount: post.likes?.length || 0,
        likes: post.likes || [],
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch likes.",
        error: error.message,
      });
    }
  }
);

postsRouter.get(
  "/:postId/comments",
  validateParams(z.object({ postId: objectIdSchema })),
  async (req, res) => {
    try {
      const post = await postModelSchema
        .findOne({ _id: req.params.postId, isDeleted: false })
        .populate("comments.user", "firstName lastName email avatarUrl")
        .select("comments")
        .lean();

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found.",
        });
      }

      const comments = (post.comments || []).map((comment) => ({
        ...comment,
        likesCount: comment.likes?.length || 0,
      }));

      return res.status(200).json({
        success: true,
        commentsCount: comments.length,
        comments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch comments.",
        error: error.message,
      });
    }
  }
);

postsRouter.get(
  "/:postId",
  validateParams(z.object({ postId: objectIdSchema })),
  async (req, res) => {
    try {
      const post = await postModelSchema
        .findOne({ _id: req.params.postId, isDeleted: false })
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

postsRouter.post(
  "/:postId/comments",
  userMiddleware,
  validateParams(z.object({ postId: objectIdSchema })),
  validateBody(commentBodySchema),
  async (req, res) => {
    try {
      const post = await postModelSchema
        .findOne({ _id: req.params.postId, isDeleted: false })
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
      const serialized = latestComment.toObject();

      return res.status(201).json({
        success: true,
        message: "Comment added successfully.",
        comment: {
          ...serialized,
          likesCount: serialized.likes?.length || 0,
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

postsRouter.post(
  "/:postId/like",
  userMiddleware,
  validateParams(z.object({ postId: objectIdSchema })),
  async (req, res) => {
    try {
      const post = await postModelSchema.findOne({
        _id: req.params.postId,
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

postsRouter.post(
  "/:postId/comments/:commentId/like",
  userMiddleware,
  validateParams(
    z.object({ postId: objectIdSchema, commentId: objectIdSchema })
  ),
  async (req, res) => {
    try {
      const post = await postModelSchema.findOne({
        _id: req.params.postId,
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

      const alreadyLiked = comment.likes.some((userId) =>
        userId.equals(req.userID)
      );

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

commentsRouter.delete(
  "/:commentId",
  userMiddleware,
  validateParams(z.object({ commentId: objectIdSchema })),
  async (req, res) => {
    try {
      const post = await postModelSchema.findOne({
        "comments._id": req.params.commentId,
        isDeleted: false,
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

      const isPostOwner = post.author.equals(req.userID);
      const isCommentOwner = comment.user.equals(req.userID);

      if (!isPostOwner && !isCommentOwner) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to delete this comment.",
        });
      }

      comment.deleteOne();
      post.updatedAt = new Date();
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Comment deleted successfully.",
        commentsCount: post.comments.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete comment.",
        error: error.message,
      });
    }
  }
);

module.exports = {
  postsRouter,
  commentsRouter,
};
