const { getGroqClient } = require("../../config/groqClient.js");
const {
  SYSTEM_PROMPT,
  buildMessagesPayload,
} = require("./ai.helpers.js");
const { executeAiAction } = require("./ai.actions.js");

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.2-90b-text-preview";

function parseBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return defaultValue;
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

async function handleAiCommand(req, res) {
  try {
    const client = getGroqClient();
    if (!client) {
      return res.status(503).json({
        message: "AI assistant is not configured. Please contact the administrator.",
      });
    }

    const { messages, context = {}, executeAction = true } = req.body || {};

    if (!Array.isArray(messages) || !messages.length) {
      return res.status(400).json({
        message: "messages array is required",
      });
    }

    const conversation = buildMessagesPayload({ messages, context });

    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...conversation,
      ],
    });

    const rawOutput = completion.choices?.[0]?.message?.content?.trim() || "{}";

    let parsed;
    try {
      parsed = JSON.parse(rawOutput);
    } catch (error) {
      return res.status(502).json({
        message: "AI response could not be parsed.",
        raw: rawOutput,
      });
    }

    const responsePayload = {
      reply: typeof parsed.reply === "string" ? parsed.reply : "",
      action: typeof parsed.action === "string" ? parsed.action : "NONE",
      data: parsed.data && typeof parsed.data === "object" ? parsed.data : {},
      needsConfirmation: parseBoolean(parsed.needsConfirmation),
      followUpQuestion:
        typeof parsed.followUpQuestion === "string"
          ? parsed.followUpQuestion
          : null,
      missingFields: ensureArray(parsed.missingFields).map((field) => String(field)),
    };

    let executionResult = null;
    const shouldExecute =
      executeAction &&
      responsePayload.action &&
      responsePayload.action !== "NONE" &&
      responsePayload.action !== "CLARIFY" &&
      !responsePayload.needsConfirmation;

    if (shouldExecute) {
      try {
        executionResult = await executeAiAction({
          action: responsePayload.action,
          data: responsePayload.data,
          actor: {
            role: req.role || "student",
            userId: req.userID || null,
            adminId: req.adminID || null,
          },
        });
      } catch (executionError) {
        console.error("AI action execution failed", executionError);
        executionResult = {
          attempted: true,
          success: false,
          message: executionError.message || "Failed to perform the requested action.",
        };
      }
    }

    return res.status(200).json({
      ...responsePayload,
      execution: executionResult,
      meta: {
        model: DEFAULT_MODEL,
        usage: completion.usage || null,
      },
    });
  } catch (error) {
    const groqMessage =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Unknown error";

    console.error("AI assistant error", {
      message: groqMessage,
      stack: error?.stack,
    });
    return res.status(500).json({
      message: "Failed to process AI command.",
      details: groqMessage,
    });
  }
}

module.exports = {
  handleAiCommand,
};
