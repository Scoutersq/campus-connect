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
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const eventModel = mongoose.model("event", eventSchema);

module.exports = { eventModel };
