const { skillExchangeModel } = require("../../models/skillExchange.model.js");
const { skillApplicationModel } = require("../../models/skillApplication.model.js");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

const sanitizeList = (list = []) =>
  [...new Set(list.map((entry) => (entry || "").trim()).filter(Boolean))];

const buildSkillFilters = ({
  search,
  category,
  mode,
  proficiency,
  availabilityDay,
}) => {
  const filters = { isActive: true };

  if (search) {
    filters.$or = [
      { skillName: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
      { tags: { $in: [search.toLowerCase()] } },
    ];
  }

  if (category) {
    filters.category = { $regex: `^${category}$`, $options: "i" };
  }

  if (mode) {
    filters.mode = mode;
  }

  if (proficiency) {
    filters.proficiency = proficiency;
  }

  if (availabilityDay) {
    filters["availability.slots"] = {
      $elemMatch: { dayOfWeek: availabilityDay.toLowerCase() },
    };
  }

  return filters;
};

const buildSort = (sortBy) => {
  const sortMap = {
    recent: { updatedAt: -1 },
    experience: { experienceYears: -1 },
    name: { skillName: 1 },
  };

  return sortMap[sortBy] || sortMap.recent;
};

async function listSkills(query = {}) {
  const page = Number(query.page) > 0 ? Number(query.page) : DEFAULT_PAGE;
  const rawLimit = Number(query.limit) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filters = buildSkillFilters(query);

  const [skills, total] = await Promise.all([
    skillExchangeModel
      .find(filters)
      .sort(buildSort(query.sortBy))
      .skip(skip)
      .limit(limit)
      .select("-__v")
      .populate("user", "firstName lastName avatarUrl"),
    skillExchangeModel.countDocuments(filters),
  ]);

  return {
    data: skills,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: skip + skills.length < total,
    },
  };
}

async function upsertSkill(userId, payload) {
  const toSave = {
    user: userId,
    skillName: payload.skillName.trim(),
    category: payload.category,
    proficiency: payload.proficiency,
    experienceYears: payload.experienceYears,
    shortDescription: payload.shortDescription,
    detailedDescription: payload.detailedDescription,
    deliveryModes: payload.deliveryModes,
    availability: payload.availability,
    tags: sanitizeList(payload.tags).map((tag) => tag.toLowerCase()),
    preferredLanguages: sanitizeList(payload.preferredLanguages),
    mode: payload.mode,
    isActive: payload.isActive,
  };

  return skillExchangeModel.findOneAndUpdate(
    { user: userId, skillName: toSave.skillName, mode: toSave.mode },
    { $set: toSave },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

async function applyForSkill(userId, skillId, payload) {
  const skill = await skillExchangeModel.findById(skillId).lean();

  if (!skill || !skill.isActive) {
    const error = new Error("Skill not found or inactive.");
    error.statusCode = 404;
    throw error;
  }

  if (skill.user?.toString() === userId) {
    const error = new Error("You cannot apply to your own skill offering.");
    error.statusCode = 400;
    throw error;
  }

  if (skill.mode === "learn") {
    const error = new Error("This listing is not accepting learners.");
    error.statusCode = 400;
    throw error;
  }

  if (payload.preferredMode && !skill.deliveryModes?.includes(payload.preferredMode)) {
    const error = new Error("Preferred mode is not offered for this skill.");
    error.statusCode = 400;
    throw error;
  }

  const existingPending = await skillApplicationModel.findOne({
    skill: skill._id,
    applicant: userId,
    status: "pending",
  });

  if (existingPending) {
    const error = new Error("You already have a pending application for this skill.");
    error.statusCode = 409;
    throw error;
  }

  const application = await skillApplicationModel.create({
    skill: skill._id,
    mentor: skill.user,
    applicant: userId,
    message: payload.message,
    preferredMode: payload.preferredMode || skill.deliveryModes?.[0] || "online",
    preferredSlot: payload.preferredSlot,
  });

  return application;
}

module.exports = {
  listSkills,
  upsertSkill,
  applyForSkill,
};
