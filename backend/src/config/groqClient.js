const Groq = require("groq-sdk");

let groqClient = null;
let lastLoggedMissingKey = 0;

function getSanitizedKey() {
  const raw = process.env.GROQ_API_KEY;
  if (!raw) {
    return "";
  }
  return raw.trim();
}

function getGroqClient() {
  const apiKey = getSanitizedKey();

  if (!apiKey) {
    const now = Date.now();
    if (now - lastLoggedMissingKey > 30_000) {
      console.warn("[groq] GROQ_API_KEY is not set or empty. AI assistant disabled.");
      lastLoggedMissingKey = now;
    }
    return null;
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

module.exports = {
  getGroqClient,
};
