const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters long"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [5, "Description must be at least 5 characters long"],
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin", // makes it easy to populate admin info later
      required: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
      maxlength: [50, "Category cannot exceed 50 characters"],
    },
    startTime: {
      type: String,
      trim: true,
      maxlength: [20, "Time label cannot exceed 20 characters"],
    },
    capacity: {
      type: Number,
      min: [0, "Capacity cannot be negative"],
      default: 0,
    },
    attendees: {
      type: [
        {
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          name: {
            type: String,
            trim: true,
            required: true,
            maxlength: 120,
          },
          email: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            maxlength: 254,
          },
          rsvpedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

eventSchema.index({ date: 1, createdAt: -1 });
eventSchema.index({ createdAt: -1 });

const eventModel = mongoose.model("event", eventSchema);

module.exports = { eventModel };
