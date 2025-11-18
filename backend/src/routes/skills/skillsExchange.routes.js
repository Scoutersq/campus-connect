const { Router } = require("express");
const { z } = require("zod");
const { asyncHandler } = require("../../utils/asyncHandler.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const {
  validateQuery,
  validateBody,
  validateParams,
} = require("../../utils/validation.js");
const skillExchangeController = require("../../controllers/skills/skillExchange.controller.js");

const router = Router();

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
  proficiency: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .default("intermediate"),
  experienceYears: z.coerce.number().int().min(0).max(60).default(0),
  shortDescription: z.string().trim().min(10).max(280).optional(),
  detailedDescription: z.string().trim().min(20).max(2000).optional(),
  deliveryModes: z
    .array(z.enum(["online", "in-person", "hybrid"]))
    .min(1)
    .max(3)
    .default(["online"]),
  availability: z
    .object({
      timezone: z.string().trim().min(2).max(60).default("UTC"),
      slots: z.array(availabilitySlotSchema).max(14).default([]),
    })
    .default({ timezone: "UTC", slots: [] }),
  tags: z
    .array(z.string().trim().min(2).max(40))
    .max(10)
    .optional()
    .default([]),
  preferredLanguages: z
    .array(z.string().trim().min(2).max(40))
    .max(5)
    .optional()
    .default([]),
  mode: z.enum(["teach", "learn", "both"]).default("teach"),
  isActive: z.boolean().optional().default(true),
});

const skillsQuerySchema = z.object({
  search: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  mode: z.enum(["teach", "learn", "both"]).optional(),
  proficiency: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
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

router.get(
  "/",
  userMiddleware,
  validateQuery(skillsQuerySchema),
  asyncHandler(skillExchangeController.getSkills)
);

router.post(
  "/teach",
  userMiddleware,
  validateBody(skillSubmissionSchema),
  asyncHandler(skillExchangeController.createOrUpdateSkill)
);

router.post(
  "/:skillId/apply",
  userMiddleware,
  validateParams(skillIdParamsSchema),
  validateBody(skillApplicationSchema),
  asyncHandler(skillExchangeController.applyForSkill)
);

module.exports = router;
