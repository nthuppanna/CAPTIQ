import React, { useState, useCallback } from 'react';
import { FloatingContainer } from '@/cedar/components/structural/FloatingContainer';
import Container3D from '@/cedar/components/containers/Container3D';
import Container3DButton from '@/cedar/components/containers/Container3DButton';
import { RefreshCw, Sparkles } from 'lucide-react';

interface CaptionGeneratorProps {
  dimensions?: { minWidth: number; minHeight: number };
  className?: string;
  onCaptionsGenerated?: (captions: string[]) => void;
}

interface CaptionOptions {
  keyword: string;
  style: string;
  platform: string;
  team: string;
  hashtags: string[];
}

export const CaptionGenerator: React.FC<CaptionGeneratorProps> = ({
  dimensions,
  className = '',
  onCaptionsGenerated,
}) => {
  console.log('CaptionGenerator component rendered');

  const [captions, setCaptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<CaptionOptions>({
    keyword: 'Game Day',
    style: 'Hype',
    platform: 'Instagram',
    team: 'Your Team',
    hashtags: ['#sports', '#team'],
  });

  const generateCaptions = useCallback(async () => {
    console.log('generateCaptions called with options:', options);
    setIsGenerating(true);
    try {
      const response = await fetch('/api/captions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: options }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate captions');
      }

      const data = await response.json();
      console.log('Received captions from API:', data.options);
      const newCaptions = data.options || [];
      setCaptions(newCaptions);

      // Also update the shared caption state
      if (onCaptionsGenerated) {
        onCaptionsGenerated(newCaptions);
      }

    } catch (err: any) {
      console.error('Error generating captions:', err);
      const errorCaptions = ['Error generating captions. Please try again.'];
      setCaptions(errorCaptions);
      if (onCaptionsGenerated) {
        onCaptionsGenerated(errorCaptions);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [options, onCaptionsGenerated]);

  const updateOption = useCallback((key: keyof CaptionOptions, value: string | string[]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <FloatingContainer
      dimensions={dimensions}
      className={`p-6 ${className}`}
    >
      <Container3D className="h-full">
        <div className="flex flex-col h-full space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Caption Generator
            </h2>
          </div>

          {/* Input Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Keyword
              </label>
              <input
                type="text"
                value={options.keyword}
                onChange={(e) => updateOption('keyword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter keyword..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Style
              </label>
              <select
                value={options.style}
                onChange={(e) => updateOption('style', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Hype">Hype</option>
                <option value="Motivational">Motivational</option>
                <option value="Celebratory">Celebratory</option>
                <option value="Competitive">Competitive</option>
                <option value="Casual">Casual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Platform
              </label>
              <select
                value={options.platform}
                onChange={(e) => updateOption('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="Instagram">Instagram</option>
                <option value="Twitter">Twitter</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Team
              </label>
              <input
                type="text"
                value={options.team}
                onChange={(e) => updateOption('team', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Team name..."
              />
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Container3DButton
              onClick={generateCaptions}
              disabled={isGenerating}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generating...' : 'Regenerate Captions & Graphics'}</span>
            </Container3DButton>
          </div>

          {/* Generated Captions */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
              Generated Captions
            </h3>
            <div className="space-y-2">
              {captions.length > 0 ? (
                captions.map((caption, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-blue-500"
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {caption}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Click "Regenerate Captions & Graphics" to generate captions
                </div>
              )}
            </div>
          </div>
        </div>
      </Container3D>
    </FloatingContainer>
  );
};