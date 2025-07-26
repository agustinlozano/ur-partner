"use client";

import { enviroment } from "@/lib/env";
import { useEffect, useRef, useCallback } from "react";

const COUNT = 800;
const SPEED = 0.2;

class Star {
  x: number;
  y: number;
  z: number;
  xPrev: number;
  yPrev: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.xPrev = x;
    this.yPrev = y;
  }

  update(width: number, height: number, speed: number) {
    this.xPrev = this.x;
    this.yPrev = this.y;
    this.z += speed * 0.0675;
    this.x += this.x * (speed * 0.0225) * this.z;
    this.y += this.y * (speed * 0.0225) * this.z;

    if (
      this.x > width / 2 ||
      this.x < -width / 2 ||
      this.y > height / 2 ||
      this.y < -height / 2
    ) {
      this.x = Math.random() * width - width / 2;
      this.y = Math.random() * height - height / 2;
      this.xPrev = this.x;
      this.yPrev = this.y;
      this.z = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.lineWidth = this.z;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.xPrev, this.yPrev);
    ctx.stroke();
  }
}

export default function Starfield() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const dimensionsRef = useRef<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const fpsRef = useRef<HTMLDivElement | null>(null);
  const frameCountRef = useRef(0);
  const fpsLastUpdateRef = useRef(performance.now());

  // Throttle resize events
  const throttledResize = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Only resize if dimensions actually changed
    if (
      dimensionsRef.current.width === width &&
      dimensionsRef.current.height === height
    ) {
      return;
    }

    dimensionsRef.current = { width, height };

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.translate(width / 2, height / 2);

    // Pre-calculate constants
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    for (const star of starsRef.current) {
      star.x = Math.random() * width - halfWidth;
      star.y = Math.random() * height - halfHeight;
      star.z = 0;
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.strokeStyle = "#adadad";
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Initialize stars only once
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: COUNT }, () => new Star());
    }

    // Use throttled resize with requestAnimationFrame
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        requestAnimationFrame(throttledResize);
      }, 16); // ~60fps throttling
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Optimized frame function with delta time
    function frame(currentTime: number) {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // FPS counter
      frameCountRef.current++;
      if (currentTime - fpsLastUpdateRef.current > 500) {
        const fps = Math.round(
          (frameCountRef.current * 1000) /
            (currentTime - fpsLastUpdateRef.current)
        );
        if (fpsRef.current) {
          fpsRef.current.textContent = `FPS: ${fps}`;
        }
        frameCountRef.current = 0;
        fpsLastUpdateRef.current = currentTime;
      }

      // Skip frame if too little time has passed (60fps cap)
      if (deltaTime < 16) {
        rafRef.current = requestAnimationFrame(frame);
        return;
      }

      if (!container || !ctx) return;

      const { width, height } = dimensionsRef.current;
      const halfWidth = width / 2;
      const halfHeight = height / 2;

      // First apply the fade effect (this should come BEFORE drawing stars)
      ctx.fillRect(-halfWidth, -halfHeight, width, height);

      // Draw each star individually to preserve individual lineWidth
      for (const star of starsRef.current) {
        star.update(width, height, SPEED);

        // Only draw if star is visible and has movement
        if (
          star.z > 0.1 &&
          (Math.abs(star.x - star.xPrev) > 0.1 ||
            Math.abs(star.y - star.yPrev) > 0.1)
        ) {
          ctx.lineWidth = Math.max(0.1, star.z);
          ctx.beginPath();
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(star.xPrev, star.yPrev);
          ctx.stroke();
        }
      }
      rafRef.current = requestAnimationFrame(frame);
    }

    // Initial setup
    throttledResize();
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);
      clearTimeout(resizeTimeout);
    };
  }, [throttledResize]);

  return (
    <div
      ref={containerRef}
      id="starfield"
      className="hidden lg:block absolute inset-0 h-fit z-50"
      aria-hidden="true"
      // Avoid mouse/pointer events on the canvas and prevent unnecessary repaints that can lower FPS
      style={{
        zIndex: 0, // Mantiene el canvas en el fondo del stacking context
        pointerEvents: "none", // Hace que el canvas ignore todos los eventos de mouse
      }}
    >
      <canvas
        ref={canvasRef}
        id="starfield-canvas"
        role="presentation"
        className="w-full h-full"
        // Performance: canvas also ignores mouse events
        style={{
          willChange: "transform",
          pointerEvents: "none", // It's redundant but explicit for browsers
        }}
      />
      {enviroment === "development" && (
        <div
          ref={fpsRef}
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            color: "#fff",
            background: "rgba(0,0,0,0.5)",
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 12,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
