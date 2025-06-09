"use client";

import { cn } from "@/lib/utils";
import React, { forwardRef, RefObject, useRef } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});

export function BidirectionalBeam() {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      className="relative flex w-full max-w-[500px] mx-auto items-center justify-center overflow-hidden rounded-lg border bg-background p-10 md:shadow-xl"
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-col items-stretch justify-between gap-10">
        <div className="flex flex-row justify-between">
          <Circle ref={div1Ref}>👧🏻</Circle>
          <Circle className="p-2" ref={div2Ref}>
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
