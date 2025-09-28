import { Mastra } from "@mastra/core";
import { graphicsAgent } from "./agents/graphicsAgent";
import { captionAgent } from "./agents/captionAgent";

export const mastra = new Mastra({
  agents: [graphicsAgent, captionAgent],
});

export { graphicsAgent, captionAgent };
