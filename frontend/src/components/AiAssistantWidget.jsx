import React from "react";
import { apiFetch } from "../api";
import aiWidgetIcon from "../assets/ai-widget-icon.svg";
import "./AiAssistantWidget.css";

const STUDENT_SUGGESTIONS = [
  "Report a lost water bottle found near the library",
  "Show my upcoming events",
  "Mark announcement 652f1d... as read",
  "RSVP me for event 652f8a...",
  "Show latest lost and found items",
];

const ADMIN_SUGGESTIONS = [
  "Show the most recent announcements",
  "List the latest discussions",
  "Display shared notes",
  "Show upcoming events",
  "Show newest lost item reports",
];

const INITIAL_ASSISTANT_MESSAGE =
  "Hi! I'm the Campus Connect assistant. Ask me to report items, check announcements, RSVP to events, and more.";

function normalizeRole(role) {
  return role === "admin" ? "admin" : "student";
}

function formatDate(value) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderExecutionDetails(action, details) {
  if (!details || typeof details !== "object") {
    return [];
  }

  const lines = [];
  const maxItems = 3;

  const addList = (items, formatter, heading) => {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }
    if (heading) {
      lines.push(heading);
    }
    items.slice(0, maxItems).forEach((item, index) => {
      const rendered = formatter(item, index);
      if (rendered) {
        lines.push(`• ${rendered}`);
      }
    });
    if (items.length > maxItems) {
      lines.push(`…and ${items.length - maxItems} more.`);
    }
  };

  switch (action) {
    case "VIEW_LOST_ITEMS": {
      addList(
        details.items,
        (item) => {
          if (!item) return null;
          const date = formatDate(item.dateLost || item.createdAt);
          const location = item.location || "Unknown location";
          const status = item.status ? ` (${item.status})` : "";
          const parts = [item.title || "Unnamed item", location];
          if (date) {
            parts.push(date);
          }
          return `${parts.join(" · ")}${status}`;
        },
        "Here are the latest lost items:"
      );
      break;
    }
    case "VIEW_FOUND_ITEMS": {
      addList(
        details.items,
        (item) => {
          if (!item) return null;
          const date = formatDate(item.dateFound || item.createdAt);
          const location = item.locationFound || item.location || "Unknown location";
          const status = item.status ? ` (${item.status})` : "";
          const parts = [item.title || "Unnamed item", location];
          if (date) {
            parts.push(date);
          }
          return `${parts.join(" · ")}${status}`;
        },
        "Here are the latest found items:"
      );
      break;
    }
    case "VIEW_EVENTS": {
      addList(
        details.events,
        (event) => {
          if (!event) return null;
          const date = formatDate(event.date || event.startDate);
          const venue = event.venue || "Venue TBA";
          return `${event.title || "Untitled event"} · ${venue}${date ? ` · ${date}` : ""}`;
        },
        "Upcoming events:"
      );
      break;
    }
    case "VIEW_ANNOUNCEMENTS": {
      addList(
        details.announcements,
        (announcement) => {
          if (!announcement) return null;
          const date = formatDate(announcement.createdAt);
          const category = announcement.category
            ? ` [${announcement.category}]`
            : "";
          return `${announcement.title || "Announcement"}${category}${
            date ? ` · ${date}` : ""
          }`;
        },
        "Recent announcements:"
      );
      break;
    }
    case "VIEW_NOTES": {
      addList(
        details.notes,
        (note) => {
          if (!note) return null;
          const subject = note.subject ? ` · ${note.subject}` : "";
          const downloads = typeof note.downloads === "number" ? ` (${note.downloads} downloads)` : "";
          return `${note.title || note.fileName || "Shared note"}${subject}${downloads}`;
        },
        "Shared notes:"
      );
      break;
    }
    case "VIEW_DISCUSSIONS": {
      addList(
        details.discussions,
        (discussion) => {
          if (!discussion) return null;
          const tags = Array.isArray(discussion.tags) && discussion.tags.length
            ? ` [${discussion.tags.slice(0, 3).join(", ")}]`
            : "";
          const date = formatDate(discussion.createdAt);
          return `${discussion.title || "Discussion"}${tags}${date ? ` · ${date}` : ""}`;
        },
        "Latest discussions:"
      );
      break;
    }
    default:
      break;
  }

  return lines;
}

