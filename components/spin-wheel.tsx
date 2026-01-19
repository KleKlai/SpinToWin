'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DEFAULT_WHEEL_PRIZES, WHEEL_CONFIG, Prize, getWeightedRandomPrize } from '@/lib/wheel-constants'
import { motion } from 'framer-motion'

interface SpinWheelProps {
  prizes?: Prize[]
}

export default function SpinWheel({ prizes = DEFAULT_WHEEL_PRIZES }: SpinWheelProps) {
  const PRIZES = prizes
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [winner, setWinner] = useState<Prize | null>(null)
  const [wheelSize, setWheelSize] = useState(500)

  // Update wheel size based on screen width
  useEffect(() => {
    const updateWheelSize = () => {
      if (typeof window === 'undefined') return
      
      const screenWidth = window.innerWidth
      if (screenWidth < 640) { // Mobile
        setWheelSize(300)
      } else if (screenWidth < 768) { // Tablet
        setWheelSize(400)
      } else { // Desktop
        setWheelSize(500)
      }
    }

    updateWheelSize()
    window.addEventListener('resize', updateWheelSize)
    
    return () => window.removeEventListener('resize', updateWheelSize)
  }, [])

  const drawWheel = (ctx: CanvasRenderingContext2D, currentRotation: number, size: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 20

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw segments
    const segmentAngle = (2 * Math.PI) / PRIZES.length

    PRIZES.forEach((prize, index) => {
      const startAngle = index * segmentAngle - (currentRotation * Math.PI / 180)
      const endAngle = startAngle + segmentAngle

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = prize.color
      ctx.fill()
      ctx.strokeStyle = WHEEL_CONFIG.segmentBorder
      ctx.lineWidth = WHEEL_CONFIG.segmentBorderWidth
      ctx.stroke()

      // Draw text - adjust font size based on wheel size
      const textAngle = startAngle + segmentAngle / 2
      const textRadius = radius * 0.65
      const textX = centerX + Math.cos(textAngle) * textRadius
      const textY = centerY + Math.sin(textAngle) * textRadius

      ctx.save()
      ctx.translate(textX, textY)
      ctx.rotate(textAngle + Math.PI / 2)
      ctx.fillStyle = WHEEL_CONFIG.textColor
      
      // Responsive font size
      const fontSize = size < 400 ? 'bold 10px sans-serif' : 
                      size < 500 ? 'bold 12px sans-serif' : 
                      'bold 16px sans-serif'
      ctx.font = fontSize
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Truncate text if too long for mobile
      let displayText = prize.name
      if (size < 400 && prize.name.length > 10) {
        displayText = prize.name.replace('% Discount', '%')
      }
      ctx.fillText(displayText, 0, 0)
      ctx.restore()
    })

    // Draw center circle
    const centerCircleRadius = size < 400 ? 20 : size < 500 ? 25 : WHEEL_CONFIG.centerCircleRadius
    const centerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, centerCircleRadius
    )
    centerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
    centerGradient.addColorStop(1, 'rgba(240, 240, 240, 0.2)')
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, centerCircleRadius, 0, 2 * Math.PI)
    ctx.fillStyle = centerGradient
    ctx.fill()
    ctx.strokeStyle = 'rgba(51, 51, 51, 0.3)'
    ctx.lineWidth = WHEEL_CONFIG.segmentBorderWidth
    ctx.stroke()

    // Draw decorative inner circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, centerCircleRadius - 5, 0, 2 * Math.PI)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw pointer indicator at top - responsive size
    const pointerSize = size < 400 ? 12 : size < 500 ? 15 : 18
    const pointerHeight = size < 400 ? 40 : size < 500 ? 50 : 60
    
    ctx.beginPath()
    ctx.moveTo(centerX - pointerSize, 15)
    ctx.lineTo(centerX + pointerSize, 15)
    ctx.lineTo(centerX, pointerHeight)
    ctx.closePath()
    
    const pointerGradient = ctx.createLinearGradient(
      centerX - pointerSize, 15, 
      centerX + pointerSize, pointerHeight
    )
    pointerGradient.addColorStop(0, '#ff0000')
    pointerGradient.addColorStop(1, '#cc0000')
    ctx.fillStyle = pointerGradient
    ctx.fill()
    
    ctx.strokeStyle = '#990000'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Add a highlight effect to the pointer
    ctx.beginPath()
    ctx.moveTo(centerX - pointerSize * 0.7, 18)
    ctx.lineTo(centerX + pointerSize * 0.7, 18)
    ctx.lineTo(centerX, pointerHeight - 5)
    ctx.closePath()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fill()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = wheelSize
    canvas.height = wheelSize
    
    drawWheel(ctx, rotation, wheelSize)
  }, [rotation, wheelSize])

  // Function to get which prize is at the pointer position
  const getPrizeAtPointer = (currentRotation: number): Prize => {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360
    const pointerAngle = 270
    const segmentAngle = 360 / PRIZES.length
    const adjustedAngle = (pointerAngle + normalizedRotation) % 360
    const segmentIndex = Math.floor(adjustedAngle / segmentAngle)
    
    return PRIZES[segmentIndex % PRIZES.length]
  }

  // Function to open GoHighLevel popup form
  const openGoHighLevelPopup = (prizeName: string) => {
    const discountMatch = prizeName.match(/(\d+)%/)
    const discountValue = discountMatch ? discountMatch[1] : '0'
    
    const formUrl = `https://api.leadconnectorhq.com/widget/form/RiifQcsGiB7V1X1KHOcK?key=${encodeURIComponent(discountValue)}`
    
    const modalOverlay = document.createElement('div')
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    `

    const modalContainer = document.createElement('div')
    modalContainer.style.cssText = `
      position: relative;
      width: 95%;
      max-width: 500px;
      max-height: 90vh;
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
    `

    const closeButton = document.createElement('button')
    closeButton.innerHTML = '×'
    closeButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      border: 2px solid #e0e0e0;
      font-size: 28px;
      color: #666;
      line-height: 1;
      cursor: pointer;
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    `

    closeButton.onmouseenter = () => {
      closeButton.style.background = '#f8f8f8'
      closeButton.style.borderColor = '#999'
      closeButton.style.color = '#333'
    }

    closeButton.onmouseleave = () => {
      closeButton.style.background = 'white'
      closeButton.style.borderColor = '#e0e0e0'
      closeButton.style.color = '#666'
    }

    const iframe = document.createElement('iframe')
    iframe.src = formUrl
    iframe.style.cssText = `
      width: 100%;
      height: 500px;
      border: none;
      border-radius: 20px;
    `

    const style = document.createElement('style')
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `
    document.head.appendChild(style)

    modalContainer.appendChild(closeButton)
    modalContainer.appendChild(iframe)
    modalOverlay.appendChild(modalContainer)
    document.body.appendChild(modalOverlay)

    document.body.style.overflow = 'hidden'

    const closeModal = () => {
      modalOverlay.style.animation = 'fadeOut 0.3s ease forwards'
      setTimeout(() => {
        if (document.body.contains(modalOverlay)) {
          document.body.removeChild(modalOverlay)
        }
        document.body.style.overflow = 'auto'
      }, 300)
    }

    closeButton.addEventListener('click', closeModal)
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal()
    })

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handleEscape)
  }

  const handleSpin = () => {
    console.log('Spin button clicked!')
    if (isSpinning) return

    setIsSpinning(true)
    setWinner(null)

    const spins = Math.random() * (WHEEL_CONFIG.maxSpins - WHEEL_CONFIG.minSpins) + WHEEL_CONFIG.minSpins
    const randomRotation = Math.random() * 360
    
    const totalRotation = rotation + spins * 360 + randomRotation
    const duration = WHEEL_CONFIG.spinDuration
    const startTime = Date.now()
    const startRotation = rotation

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOut = 1 - Math.pow(1 - progress, WHEEL_CONFIG.stopEasing)
      const currentRotation = startRotation + (totalRotation - startRotation) * easeOut

      setRotation(currentRotation % 360)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        const finalRotation = currentRotation % 360
        const winningPrize = getPrizeAtPointer(finalRotation)
        
        setIsSpinning(false)
        setWinner(winningPrize)
        
        setTimeout(() => {
          openGoHighLevelPopup(winningPrize.name)
        }, 1500)
      }
    }

    requestAnimationFrame(animate)
  }

  // Calculate button size based on wheel size
  const buttonSize = wheelSize < 400 ? 80 : 
                    wheelSize < 500 ? 100 : 
                    128

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-100 flex flex-col items-center justify-center gap-6 p-4">
      <div className="text-center space-y-2 md:space-y-3">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Spin The Wheel
        </h1>
        <p className="text-gray-700 text-base md:text-lg font-medium">Try your luck and win amazing prizes!</p>
      </div>

      {/* Wheel Container */}
      <div 
        ref={containerRef}
        className="relative"
        style={{ width: wheelSize, height: wheelSize }}
      >
        {/* Canvas Wheel */}
        <canvas
          ref={canvasRef}
          width={wheelSize}
          height={wheelSize}
          className="drop-shadow-xl md:drop-shadow-2xl absolute top-0 left-0 pointer-events-none"
          style={{ pointerEvents: 'none' }}
        />
        
        {/* Spin Button positioned at the center */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <motion.div
            animate={isSpinning ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.5 }}
            className="relative"
          >
            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`
                rounded-full 
                bg-gradient-to-br from-orange-500 via-pink-500 to-red-600
                hover:from-orange-600 hover:via-pink-600 hover:to-red-700
                text-white font-bold
                shadow-xl md:shadow-2xl hover:shadow-3xl
                border-4 border-white
                transform transition-all duration-300
                hover:scale-105 active:scale-95
                relative z-20
                ${isSpinning ? 'cursor-not-allowed opacity-90' : ''}
              `}
              style={{
                width: buttonSize,
                height: buttonSize
              }}
            >
              <div className="flex flex-col items-center justify-center">
                {isSpinning ? (
                  <>
                    <span className="text-sm md:text-base">Spinning...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl md:text-2xl font-black">SPIN</span>
                    <span className="text-base md:text-lg font-semibold">NOW!</span>
                  </>
                )}
              </div>
            </Button>
            
            {/* Decorative ring around button */}
            <div className="absolute inset-0 rounded-full border-4 border-white/30 -m-2"></div>
            <div className="absolute inset-0 rounded-full border-4 border-white/20 -m-4"></div>
          </motion.div>
        </div>
        
        {/* Pointer decoration */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-5">
          <div className="w-[5px] bg-gradient-to-b from-red-600 to-red-800 mx-auto"></div>
        </div>
      </div>

      {/* Winner Banner - Responsive */}
      <div className="flex flex-col items-center gap-4 md:gap-6">
        {winner && (
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="animate-pulse bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 text-white px-6 py-4 md:px-10 md:py-6 rounded-2xl md:rounded-3xl font-bold text-lg md:text-2xl shadow-xl md:shadow-2xl border-4 border-white"
          >
            🎉 You won: <span className="text-yellow-300">{winner.name}</span>! 🎉
          </motion.div>
        )}
      </div>
      
      {/* Add custom CSS for spin animation */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        /* Mobile optimizations */
        @media (max-width: 640px) {
          .text-responsive {
            font-size: clamp(0.875rem, 3vw, 1rem);
          }
        }
      `}</style>
    </main>
  )
}