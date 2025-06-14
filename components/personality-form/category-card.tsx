import React from "react";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/personality-form-constants";
import "./category-card.css";

interface CategoryCardProps {
  category: (typeof categories)[0];
  images: string | string[];
}

export const CategoryCard = ({ category, images }: CategoryCardProps) => {
  const Icon = category.icon;
  const imageArray = Array.isArray(images) ? images : [images];
  const displayImage = imageArray[0]; // Show first image for the card

  return (
    <figure
      className={cn(
        "relative w-64 cursor-pointer overflow-hidden rounded-xl border p-4",
        // light styles
        "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
        // dark styles
        "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
      )}
    >
      <div className="flex flex-row items-end gap-3 mb-3">
        <div className="p-2 rounded-md bg-muted/50">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col">
          <figcaption className="text-sm font-medium dark:text-white">
            {category.name}
          </figcaption>
          <p className="text-xs font-medium dark:text-white/60">
            {category.description}
          </p>
        </div>
        {Array.isArray(images) && images.length > 1 && (
          <div className="ml-auto text-xs bg-muted px-2 py-1 rounded-full">
            +{images.length}
          </div>
        )}
      </div>

      <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-muted-foreground/10">
        <img
          src={displayImage || "/placeholder.svg"}
          alt={`${category.name} image`}
          className="w-full h-full object-cover select-none drag-none"
        />
      </div>
    </figure>
  );
};
