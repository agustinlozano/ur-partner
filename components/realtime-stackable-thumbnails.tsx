"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import styles from "./realtime-stackable-thumbnails.module.css";

export interface ThumbnailData {
  id: string;
  src: string;
  category: string;
  isUnsplash?: boolean;
  timestamp: number;
}

interface StackableThumbnailsProps {
  thumbnails: ThumbnailData[];
  onRemove?: (id: string) => void;
  maxVisible?: number;
  blurred?: boolean;
  position?: "fixed" | "relative";
}

export function StackableThumbnails({
  thumbnails,
  onRemove,
  maxVisible = 3,
  blurred = false,
  position = "fixed",
}: StackableThumbnailsProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  console.log({ thumbnails });

  // Sort thumbnails by timestamp (newest first)
  const sortedThumbnails = [...thumbnails].sort(
    (a, b) => b.timestamp - a.timestamp
  );
  const visibleThumbnails = sortedThumbnails.slice(0, maxVisible);
  const hiddenCount = Math.max(0, thumbnails.length - maxVisible);

  const handleRemove = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    setExitingIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      onRemove?.(id);
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  if (thumbnails.length === 0) {
    return null;
  }

  return (
    <div
      className={`${styles.container} ${
        position === "relative" ? "!relative !bottom-auto !left-auto" : ""
      }`}
    >
      <div
        ref={containerRef}
        className={styles.stackContainer}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence mode="popLayout">
          {visibleThumbnails.map((thumbnail, index) => {
            const isExiting = exitingIds.has(thumbnail.id);
            const isTop = index === 0;
            const zIndex = visibleThumbnails.length - index;

            // Calculate stacked position
            const stackOffset = isHovered ? index * 72 : index * 4;
            const rotationOffset = isHovered
              ? 0
              : index % 2 === 0
              ? index * 1
              : -index * 1;
            const scaleOffset = isHovered ? 1 : 1 - index * 0.02;

            return (
              <motion.div
                key={thumbnail.id}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  x: 20,
                  rotate: -10,
                }}
                animate={{
                  opacity: isExiting ? 0 : 1,
                  scale: isExiting ? 0.8 : scaleOffset,
                  x: isExiting ? 20 : stackOffset,
                  rotate: isExiting ? 10 : rotationOffset,
                  zIndex,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.7,
                  x: 30,
                  rotate: 15,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  mass: 0.8,
                }}
                className={styles.thumbnail}
                style={{
                  zIndex,
                }}
              >
                <Image
                  src={thumbnail.src}
                  alt={thumbnail.category}
                  width={64}
                  height={64}
                  className={`${styles.thumbnailImage} ${
                    blurred ? styles.blurred : ""
                  }`}
                  quality={75}
                  priority={isTop}
                />

                {/* Category Badge */}

                {/* Unsplash Badge */}
                {thumbnail.isUnsplash && (
                  <motion.div
                    className={styles.unsplashBadge}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      scale: isHovered ? 1 : 0.6,
                    }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    title="From Unsplash"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 32 32"
                      fill="currentColor"
                    >
                      <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z" />
                    </svg>
                  </motion.div>
                )}

                {/* Remove Button */}
                {onRemove && (
                  <motion.button
                    className={styles.removeButton}
                    onClick={(e) => handleRemove(thumbnail.id, e)}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      scale: isHovered ? 1 : 0.6,
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ delay: index * 0.05 + 0.15 }}
                    title={`Remove ${thumbnail.category}`}
                  >
                    <X className={styles.removeIcon} />
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Counter for hidden thumbnails - only show on first thumbnail */}
        {hiddenCount > 0 && (
          <motion.div
            className={isHovered ? "hidden" : styles.counter}
            initial={{ opacity: 1 }}
            animate={{
              opacity: isHovered ? 0 : 1,
            }}
            transition={{ duration: 0 }}
          >
            +{hiddenCount}
          </motion.div>
        )}
      </div>
    </div>
  );
}
