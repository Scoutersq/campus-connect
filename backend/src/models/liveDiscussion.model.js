const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const liveDiscussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    topicTag: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

liveDiscussionSchema.index({ createdAt: -1 });
liveDiscussionSchema.index({ topicTag: 1 });
liveDiscussionSchema.index({ "participants.user": 1 });

const liveDiscussionMessageSchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LiveDiscussion",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

liveDiscussionMessageSchema.index({ discussion: 1, createdAt: -1 });

const LiveDiscussion = mongoose.model("LiveDiscussion", liveDiscussionSchema);
const LiveDiscussionMessage = mongoose.model(
  "LiveDiscussionMessage",
  liveDiscussionMessageSchema
);

module.exports = {
  LiveDiscussion,
  LiveDiscussionMessage,
};
