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
      style, 
      platform, 
      team, 
      hashtags = [],
      seed 
    } = req.body;

    if (!keyword || !style || !platform) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(400).json({ error: "Missing required fields: keyword, style, platform" });
      return;
    }

    console.log('🎯 Calling Mastra caption agent for:', { keyword, style, platform, team });

    // Try different Mastra endpoint formats
    const endpoints = [
      'http://localhost:4111/agents/captionAgent/run',
      'http://localhost:4111/api/agents/captionAgent/run',
      'http://localhost:4111/captionAgent/run',
      'http://localhost:4111/run/captionAgent'
    ];

    let response;
    let lastError;

    for (const endpoint of endpoints) {
      try {
        console.log('Trying endpoint:', endpoint);
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keyword,
            style,
            platform,
            team: team || "Your Team",
            hashtags,
            seed: seed || Math.floor(Math.random() * 1_000_000)
          }),
        });

        if (response.ok) {
          console.log('✅ Success with endpoint:', endpoint);
          break;
        } else {
          console.log('❌ Failed with endpoint:', endpoint, response.status);
        }
      } catch (error) {
        lastError = error;
        console.log('❌ Error with endpoint:', endpoint, error.message);
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Mastra agent error: ${response?.status || 'No response'} ${lastError?.message || 'All endpoints failed'}`);
    }

    const data = await response.json();
    console.log('✅ Mastra generated captions:', data);

    // Extract captions from the response
    const captions = data.captions || data.output?.captions || data.result?.captions || [];
    
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

