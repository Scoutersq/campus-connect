const { Router } = require("express");
const eventRouter = Router();
const { eventModel } = require("../models/events.model.js");
const { adminMiddleware } = require("../middlewares/admin.middleware.js");
const { notificationModel } = require("../models/notifications.model.js");

eventRouter.post("/create", adminMiddleware, async (req, res) => {
  try {
    const { title, description, venue, date } = req.body;

    // Validate input
    if (!title || !description || !venue || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const event = new eventModel({
      title: title.trim(),
      description: description.trim(),
      venue: venue.trim(),
      date: new Date(date),
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
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

eventRouter.get("/", async (req, res) => {
  try {
    // Fetch events sorted by date (upcoming first)
    const events = await eventModel.find({}).sort({ date: 1 });

    if (!events || events.length === 0) {
      return res.status(404).json({ message: "No events found" });
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
