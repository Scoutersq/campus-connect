const { Router } = require("express");
const { z } = require("zod");
const eventRouter = Router();
const { eventModel } = require("../models/events.model.js");
const { adminMiddleware } = require("../middlewares/admin.middleware.js");
const { notificationModel } = require("../models/notifications.model.js");
const { validateBody } = require("../utils/validation.js");

const createEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  venue: z.string().trim().min(3).max(120),
  date: z.coerce.date(),
});

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
    // Fetch events sorted by date (upcoming first)
    const events = await eventModel.find({}).sort({ date: 1 });

    if (!events || events.length === 0) {
      return res.status(404).json({ success: false, message: "No events found." });
    }

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
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


module.exports = { eventRouter };
