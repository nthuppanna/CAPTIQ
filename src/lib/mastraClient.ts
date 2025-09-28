// src/lib/mastraClient.ts
type Payload = {
  team?: string;
  keyword: string;
  style: string;
  platform: string;
  hashtags?: string[];
};

export async function runCaptionAgent(input: Payload): Promise<string[]> {
  // Point to the working cedar-backend API
  const base = "http://localhost:3003/api";
  
  console.log('📤 Sending to API:', input);
  
  // Use Gemini directly (Mastra has compatibility issues)
  const endpoints = [
    "/captions/generate"        // Gemini (working)
  ];

  for (const path of endpoints) {
    try {
      console.log(`🎯 Trying caption endpoint: ${path}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => ({} as any));
        if (Array.isArray(data?.options)) {
          console.log(`✅ Captions from ${path}:`, data.options.length);
          return data.options;
        }
        if (Array.isArray(data?.captions)) {
          console.log(`✅ Captions from ${path}:`, data.captions.length);
          return data.captions;
        }
      } else {
        console.log(`❌ ${path} failed:`, res.status);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ ${path} timeout after 10 seconds`);
      } else {
        console.log(`❌ ${path} error:`, error.message);
      }
    }
  }

  // If all endpoints fail, return fallback captions
  console.log("❌ All caption endpoints failed, using fallback captions");
  return generateFallbackCaptions(input.keyword);
}

function generateFallbackCaptions(keyword: string): string[] {
  const fallbackTemplates = [
    `✨ ${keyword} vibes ✨`,
    `Living my best ${keyword} life! 💕`,
    `Nothing beats a good ${keyword} moment 🥰`,
    `${keyword} = pure happiness! 😊`,
    `My heart is full of ${keyword} joy 🌟`,
    `Sending you all the ${keyword} love! 💖`
  ];
  
  return fallbackTemplates;
}

