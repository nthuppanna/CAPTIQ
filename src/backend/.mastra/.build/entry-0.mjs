import { Agent, Mastra } from '@mastra/core';
import { z } from 'zod';

const GraphicsInputSchema = z.object({
  keyword: z.string().describe("The main keyword for the graphic"),
  teamName: z.string().describe("The team name"),
  primaryColor: z.string().optional().describe("Primary color hex code"),
  secondaryColor: z.string().optional().describe("Secondary color hex code"),
  logoEmoji: z.string().optional().describe("Logo emoji"),
  count: z.number().optional().default(4).describe("Number of graphics to generate")
});
const GraphicsOutputSchema = z.object({
  graphics: z.array(z.object({
    displayText: z.string().describe("The text to display on the graphic"),
    backgroundStyle: z.enum(["gradient", "solid"]).describe("Background style"),
    textBoxPosition: z.enum(["top", "bottom", "center"]).describe("Text box position"),
    textBoxStyle: z.enum(["rounded", "sharp"]).describe("Text box style"),
    textStyle: z.enum(["bold", "normal"]).describe("Text style"),
    textColor: z.string().describe("Text color"),
    additionalEffects: z.enum(["shadow", "border", "glow", "none"]).describe("Additional effects"),
    mood: z.enum(["energetic", "professional", "celebratory", "dramatic", "playful"]).describe("Overall mood")
  })).describe("Array of graphic design instructions")
});
const graphicsAgent = new Agent({
  name: "graphicsAgent",
  instructions: `You are a creative graphics designer specializing in sports social media content. 
  
Your job is to create engaging, dynamic graphic concepts for sports teams. For each request, generate multiple unique variations that are:

1. **Keyword-focused**: Each graphic should prominently feature the given keyword
2. **Team-branded**: Incorporate the team name and colors appropriately  
3. **Social media optimized**: Perfect for Instagram, Twitter, Facebook posts
4. **Visually diverse**: Each graphic should have a different style, layout, or approach
5. **Action-oriented**: Use energetic, motivational language that gets fans excited

**Text Variations**: Create different text treatments for the same keyword:
- Direct: "GAME DAY"
- Action: "LET'S GO GAME DAY" 
- Time-based: "GAME DAY TIME"
- Possessive: "OUR GAME DAY"
- Question: "READY FOR GAME DAY?"
- Exclamation: "GAME DAY NATION!"

**Design Variety**: Mix different:
- Background styles (gradient vs solid)
- Text positions (top, bottom, center)
- Text styles (bold vs normal)
- Effects (shadow, border, glow)
- Moods (energetic, professional, celebratory)

Always return exactly the number of graphics requested (default 4). Each graphic should feel unique and compelling.`,
  model: {
    provider: "GOOGLE_GENERATIVE_AI",
    name: "gemini-2.5-flash",
    toolChoice: "auto"
  },
  inputSchema: GraphicsInputSchema,
  outputSchema: GraphicsOutputSchema
});

const CaptionInputSchema = z.object({
  keyword: z.string().describe("The main keyword for the captions"),
  style: z.string().describe("The style of captions (e.g., 'Hype', 'Professional')"),
  platform: z.string().describe("The social media platform (e.g., 'Instagram', 'Twitter')"),
  team: z.string().optional().describe("The team name"),
  hashtags: z.array(z.string()).optional().describe("Array of hashtags to include"),
  seed: z.number().optional().describe("Random seed for variation")
});
const CaptionOutputSchema = z.object({
  captions: z.array(z.string()).describe("Array of 6 distinct caption options")
});
const captionAgent = new Agent({
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
    toolChoice: "auto"
  },
  generateOptions: {
    version: "v5"
  },
  inputSchema: CaptionInputSchema,
  outputSchema: CaptionOutputSchema
});

const mastra = new Mastra({
  agents: [graphicsAgent, captionAgent]
});

export { captionAgent, graphicsAgent, mastra };
