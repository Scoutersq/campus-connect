const { Router } = require("express");
const { z } = require("zod");
const { asyncHandler } = require("../../utils/asyncHandler.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { validateQuery } = require("../../utils/validation.js");
const skillsDirectoryController = require("../../controllers/skills/skillsDirectory.controller.js");

const router = Router();

const mentorsQuerySchema = z.object({
  skill: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  proficiency: z.enum(["beginner", "intermediate", "advanced", "expert"]).optional(),
  language: z.string().trim().min(2).max(60).optional(),
  tag: z.string().trim().min(2).max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(["recent", "experience", "name"]).default("recent"),
});

const skillsCatalogQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(2).max(80).optional(),
  mode: z.enum(["teach", "learn", "both"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

router.get(
  "/mentors",
  userMiddleware,
  validateQuery(mentorsQuerySchema),
  asyncHandler(skillsDirectoryController.getMentors)
);

router.get(
  "/skills",
  userMiddleware,
  validateQuery(skillsCatalogQuerySchema),
  asyncHandler(skillsDirectoryController.getSkillsCatalog)
);

module.exports = router;
