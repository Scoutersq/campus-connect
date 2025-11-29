const mongoose = require("mongoose");
const { Schema } = mongoose;

const studentIdSchema = new Schema(
  {
    value: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^ST([1-9]|1[0-9]|20)$/,
    },
    assignedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const studentIdModel = mongoose.model("StudentId", studentIdSchema, "studentIds");

module.exports = {
  studentIdModel,
};
