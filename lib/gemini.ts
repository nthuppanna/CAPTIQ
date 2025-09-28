// cedar-backend/lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in cedar-backend/.env");
}

// Singleton client
export const gemini = new GoogleGenerativeAI(apiKey);

/** Central place to choose the model name. */
export function getModelName(): string {
  // You can override via env if you want
  return process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
}