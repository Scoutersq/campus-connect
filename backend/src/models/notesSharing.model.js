const mongoose = require("mongoose");

const noteSharingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
      maxlength: [50, "Title cannot exceed 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters long"],
      maxlength: [200, "Description cannot exceed 200 characters"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const noteSharingModel = mongoose.model("note", noteSharingSchema);

module.exports = { noteSharingModel };
