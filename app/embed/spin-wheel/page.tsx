// app/embed/spin-wheel/page.tsx
'use client'

import { Suspense } from 'react'
import SpinWheel from '@/components/spin-wheel'

export default function EmbedSpinWheelPage() {
  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center md:p-6">
      <div 
        className="relative w-full max-w-[min(680px,94vw)] h-[min(720px,88vh)] rounded-2xl shadow-2xl overflow-hidden"
      >
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 animate-pulse">
            Loading wheel...
          </div>
        }>
          <SpinWheel
            compact={false}
            autoShow={true}
            showCloseButton={true}
            embedded={true}
            onClose={() => {
              window.parent.postMessage({ type: 'spin-wheel-close' }, '*')
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}