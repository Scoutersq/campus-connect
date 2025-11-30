const mongoose = require("mongoose");

// Comment subdocument schema
const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // users who liked the comment
  },
  { _id: true }
);

// Main post schema
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    content: {
      type: String,
      required: [true, "Post content is required"],
      trim: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tags: {
      type: [String],
      default: [],
      index: true, // helps in searching/filtering posts by tags
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    comments: [commentSchema], // embedded subdocuments

    isPinned: {
      type: Boolean,
      default: false, // for admins to pin important posts
    },

    isDeleted: {
      type: Boolean,
      default: false, // soft delete, for moderation
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // auto-manages createdAt and updatedAt
);

// Add text index for better search functionality
postSchema.index({ title: "text", content: "text" });
postSchema.index({ createdAt: -1 });
postSchema.index({ isDeleted: 1, createdAt: -1 });

// Pre-hook to update timestamp before save
postSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const postModelSchema = mongoose.model("post",postSchema);
module.exports = {
    postModelSchema:postModelSchema
}
