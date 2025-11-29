const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminCodeSchema = new Schema(
  {
    value: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^ADM([1-9]|1[0-9]|20)$/,
    },
    assignedAdmin: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
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

const adminCodeModel = mongoose.model("AdminCode", adminCodeSchema, "adminCodes");

module.exports = {
  adminCodeModel,
};
