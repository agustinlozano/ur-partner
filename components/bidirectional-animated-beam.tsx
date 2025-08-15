"use client";

import React, {
  forwardRef,
  RefObject,
  useRef,
  useState,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "z-10 flex size-16 items-center justify-center rounded-full border-2 bg-background text-4xl shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
      layout
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 30,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={children as string}
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0, opacity: 0, rotate: 180 }}
          transition={{
            type: "tween",
            stiffness: 500,
            damping: 25,
          }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
});

export function BidirectionalBeam({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);

  // The exact order to start the animation sequence
  const emojiOrder = [
    "👧🏻",
    "👦🏻",
    "👦🏼",
    "👱🏽‍♂️",
    "👦",
    "👧",
    "👧🏼",
    "👧🏽",
    "👱🏻‍♀️",
    "👱🏼‍♀️",
    "👦🏽",
    "👨🏼",
    "👨🏻",
    "👱🏽‍♂️",
    "👦🏽",
    "👦🏾",
    "👨🏽",
  ];

  // Predefined hetero pairs to bias selection toward
  const heteroPairs: [string, string][] = [
    ["👧🏻", "👦🏻"],
    ["👧🏼", "👱🏽‍♂️"],
    ["👦🏽", "👧"],
    ["👨🏻", "👧🏽"],
    ["👦", "👧"],
    ["👧🏽", "👨🏽"],
    ["👱🏻‍♀️", "👦🏻"],
    ["👱🏼‍♀️", "👦🏼"],
    ["👧", "👨🏼"],
    ["👧🏼", "👦🏽"],
    ["👧🏽", "👦🏾"],
    ["👱🏻‍♀️", "👨🏻"],
    ["👱🏼‍♀️", "👱🏽‍♂️"],
    ["👧🏻", "👨🏽"],
    ["👧🏼", "👦"],
    ["👧🏽", "👦🏻"],
  ];

  // Build the deterministic start sequence from the provided order
  const startPairs: [string, string][] = [];
  for (let i = 0; i < emojiOrder.length; i += 2) {
    const a = emojiOrder[i];
    const b = emojiOrder[i + 1] ?? emojiOrder[0];
    startPairs.push([a, b]);
  }

  // Recent history to avoid repeats
  const recent = useRef<string[]>([]);
  const [currentPair, setCurrentPair] = useState<[string, string]>(
    startPairs[0]
  );
  const tickRef = useRef(0);

  // Helper to pick a weighted hetero pair while avoiding recent repeats
  function pickWeightedHeteroPair(): [string, string] {
    const pool: [string, string][] = [];
    // Push each hetero pair multiple times to bias selection
    for (const p of heteroPairs) {
      for (let k = 0; k < 6; k++) pool.push(p);
    }
    // Include some other pairs lightly to keep variety
    for (const p of startPairs) pool.push(p);

    // Attempt to pick one not in recent
    for (let attempts = 0; attempts < 12; attempts++) {
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      const key = candidate.join("|");
      if (!recent.current.includes(key)) return candidate;
    }
    // Fallback: return any hetero pair
    return heteroPairs[Math.floor(Math.random() * heteroPairs.length)];
  }

  // Pick any pair avoiding recent
  function pickAnyPairAvoidingRecent(): [string, string] {
    const allPairs: [string, string][] = [];
    for (let i = 0; i < emojiOrder.length; i++) {
      for (let j = 0; j < emojiOrder.length; j++) {
        if (i === j) continue;
        allPairs.push([emojiOrder[i], emojiOrder[j]]);
      }
    }

    for (let attempts = 0; attempts < 20; attempts++) {
      const candidate = allPairs[Math.floor(Math.random() * allPairs.length)];
      const key = candidate.join("|");
      if (!recent.current.includes(key)) return candidate;
    }
    return allPairs[Math.floor(Math.random() * allPairs.length)];
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const tick = tickRef.current++;

      // For the first pass, emit the deterministic start sequence in order
      if (tick < startPairs.length) {
        const pair = startPairs[tick];
        setCurrentPair(pair);
        const key = pair.join("|");
        recent.current.unshift(key);
        if (recent.current.length > 6) recent.current.pop();
        return;
      }

      // After the startup sequence, pick with bias but avoid repeats
      let pair: [string, string];
      // 80% try hetero-biased pick, 20% pick any pair
      if (Math.random() < 0.8) {
        pair = pickWeightedHeteroPair();
      } else {
        pair = pickAnyPairAvoidingRecent();
      }

      setCurrentPair(pair);
      const key = pair.join("|");
      recent.current.unshift(key);
      if (recent.current.length > 6) recent.current.pop();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        "relative flex w-full max-w-sm mx-auto items-center justify-center overflow-hidden p-6",
        className
      )}
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row justify-between select-none">
          <Circle
            className="border-pink-400 dark:border-pink-600 bg-pink-200 dark:bg-pink-900"
            ref={div1Ref}
          >
            {currentPair[0]}
          </Circle>
          <Circle
            className="border-blue-400 dark:border-blue-600 bg-blue-200 dark:bg-blue-900"
            ref={div2Ref}
          >
            {currentPair[1]}
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef as RefObject<HTMLElement>}
        fromRef={div1Ref as RefObject<HTMLElement>}
        toRef={div2Ref as RefObject<HTMLElement>}
        startYOffset={10}
        endYOffset={10}
        curvature={-20}
        dotted
      />
      <AnimatedBeam
        containerRef={containerRef as RefObject<HTMLElement>}
        fromRef={div1Ref as RefObject<HTMLElement>}
        toRef={div2Ref as RefObject<HTMLElement>}
        startYOffset={-10}
        endYOffset={-10}
        curvature={20}
        reverse
        dotted
        gradientStartColor="#CC9B7A"
        gradientStopColor="#f5c7a8"
      />
    </div>
  );
}
