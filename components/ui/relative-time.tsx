"use client";

import { useEffect, createElement } from "react";

// Import the web component
import "@github/relative-time-element";

interface RelativeTimeProps {
  datetime: string | Date;
  format?: "datetime" | "relative" | "duration" | "auto" | "micro" | "elapsed";
  tense?: "auto" | "past" | "future";
  precision?: "year" | "month" | "day" | "hour" | "minute" | "second";
  threshold?: string;
  prefix?: string;
  formatStyle?: "long" | "short" | "narrow";
  className?: string;
  children?: React.ReactNode;
}

export default function RelativeTime({
  datetime,
  format = "relative",
  tense = "auto",
  precision = "second",
  threshold = "P30D",
  prefix = "on",
  formatStyle,
  className,
  children,
}: RelativeTimeProps) {
  useEffect(() => {
    // Ensure the web component is registered
    if (!customElements.get("relative-time")) {
      import("@github/relative-time-element");
    }
  }, []);

  const dateString =
    datetime instanceof Date ? datetime.toISOString() : datetime;
  const fallbackText = children || new Date(dateString).toLocaleDateString();

  // Use React.createElement to avoid TypeScript issues with web components
  return createElement(
    "relative-time" as any,
    {
      datetime: dateString,
      format,
      tense,
      precision,
      threshold,
      prefix,
      "format-style": formatStyle,
      className,
    },
    fallbackText
  );
}
