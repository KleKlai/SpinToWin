// app/embed/spin-wheel/page.tsx
'use client';

import { Suspense } from 'react';
import SpinWheel from '@/components/spin-wheel';

export const dynamic = 'force-dynamic';

export default function EmbedSpinWheelPage() {
  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <Suspense fallback={
          <div className="h-[680px] flex items-center justify-center bg-gray-50 animate-pulse">
            <p className="text-lg text-gray-500">Loading spin wheel...</p>
          </div>
        }>
          <SpinWheel
            compact={false}           // ← changed to false → bigger wheel
            autoShow={true}
            showCloseButton={true}
            embedded={true}
            onClose={() => {
              window.parent.postMessage({ type: 'spin-wheel-close' }, '*');
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}