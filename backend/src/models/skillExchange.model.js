const mongoose = require("mongoose");
const { Schema } = mongoose;

const availabilitySlotSchema = new Schema(
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
      required: true,
      lowercase: true,
      trim: true,
    },
    from: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    to: {
      type: String,
      required: true,
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
  },
  { _id: false }
);

const skillExchangeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    skillName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    proficiency: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "expert"],
      default: "intermediate",
    },
    experienceYears: {
      type: Number,
      min: 0,
      max: 60,
      default: 0,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 280,
    },
    detailedDescription: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    deliveryModes: {
      type: [String],
      enum: ["online", "in-person", "hybrid"],
      default: ["online"],
    },
    availability: {
      timezone: {
        type: String,
        trim: true,
        maxlength: 60,
        default: "UTC",
      },
      slots: {
        type: [availabilitySlotSchema],
        default: [],
        validate: {
          validator(value) {
            return value.length <= 14;
          },
          message: "You can provide up to 14 availability slots.",
        },
      },
    },
    tags: {
      type: [String],
      default: [],
      set: (values = []) =>
        values.map((value) => value.trim().toLowerCase()).slice(0, 10),
    },
    preferredLanguages: {
      type: [String],
      default: [],
      set: (values = []) =>
        values.map((value) => value.trim()).filter(Boolean).slice(0, 5),
    },
    mode: {
      type: String,
      enum: ["teach", "learn", "both"],
      default: "teach",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified"],
      default: "unverified",
    },
  },
  { timestamps: true }
);

skillExchangeSchema.index({ user: 1, skillName: 1, mode: 1 }, { unique: true });
skillExchangeSchema.index({ skillName: 1, proficiency: 1, isActive: 1 });

const skillExchangeModel = mongoose.model(
  "SkillExchange",
  skillExchangeSchema,
  "skills_exchange"
);

module.exports = {
  skillExchangeModel,
};
