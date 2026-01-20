'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_WHEEL_PRIZES, WHEEL_CONFIG, Prize, getWeightedRandomPrize } from '@/lib/wheel-constants';

interface SpinWheelEmbedProps {
  isOpen: boolean;
  onClose: () => void;
  prizes?: Prize[];
}

export default function SpinWheelEmbed({ isOpen, onClose, prizes = DEFAULT_WHEEL_PRIZES }: SpinWheelEmbedProps) {
  const PRIZES = prizes;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Prize | null>(null);
  const [wheelSize, setWheelSize] = useState(400);

  // Update wheel size based on container
  const updateWheelSize = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const containerWidth = document.getElementById('spin-wheel-container')?.offsetWidth || 400;
    const maxSize = Math.min(containerWidth, 500);
    const minSize = 280;
    setWheelSize(Math.max(minSize, maxSize));
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateWheelSize();
      window.addEventListener('resize', updateWheelSize);
    }
    
    return () => window.removeEventListener('resize', updateWheelSize);
  }, [isOpen, updateWheelSize]);

  const drawWheel = (ctx: CanvasRenderingContext2D, currentRotation: number, size: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    const segmentAngle = (2 * Math.PI) / PRIZES.length;

    PRIZES.forEach((prize, index) => {
      const startAngle = index * segmentAngle - (currentRotation * Math.PI / 180);
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      const textAngle = startAngle + segmentAngle / 2;
      const textRadius = radius * 0.65;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = 'white';
      ctx.font = size < 350 ? 'bold 10px sans-serif' : 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      let displayText = prize.name;
      if (size < 350 && prize.name.length > 10) {
        displayText = prize.name.replace('% Discount', '%');
      }
      ctx.fillText(displayText, 0, 0);
      ctx.restore();
    });

    // Draw center circle
    const centerCircleRadius = size < 350 ? 15 : 20;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerCircleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pointer
    const pointerSize = size < 350 ? 10 : 14;
    const pointerHeight = size < 350 ? 35 : 45;
    
    ctx.beginPath();
    ctx.moveTo(centerX - pointerSize, 10);
    ctx.lineTo(centerX + pointerSize, 10);
    ctx.lineTo(centerX, pointerHeight);
    ctx.closePath();
    ctx.fillStyle = '#ff0000';
    ctx.fill();
  };

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = wheelSize;
    canvas.height = wheelSize;
    drawWheel(ctx, rotation, wheelSize);
  }, [rotation, wheelSize, isOpen]);

  const getPrizeAtPointer = (currentRotation: number): Prize => {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const pointerAngle = 270;
    const segmentAngle = 360 / PRIZES.length;
    const adjustedAngle = (pointerAngle + normalizedRotation) % 360;
    const segmentIndex = Math.floor(adjustedAngle / segmentAngle);
    return PRIZES[segmentIndex % PRIZES.length];
  };

  const openGoHighLevelPopup = (prizeName: string) => {
    const discountMatch = prizeName.match(/(\d+)%/);
    const discountValue = discountMatch ? discountMatch[1] : '0';
    const formUrl = `https://api.leadconnectorhq.com/widget/form/RiifQcsGiB7V1X1KHOcK?key=${encodeURIComponent(discountValue)}`;
    
    // Open in new tab
    window.open(formUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSpin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    const spins = Math.random() * (WHEEL_CONFIG.maxSpins - WHEEL_CONFIG.minSpins) + WHEEL_CONFIG.minSpins;
    const randomRotation = Math.random() * 360;
    
    const totalRotation = rotation + spins * 360 + randomRotation;
    const duration = 4000;
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, 4);
      const currentRotation = startRotation + (totalRotation - startRotation) * easeOut;

      setRotation(currentRotation % 360);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const finalRotation = currentRotation % 360;
        const winningPrize = getPrizeAtPointer(finalRotation);
        setIsSpinning(false);
        setWinner(winningPrize);
        
        setTimeout(() => {
          openGoHighLevelPopup(winningPrize.name);
        }, 1000);
      }
    };

    requestAnimationFrame(animate);
  };

  const buttonSize = wheelSize < 350 ? 70 : wheelSize < 450 ? 90 : 110;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-[9999]"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            id="spin-wheel-container"
            className="fixed left-1/2 top-1/2 z-[10000] transform -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px]"
          >
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg z-10 hover:scale-110 transition-transform"
              >
                ✕
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Spin & Win!
                </h1>
                <p className="text-gray-700 text-sm md:text-base mt-2">
                  Try your luck and win amazing discounts!
                </p>
              </div>

              {/* Wheel Container */}
              <div className="relative" style={{ width: wheelSize, height: wheelSize, margin: '0 auto' }}>
                <canvas
                  ref={canvasRef}
                  width={wheelSize}
                  height={wheelSize}
                  className="drop-shadow-xl pointer-events-none"
                />
                
                {/* Spin Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning}
                    className={`
                      rounded-full 
                      bg-gradient-to-br from-orange-500 via-pink-500 to-red-600
                      hover:from-orange-600 hover:via-pink-600 hover:to-red-700
                      text-white font-bold shadow-xl hover:shadow-2xl
                      border-4 border-white transition-all duration-300
                      hover:scale-105 active:scale-95
                      ${isSpinning ? 'cursor-not-allowed opacity-90' : ''}
                      flex flex-col items-center justify-center
                    `}
                    style={{
                      width: buttonSize,
                      height: buttonSize,
                    }}
                  >
                    {isSpinning ? (
                      <span className="text-sm md:text-base">Spinning...</span>
                    ) : (
                      <>
                        <span className="text-lg md:text-xl font-black">SPIN</span>
                        <span className="text-sm md:text-base font-semibold">NOW!</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Pointer */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                  <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-b-[15px] border-l-transparent border-r-transparent border-b-red-600"></div>
                </div>
              </div>

              {/* Winner Banner */}
              <AnimatePresence>
                {winner && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-6 py-4 rounded-xl font-bold text-lg text-center shadow-lg"
                  >
                    🎉 You won: <span className="text-yellow-200">{winner.name}</span>! 🎉
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}