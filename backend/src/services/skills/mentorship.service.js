const { skillApplicationModel } = require("../../models/skillApplication.model.js");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const buildRequestFilters = ({ role, status }, userId) => {
  const filters = role === "mentor" ? { mentor: userId } : { applicant: userId };

  if (status) {
    filters.status = status;
  }

  return filters;
};

async function listRequests(userId, query = {}) {
  const page = Number(query.page) > 0 ? Number(query.page) : DEFAULT_PAGE;
  const rawLimit = Number(query.limit) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filters = buildRequestFilters(query, userId);

  const [requests, total] = await Promise.all([
    skillApplicationModel
      .find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("skill", "skillName category proficiency deliveryModes mode")
      .populate("mentor", "firstName lastName avatarUrl")
      .populate("applicant", "firstName lastName avatarUrl")
      .lean(),
    skillApplicationModel.countDocuments(filters),
  ]);

  return {
    data: requests,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: skip + requests.length < total,
    },
  };
}

async function updateRequestStatus(userId, requestId, action) {
  const application = await skillApplicationModel.findById(requestId);

  if (!application) {
    const error = new Error("Mentorship request not found.");
    error.statusCode = 404;
    throw error;
  }

  const isMentor = application.mentor?.toString() === userId;
  const isApplicant = application.applicant?.toString() === userId;

  if (action === "cancel") {
    if (!isApplicant) {
      const error = new Error("Only the applicant can cancel this request.");
      error.statusCode = 403;
      throw error;
    }

    if (application.status !== "pending") {
      const error = new Error("Only pending requests can be cancelled.");
      error.statusCode = 400;
      throw error;
    }

    application.status = "cancelled";
    application.respondedAt = new Date();
  } else {
    if (!isMentor) {
      const error = new Error("Only the mentor can update this request.");
      error.statusCode = 403;
      throw error;
    }

    if (application.status !== "pending") {
      const error = new Error("Request has already been handled.");
      error.statusCode = 400;
      throw error;
    }

    application.status = action === "accept" ? "accepted" : "declined";
    application.respondedAt = new Date();
  }

  await application.save();

  return application
    .populate("skill", "skillName category proficiency deliveryModes mode")
    .populate("mentor", "firstName lastName avatarUrl")
    .populate("applicant", "firstName lastName avatarUrl");
}

module.exports = {
  listRequests,
  updateRequestStatus,
};
