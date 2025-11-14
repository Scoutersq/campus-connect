const { Router } = require("express");
const { z } = require("zod");
const { skillExchangeModel } = require("../../models/skillExchange.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { validateBody, validateQuery, validateParams } = require("../../utils/validation.js");
const { skillApplicationModel } = require("../../models/skillApplication.model.js");

const skillsExchangeRouter = Router();

const availabilitySlotSchema = z.object({
  dayOfWeek: z
    .enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
    .transform((value) => value.toLowerCase()),
  from: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h) format for 'from'."),
  to: z
    .string()
    .trim()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h) format for 'to'."),
});

const skillSubmissionSchema = z.object({
  skillName: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80).optional(),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
  shortDescription: z.string().trim().min(10).max(280).optional(),
  detailedDescription: z.string().trim().min(20).max(2000).optional(),
  deliveryModes: z.array(z.enum(["online", "in-person", "hybrid"])).min(1).max(3).default(["online"]),
  availability: z.object({timezone: z.string().trim().min(2).max(60).default("UTC"),slots: z.array(availabilitySlotSchema).max(14).default([]),}).default({ timezone: "UTC", slots: [] }),
  tags: z.array(z.string().trim().min(2).max(40)).max(10).optional().default([]),
  preferredLanguages: z.array(z.string().trim().min(2).max(40)).max(5).optional().default([]),
  mode: z.enum(["teach", "learn", "both"]).default("teach"),
  isActive: z.boolean().optional().default(true),
});

const skillsQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  mode: z.enum(["teach", "learn", "both"]).optional(),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  availabilityDay: z
    .enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["recent", "experience", "name"]).default("recent"),
});

const skillIdParamsSchema = z.object({
  skillId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/i, "Invalid skill id."),
});

const skillApplicationSchema = z.object({
  message: z.string().trim().min(10).max(500).optional(),
  preferredMode: z.enum(["online", "in-person", "hybrid"]).optional(),
  preferredSlot: availabilitySlotSchema.optional(),
});

const sanitizeList = (list = []) =>
  [...new Set(list.map((entry) => entry.trim()).filter(Boolean))];

skillsExchangeRouter.get(
  "/",
  userMiddleware,
  validateQuery(skillsQuerySchema),
  async (req, res) => {
    try {
      const {
        search,
        category,
        mode,
        proficiency,
        availabilityDay,
        page,
        limit,
        sortBy,
      } = req.query;

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

      const sortMap = {
        recent: { updatedAt: -1 },
        experience: { experienceYears: -1 },
        name: { skillName: 1 },
      };

      const skip = (page - 1) * limit;

      const [skills, total] = await Promise.all([
        skillExchangeModel
          .find(filters)
          .sort(sortMap[sortBy] || sortMap.recent)
          .skip(skip)
          .limit(limit)
          .select("-__v")
          .populate("user", "firstName lastName avatarUrl"),
        skillExchangeModel.countDocuments(filters),
      ]);

      return res.status(200).json({
        success: true,
        data: skills,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasNext: skip + skills.length < total,
        },
      });
    } catch (error) {
      console.error("Error fetching skills:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch skills.",
      });
    }
  }
);

skillsExchangeRouter.post(
  "/teach",
  userMiddleware,
  validateBody(skillSubmissionSchema),
  async (req, res) => {
    try {
      const payload = {
        user: req.userID,
        skillName: req.body.skillName.trim(),
        category: req.body.category,
        proficiency: req.body.proficiency,
        experienceYears: req.body.experienceYears,
        shortDescription: req.body.shortDescription,
        detailedDescription: req.body.detailedDescription,
        deliveryModes: req.body.deliveryModes,
        availability: req.body.availability,
        tags: sanitizeList(req.body.tags).map((tag) => tag.toLowerCase()),
        preferredLanguages: sanitizeList(req.body.preferredLanguages),
        mode: req.body.mode,
        isActive: req.body.isActive,
      };

      const upsertedSkill = await skillExchangeModel.findOneAndUpdate(
        { user: req.userID, skillName: payload.skillName, mode: payload.mode },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      return res.status(201).json({
        success: true,
        message: "Skill saved successfully.",
        data: upsertedSkill,
      });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "You have already published this skill in the selected mode.",
        });
      }

      console.error("Error saving skill exchange entry:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

skillsExchangeRouter.post(
  "/:skillId/apply",
  userMiddleware,
  validateParams(skillIdParamsSchema),
  validateBody(skillApplicationSchema),
  async (req, res) => {
    try {
      const skill = await skillExchangeModel.findById(req.params.skillId).lean();

      if (!skill || !skill.isActive) {
        return res.status(404).json({
          success: false,
          message: "Skill not found or inactive.",
        });
      }

      if (skill.user?.toString() === req.userID) {
        return res.status(400).json({
          success: false,
          message: "You cannot apply to your own skill offering.",
        });
      }

      if (skill.mode === "learn") {
        return res.status(400).json({
          success: false,
          message: "This listing is not accepting learners.",
        });
      }

      if (
        req.body.preferredMode &&
        !skill.deliveryModes?.includes(req.body.preferredMode)
      ) {
        return res.status(400).json({
          success: false,
          message: "Preferred mode is not offered for this skill.",
        });
      }

      const existingPending = await skillApplicationModel.findOne({
        skill: skill._id,
        applicant: req.userID,
        status: "pending",
      });

      if (existingPending) {
        return res.status(409).json({
          success: false,
          message: "You already have a pending application for this skill.",
        });
      }

      const application = await skillApplicationModel.create({
        skill: skill._id,
        mentor: skill.user,
        applicant: req.userID,
        message: req.body.message,
        preferredMode:
          req.body.preferredMode || skill.deliveryModes?.[0] || "online",
        preferredSlot: req.body.preferredSlot,
      });

      return res.status(201).json({
        success: true,
        message: "Application submitted successfully.",
        data: application,
      });
    } catch (error) {
      console.error("Error applying to skill:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error.",
      });
    }
  }
);

module.exports = {
  skillsExchangeRouter,
};
