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
    // Handle both direct data and wrapped input
    const data = req.body || {};
    const input = data.input || data;
    const {
      keyword = "coffee",
      style = "Cute",
      platform = "Instagram",
      hashtags = [],
    } = input;

    console.log('🎯 API received request body:', JSON.stringify(req.body, null, 2));
    console.log('🎯 API received request for keyword:', keyword);
    
    const seed = Math.floor(Math.random() * 1_000_000);
    console.log('🎲 Using seed:', seed);

    const options = await generateSixCaptions({
      keyword, style, platform, hashtags, seed,
    });

    console.log('✅ Generated captions:', options);

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ options });
  } catch (e: any) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: e?.message || "Caption generation failed" });
  }
}
