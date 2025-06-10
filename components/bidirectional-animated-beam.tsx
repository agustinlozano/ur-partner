"use client";

import React, { forwardRef, RefObject, useRef } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-16 items-center justify-center rounded-full border-2 bg-background text-4xl shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});

export function BidirectionalBeam({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);

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
            👧🏻
          </Circle>
          <Circle
            className="border-blue-400 dark:border-blue-600 bg-blue-200 dark:bg-blue-900"
            ref={div2Ref}
          >
            👦🏻
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
