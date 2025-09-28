import { Mastra } from "@mastra/core";
import { graphicsAgent } from "./src/mastra/agents/graphicsAgent.mjs";

const mastra = new Mastra({
  agents: [graphicsAgent],
});

export default mastra;

