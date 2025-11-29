const { adminCodeModel } = require("../models/adminCode.model.js");

const allowedAdminCodes = Array.from({ length: 20 }, (_, index) => `ADM${index + 1}`);

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
}

module.exports = {
  allowedAdminCodes,
  ensureAdminCodes,
  normalizeAdminCode,
};
