import { defineConfig } from "@mastra/core";

export default defineConfig({
  agents: [
    "./src/mastra/agents/graphicsAgent.ts",
    "./src/mastra/agents/captionAgent.ts"
  ],
  server: {
    port: 4111,
  },
});
