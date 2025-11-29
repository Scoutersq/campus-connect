const { Router } = require("express");
const { z } = require("zod");
const eventRouter = Router();
const { eventModel } = require("../../models/events.model.js");
const { adminMiddleware } = require("../../middlewares/admin.middleware.js");
const { notificationModel } = require("../../models/notifications.model.js");
const { userMiddleware } = require("../../middlewares/user.middleware.js");
const { userModel } = require("../../models/user.model.js");
const { validateBody } = require("../../utils/validation.js");
const { resolveUserIdFromToken, extractTokenFromRequest } = require("../../utils/session.js");

const createEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  venue: z.string().trim().min(3).max(120),
  date: z.coerce.date(),
  category: z.string().trim().min(2).max(50).optional(),
  time: z.string().trim().min(1).max(20).optional(),
  capacity: z.coerce.number().int().nonnegative().max(100000).optional(),
});

const buildEventResponse = (event, currentUserId = null) => {
  const plain = event.toObject ? event.toObject() : event;
  const attendees = Array.isArray(plain.attendees) ? plain.attendees : [];
  const attendingCount = attendees.length;
  const rawCapacity = typeof plain.capacity === "number" ? plain.capacity : 0;
  const capacity = rawCapacity > 0 ? rawCapacity : null;
  const isAttending = currentUserId
    ? attendees.some((entry) => String(entry.user) === String(currentUserId))
    : false;

  return {
    _id: plain._id,
    title: plain.title,
    description: plain.description,
    venue: plain.venue,
    date: plain.date,
    category: plain.category || "General",
    startTime: plain.startTime || null,
    capacity,
    attendees: attendees.map((entry) => ({
      name: entry.name,
      email: entry.email,
      rsvpedAt: entry.rsvpedAt,
    })),
    attendeesCount: attendingCount,
    isAttending,
    createdBy: plain.createdBy,
    createdAt: plain.createdAt,
  };
};

eventRouter.post(
  "/create",
  adminMiddleware,
  validateBody(createEventSchema),
  async (req, res) => {
    try {
      const event = new eventModel({
        title: req.body.title,
        description: req.body.description,
        venue: req.body.venue,
        date: req.body.date,
        createdBy: req.adminID,
        category: req.body.category || "General",
        startTime: req.body.time || null,
        capacity: typeof req.body.capacity === "number" ? req.body.capacity : 0,
      });

      await event.save();

      await notificationModel.create({
        title: "New Event Added",
        message: `${event.title} will be held on ${new Date(
          event.date
        ).toDateString()} at ${event.venue}`,
        createdBy: req.adminID,
      });

      return res.status(201).json({
        success: true,
        message: "Event created successfully.",
        event,
      });
    } catch (error) {
      console.error("Error creating event:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error.",
        error: error.message,
      });
    }
  }
);

eventRouter.get("/", async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);
    const currentUserId = await resolveUserIdFromToken(token);

    const events = await eventModel.find({}).sort({ date: 1 }).lean();

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: "No events found." });
    }

    return res.status(200).json({
      success: true,
      count: events.length,
      events: events.map((event) => buildEventResponse(event, currentUserId)),
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

eventRouter.post("/:eventId/rsvp", userMiddleware, async (req, res) => {
  try {
    const event = await eventModel.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const alreadyAttending = event.attendees.some(
      (entry) => String(entry.user) === String(req.userID)
    );

    if (alreadyAttending) {
      return res.status(400).json({ success: false, message: "You have already RSVPed to this event." });
    }

    if (event.capacity && event.capacity > 0 && event.attendees.length >= event.capacity) {
      return res.status(400).json({ success: false, message: "This event has reached capacity." });
    }

    const user = await userModel
      .findById(req.userID)
      .select("firstName lastName email")
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User profile not found." });
    }

    event.attendees.push({
      user: req.userID,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      rsvpedAt: new Date(),
    });

    await event.save();

    return res.status(200).json({
      success: true,
      message: "RSVP confirmed.",
      event: buildEventResponse(event, req.userID),
    });
  } catch (error) {
    console.error("Error processing RSVP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to RSVP for event.",
      error: error.message,
    });
  }
});

eventRouter.delete("/:eventId/rsvp", userMiddleware, async (req, res) => {
  try {
    const event = await eventModel.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const originalLength = event.attendees.length;
    event.attendees = event.attendees.filter(
      (entry) => String(entry.user) !== String(req.userID)
    );

    if (event.attendees.length === originalLength) {
      return res.status(400).json({ success: false, message: "You have not RSVPed to this event." });
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: "RSVP cancelled.",
      event: buildEventResponse(event, req.userID),
    });
  } catch (error) {
    console.error("Error cancelling RSVP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel RSVP.",
      error: error.message,
    });
  }
});

module.exports = { eventRouter };
