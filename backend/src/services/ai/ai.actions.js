const { lostModel } = require("../../models/lost.model.js");
const { foundModel } = require("../../models/found.model.js");
const { notificationModel } = require("../../models/notifications.model.js");
const { eventModel } = require("../../models/events.model.js");
const { noteSharingModel } = require("../../models/notesSharing.model.js");
const { postModelSchema } = require("../../models/discussion.model.js");
const { userModel } = require("../../models/user.model.js");

function ensureTrimmed(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).trim();
}

function coerceDate(value, fallback = new Date()) {
  if (!value) {
    return fallback;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }
  return parsed;
}

async function resolveUserProfile(userId) {
  if (!userId) {
    return null;
  }

  const profile = await userModel
    .findById(userId)
    .select("firstName lastName email studentId")
    .lean();
  return profile;
}

function success(message, details = {}) {
  return {
    attempted: true,
    success: true,
    message,
    details,
  };
}

function failure(message, details = {}) {
  return {
    attempted: true,
    success: false,
    message,
    details,
  };
}

async function reportLostItem(data, actor) {
  if (actor.role !== "user") {
    return failure("Only student accounts can report lost items.");
  }

  const missing = [];
  const title = ensureTrimmed(data.title || data.itemName);
  const description = ensureTrimmed(data.description);
  const location = ensureTrimmed(data.location || data.locationLost);

  if (!title) missing.push("title");
  if (!description) missing.push("description");
  if (!location) missing.push("location");

  if (missing.length) {
    return failure(`Missing required information: ${missing.join(", ")}.`, {
      missing,
    });
  }

  const userProfile = await resolveUserProfile(actor.userId);

  const contact = ensureTrimmed(
    data.contact || data.contactEmail || data.contactPhone || userProfile?.email || ""
  );

  const newItem = await lostModel.create({
    title,
    description,
    location,
    contact: contact || "Not provided",
    image: ensureTrimmed(data.image || data.imageUrl),
    dateLost: coerceDate(data.dateLost || data.lostDate),
    reportedBy: actor.userId,
    status: "reported",
  });

  return success(`The lost item "${newItem.title}" has been submitted.`, {
    itemId: String(newItem._id),
  });
}

async function reportFoundItem(data, actor) {
  if (actor.role !== "user") {
    return failure("Only student accounts can report found items.");
  }

  const missing = [];
  const title = ensureTrimmed(data.title || data.itemName);
  const description = ensureTrimmed(data.description);
  const locationFound = ensureTrimmed(data.locationFound || data.location);

  if (!title) missing.push("title");
  if (!description) missing.push("description");
  if (!locationFound) missing.push("locationFound");

  if (missing.length) {
    return failure(`Missing required information: ${missing.join(", ")}.`, {
      missing,
    });
  }

  const userProfile = await resolveUserProfile(actor.userId);

  const contact = ensureTrimmed(
    data.contact || data.contactEmail || data.contactPhone || userProfile?.email || ""
  );

  const newItem = await foundModel.create({
    title,
    description,
    locationFound,
    contact: contact || "Not provided",
    image: ensureTrimmed(data.image || data.imageUrl),
    dateFound: coerceDate(data.dateFound || data.foundDate),
    reportedBy: actor.userId,
    status: "reported",
  });

  return success(`The found item "${newItem.title}" has been logged.`, {
    itemId: String(newItem._id),
  });
}

async function markAnnouncementRead(data, actor) {
  if (actor.role !== "user") {
    return failure("Only students can mark announcements as read.");
  }

  const notificationId = ensureTrimmed(data.notificationId || data.id);
  if (!notificationId) {
    return failure("Provide the announcement ID to mark it as read.");
  }

  const notification = await notificationModel
    .findById(notificationId)
    .select("_id title")
    .lean();

  if (!notification) {
    return failure("Announcement not found. Please double-check the identifier.");
  }

  await notificationModel.updateOne(
    { _id: notification._id },
    { $addToSet: { readBy: actor.userId } }
  );

  return success(`Marked "${notification.title}" as read.`, {
    notificationId,
  });
}

