const { adminCodeModel } = require("../models/adminCode.model.js");

// Only allow a single admin code.
const allowedAdminCodes = ["ADM10"];

const normalizeAdminCode = (value = "") => value.trim().toUpperCase();

async function ensureAdminCodes() {
  const operations = allowedAdminCodes.map((value) => ({
    updateOne: {
      filter: { value },
      update: {
        $setOnInsert: { value, assignedAdmin: null, assignedAt: null },
      },
      upsert: true,
    },
  }));

  if (operations.length === 0) {
    return;
  }

  await adminCodeModel.bulkWrite(operations, { ordered: false });
  // Remove any codes that are no longer allowed to keep the DB clean.
  await adminCodeModel.deleteMany({ value: { $nin: allowedAdminCodes } });
}

module.exports = {
  allowedAdminCodes,
  ensureAdminCodes,
  normalizeAdminCode,
};
