"use client";

import React from "react";
import styles from "./matrix-board.module.css";

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
}

export function MatrixBoard({
  text = "CSS.",
  title = "CSS Matrix Board",
  description = "The power of masking text under a repeating background with mix-blend-mode thrown in.",
  href,
  blur = 2,
  hue = 180,
  spread = 2,
  font = 12,
  weight = 500,
  line = 1,
  className = "",
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

  return (
    <article className={`${styles.container} ${className}`} style={cssVars}>
      <div className={styles.board}>
        <div className={styles.textWrap}>
          <div aria-hidden="true" className={styles.fluidText}>
            {text}
          </div>
        </div>
      </div>
      <div className={styles.details}>
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
    </article>
  );
}
