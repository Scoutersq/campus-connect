const mongoose = require("mongoose");
const { Schema } = mongoose;

const emergencyAlertSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 140,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
      index: true,
    },
    category: {
      type: String,
      enum: ["weather", "security", "health", "infrastructure", "other"],
      default: "other",
    },
    audience: {
      type: String,
      enum: ["all", "students", "faculty"],
      default: "all",
      index: true,
    },
    deliveryChannels: {
      type: [String],
      enum: ["in-app", "push", "email", "sms"],
      default: ["in-app"],
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    acknowledgedBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    metadata: {
      location: {
        type: String,
        trim: true,
        maxlength: 120,
      },
      attachments: {
        type: [String],
        default: [],
      },
    },
  },
  { timestamps: true }
);

emergencyAlertSchema.index({ expiresAt: 1 }, { sparse: true });

const emergencyAlertModel = mongoose.model(
  "EmergencyAlert",
  emergencyAlertSchema,
  "emergency_alerts"
);

module.exports = {
  emergencyAlertModel,
};
