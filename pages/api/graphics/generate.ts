import type { NextApiRequest, NextApiResponse } from "next";
import { gemini, getModelName } from "../../../lib/gemini";

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
    const { 
      keyword, 
      teamName, 
      primaryColor, 
      secondaryColor, 
      logoEmoji,
      imageData, // Base64 encoded image
      count = 4 
    } = req.body;

    if (!keyword || !teamName) {
      return res.status(400).json({ error: "Missing required fields: keyword, teamName" });
    }

    console.log('🎨 Generating graphics for:', { keyword, teamName, count });

    // For now, let's use the regular Gemini model to generate image descriptions
    // and create placeholder graphics. In the future, we can integrate with actual image generation.
    const model = gemini.getGenerativeModel({
      model: getModelName(), // Use the regular text model
    });

    const prompt = `You are a creative graphics designer. Create exactly ${count} different social media graphic concepts for a sports team called "${teamName}".

Requirements:
- Keyword: "${keyword}"
- Team colors: Primary ${primaryColor || '#3B82F6'}, Secondary ${secondaryColor || '#1E40AF'}
- Logo emoji: ${logoEmoji || '🏀'}
- Style: Modern, energetic, sports-focused
- Format: Square aspect ratio (1:1)

For each graphic, create DIFFERENT text variations related to "${keyword}". Examples:
- If keyword is "Game Day": "GAME DAY", "LET'S GO", "TIME TO PLAY", "GAME ON"
- If keyword is "Victory": "VICTORY", "WE WON", "CHAMPIONS", "DOMINATED"
- If keyword is "Championship": "CHAMPIONSHIP", "FINAL", "TITLE TIME", "CROWN US"

IMPORTANT: Return ONLY valid JSON array with exactly ${count} objects. No other text before or after the JSON.

[
  {
    "displayText": "DIFFERENT_TEXT_VARIATION_FOR_KEYWORD",
    "backgroundStyle": "gradient",
    "textBoxPosition": "bottom",
    "textBoxStyle": "rounded",
    "textStyle": "bold",
    "textColor": "white",
    "additionalEffects": "shadow",
    "mood": "energetic"
  }
]`;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    let graphics = [];
    try {
      // Try to extract JSON from the response (in case Gemini adds extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) {
        graphics = parsed;
        console.log('✅ Successfully parsed Gemini JSON response');
      }
    } catch (e) {
      console.log('Failed to parse JSON, using fallback. Error:', e.message);
      console.log('Raw response:', text.substring(0, 200) + '...');
      
      // Create fallback graphics descriptions
      const textVariations = [
        keyword.toUpperCase(),
        `LET'S GO ${keyword.toUpperCase()}`,
        `${keyword.toUpperCase()} TIME`,
        `READY FOR ${keyword.toUpperCase()}`
      ];
      
      graphics = Array.from({length: count}, (_, i) => ({
        displayText: textVariations[i % textVariations.length],
        backgroundStyle: i % 2 === 0 ? 'gradient' : 'solid',
        textBoxPosition: i % 2 === 0 ? 'bottom' : 'top',
        textBoxStyle: i % 2 === 0 ? 'rounded' : 'sharp',
        textStyle: i % 2 === 0 ? 'bold' : 'normal',
        textColor: 'white',
        additionalEffects: i % 2 === 0 ? 'shadow' : 'border',
        mood: i % 2 === 0 ? 'energetic' : 'professional'
      }));
    }

    console.log('✅ Generated graphics concepts:', graphics.length);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(200).json({ 
      graphics: graphics,
      count: graphics.length 
    });

  } catch (error: any) {
    console.error("Graphics generation API error:", error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ 
      error: error?.message || "Graphics generation failed" 
    });
  }
}
