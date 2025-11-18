const { skillExchangeModel } = require("../../models/skillExchange.model.js");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const MAX_CATALOG_LIMIT = 200;

const buildMentorFilters = ({ skill, category, proficiency, language, tag }) => {
  const filters = { isActive: true, mode: { $in: ["teach", "both"] } };

  if (skill) {
    filters.skillName = { $regex: skill, $options: "i" };
  }

  if (category) {
    filters.category = { $regex: `^${category}$`, $options: "i" };
  }

  if (proficiency) {
    filters.proficiency = proficiency;
  }

  if (language) {
    filters.preferredLanguages = { $regex: new RegExp(language, "i") };
  }

  if (tag) {
    filters.tags = { $in: [tag.toLowerCase()] };
  }

  return filters;
};

const sortMentors = (mentors, sortBy) => {
  const sorters = {
    recent: (a, b) =>
      new Date(b.stats.lastUpdated).getTime() -
      new Date(a.stats.lastUpdated).getTime(),
    experience: (a, b) => b.stats.totalExperience - a.stats.totalExperience,
    name: (a, b) => {
      const nameA = `${a.mentor.firstName ?? ""} ${a.mentor.lastName ?? ""}`
        .trim()
        .toLowerCase();
      const nameB = `${b.mentor.firstName ?? ""} ${b.mentor.lastName ?? ""}`
        .trim()
        .toLowerCase();
      return nameA.localeCompare(nameB);
    },
  };

  mentors.sort(sorters[sortBy] || sorters.recent);
};

async function listMentors(query = {}) {
  const page = Number(query.page) > 0 ? Number(query.page) : DEFAULT_PAGE;
  const rawLimit = Number(query.limit) || DEFAULT_LIMIT;
  const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT);
  const start = (page - 1) * limit;

  const entries = await skillExchangeModel
    .find(buildMentorFilters(query))
    .sort({ updatedAt: -1 })
    .populate("user", "firstName lastName avatarUrl email")
    .lean();

  const mentorMap = new Map();

  entries.forEach((entry) => {
    if (!entry?.user?._id) {
      return;
    }

    const mentorId = entry.user._id.toString();
    const stored = mentorMap.get(mentorId) || {
      mentor: {
        id: entry.user._id,
        firstName: entry.user.firstName,
        lastName: entry.user.lastName,
        avatarUrl: entry.user.avatarUrl,
        email: entry.user.email,
      },
      stats: {
        totalExperience: 0,
        totalSkills: 0,
        categories: new Set(),
        tags: new Set(),
        preferredLanguages: new Set(),
        lastUpdated: entry.updatedAt || entry.createdAt || new Date(),
      },
      skills: [],
    };

    stored.stats.totalExperience += entry.experienceYears || 0;
    stored.stats.totalSkills += 1;
    stored.stats.lastUpdated = new Date(
      Math.max(
        stored.stats.lastUpdated instanceof Date
          ? stored.stats.lastUpdated.getTime()
          : new Date(stored.stats.lastUpdated).getTime(),
        (entry.updatedAt || entry.createdAt || new Date()).getTime()
      )
    );

    if (entry.category) {
      stored.stats.categories.add(entry.category);
    }

    (entry.tags || []).forEach((value) => stored.stats.tags.add(value));
    (entry.preferredLanguages || []).forEach((value) =>
      stored.stats.preferredLanguages.add(value)
    );

    stored.skills.push({
      id: entry._id,
      name: entry.skillName,
      category: entry.category,
      proficiency: entry.proficiency,
      experienceYears: entry.experienceYears,
      deliveryModes: entry.deliveryModes,
      shortDescription: entry.shortDescription,
      availability: entry.availability,
      tags: entry.tags || [],
      preferredLanguages: entry.preferredLanguages || [],
      mode: entry.mode,
    });

    mentorMap.set(mentorId, stored);
  });

  const mentors = Array.from(mentorMap.values()).map((entry) => ({
    mentor: entry.mentor,
    stats: {
      totalExperience: entry.stats.totalExperience,
      totalSkills: entry.stats.totalSkills,
      categories: Array.from(entry.stats.categories),
      tags: Array.from(entry.stats.tags),
      preferredLanguages: Array.from(entry.stats.preferredLanguages),
      lastUpdated: entry.stats.lastUpdated,
    },
    skills: entry.skills,
  }));

  sortMentors(mentors, query.sortBy);

  const paginated = mentors.slice(start, start + limit);

  return {
    data: paginated,
    meta: {
      total: mentors.length,
      page,
      limit,
      totalPages: Math.ceil(mentors.length / limit) || 1,
      hasNext: start + paginated.length < mentors.length,
    },
  };
}

async function listSkillsCatalog(query = {}) {
  const limit = Math.min(
    Math.max(Number(query.limit) || MAX_CATALOG_LIMIT, 1),
    MAX_CATALOG_LIMIT
  );

  const filters = { isActive: true };

  if (query.category) {
    filters.category = { $regex: `^${query.category}$`, $options: "i" };
  }

  if (query.mode) {
    filters.mode = query.mode;
  }

  if (query.q) {
    filters.$or = [
      { skillName: { $regex: query.q, $options: "i" } },
      { tags: { $in: [query.q.toLowerCase()] } },
      { category: { $regex: query.q, $options: "i" } },
    ];
  }

  const rawSkills = await skillExchangeModel
    .aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$skillName",
          categories: { $addToSet: "$category" },
          tags: { $push: "$tags" },
          modes: { $addToSet: "$mode" },
          proficiencyLevels: { $addToSet: "$proficiency" },
          listings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: limit },
    ])
    .exec();

  const skills = rawSkills.map((entry) => ({
    name: entry._id,
    categories: (entry.categories || []).filter(Boolean),
    tags: Array.from(new Set((entry.tags || []).flat().filter(Boolean))),
    modes: entry.modes || [],
    proficiencyLevels: entry.proficiencyLevels || [],
    listings: entry.listings || 0,
  }));

  return {
    data: skills,
    meta: {
      total: skills.length,
    },
  };
}

module.exports = {
  listMentors,
  listSkillsCatalog,
};
