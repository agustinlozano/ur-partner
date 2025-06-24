"use client";

import { motion, AnimatePresence } from "motion/react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { XIcon } from "./icons";
import styles from "./matrix-board.module.css";

interface MatrixBoardProps {
  text?: string;
  title?: string;
  finalTitle?: string;
  description?: string;
  href?: string;
  blur?: number;
  hue?: number;
  spread?: number;
  font?: number;
  weight?: number;
  line?: number;
  className?: string;
  style?: React.CSSProperties;
  containerBg?: string;
  containerBorder?: string;
  containerRadius?: string | number;
  containerPadding?: string | number;
  containerShadow?: string;
}

export function MatrixBoard({
  text = "Front.",
  title = "CSS Matrix Board",
  finalTitle,
  description = "Guy from Argentina 🇦🇷 doin' software",
  href,
  blur = 1.5,
  hue = 280,
  spread = 1.3,
  font = 22,
  weight = 600,
  line = 1,
  className = "",
  style = {},
  containerBg = "color-mix(in lch, canvas, canvasText 5%)",
  containerBorder = "1px solid color-mix(in lch, canvas, canvasText 35%)",
  containerRadius = 12,
  containerPadding = "1rem",
  containerShadow = "0 1px 0 0 hsl(0 0% 100% / 0.5) inset",
}: MatrixBoardProps) {
  const [hovered, setHovered] = useState(false);

  const cssVars = {
    "--blur": blur,
    "--hue": hue,
    "--spread": spread,
    "--font": font,
    "--weight": weight,
    "--line": line,
    "--size": `calc(${spread} * 1cqi)`,
  } as React.CSSProperties;

  const containerStyle: React.CSSProperties = {
    background: containerBg,
    border: containerBorder,
    borderRadius: containerRadius,
    padding: containerPadding,
    boxShadow: containerShadow,
    ...cssVars,
    ...style,
  };

  return (
    <article
      className={cn(styles.container, className)}
      style={containerStyle}
      tabIndex={0}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      <div className={styles.board}>
        <div className={styles.textWrap}>
          <div aria-hidden="true" className={styles.fluidText}>
            {text}
          </div>
        </div>
      </div>
      <div className={"flex w-full gap-4 p-2 sm:gap-8 border bg-muted/50"}>
        <div className={styles.avatar}>
          <img
            src="/emoji.webp"
            alt="Agustin's avatar"
            className="w-32 mb-0 rounded-md object-cover select-none"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h2
            className={cn(
              styles.title,
              "text-lg font-mono sm:text-2xl font-bold"
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={hovered && finalTitle ? "final" : "initial"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="inline-block text-gradient"
              >
                {hovered && finalTitle ? finalTitle : title}
              </motion.span>
            </AnimatePresence>
          </h2>
          <p className="m-0 text-sm text-primary/75">{description}</p>
          <a
            href="https://x.com/gustinlzn"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-3 h-8 w-fit select-none rounded-lg dark:bg-black dark:text-white bg-white dark:bg-gradient-to-b dark:from-zinc-800 dark:via-zinc-900 dark:to-zinc-600 px-3 text-sm leading-8 text-zinc-950 shadow-[0_-1px_0_0px_#d4d4d8_inset,0_0_0_1px_#f4f4f5_inset,0_0.5px_0_1.5px_#fff_inset] dark:shadow-[0_-1px_0_1px_rgba(0,0,0,0.8)_inset,0_0_0_1px_rgb(9_9_11)_inset,0_0.5px_0_1.5px_#71717a_inset] hover:bg-zinc-50 hover:via-zinc-900 hover:to-zinc-800 active:shadow-[-1px_0px_1px_0px_#e4e4e7_inset,1px_0px_1px_0px_#e4e4e7_inset,0px_0.125rem_1px_0px_#d4d4d8_inset] dark:hover:bg-gradient-to-b dark:hover:from-zinc-900 dark:hover:via-zinc-900 dark:hover:to-zinc-700 dark:active:shadow-[0_3px_0_0_rgba(0,0,0)_inset] transition-all duration-300 outline-none focus-visible:ring-4 focus-visible:ring-gray-400/50 focus-visible:scale-105"
          >
            <span className="flex items-center gap-2 group-active:[transform:translate3d(0,1px,0)]">
              <XIcon className="size-4" /> @gustinlzn
            </span>
          </a>
        </div>
      </div>
    </article>
  );
}
