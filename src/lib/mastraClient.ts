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
  const base = "http://localhost:3002/api";
  
  // Use Gemini directly (Mastra has compatibility issues)
  const endpoints = [
    "/captions/generate"        // Gemini (working)
  ];

  for (const path of endpoints) {
    try {
      console.log(`🎯 Trying caption endpoint: ${path}`);
      
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

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
      console.log(`❌ ${path} error:`, error.message);
    }
  }

  // If all endpoints fail, return empty array
  console.log("❌ All caption endpoints failed");
  return [];
}

