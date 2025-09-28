import type { NextApiRequest, NextApiResponse } from "next";

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
      keyword, 
      teamName, 
      primaryColor, 
      secondaryColor, 
      logoEmoji, 
      count = 4 
    } = req.body;

    if (!keyword || !teamName) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(400).json({ error: "Missing required fields: keyword, teamName" });
      return;
    }

    console.log('🎨 Calling Mastra graphics agent for:', { keyword, teamName, count });

    // Call the Mastra graphics agent
    const response = await fetch('http://localhost:4111/agents/graphicsAgent/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        keyword,
        teamName,
        primaryColor: primaryColor || '#3B82F6',
        secondaryColor: secondaryColor || '#1E40AF',
        logoEmoji: logoEmoji || '🏀',
        count
      }),
    });

    if (!response.ok) {
      throw new Error(`Mastra agent error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Mastra generated graphics:', data);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ 
      graphics: data.graphics || [],
      count: data.graphics?.length || 0
    });

  } catch (error: any) {
    console.error("Mastra graphics API error:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ 
      error: error?.message || "Mastra graphics generation failed" 
    });
  }
}