function buildConversationPayload(messages) {
  return messages.map((message) => ({
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
  }));
}

export default function AiAssistantWidget({ context = {} }) {
  const portalRole = normalizeRole(context.role);
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { id: "welcome", role: "assistant", content: INITIAL_ASSISTANT_MESSAGE },
  ]);
  const listRef = React.useRef(null);

  const suggestions = portalRole === "admin" ? ADMIN_SUGGESTIONS : STUDENT_SUGGESTIONS;

  const toggleWidget = () => setIsOpen((prev) => !prev);

  React.useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const appendMessage = React.useCallback((role, content) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        content,
      },
    ]);
  }, []);

  const sendMessage = React.useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) {
        return;
      }

      const userMessage = { id: `user-${Date.now()}`, role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      setIsLoading(true);

      try {
        const response = await apiFetch("/api/ai/command", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: buildConversationPayload([...messages, userMessage]),
            context: {
              role: portalRole,
              name: context.name || "",
              email: context.email || "",
            },
            executeAction: true,
          }),
        });

        let payload;
        let rawFallback = null;

        try {
          const contentType = response.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            payload = await response.json();
          } else {
            rawFallback = await response.text();
          }
        } catch (parseError) {
          rawFallback = rawFallback || parseError.message;
        }

        if (!payload) {
          throw new Error(
            rawFallback?.slice?.(0, 160) || "Assistant returned an unexpected response."
          );
        }

        if (!response.ok) {
          throw new Error(
            payload?.details || payload?.message || "Failed to reach the assistant."
          );
        }

        if (payload.reply) {
          appendMessage("assistant", payload.reply);
        }

        if (payload.followUpQuestion) {
          appendMessage("assistant", payload.followUpQuestion);
        }

        if (payload.execution) {
          const { success, message, details } = payload.execution;
          if (message) {
            appendMessage("assistant", message);
          } else if (success) {
            appendMessage("assistant", "Action completed.");
          }

          const detailLines = renderExecutionDetails(payload.action, details);
          detailLines.forEach((line) => appendMessage("assistant", line));
        }
      } catch (error) {
        appendMessage(
          "assistant",
          error.message || "I ran into a problem handling that request. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [appendMessage, context.email, context.name, isLoading, messages, portalRole]
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(inputValue);
  };

  const handleSuggestion = (suggestion) => {
    setInputValue(suggestion);
    setTimeout(() => {
      sendMessage(suggestion);
    }, 0);
  };

  return (
    <>
      <button
        type="button"
        className="ai-widget-button"
        onClick={toggleWidget}
        aria-label="Campus Connect assistant"
      >
        <img src={aiWidgetIcon} alt="AI assistant" className="ai-widget-icon" />
      </button>

      {isOpen && (
        <div className="ai-widget-panel">
          <header className="ai-widget-header">
            <div>
              <p className="ai-widget-title">Campus Assistant</p>
              <p className="ai-widget-subtitle">
                {portalRole === "admin" ? "Admin tools" : "Student support"}
              </p>
            </div>
            <button
              type="button"
              className="ai-widget-close"
              onClick={toggleWidget}
              aria-label="Close assistant"
            >
              ×
            </button>
          </header>

          <div className="ai-widget-suggestions">
            {suggestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => handleSuggestion(suggestion)}
                className="ai-widget-chip"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <div className="ai-widget-messages" ref={listRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`ai-widget-message ai-widget-message-${message.role}`}
              >
                <div className="ai-widget-bubble">{message.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="ai-widget-message ai-widget-message-assistant">
                <div className="ai-widget-bubble ai-widget-typing">
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                </div>
              </div>
            )}
          </div>

          <form className="ai-widget-input" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Ask me to handle something..."
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputValue.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
