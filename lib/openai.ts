import OpenAI from "openai";

export type InvitationCopyParams = {
  scene: string;
  style: string;
  eventInfo: {
    names?: string[];
    date?: string;
    location?: string;
    description?: string;
  };
  locale: string;
};

function buildPrompt(params: InvitationCopyParams) {
  const { scene, eventInfo, locale } = params;
  const language = locale.toLowerCase().startsWith("zh") ? "Chinese" : "English";
  const names = eventInfo.names?.filter(Boolean).join(" & ") || "Not provided";
  return [
    `Create one invitation copy variation in ${language}; three independent options are being requested.`,
    `Scene: ${scene}. Style: ${params.style || "modern"}.`,
    `Names: ${names}. Date: ${eventInfo.date || "Not provided"}. Location: ${eventInfo.location || "Not provided"}.`,
    eventInfo.description ? `Additional context: ${eventInfo.description.slice(0, 500)}.` : "",
    "Keep it warm, specific, and ready to paste into an invitation. Return only the copy without a heading or numbering.",
  ].filter(Boolean).join("\n");
}

function getSystemPrompt(scene: string, locale: string) {
  const language = locale.toLowerCase().startsWith("zh") ? "Chinese" : "English";
  const tone = scene === "wedding" ? "warm and heartfelt" : scene === "birthday" ? "lively and fun" : "welcoming and thoughtful";
  return `You are a professional ${scene} invitation copywriter. Write in ${language} with a ${tone} tone. Avoid cliches and invented facts.`;
}

export async function generateInvitationCopy(params: InvitationCopyParams) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { variations: null, tokensUsed: null, model: null };
  }

  const client = new OpenAI({ apiKey });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const completion = await client.chat.completions.create(
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: getSystemPrompt(params.scene, params.locale) },
          { role: "user", content: buildPrompt(params) },
        ],
        temperature: 0.8,
        max_tokens: 500,
        n: 3,
      },
      { signal: controller.signal },
    );
    const variations = completion.choices.map((choice) => choice.message.content?.trim() || "").filter(Boolean).slice(0, 3);
    return {
      variations: variations.length > 0 ? variations : null,
      tokensUsed: completion.usage?.total_tokens ?? null,
      model: completion.model || process.env.OPENAI_MODEL || "gpt-4o-mini",
    };
  } finally {
    clearTimeout(timeout);
  }
}
