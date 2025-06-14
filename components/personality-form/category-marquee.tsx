import React from "react";
import Marquee from "@/components/ui/marquee";
import { CategoryCard } from "./category-card";
import {
  categories,
  type UploadedImages,
} from "@/lib/personality-form-constants";

interface CategoryMarqueeProps {
  uploadedImages: UploadedImages;
}

export const CategoryMarquee = ({ uploadedImages }: CategoryMarqueeProps) => {
  const completedCategories = categories.filter(
    (category) => uploadedImages[category.id]
  );
  const firstRow = completedCategories.slice(
    0,
    Math.ceil(completedCategories.length / 2)
  );
  const secondRow = completedCategories.slice(
    Math.ceil(completedCategories.length / 2)
  );

  return (
    <div
      className="relative flex h-full w-full flex-col border
     items-center justify-center overflow-hidden rounded-lg py-10"
    >
      <Marquee pauseOnHover className="[--duration:25s]">
        {firstRow.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            images={uploadedImages[category.id]}
          />
        ))}
      </Marquee>
      {secondRow.length > 0 && (
        <Marquee reverse pauseOnHover className="[--duration:25s]">
          {secondRow.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              images={uploadedImages[category.id]}
            />
          ))}
        </Marquee>
      )}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-white dark:from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-white dark:from-background"></div>
    </div>
  );
};
