'use client'

import { Suspense, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useState } from 'react'

// Dynamically import SpinWheel to avoid SSR issues with canvas
const SpinWheelNoSSR = dynamic(
  () => import('@/components/spin-wheel'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Loading spin wheel...</p>
        </div>
      </div>
    )
  }
)

export default function EmbedPage() {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    
    // Set body styles to ensure proper display in iframe
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    
    // Clean up
    return () => {
      document.body.style.margin = ''
      document.body.style.padding = ''
      document.body.style.overflow = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
  }, [])

  // Communication with parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Listen for messages from parent
      if (event.data.type === 'WHEEL_RESET') {
        // You can add logic to reset the wheel if needed
        console.log('Reset requested from parent')
      }
    }

    window.addEventListener('message', handleMessage)
    
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100">
      <Suspense 
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mb-4"></div>
              <p className="text-gray-600">Loading spin wheel...</p>
            </div>
          </div>
        }
      >
        <SpinWheelNoSSR />
      </Suspense>
    </div>
  )
}