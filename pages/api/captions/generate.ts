import type { NextApiRequest, NextApiResponse } from "next";
import { generateSixCaptions } from "../../../lib/captions";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS + preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { input = {} } = (req.body || {}) as any;
    const {
      keyword = "Game Day",
      style = "Hype",
      platform = "Instagram",
      hashtags = [],
      team = "Your Team",
    } = input;

    console.log('🎯 API received request for keyword:', keyword);
    
    const seed = Math.floor(Math.random() * 1_000_000);
    console.log('🎲 Using seed:', seed);

    const options = await generateSixCaptions({
      keyword, style, platform, team, hashtags, seed,
    });

    console.log('✅ Generated captions:', options);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ options });
  } catch (e: any) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: e?.message || "Caption generation failed" });
  }
}
