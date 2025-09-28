import { NextApiRequest, NextApiResponse } from 'next';
import { generateSixCaptions } from '../../../lib/captions';

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
    const { text } = req.body;
    
    if (!text) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(400).json({ error: "Text is required" });
    }

    // Simple color mapping instead of using Gemini
    const colorMap = {
      'blue': '#0000FF',
      'red': '#FF0000',
      'green': '#00FF00',
      'yellow': '#FFFF00',
      'purple': '#800080',
      'orange': '#FFA500',
      'pink': '#FFC0CB',
      'black': '#000000',
      'white': '#FFFFFF',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'lime': '#00FF00',
      'navy': '#000080',
      'teal': '#008080',
      'maroon': '#800000',
      'olive': '#808000',
      'gray': '#808080',
      'grey': '#808080',
      'silver': '#C0C0C0',
      'gold': '#FFD700'
    };

    // Extract color from text (case insensitive)
    const lowerText = text.toLowerCase();
    let foundColor = '#FFFFFF'; // default
    
    for (const [colorName, hexCode] of Object.entries(colorMap)) {
      if (lowerText.includes(colorName)) {
        foundColor = hexCode;
        break;
      }
    }
    
    console.log(`🎨 Color interpretation: "${text}" → ${foundColor}`);
    
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ color: foundColor });
  } catch (error: any) {
    console.error('Color interpretation error:', error);
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: error.message || "Color interpretation failed" });
  }
}
