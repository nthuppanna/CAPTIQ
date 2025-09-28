// pages/cedar.tsx - Cedar-OS + Mastra integration
import React, { useState } from 'react';
import { CedarCopilot } from 'cedar-os';
import { messageRenderers } from '../cedar/messageRenderers';
import { responseHandlers } from '../cedar/responseHandlers';

export default function CedarPage() {
  const [captions, setCaptions] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('Game Day');
  const [team, setTeam] = useState('Bay City Bears');

  // Configure Mastra agent connection
  const agentConnection = {
    provider: 'mastra',
    baseUrl: 'http://localhost:4111',
    agentName: 'captionAgent',
    apiKey: process.env.GEMINI_API_KEY,
  };

  // Configure LLM provider for Mastra
  const llmProvider = {
    provider: 'mastra',
    route: '/api/agents/captionAgent/run',
    model: 'gemini-2.5-flash',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Cedar-OS + Mastra Integration</h1>
        
        {/* Input Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Caption Generation</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Keyword</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter keyword..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team Name</label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter team name..."
              />
            </div>
          </div>
        </div>

        {/* Generated Captions Display */}
        {captions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Generated Captions</h2>
            <div className="space-y-2">
              {captions.map((caption, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                  {caption}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cedar Chat Interface */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">AI Assistant</h2>
          <CedarCopilot
            agentConnection={agentConnection}
            llmProvider={llmProvider}
            messageRenderers={messageRenderers}
            responseHandlers={responseHandlers}
            context={{
              keyword,
              team,
              updateCaptions: setCaptions,
            }}
            placeholder="Ask me to generate captions for your team..."
            className="min-h-[400px]"
          />
        </div>
      </div>
    </div>
  );
}

