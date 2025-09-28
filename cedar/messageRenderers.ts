// cedar/messageRenderers.ts
import { MessageRenderer } from 'cedar-os';

export const messageRenderers: Record<string, MessageRenderer> = {
  // Default text message renderer
  text: ({ content }) => (
    <div className="prose prose-sm max-w-none">
      {content}
    </div>
  ),
  
  // Caption list renderer
  captions: ({ content }) => {
    if (Array.isArray(content)) {
      return (
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Generated Captions:</h3>
          <ul className="space-y-1">
            {content.map((caption: string, index: number) => (
              <li key={index} className="p-2 bg-gray-100 rounded text-sm">
                {caption}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return <div>{content}</div>;
  },
};

