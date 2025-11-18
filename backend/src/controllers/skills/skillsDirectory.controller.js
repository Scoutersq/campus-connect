const skillsDirectoryService = require("../../services/skills/skillsDirectory.service.js");

const getMentors = async (req, res) => {
  const result = await skillsDirectoryService.listMentors(req.query);
  return res.status(200).json({ success: true, ...result });
};

const getSkillsCatalog = async (req, res) => {
  const result = await skillsDirectoryService.listSkillsCatalog(req.query);
  return res.status(200).json({ success: true, ...result });
};

module.exports = {
  getMentors,
  getSkillsCatalog,
};
