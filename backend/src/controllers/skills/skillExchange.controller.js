const skillExchangeService = require("../../services/skills/skillExchange.service.js");

const getSkills = async (req, res) => {
  const result = await skillExchangeService.listSkills(req.query);
  return res.status(200).json({ success: true, ...result });
};

const createOrUpdateSkill = async (req, res) => {
  try {
    const skill = await skillExchangeService.upsertSkill(req.userID, req.body);

    return res.status(201).json({
      success: true,
      message: "Skill saved successfully.",
      data: skill,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already published this skill in the selected mode.",
      });
    }

    throw error;
  }
};

const applyForSkill = async (req, res) => {
  const application = await skillExchangeService.applyForSkill(
    req.userID,
    req.params.skillId,
    req.body
  );

  return res.status(201).json({
    success: true,
    message: "Application submitted successfully.",
    data: application,
  });
};

module.exports = {
  getSkills,
  createOrUpdateSkill,
  applyForSkill,
};
