import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the AutoNarrate App component
const AutoNarrateApp = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading AutoNarrate...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return <AutoNarrateApp />;
}