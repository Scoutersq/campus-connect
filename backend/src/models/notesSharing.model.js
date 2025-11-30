const mongoose = require("mongoose");

const noteSharingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [80, "Subject cannot exceed 80 characters"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
      trim: true,
    },
    storageName: {
      type: String,
      required: [true, "Stored file name is required"],
    },
    fileName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
      maxlength: [240, "File name is too long"],
    },
    fileType: {
      type: String,
      required: [true, "File type is required"],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, "File size is required"],
      min: [1, "File size must be greater than zero"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloads: {
      type: Number,
      default: 0,
      min: 0,
    },
    upvotedBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

noteSharingSchema.index({ createdAt: -1 });
noteSharingSchema.index({ subject: 1, createdAt: -1 });

const noteSharingModel = mongoose.model("note", noteSharingSchema);

module.exports = { noteSharingModel };
