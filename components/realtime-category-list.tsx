"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Heart,
  MapPin,
  User,
  Utensils,
  Calendar,
  Gamepad2,
  Palette,
  Coffee,
  Check,
} from "lucide-react";
import { useSoundPlayer, SOUNDS } from "@/hooks/useSoundStore";

const CATEGORIES = [
  { id: "animal", label: "animal", icon: Heart },
  { id: "place", label: "place", icon: MapPin },
  { id: "character", label: "character", icon: User },
  { id: "food", label: "food", icon: Utensils },
  { id: "session", label: "session", icon: Calendar },
  { id: "hobby", label: "hobby", icon: Gamepad2 },
  { id: "color", label: "color", icon: Palette },
  { id: "drink", label: "drink", icon: Coffee },
];

interface CategoryListProps {
  selectedCategory: string | null;
  completedCategories: string[];
  onCategorySelect: (category: string) => void;
  disabled?: boolean;
}

export function CategoryList({
  selectedCategory,
  completedCategories,
  onCategorySelect,
  disabled = false,
}: CategoryListProps) {
  const playSound = useSoundPlayer();

  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    e.dataTransfer.setData("text/plain", categoryId);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Card className="p-2 sm:p-4 h-fit gap-4">
      <h3 className="text-sm font-medium text-muted-foreground">Categories</h3>
      <p className="text-xs text-muted-foreground hidden sm:block">
        Click or drag to main panel
      </p>
      <div className="space-y-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isCompleted = completedCategories.includes(category.id);
          const isSelected = selectedCategory === category.id;
          const isDisabled = disabled || isCompleted;

          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "outline"}
              className={`w-full justify-start gap-2 h-10 transition-all ${
                isCompleted ? "opacity-50 line-through" : ""
              } ${
                !isDisabled
                  ? "cursor-grab active:cursor-grabbing hover:scale-[1.02]"
                  : ""
              }`}
              onClick={() => {
                if (!isDisabled) {
                  onCategorySelect(category.id);
                  playSound(SOUNDS.tap);
                }
              }}
              disabled={isDisabled}
              draggable={!isDisabled}
              onDragStart={(e) => handleDragStart(e, category.id)}
            >
              <Icon className="h-4 w-4" />
              {category.label}
              {isCompleted && <Check className="h-4 w-4 ml-auto" />}
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
