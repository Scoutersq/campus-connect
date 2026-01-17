const { studentIdModel } = require("../models/studentId.model.js");

const allowedStudentIds = Array.from({ length: 100 }, (_, index) => `ST${index + 1}`);

const normalizeStudentId = (value = "") => value.trim().toUpperCase();

async function ensureStudentIds() {
  const operations = allowedStudentIds.map((value) => ({
    updateOne: {
      filter: { value },
      update: {
        $setOnInsert: { value, assignedUser: null, assignedAt: null },
      },
      upsert: true,
    },
  }));

  if (operations.length === 0) {
    return;
  }

  await studentIdModel.bulkWrite(operations, { ordered: false });
  // Remove any IDs outside the allowed range to keep the collection clean.
  await studentIdModel.deleteMany({ value: { $nin: allowedStudentIds } });
}

module.exports = {
  allowedStudentIds,
  ensureStudentIds,
  normalizeStudentId,
};
