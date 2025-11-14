const mongoose = require("mongoose");
const { Schema } = mongoose;

const preferredSlotSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      lowercase: true,
      trim: true,
    },
    from: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    to: {
      type: String,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
  },
  { _id: false }
);

const skillApplicationSchema = new Schema(
  {
    skill: {
      type: Schema.Types.ObjectId,
      ref: "SkillExchange",
      required: true,
      index: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    applicant: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    preferredMode: {
      type: String,
      enum: ["online", "in-person", "hybrid"],
      default: "online",
    },
    preferredSlot: preferredSlotSchema,
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
      index: true,
    },
    respondedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

skillApplicationSchema.index(
  { applicant: 1, skill: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);
skillApplicationSchema.index({ mentor: 1, status: 1 });

const skillApplicationModel = mongoose.model(
  "SkillApplication",
  skillApplicationSchema,
  "skill_applications"
);

module.exports = {
  skillApplicationModel,
};
