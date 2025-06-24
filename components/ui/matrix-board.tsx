"use client";

import React from "react";
import styles from "./matrix-board.module.css";
import { cn } from "@/lib/utils";

interface MatrixBoardProps {
  text?: string;
  title?: string;
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
  description = "Guy from Argentina 🇦🇷 doin' software",
  href,
  blur = 1.5,
  hue = 300,
  spread = 1.3,
  font = 22,
  weight = 600,
  line = 1,
  className = "",
  style = {},
  containerBg = "color-mix(in lch, canvas, canvasText 10%)",
  containerBorder = "1px solid color-mix(in lch, canvas, canvasText 35%)",
  containerRadius = 12,
  containerPadding = "1rem",
  containerShadow = "0 1px 0 0 hsl(0 0% 100% / 0.5) inset",
}: MatrixBoardProps) {
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
    <article className={cn(styles.container, className)} style={containerStyle}>
      <div className={styles.board}>
        <div className={styles.textWrap}>
          <div aria-hidden="true" className={styles.fluidText}>
            {text}
          </div>
        </div>
      </div>
      <div className={styles.details}>
        <div className={styles.avatar}>
          <img
            src="/emoji.webp"
            alt="Agustin's avatar"
            className="w-28 mb-0 rounded-md object-cover border-2 border-primary/20 shadow-md"
          />
        </div>
        <div className="grow flex flex-col justify-center">
          <h2 className={styles.title}>
            {href ? (
              <a href={href} target="_blank" rel="noreferrer noopener">
                {title}
              </a>
            ) : (
              title
            )}
          </h2>
          <p className={styles.description}>{description}</p>
        </div>
      </div>
    </article>
  );
}
