import type { NextApiRequest, NextApiResponse } from "next";
import { captionAgent } from "../../../src/backend/src/mastra/agents/captionAgent";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    // Handle both direct input and nested input structure
    const input = req.body.input || req.body;
    const { 
      keyword, 
      style, 
      platform, 
      team, 
      hashtags = [],
      seed 
    } = input;

    if (!keyword || !style || !platform) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(400).json({ error: "Missing required fields: keyword, style, platform" });
      return;
    }

    console.log('🎯 Calling Mastra caption agent directly for:', { keyword, style, platform, team });

    // Call the Mastra agent directly
    const result = await captionAgent.generateVNext({
      keyword,
      style,
      platform,
      team: team || "Your Team",
      hashtags,
      seed: seed || Math.floor(Math.random() * 1_000_000)
    });

    console.log('✅ Mastra generated captions:', result);

    // Extract captions from the result
    const captions = result.captions || [];
    
    if (!Array.isArray(captions) || captions.length === 0) {
      throw new Error('No captions returned from Mastra agent');
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ 
      options: captions,
      count: captions.length
    });

  } catch (error: any) {
    console.error("Mastra captions API error:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ 
      error: error?.message || "Mastra captions generation failed" 
    });
  }
}
