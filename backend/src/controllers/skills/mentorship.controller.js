const mentorshipService = require("../../services/skills/mentorship.service.js");

const getRequests = async (req, res) => {
  const result = await mentorshipService.listRequests(req.userID, req.query);

  return res.status(200).json({ success: true, ...result });
};

const updateRequest = async (req, res) => {
  const application = await mentorshipService.updateRequestStatus(
    req.userID,
    req.params.requestId,
    req.body.action
  );

  return res.status(200).json({
    success: true,
    message: "Mentorship request updated successfully.",
    data: application,
  });
};

module.exports = {
  getRequests,
  updateRequest,
};
