"use client";

import { useRef, useEffect, useState } from "react";
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
  const [wheelSize, setWheelSize] = useState(compact ? 300 : 500);
  const [appState, setAppState] = useState<AppState>("wheel");
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [isVisible, setIsVisible] = useState(!autoShow);
  const [hasShown, setHasShown] = useState(false);

  // Handle auto-show with different triggers
  useEffect(() => {
    if (!autoShow || hasShown) return;

    const showWheel = () => {
      setIsVisible(true);
      setHasShown(true);
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
            (window.scrollY /
              (document.body.scrollHeight - window.innerHeight)) *
            100;
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
      if (mouseLeaveHandler)
        document.removeEventListener("mouseleave", mouseLeaveHandler);
    };
  }, [autoShow, trigger, showDelay, hasShown]);

  // Update wheel size based on screen width and compact mode
  useEffect(() => {
    if (compact) {
      setWheelSize(300);
      return;
    }

    const updateWheelSize = () => {
      if (typeof window === "undefined") return;

      const screenWidth = window.innerWidth;
      if (screenWidth < 640) {
        // Mobile
        setWheelSize(300);
      } else if (screenWidth < 768) {
        // Tablet
        setWheelSize(400);
      } else {
        // Desktop
        setWheelSize(500);
      }
    };

    updateWheelSize();
    window.addEventListener("resize", updateWheelSize);

    return () => window.removeEventListener("resize", updateWheelSize);
  }, [compact]);

  // Notify parent when wheel is closed (for embedded mode)
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose(); // ← important!
    if (embedded && window.parent !== window) {
      window.parent.postMessage({ type: "spin-wheel-close" }, "*");
    }
  };

  // Notify parent when discount is claimed (for embedded mode)
  const handleDiscountClaimed = (discount: string) => {
    if (embedded && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "discountClaimed",
          discount: discount,
        },
        "*",
      );
    }
  };

  // Handle messages from parent (for embedded mode)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "showSpinWheel") {
        setIsVisible(true);
      } else if (event.data === "hideSpinWheel") {
        setIsVisible(false);
      }
    };

    if (embedded) {
      window.addEventListener("message", handleMessage);
      return () => window.removeEventListener("message", handleMessage);
    }
  }, [embedded]);

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    currentRotation: number,
    size: number,
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - (compact ? 10 : 20);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segments
    const segmentAngle = (2 * Math.PI) / PRIZES.length;

    PRIZES.forEach((prize, index) => {
      const startAngle =
        index * segmentAngle - (currentRotation * Math.PI) / 180;
      const endAngle = startAngle + segmentAngle;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();
      ctx.strokeStyle = WHEEL_CONFIG.segmentBorder;
      ctx.lineWidth = WHEEL_CONFIG.segmentBorderWidth;
      ctx.stroke();

      // Draw text - adjust font size based on wheel size
      const textAngle = startAngle + segmentAngle / 2;
      const textRadius = radius * 0.65;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = WHEEL_CONFIG.textColor;

      // Responsive font size
      const fontSize =
        size < 350
          ? "bold 8px sans-serif"
          : size < 400
            ? "bold 10px sans-serif"
            : size < 500
              ? "bold 12px sans-serif"
              : "bold 16px sans-serif";
      ctx.font = fontSize;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Truncate text if too long
      let displayText = prize.name;
      if (size < 350 && prize.name.length > 8) {
        displayText = prize.name.replace("% Discount", "%").slice(0, 8) + "...";
      } else if (size < 400 && prize.name.length > 10) {
        displayText = prize.name.replace("% Discount", "%");
      }
      ctx.fillText(displayText, 0, 0);
      ctx.restore();
    });

    // Draw center circle
    const centerCircleRadius = compact
      ? 15
      : size < 400
        ? 20
        : size < 500
          ? 25
          : WHEEL_CONFIG.centerCircleRadius;
    const centerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      centerCircleRadius,
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

    // Draw decorative inner circle
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      centerCircleRadius - (compact ? 3 : 5),
      0,
      2 * Math.PI,
    );
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = compact ? 1 : 2;
    ctx.stroke();

    // Draw pointer indicator at top - responsive size
    const pointerSize = compact ? 8 : size < 400 ? 12 : size < 500 ? 15 : 18;
    const pointerHeight = compact ? 25 : size < 400 ? 40 : size < 500 ? 50 : 60;

    ctx.beginPath();
    ctx.moveTo(centerX - pointerSize, 10);
    ctx.lineTo(centerX + pointerSize, 10);
    ctx.lineTo(centerX, pointerHeight);
    ctx.closePath();

    const pointerGradient = ctx.createLinearGradient(
      centerX - pointerSize,
      10,
      centerX + pointerSize,
      pointerHeight,
    );
    pointerGradient.addColorStop(0, "#ff0000");
    pointerGradient.addColorStop(1, "#cc0000");
    ctx.fillStyle = pointerGradient;
    ctx.fill();

    ctx.strokeStyle = "#990000";
    ctx.lineWidth = compact ? 1 : 2;
    ctx.stroke();

    // Add a highlight effect to the pointer
    ctx.beginPath();
    ctx.moveTo(centerX - pointerSize * 0.7, 13);
    ctx.lineTo(centerX + pointerSize * 0.7, 13);
    ctx.lineTo(centerX, pointerHeight - 3);
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = wheelSize;
    canvas.height = wheelSize;

    drawWheel(ctx, rotation, wheelSize);
  }, [rotation, wheelSize, compact]);

  // Function to get which prize is at the pointer position
  const getPrizeAtPointer = (currentRotation: number): Prize => {
    const normalizedRotation = ((currentRotation % 360) + 360) % 360;
    const pointerAngle = 270;
    const segmentAngle = 360 / PRIZES.length;
    const adjustedAngle = (pointerAngle + normalizedRotation) % 360;
    const segmentIndex = Math.floor(adjustedAngle / segmentAngle);

    return PRIZES[segmentIndex % PRIZES.length];
  };

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

        // Notify parent of win
        if (embedded && window.parent !== window) {
          window.parent.postMessage(
            {
              type: "prizeWon",
              prize: winningPrize,
            },
            "*",
          );
        }
      }
    };

    requestAnimationFrame(animate);
  };

  const handleClaimDiscount = () => {
    if (!winner) return;

    // Extract discount percentage from prize name
    const discountMatch = winner.name.match(/(\d+)%/);
    const discountValue = discountMatch ? discountMatch[1] : "5";

    setDiscountPercentage(discountValue);
    setAppState("form");
    handleDiscountClaimed(discountValue);
  };

  const handleBackToWheel = () => {
    setWinner(null);
    setAppState("wheel");
    if (compact && autoShow) {
      handleClose();
    }
  };

  // Calculate button size based on wheel size
  const buttonSize = compact
    ? 60
    : wheelSize < 400
      ? 80
      : wheelSize < 500
        ? 100
        : 128;

  // Render the DiscountForm if in form or coupon state
  if (appState === "form") {
    return (
      <DiscountForm
        discount={discountPercentage}
        onBack={handleBackToWheel}
        compact={compact}
      />
    );
  }

  // If autoShow is enabled and not visible, don't render
  if (autoShow && !isVisible) {
    return null;
  }

  // Main wheel UI
  const WheelContent = () => (
    <main
      className={`
      ${compact ? "bg-transparent p-2" : "min-h-screen p-4"}
      ${!compact ? "bg-gradient-to-br from-amber-50 via-white to-orange-100" : ""}
      flex flex-col items-center justify-center gap-6
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
          className={`drop-shadow-xl md:drop-shadow-2xl absolute top-0 left-0 pointer-events-none
            ${compact ? "drop-shadow-lg" : ""}`}
          style={{ pointerEvents: "none" }}
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
                  <>
                    <span
                      className={compact ? "text-xs" : "text-sm md:text-base"}
                    >
                      Spinning...
                    </span>
                  </>
                ) : (
                  <>
                    <span
                      className={
                        compact
                          ? "text-base font-black"
                          : "text-xl md:text-2xl font-black"
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

            {/* Decorative ring around button */}
            {!compact && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/30 -m-2"></div>
                <div className="absolute inset-0 rounded-full border-4 border-white/20 -m-4"></div>
              </>
            )}
          </motion.div>
        </div>

        {/* Pointer decoration */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-5">
          <div className="w-[5px] bg-gradient-to-b from-red-600 to-red-800 mx-auto"></div>
        </div>
      </div>

      {/* Winner Banner - Responsive */}
      <div
        className={`flex flex-col items-center ${compact ? "gap-2" : "gap-4 md:gap-6"} w-full ${compact ? "max-w-xs" : "max-w-md"}`}
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
                className={`text-gray-700 text-center ${compact ? "mb-2" : "mb-4"}`}
              >
                <span
                  className={`font-bold text-emerald-600 ${compact ? "text-lg" : "text-xl"}`}
                >
                  {winner.name}
                </span>
              </p>
              <p
                className={`text-gray-600 text-center ${compact ? "mb-4 text-sm" : "mb-6 text-sm md:text-base"}`}
              >
                We've reserved your {winner.name.replace("% Discount", "%")} for
                the next 15 minutes!
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

      {/* Add custom CSS for spin animation */}
      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
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
  );

  // If compact mode with autoShow, wrap in popup overlay
  if (compact && autoShow && isVisible) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-50 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              <X size={18} />
            </button>
          )}
          <WheelContent />
        </div>
      </div>
    );
  }

  return <WheelContent />;
}
