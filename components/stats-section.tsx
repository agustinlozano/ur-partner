"use client";
import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Users, Home, Images } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  targetValue: number;
  label: string;
  description: string;
  gradient: string;
  iconColor: string;
  delay?: number;
}

function StatCard({
  icon,
  targetValue,
  label,
  description,
  gradient,
  iconColor,
  delay = 0,
}: StatCardProps) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentValue(targetValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [targetValue, delay]);

  return (
    <motion.div
      className={cn(
        "p-6 rounded-xl shadow-lg border group select-none",
        gradient,
        "hover:shadow-xl transition-all duration-300"
      )}
      whileHover={{ scale: 1.02 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
    >
      {/* Mobile layout: row with icon+number left, text right */}
      <div className="flex items-center gap-8 md:hidden">
        <div className="flex flex-col items-center space-y-2">
          <div className={cn("inline-flex p-3 rounded-full", iconColor)}>
            {icon}
          </div>
          <NumberFlow
            value={currentValue}
            className="text-2xl font-bold font-mono"
            format={{ notation: "compact" }}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold font-mono">{label}</h3>
          <p className="text-sm text-primary/75">{description}</p>
        </div>
      </div>

      {/* Desktop layout: centered column */}
      <div className="hidden md:block text-center space-y-3">
        <div className={cn("inline-flex p-3 rounded-full", iconColor)}>
          {icon}
        </div>
        <div>
          <NumberFlow
            value={currentValue}
            className="text-3xl font-bold font-mono"
            format={{ notation: "compact" }}
          />
          <h3 className="text-lg font-semibold font-mono mt-1">{label}</h3>
          <p className="text-sm text-primary/75">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function StatsSection({ className }: { className?: string }) {
  const stats = [
    {
      icon: <Users className="w-6 h-6" />,
      targetValue: 1247,
      label: "Visitors",
      description: "People have discovered the app",
      gradient:
        "bg-gradient-to-t from-blue-200/80 to-blue-600/30 dark:from-blue-900/20 dark:to-blue-700/25 border-blue-400 dark:border-blue-800",
      iconColor: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
      delay: 500,
    },
    {
      icon: <Home className="w-6 h-6" />,
      targetValue: 89,
      label: "Rooms Created",
      description: "Personality sessions started",
      gradient:
        "bg-gradient-to-t from-emerald-200/80 to-emerald-600/30 dark:from-emerald-900/20 dark:to-emerald-700/25 border-emerald-400 dark:border-emerald-800",
      iconColor: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      delay: 700,
    },
    {
      icon: <Images className="w-6 h-6" />,
      targetValue: 1680,
      label: "Images Uploaded",
      description: "Personalities shared",
      gradient:
        "bg-gradient-to-t from-violet-200/80 to-violet-600/30 dark:from-violet-900/20 dark:to-violet-700/25 border-violet-400 dark:border-violet-800",
      iconColor: "bg-violet-500/20 text-violet-600 dark:text-violet-400",
      delay: 900,
    },
  ];

  return (
    <div className={cn("w-full max-w-4xl mx-auto py-8", className)}>
      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>
    </div>
  );
}
