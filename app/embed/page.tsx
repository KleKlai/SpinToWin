'use client';

import { useState, useEffect } from 'react';
import SpinWheelEmbed from '@/components/embed/SpinWheelEmbed';

export default function EmbedPage() {
  const [isOpen, setIsOpen] = useState(true);

  // Handle messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'CLOSE_SPIN_WHEEL') {
        setIsOpen(false);
        // Notify parent that we're closing
        window.parent.postMessage('EMBED_CLOSED', '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-transparent">
      <SpinWheelEmbed 
        isOpen={isOpen} 
        onClose={() => {
          setIsOpen(false);
          window.parent.postMessage('EMBED_CLOSED', '*');
        }} 
      />
    </div>
  );
}