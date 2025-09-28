// cedar/responseHandlers.ts
import { ResponseHandler } from 'cedar-os';

export const responseHandlers: Record<string, ResponseHandler> = {
  // Handle caption generation responses
  generateCaptions: async (response, context) => {
    try {
      const data = await response.json();
      if (data.captions && Array.isArray(data.captions)) {
        // Update the shared state with new captions
        if (context.updateCaptions) {
          context.updateCaptions(data.captions);
        }
        return {
          type: 'captions',
          content: data.captions
        };
      }
      return {
        type: 'text',
        content: 'Failed to generate captions'
      };
    } catch (error) {
      console.error('Error handling caption response:', error);
      return {
        type: 'text',
        content: 'Error generating captions'
      };
    }
  },
};

