// components/spin-wheel.tsx
"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_WHEEL_PRIZES,
  WHEEL_CONFIG,
  Prize,
} from "@/lib/wheel-constants";
import { motion } from "framer-motion";
import DiscountForm from "./discount-form";
import { X } from "lucide-react";

interface SpinWheelProps {
  prizes?: Prize[];
  compact?: boolean;
  autoShow?: boolean;
  showDelay?: number;
  trigger?: "delay" | "scroll" | "exit" | "immediate";
  showCloseButton?: boolean;
  onClose?: () => void;
  embedded?: boolean;
}

type AppState = "wheel" | "form" | "coupon";

export default function SpinWheel({
  prizes = DEFAULT_WHEEL_PRIZES,
  compact = false,
  autoShow = false,
  showDelay = 5000,
  trigger = "delay",
  showCloseButton = true,
  onClose,
  embedded = false,
}: SpinWheelProps) {
  const PRIZES = prizes;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Prize | null>(null);
  const [wheelSize, setWheelSize] = useState(420); // safe starting value
  const [appState, setAppState] = useState<AppState>("wheel");
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [isVisible, setIsVisible] = useState(!autoShow);
  const [hasShown, setHasShown] = useState(false);
  const [redrawCount, setRedrawCount] = useState(0); // force redraw trigger

  // ────────────────────────────────────────────────
  // Auto-show logic
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!autoShow || hasShown) return;

    const showWheel = () => {
      setIsVisible(true);
      setHasShown(true);
      // Force redraw shortly after visibility
      setTimeout(() => setRedrawCount(c => c + 1), 150);
    };

    let timeoutId: NodeJS.Timeout;
    let scrollHandler: () => void;
    let mouseLeaveHandler: (e: MouseEvent) => void;

    switch (trigger) {
      case "delay":
        timeoutId = setTimeout(showWheel, showDelay);
        break;
      case "immediate":
        showWheel();
        break;
      case "scroll":
        scrollHandler = () => {
          const scrollPercent =
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
          if (scrollPercent > 70) {
            showWheel();
            window.removeEventListener("scroll", scrollHandler);
          }
        };
        window.addEventListener("scroll", scrollHandler);
        break;
      case "exit":
        mouseLeaveHandler = (e: MouseEvent) => {
          if (e.clientY <= 0 || e.relatedTarget === null) {
            showWheel();
            document.removeEventListener("mouseleave", mouseLeaveHandler);
          }
        };
        document.addEventListener("mouseleave", mouseLeaveHandler);
        break;
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scrollHandler) window.removeEventListener("scroll", scrollHandler);
      if (mouseLeaveHandler) document.removeEventListener("mouseleave", mouseLeaveHandler);
    };
  }, [autoShow, trigger, showDelay, hasShown]);

  // ────────────────────────────────────────────────
  // Dynamic wheel size (container-based)
  // ────────────────────────────────────────────────
  const updateWheelSize = useCallback(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    let size = Math.min(width, height, window.innerWidth * 0.92);

    if (compact) {
      size = Math.min(380, size);
    } else {
      size = Math.min(680, Math.max(420, size));
    }

    if (Math.abs(size - wheelSize) > 5) {
      setWheelSize(Math.round(size));
      setRedrawCount(c => c + 1);
    }
  }, [compact, wheelSize]);

  useEffect(() => {
    updateWheelSize();

    const resizeObserver = new ResizeObserver(updateWheelSize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);

    window.addEventListener("resize", updateWheelSize);

    // Multiple redraw attempts for iframe timing issues
    const timers = [
      setTimeout(updateWheelSize, 250),
      setTimeout(() => setRedrawCount(c => c + 1), 450),
      setTimeout(() => setRedrawCount(c => c + 1), 800),
      setTimeout(() => setRedrawCount(c => c + 1), 1400),
    ];

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateWheelSize);
      timers.forEach(clearTimeout);
    };
  }, [updateWheelSize]);

  // ────────────────────────────────────────────────
  // Canvas drawing
  // ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Explicitly set dimensions (critical for correct rendering)
    canvas.width = wheelSize;
    canvas.height = wheelSize;

    drawWheel(ctx, rotation, wheelSize);

    // Debug log – remove later if not needed
    console.log(`[DRAW] size=${wheelSize}px, redrawCount=${redrawCount}`);
  }, [wheelSize, rotation, redrawCount, compact]);

  // ────────────────────────────────────────────────
  // drawWheel function
  // ────────────────────────────────────────────────
  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    currentRotation: number,
    size: number,
  ) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = Math.min(centerX, centerY) - (compact ? 10 : 20);

    ctx.clearRect(0, 0, size, size);

    const segmentAngle = (2 * Math.PI) / PRIZES.length;

    PRIZES.forEach((prize, index) => {
      const startAngle =
        index * segmentAngle - (currentRotation * Math.PI) / 180;
      const endAngle = startAngle + segmentAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = WHEEL_CONFIG.segmentBorder;
      ctx.lineWidth = WHEEL_CONFIG.segmentBorderWidth;
      ctx.stroke();

      const textAngle = startAngle + segmentAngle / 2;
      const textRadius = radius * 0.65;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = WHEEL_CONFIG.textColor;

      const fontSize =
        size < 350 ? "bold 8px sans-serif" :
        size < 400 ? "bold 10px sans-serif" :
        size < 500 ? "bold 12px sans-serif" :
        "bold 16px sans-serif";
      ctx.font = fontSize;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      let displayText = prize.name;
      if (size < 350 && prize.name.length > 8) {
        displayText = prize.name.replace("% Discount", "%").slice(0, 8) + "...";
      } else if (size < 400 && prize.name.length > 10) {
        displayText = prize.name.replace("% Discount", "%");
      }
      ctx.fillText(displayText, 0, 0);
      ctx.restore();
    });

    // Center circle
    const centerCircleRadius = compact
      ? 15
      : size < 400 ? 20 : size < 500 ? 25 : WHEEL_CONFIG.centerCircleRadius;
    const centerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, centerCircleRadius
    );
    centerGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    centerGradient.addColorStop(1, "rgba(240, 240, 240, 0.2)");

    ctx.beginPath();
    ctx.arc(centerX, centerY, centerCircleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(51, 51, 51, 0.3)";
    ctx.lineWidth = WHEEL_CONFIG.segmentBorderWidth;
    ctx.stroke();

    // Decorative inner circle
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      centerCircleRadius - (compact ? 3 : 5),
      0,
      2 * Math.PI
    );
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = compact ? 1 : 2;
    ctx.stroke();

    // Pointer
    const pointerSize = compact ? 8 : size < 400 ? 12 : size < 500 ? 15 : 18;
    const pointerHeight = compact ? 25 : size < 400 ? 40 : size < 500 ? 50 : 60;

    ctx.beginPath();
    ctx.moveTo(centerX - pointerSize, 10);
    ctx.lineTo(centerX + pointerSize, 10);
    ctx.lineTo(centerX, pointerHeight);
    ctx.closePath();

    const pointerGradient = ctx.createLinearGradient(
      centerX - pointerSize, 10,
      centerX + pointerSize, pointerHeight
    );
    pointerGradient.addColorStop(0, "#ff0000");
    pointerGradient.addColorStop(1, "#cc0000");
    ctx.fillStyle = pointerGradient;
    ctx.fill();

    ctx.strokeStyle = "#990000";
    ctx.lineWidth = compact ? 1 : 2;
    ctx.stroke();

    // Pointer highlight
    ctx.beginPath();
    ctx.moveTo(centerX - pointerSize * 0.7, 13);
    ctx.lineTo(centerX + pointerSize * 0.7, 13);
    ctx.lineTo(centerX, pointerHeight - 3);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
  };

  // ────────────────────────────────────────────────
  // Get prize at pointer
  // ────────────────────────────────────────────────
  const getPrizeAtPointer = (currentRotation: number): Prize => {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const pointerAngle = 270;
    const segmentAngle = 360 / PRIZES.length;
    const adjustedAngle = (pointerAngle + normalizedRotation) % 360;
    const segmentIndex = Math.floor(adjustedAngle / segmentAngle);

    return PRIZES[segmentIndex % PRIZES.length];
  };

  // ────────────────────────────────────────────────
  // Handle spin action
  // ────────────────────────────────────────────────
  const handleSpin = () => {
    console.log("Spin button clicked!");
    if (isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    const spins =
      Math.random() * (WHEEL_CONFIG.maxSpins - WHEEL_CONFIG.minSpins) +
      WHEEL_CONFIG.minSpins;
    const randomRotation = Math.random() * 360;

    const totalRotation = rotation + spins * 360 + randomRotation;
    const duration = WHEEL_CONFIG.spinDuration;
    const startTime = Date.now();
    const startRotation = rotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOut = 1 - Math.pow(1 - progress, WHEEL_CONFIG.stopEasing);
      const currentRotation =
        startRotation + (totalRotation - startRotation) * easeOut;

      setRotation(currentRotation % 360);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        const finalRotation = currentRotation % 360;
        const winningPrize = getPrizeAtPointer(finalRotation);

        setIsSpinning(false);
        setWinner(winningPrize);

        if (embedded && window.parent !== window) {
          window.parent.postMessage(
            {
              type: "prizeWon",
              prize: winningPrize,
            },
            "*"
          );
        }
      }
    };

    requestAnimationFrame(animate);
  };

  // ────────────────────────────────────────────────
  // Claim discount → go to form
  // ────────────────────────────────────────────────
  const handleClaimDiscount = () => {
    if (!winner) return;

    const discountMatch = winner.name.match(/(\d+)%/);
    const discountValue = discountMatch ? discountMatch[1] : "5";

    setDiscountPercentage(discountValue);
    setAppState("form");
    handleDiscountClaimed(discountValue);
  };

  // ────────────────────────────────────────────────
  // Back to wheel from form
  // ────────────────────────────────────────────────
  const handleBackToWheel = () => {
    setWinner(null);
    setAppState("wheel");
    if (compact && autoShow) {
      handleClose();
    }
  };

  // ────────────────────────────────────────────────
  // Close handler
  // ────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (onClose) onClose();
    if (embedded && window.parent !== window) {
      window.parent.postMessage({ type: "spin-wheel-close" }, "*");
    }
  }, [onClose, embedded]);

  // ────────────────────────────────────────────────
  // Discount claimed notification
  // ────────────────────────────────────────────────
  const handleDiscountClaimed = (discount: string) => {
    if (embedded && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "discountClaimed",
          discount,
        },
        "*"
      );
    }
  };

  const buttonSize = compact
    ? 60
    : wheelSize < 400
      ? 80
      : wheelSize < 500
        ? 100
        : 128;

  // ────────────────────────────────────────────────
  // Main wheel content
  // ────────────────────────────────────────────────
  const WheelContent = () => (
    <main
      className={`
        ${compact ? "bg-transparent p-2" : "min-h-full p-4"}
        ${!compact ? "bg-gradient-to-br from-amber-50 via-white to-orange-100" : ""}
        flex flex-col items-center justify-center gap-6 w-full h-full
      `}
    >
      {!compact && (
        <div className="text-center space-y-2 md:space-y-3">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Spin The Wheel
          </h1>
          <p className="text-gray-700 text-base md:text-lg font-medium">
            Try your luck and win amazing prizes!
          </p>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center min-h-[380px]"
      >
        <canvas
          ref={canvasRef}
          width={wheelSize}
          height={wheelSize}
          className="drop-shadow-2xl"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: "auto",
            height: "auto",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-auto">
          <motion.div
            animate={isSpinning ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.5 }}
            className="relative"
          >
            <Button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`
                rounded-full bg-gradient-to-br from-orange-500 via-pink-500 to-red-600
                hover:from-orange-600 hover:via-pink-600 hover:to-red-700
                text-white font-bold shadow-xl md:shadow-2xl hover:shadow-3xl
                border-4 border-white transform transition-all duration-300
                hover:scale-105 active:scale-95 relative z-20
                ${isSpinning ? "cursor-not-allowed opacity-90" : ""}
                ${compact ? "border-2" : ""}
              `}
              style={{
                width: buttonSize,
                height: buttonSize,
              }}
            >
              <div className="flex flex-col items-center justify-center">
                {isSpinning ? (
                  <span className={compact ? "text-xs" : "text-sm md:text-base"}>
                    Spinning...
                  </span>
                ) : (
                  <>
                    <span
                      className={
                        compact ? "text-base font-black" : "text-xl md:text-2xl font-black"
                      }
                    >
                      SPIN
                    </span>
                    {!compact && (
                      <span className="text-base md:text-lg font-semibold">
                        NOW!
                      </span>
                    )}
                  </>
                )}
              </div>
            </Button>

            {!compact && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/30 -m-2"></div>
                <div className="absolute inset-0 rounded-full border-4 border-white/20 -m-4"></div>
              </>
            )}
          </motion.div>
        </div>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-5 pointer-events-none">
          <div className="w-[5px] bg-gradient-to-b from-red-600 to-red-800 mx-auto"></div>
        </div>
      </div>

      <div
        className={`flex flex-col items-center ${
          compact ? "gap-2" : "gap-4 md:gap-6"
        } w-full ${compact ? "max-w-xs" : "max-w-md"}`}
      >
        {winner && (
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-full space-y-4"
          >
            {!compact && (
              <div className="bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 text-white px-6 py-4 md:px-8 md:py-6 rounded-2xl font-bold text-lg md:text-xl shadow-xl border-4 border-white text-center">
                🎉 Congratulations! 🎉
              </div>
            )}

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`
                bg-white rounded-2xl shadow-lg border-2 border-emerald-100
                ${compact ? "p-4" : "p-6"}
              `}
            >
              <p
                className={`text-gray-700 text-center ${
                  compact ? "mb-2" : "mb-4"
                }`}
              >
                <span
                  className={`font-bold text-emerald-600 ${
                    compact ? "text-lg" : "text-xl"
                  }`}
                >
                  {winner.name}
                </span>
              </p>
              <p
                className={`text-gray-600 text-center ${
                  compact ? "mb-4 text-sm" : "mb-6 text-sm md:text-base"
                }`}
              >
                We've reserved your {winner.name.replace("% Discount", "%")}{" "}
                for the next 15 minutes!
              </p>

              <Button
                onClick={handleClaimDiscount}
                size={compact ? "default" : "lg"}
                className={`
                  w-full ${compact ? "py-2 text-sm" : "py-4 text-base md:text-lg"}
                  bg-gradient-to-r from-emerald-500 to-green-600 
                  hover:from-emerald-600 hover:to-green-700 
                  text-white font-bold rounded-xl shadow-lg
                `}
              >
                Claim Your {winner.name.replace("% Discount", "%")}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Offer expires in 15 minutes
              </p>
            </motion.div>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 640px) {
          .text-responsive {
            font-size: clamp(0.875rem, 3vw, 1rem);
          }
        }
      `}</style>
    </main>
  );

  // ────────────────────────────────────────────────
  // Render logic
  // ────────────────────────────────────────────────
  if (appState === "form") {
    return (
      <DiscountForm
        discount={discountPercentage}
        onBack={() => {
          setWinner(null);
          setAppState("wheel");
          if (compact && autoShow) handleClose();
        }}
        compact={compact}
      />
    );
  }

  if (autoShow && !isVisible) return null;

  if (compact && autoShow && isVisible) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg aspect-[4/5] max-h-[85vh]">
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-gray-200"
              aria-label="Close spin wheel"
            >
              <X size={20} />
            </button>
          )}
          <WheelContent />
        </div>
      </div>
    );
  }

  return <WheelContent />;
}