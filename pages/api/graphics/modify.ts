import type { NextApiRequest, NextApiResponse } from "next";
import { gemini, getModelName } from "../../../lib/gemini";

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
    const { 
      modificationRequest, 
      keyword, 
      teamName, 
      primaryColor, 
      secondaryColor, 
      logoEmoji 
    } = req.body;

    if (!modificationRequest || !keyword || !teamName) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(400).json({ error: "Missing required fields: modificationRequest, keyword, teamName" });
      return;
    }

    console.log('🎨 Modifying graphic with request:', modificationRequest);

    // Simple color detection without API call (to avoid rate limits)
    const request = modificationRequest.toLowerCase();
    let modifiedInstruction = { textColor: 'blue' }; // Default fallback
    
    if (request.includes('red')) {
      modifiedInstruction = { textColor: 'red' };
    } else if (request.includes('green')) {
      modifiedInstruction = { textColor: 'green' };
    } else if (request.includes('yellow')) {
      modifiedInstruction = { textColor: 'yellow' };
    } else if (request.includes('purple')) {
      modifiedInstruction = { textColor: 'purple' };
    } else if (request.includes('orange')) {
      modifiedInstruction = { textColor: 'orange' };
    } else if (request.includes('white')) {
      modifiedInstruction = { textColor: 'white' };
    } else if (request.includes('black')) {
      modifiedInstruction = { textColor: 'black' };
    } else if (request.includes('blue')) {
      modifiedInstruction = { textColor: 'blue' };
    }
    
    console.log('🎨 Detected color:', modifiedInstruction.textColor);

    console.log('✅ Generated modification instructions:', modifiedInstruction);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ 
      graphics: [modifiedInstruction],
      count: 1
    });

  } catch (error: any) {
    console.error("Graphics modification API error:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ 
      error: error?.message || "Graphics modification failed" 
    });
  }
}
