const ALLOWED_ACTIONS = [
  "NONE",
  "CLARIFY",
  "REPORT_LOST_ITEM",
  "REPORT_FOUND_ITEM",
  "MARK_ANNOUNCEMENT_READ",
  "RSVP_EVENT",
  "CANCEL_EVENT_RSVP",
  "VIEW_LOST_ITEMS",
  "VIEW_FOUND_ITEMS",
  "VIEW_EVENTS",
  "VIEW_ANNOUNCEMENTS",
  "VIEW_NOTES",
  "VIEW_DISCUSSIONS",
  "SHARE_NOTES_GUIDE",
];

const ACTION_FIELD_GUIDE = {
  REPORT_LOST_ITEM: {
    required: ["title", "description", "location"],
    optional: ["dateLost", "contact", "image", "tags"],
    note: "Extract title, description, location, and dates directly from the user's latest request whenever possible. Ask follow-up questions only when critical details are genuinely missing."
  },
  REPORT_FOUND_ITEM: {
    required: ["title", "description", "locationFound"],
    optional: ["dateFound", "contact", "image", "tags"],
    note: "Infer the core details (what item, where it was found, when) from the natural-language command before asking follow-up questions."
  },
  MARK_ANNOUNCEMENT_READ: {
    required: ["notificationId"],
    optional: [],
  },
  RSVP_EVENT: {
    required: ["eventId"],
    optional: [],
  },
  CANCEL_EVENT_RSVP: {
    required: ["eventId"],
    optional: [],
  },
  VIEW_LOST_ITEMS: {
    required: [],
    optional: ["status", "limit"],
  },
  VIEW_FOUND_ITEMS: {
    required: [],
    optional: ["status", "limit"],
  },
  VIEW_EVENTS: {
    required: [],
    optional: ["limit", "timeframe"],
  },
  VIEW_ANNOUNCEMENTS: {
    required: [],
    optional: ["limit", "category"],
  },
  VIEW_NOTES: {
    required: [],
    optional: ["subject", "limit"],
  },
  VIEW_DISCUSSIONS: {
    required: [],
    optional: ["limit", "topic"],
  },
  SHARE_NOTES_GUIDE: {
    required: [],
    optional: [],
    note: "Use when the user wants to upload notes; tell them how to use the existing upload feature."
  },
};

const SYSTEM_PROMPT = `You are Campus Connect's virtual assistant. Interpret the user's requests and select
an action from the allowed list. Respond strictly in JSON following this schema:
{
  "reply": string,                 // conversational response summarising intent/result
  "action": string,                // one of ${ALLOWED_ACTIONS.join(", ")}
  "data": object,                  // structured arguments for the backend
  "needsConfirmation": boolean,    // true when more user confirmation is required before execution
  "followUpQuestion": string|null, // question to gather missing info
  "missingFields": string[]        // list of unresolved fields for the chosen action
}

Guidelines:
- Choose action "NONE" for greetings, thanks, or when no backend work is needed.
- Choose "CLARIFY" when intent is unclear; ask for the missing detail through followUpQuestion.
- When the user describes an item or request in natural language, extract the relevant fields yourself and populate \"data\". For example, "My white bottle went missing in classroom 4 on 29 November" should map to {"title":"bottle","description":"white bottle lost","location":"classroom 4","dateLost":"2024-11-29"}. If the year is omitted, assume the most recent sensible year.
- Field expectations:
  * REPORT_LOST_ITEM -> { title, description, location, dateLost?, contact?, image?, tags? }
  * REPORT_FOUND_ITEM -> { title, description, locationFound, dateFound?, contact?, image?, tags? }
  * MARK_ANNOUNCEMENT_READ -> { notificationId }
  * RSVP_EVENT / CANCEL_EVENT_RSVP -> { eventId }
  * VIEW_LOST_ITEMS -> { status?, limit? }
  * VIEW_FOUND_ITEMS -> { status?, limit? }
  * VIEW_EVENTS -> { limit?, timeframe? }
  * VIEW_ANNOUNCEMENTS -> { limit?, category? }
  * VIEW_NOTES -> { subject?, limit? }
  * VIEW_DISCUSSIONS -> { topic?, limit? }
- Only ask the user for missing information when it cannot be confidently inferred. Prefer concise titles (1-4 words) and plain-text descriptions summarising the user's request.
- Use "SHARE_NOTES_GUIDE" to explain how to upload notes (file uploads require manual steps).
- Keep replies concise and helpful. Use needsConfirmation=true if the user must confirm or
  supply sensitive details before execution.
- Never invent IDs; ask the user if an identifier (like event or announcement ID) is not provided.
- Provide structured data in "data" even when the user doesn't explicitly label fields—parse their language to fill required keys.
`;

function normalizeRole(value) {
  if (!value) return "student";
  const lowered = String(value).trim().toLowerCase();
  if (lowered === "admin" || lowered === "administrator") {
    return "admin";
  }
  return "student";
}

function sanitizeMessages(messages = []) {
  return messages
    .slice(-12)
    .map((message) => {
      const role = message.role === "assistant" ? "assistant" : "user";
      const content = typeof message.content === "string" ? message.content.trim() : "";
      if (!content) {
        return null;
      }
      return {
        role,
        content: content.slice(0, 2000),
      };
    })
    .filter(Boolean);
}

function buildMessagesPayload({ messages = [], context = {} }) {
  const cleanedMessages = sanitizeMessages(messages);
  const safeContext = {
    role: normalizeRole(context.role),
    name: context.name ? String(context.name).slice(0, 120) : "",
    email: context.email ? String(context.email).slice(0, 160) : "",
  };

  return [
    {
      role: "system",
      content: `SESSION_CONTEXT: ${JSON.stringify(safeContext)}`,
    },
    ...cleanedMessages,
  ];
}

module.exports = {
  ALLOWED_ACTIONS,
  ACTION_FIELD_GUIDE,
  SYSTEM_PROMPT,
  buildMessagesPayload,
};
