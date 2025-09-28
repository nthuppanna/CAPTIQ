// cedar-backend/lib/captions.ts
import { gemini, getModelName } from "./gemini";

export type GenInput = {
  keyword: string;
  style: string;
  platform: string;
  team?: string;
  hashtags?: string[];
  seed?: number;
};

export async function generateSixCaptions(input: GenInput): Promise<string[]> {
  const {
    keyword,
    style,
    platform,
    team = "Your Team",
    hashtags = [],
    seed = Math.floor(Math.random() * 1_000_000),
  } = input;

  const tagStr = (hashtags || [])
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");

  const system = [
    "You write short, punchy social captions for sports teams.",
    "Rules:",
    "- Return exactly 6 distinct options.",
    "- Each option should be concise (ideally < 140 chars).",
    "- Vary voice, rhythm, and framing (don’t repeat the same opener).",
    "- If hashtags are provided, include at most 1–2 per option.",
    "- Do NOT number or bullet the options; output one caption per line.",
  ].join("\n");

  const user = [
    `Team: ${team}`,
    `Platform: ${platform}`,
    `Keyword/idea: "${keyword}"`,
    `Style: ${style}`,
    `Hashtags: ${tagStr || "(none)"}`,
    `Variation seed: ${seed}`,
    "",
    "Write 6 caption options.",
  ].join("\n");

  const model = gemini.getGenerativeModel({
    model: getModelName(),
    systemInstruction: system,
  });

  const resp = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: user }] }],
  });

  const text = resp.response.text() || "";

  // Primary split: line-by-line; strip bullets/numbers
  const lines = text
    .split(/\r?\n/)
    .map((s) => s.replace(/^\s*[-*•\d]+\s*[).]?\s*/, "").trim())
    .filter(Boolean);

  // Fallback: split by paragraphs if needed
  let options = lines;
  if (options.length < 6 && text) {
    options = text
      .split(/\n{2,}/)
      .map((s) => s.replace(/^\s*[-*•\d]+\s*[).]?\s*/, "").trim())
      .filter(Boolean);
  }

  // Pad to 6 so the UI never breaks
  const fallback = `${keyword} • ${platform}`;
  while (options.length < 6) {
    options.push(`${fallback} — Let’s go! ${tagStr}`.trim());
  }

  return options.slice(0, 6);
}
