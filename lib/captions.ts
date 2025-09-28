// cedar-backend/lib/captions.ts
import { gemini, getModelName } from "./gemini";

export type GenInput = {
  keyword: string;
  style: string;
  platform: string;
  hashtags?: string[];
  seed?: number;
};

export async function generateSixCaptions(input: GenInput): Promise<string[]> {
  const {
    keyword,
    style,
    platform,
    hashtags = [],
    seed = Math.floor(Math.random() * 1_000_000),
  } = input;

  const tagStr = (hashtags || [])
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .join(" ");

  try {
    const system = [
      "You write cute, adorable Instagram captions for general posts.",
      "Rules:",
      "- Return exactly 6 distinct options.",
      "- Each option should be cute, sweet, and Instagram-worthy.",
      "- Use emojis and positive, uplifting language.",
      "- Vary voice, rhythm, and framing (don't repeat the same opener).",
      "- If hashtags are provided, include at most 1–2 per option.",
      "- Do NOT number or bullet the options; output one caption per line.",
      "- Focus on feelings, moments, and positive vibes.",
    ].join("\n");

    const user = [
      `Topic/idea: "${keyword}"`,
      `Platform: ${platform}`,
      `Style: ${style}`,
      `Hashtags: ${tagStr || "(none)"}`,
      `Variation seed: ${seed}`,
      "",
      "Write 6 cute, adorable caption options for this topic.",
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
    const fallback = `✨ ${keyword} vibes ✨`;
    while (options.length < 6) {
      options.push(`${fallback} ${tagStr}`.trim());
    }

    return options.slice(0, 6);
  } catch (error) {
    console.log('❌ Gemini API failed, using fallback captions:', error.message);
    // Return fallback captions when API fails
    return generateFallbackCaptions(keyword, tagStr);
  }
}

function generateFallbackCaptions(keyword: string, tagStr: string = ""): string[] {
  const fallbackTemplates = [
    `✨ ${keyword} vibes ✨`,
    `Living my best ${keyword} life! 💕`,
    `Nothing beats a good ${keyword} moment 🥰`,
    `${keyword} = pure happiness! 😊`,
    `My heart is full of ${keyword} joy 🌟`,
    `Sending you all the ${keyword} love! 💖`
  ];
  
  return fallbackTemplates.map(template => 
    tagStr ? `${template} ${tagStr}`.trim() : template
  );
}
