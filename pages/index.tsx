import React, { useState } from 'react';

// Simple caption state management
function SharedCaptionDisplay({ captions, timestamp }: { captions: string[], timestamp?: number }) {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Generated Captions
        {timestamp && (
          <span className="text-sm text-gray-500 ml-2">
            (Generated at {new Date(timestamp).toLocaleTimeString()})
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {captions.length > 0 ? (
          captions.map((caption, index) => (
            <div
              key={`${timestamp}-${index}`}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {caption}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Generate captions using the caption generator
          </div>
        )}
      </div>
    </div>
  );
}

// Simple caption generator component
function SimpleCaptionGenerator({ onCaptionsGenerated }: { onCaptionsGenerated?: (captions: string[]) => void }) {
  const [keyword, setKeyword] = useState('Game Day');
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [isGeneratingGraphics, setIsGeneratingGraphics] = useState(false);

  const generateCaptions = async () => {
    console.log('🔄 Generating captions for keyword:', keyword);
    setIsGeneratingCaptions(true);
    try {
      const requestBody = { 
        input: {
          keyword,
          style: 'Hype',
          platform: 'Instagram',
          team: 'Your Team',
          hashtags: ['#sports', '#team'],
        }
      };
      
      console.log('📤 Sending request:', requestBody);
      
      const response = await fetch(`/api/captions/generate?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to generate captions');
      }

      const data = await response.json();
      console.log('📋 Received captions:', data.options);
      
      const newCaptions = data.options || [];
      
      if (onCaptionsGenerated) {
        onCaptionsGenerated(newCaptions);
      }
    } catch (err) {
      console.error('❌ Error generating captions:', err);
      if (onCaptionsGenerated) {
        onCaptionsGenerated(['Error generating captions. Please try again.']);
      }
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  const generateGraphics = async () => {
    console.log('🎨 Generating graphics for keyword:', keyword);
    setIsGeneratingGraphics(true);
    try {
      // TODO: Implement graphics generation
      // For now, just show a placeholder message
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      console.log('🎨 Graphics generation completed');
    } catch (err) {
      console.error('❌ Error generating graphics:', err);
    } finally {
      setIsGeneratingGraphics(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[400px]">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Caption Generator
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Keyword
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter keyword..."
          />
        </div>
        
        <div className="space-y-3">
          <button
            onClick={generateCaptions}
            disabled={isGeneratingCaptions || isGeneratingGraphics}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <span>{isGeneratingCaptions ? 'Generating Captions...' : `Regenerate Captions`}</span>
          </button>
          
          <button
            onClick={generateGraphics}
            disabled={isGeneratingCaptions || isGeneratingGraphics}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <span>{isGeneratingGraphics ? 'Generating Graphics...' : `Regenerate Graphics`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [sharedCaptions, setSharedCaptions] = useState<string[]>([]);
  const [captionTimestamp, setCaptionTimestamp] = useState<number | undefined>();

  const handleCaptionsGenerated = (captions: string[]) => {
    setSharedCaptions(captions);
    setCaptionTimestamp(Date.now());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Cedar + Mastra Demo
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Cedar + Mastra
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                This demo shows how Cedar-OS integrates with Mastra agents.
              </p>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Caption Generator:</strong> Generate social media captions and graphics for sports teams.
                </p>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    💡 Use "Regenerate Captions" to create new caption options and "Regenerate Graphics" for visual content.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shared Caption Display */}
          <SharedCaptionDisplay captions={sharedCaptions} timestamp={captionTimestamp} />
        </div>
      </main>

      {/* Caption Generator */}
      <SimpleCaptionGenerator onCaptionsGenerated={handleCaptionsGenerated} />
    </div>
  );
}