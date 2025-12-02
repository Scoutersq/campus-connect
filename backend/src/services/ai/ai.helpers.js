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
    note: "Use only when the user clearly provides enough details to file a report."
  },
  REPORT_FOUND_ITEM: {
    required: ["title", "description", "locationFound"],
    optional: ["dateFound", "contact", "image", "tags"],
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
- Only choose REPORT/RSVP actions when all required fields listed in ACTION_FIELD_GUIDE are present.
- Use "SHARE_NOTES_GUIDE" to explain how to upload notes (file uploads require manual steps).
- Keep replies concise and helpful. Use needsConfirmation=true if the user must confirm or
  supply sensitive details before execution.
- Never invent IDs; ask the user if an identifier (like event or announcement ID) is not provided.
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
