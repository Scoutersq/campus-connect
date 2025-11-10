const { Router } = require("express");
const { postModelSchema } = require("../models/discussion.model");
const { userMiddleware } = require("../middlewares/user.middleware.js");

const discussionRouter = Router();

discussionRouter.post("/create", userMiddleware, async (req, res) => {
  try {
    const { title, content, tags = [] } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Both title and content are required.",
      });
    }

    const post = await postModelSchema.create({
      title: title.trim(),
      content: content.trim(),
      tags: Array.isArray(tags) ? tags.map((tag) => tag.trim()).filter(Boolean) : [],
      author: req.userID,
    });

    const populated = await postModelSchema
      .findById(post._id)
      .populate("author", "firstName lastName email")
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
});

discussionRouter.get("/", async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const { tag, search, author } = req.query;
    const filters = { isDeleted: false };

    if (tag) {
      const tags = Array.isArray(tag) ? tag : tag.split(",");
      filters.tags = { $in: tags.map((item) => item.trim()).filter(Boolean) };
    }

    if (author) {
      filters.author = author.trim();
    }

    if (search) {
      filters.$text = { $search: search.trim() };
    }

    const [posts, total] = await Promise.all([
      postModelSchema
        .find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "firstName lastName email")
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
});

discussionRouter.get("/:id", async (req, res) => {
  try {
    const post = await postModelSchema
      .findOne({ _id: req.params.id, isDeleted: false })
      .populate("author", "firstName lastName email")
      .populate("comments.user", "firstName lastName email")
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
});

discussionRouter.post("/:id/comments", userMiddleware, async (req, res) => {
  try {
    const text = req.body?.text?.trim();

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required.",
      });
    }

    const post = await postModelSchema
      .findOne({ _id: req.params.id, isDeleted: false })
      .populate("comments.user", "firstName lastName email");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    post.comments.push({ user: req.userID, text });
    post.updatedAt = new Date();
    await post.save();
    await post.populate("comments.user", "firstName lastName email");

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
});

discussionRouter.post("/:id/like", userMiddleware, async (req, res) => {
  try {
    const post = await postModelSchema.findOne({ _id: req.params.id, isDeleted: false });

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
});

discussionRouter.post(
  "/:id/comments/:commentId/like",
  userMiddleware,
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