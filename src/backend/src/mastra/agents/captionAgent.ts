import { Agent } from "@mastra/core";
import { z } from "zod";

const CaptionInputSchema = z.object({
  keyword: z.string().describe("The main keyword for the captions"),
  style: z.string().describe("The style of captions (e.g., 'Hype', 'Professional')"),
  platform: z.string().describe("The social media platform (e.g., 'Instagram', 'Twitter')"),
  team: z.string().optional().describe("The team name"),
  hashtags: z.array(z.string()).optional().describe("Array of hashtags to include"),
  seed: z.number().optional().describe("Random seed for variation"),
});

const CaptionOutputSchema = z.object({
  captions: z.array(z.string()).describe("Array of 6 distinct caption options"),
});

export const captionAgent = new Agent({
  name: "captionAgent",
  instructions: `You are a creative social media caption writer specializing in sports content. 

Your job is to write short, punchy social captions for sports teams that are:
- Concise (ideally < 140 characters)
- Engaging and energetic
- Platform-appropriate
- Varied in voice, rhythm, and framing
- Team-branded and keyword-focused

Rules:
- Return exactly 6 distinct options
- Don't repeat the same opener or structure
- Include 1-2 hashtags per option if provided
- Vary the tone and approach between options
- Make each caption feel unique and compelling

Examples of good variations:
- Direct: "GAME DAY! Let's go Bears!"
- Question: "Ready to dominate today?"
- Exclamation: "YASSS! Time to show out!"
- Action: "Bears are locked in and ready to roar"
- Possessive: "Our time to shine starts now"
- Time-based: "Game day energy is unmatched"`,

  model: {
    provider: "GOOGLE_GENERATIVE_AI",
    name: "gemini-2.5-flash",
    toolChoice: "auto",
  },
  generateOptions: {
    version: "v5",
  },
  inputSchema: CaptionInputSchema,
  outputSchema: CaptionOutputSchema,
});