async function rsvpEvent(data, actor) {
  if (actor.role !== "user") {
    return failure("Only students can RSVP to events.");
  }

  const eventId = ensureTrimmed(data.eventId || data.id);
  if (!eventId) {
    return failure("Provide the event ID to RSVP.");
  }

  const event = await eventModel.findById(eventId);
  if (!event) {
    return failure("Event not found. Please verify the event ID.");
  }

  const alreadyAttending = event.attendees.some(
    (entry) => String(entry.user) === String(actor.userId)
  );

  if (alreadyAttending) {
    return success(`You're already on the attendee list for ${event.title}.`, {
      eventId,
    });
  }

  if (event.capacity && event.capacity > 0 && event.attendees.length >= event.capacity) {
    return failure("This event has reached its capacity.");
  }

  const userProfile = await resolveUserProfile(actor.userId);
  if (!userProfile) {
    return failure("Unable to confirm your profile for RSVP.");
  }

  event.attendees.push({
    user: actor.userId,
    name: `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim() ||
      userProfile.email,
    email: userProfile.email,
    rsvpedAt: new Date(),
  });

  await event.save();

  return success(`RSVP confirmed for ${event.title}.`, {
    eventId,
    attendeeCount: event.attendees.length,
  });
}

async function cancelEventRsvp(data, actor) {
  if (actor.role !== "user") {
    return failure("Only students can manage event RSVPs.");
  }

  const eventId = ensureTrimmed(data.eventId || data.id);
  if (!eventId) {
    return failure("Provide the event ID to update your RSVP.");
  }

  const event = await eventModel.findById(eventId);
  if (!event) {
    return failure("Event not found. Please verify the event ID.");
  }

  const originalLength = event.attendees.length;
  event.attendees = event.attendees.filter(
    (entry) => String(entry.user) !== String(actor.userId)
  );

  if (event.attendees.length === originalLength) {
    return success("You were not on the attendee list.");
  }

  await event.save();

  return success(`Your RSVP for ${event.title} has been cancelled.`, {
    eventId,
    attendeeCount: event.attendees.length,
  });
}

async function viewLostItems(data) {
  const limit = Math.min(Math.max(Number(data.limit) || 5, 1), 10);
  const statusFilter = ensureTrimmed(data.status);
  const filters = {};
  if (statusFilter) {
    filters.status = statusFilter;
  }

  const items = await lostModel
    .find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title location status createdAt dateLost")
    .lean();

  return success(`Here are the latest ${items.length} lost item reports.`, {
    items,
  });
}

async function viewFoundItems(data) {
  const limit = Math.min(Math.max(Number(data.limit) || 5, 1), 10);
  const statusFilter = ensureTrimmed(data.status);
  const filters = {};
  if (statusFilter) {
    filters.status = statusFilter;
  }

  const items = await foundModel
    .find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title locationFound status createdAt dateFound")
    .lean();

  return success(`Here are the latest ${items.length} found item reports.`, {
    items,
  });
}

async function viewEvents(data) {
  const limit = Math.min(Math.max(Number(data.limit) || 5, 1), 10);
  const now = new Date();
  const events = await eventModel
    .find({ date: { $gte: now } })
    .sort({ date: 1 })
    .limit(limit)
    .select("title date venue category capacity attendees")
    .lean();

  return success(`Upcoming events: ${events.length} item(s).`, {
    events,
  });
}

async function viewAnnouncements(data) {
  const limit = Math.min(Math.max(Number(data.limit) || 5, 1), 10);
  const category = ensureTrimmed(data.category);
  const filters = {};
  if (category) {
    filters.category = category;
  }

  const notifications = await notificationModel
    .find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title message category createdAt")
    .lean();

  return success(`Here are ${notifications.length} recent announcements.`, {
    announcements: notifications,
  });
}

async function viewNotes(data) {
  const limit = Math.min(Math.max(Number(data.limit) || 5, 1), 10);
  const subject = ensureTrimmed(data.subject);
  const filters = {};
  if (subject) {
    filters.subject = new RegExp(subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  const notes = await noteSharingModel
    .find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title subject fileName createdAt downloads")
    .lean();

  return success(`Showing ${notes.length} shared notes.`, {
    notes,
  });
}

async function viewDiscussions(data) {
  const limit = Math.min(Math.max(Number(data.limit) || 5, 1), 10);
  const topics = ensureTrimmed(data.topic);
  const filters = { isDeleted: { $ne: true } };
  if (topics) {
    filters.tags = { $in: [topics] };
  }

  const posts = await postModelSchema
    .find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title tags createdAt")
    .lean();

  return success(`Here are ${posts.length} recent discussions.`, {
    discussions: posts,
  });
}

function shareNotesGuide() {
  return success(
    "To share notes, use the Notes Sharing page and upload your file there. I can guide you through the steps if needed.",
    {}
  );
}

async function executeAiAction({ action, data = {}, actor }) {
  switch (action) {
    case "REPORT_LOST_ITEM":
      return reportLostItem(data, actor);
    case "REPORT_FOUND_ITEM":
      return reportFoundItem(data, actor);
    case "MARK_ANNOUNCEMENT_READ":
      return markAnnouncementRead(data, actor);
    case "RSVP_EVENT":
      return rsvpEvent(data, actor);
    case "CANCEL_EVENT_RSVP":
      return cancelEventRsvp(data, actor);
    case "VIEW_LOST_ITEMS":
      return viewLostItems(data, actor);
    case "VIEW_FOUND_ITEMS":
      return viewFoundItems(data, actor);
    case "VIEW_EVENTS":
      return viewEvents(data, actor);
    case "VIEW_ANNOUNCEMENTS":
      return viewAnnouncements(data, actor);
    case "VIEW_NOTES":
      return viewNotes(data, actor);
    case "VIEW_DISCUSSIONS":
      return viewDiscussions(data, actor);
    case "SHARE_NOTES_GUIDE":
      return shareNotesGuide();
    default:
      return null;
  }
}

module.exports = {
  executeAiAction,
};
