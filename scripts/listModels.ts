// scripts/listModels.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
(async () => {
  const models = await (client as any).models.list(); // typed as any for quick script
  console.log(models);
})();
