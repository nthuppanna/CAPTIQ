import type { NextApiRequest, NextApiResponse } from "next";

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
    // This endpoint should redirect to the Mastra backend
    // The Cedar store should be configured to call the Mastra backend directly
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ 
      message: "This endpoint is deprecated. Please use the Mastra backend at http://localhost:4111/chat/stream" 
    });
  } catch (e: any) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(500).json({ error: e?.message || "Agent endpoint error" });
  }
}
