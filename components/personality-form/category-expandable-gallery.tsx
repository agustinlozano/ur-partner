"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface CategoryExpandableGalleryProps {
  uploadedImages: { [categoryId: string]: string | string[] };
}

interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  image: string;
  description: string;
  totalImages: number;
}

const CATEGORY_CONFIG = {
  animal: {
    name: "Animal",
    emoji: "🐾",
    description: "The animal that represents their spirit",
  },
  place: {
    name: "Place",
    emoji: "🏞️",
    description: "A place that reminds them of you",
  },
  plant: {
    name: "Plant",
    emoji: "🌱",
    description: "The plant that matches your essence",
  },
  character: {
    name: "Character",
    emoji: "👤",
    description: "A character that embodies you",
  },
  season: {
    name: "Season",
    emoji: "🍂",
    description: "The season that captures your vibe",
  },
  hobby: {
    name: "Hobby",
    emoji: "🎨",
    description: "An activity that reflects your personality",
  },
  food: {
    name: "Food",
    emoji: "🍕",
    description: "The food that represents your taste",
  },
  colour: {
    name: "Color",
    emoji: "🎨",
    description: "The color that defines your aura",
  },
  drink: {
    name: "Drink",
    emoji: "🥤",
    description: "The drink that matches your energy",
  },
};

const article = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      delayChildren: 0.2,
      staggerChildren: 0.1,
    },
  },
};

function CategoryExpandableGallery({
  uploadedImages,
}: CategoryExpandableGalleryProps) {
  // Transform uploadedImages into CategoryItem array
  const categories: CategoryItem[] = Object.entries(uploadedImages)
    .filter(
      ([_, images]) =>
        images && (Array.isArray(images) ? images.length > 0 : images)
    )
    .map(([categoryId, images]) => {
      const config =
        CATEGORY_CONFIG[categoryId as keyof typeof CATEGORY_CONFIG];
      const imageArray = Array.isArray(images) ? images : [images];

      return {
        id: categoryId,
        name: config?.name || categoryId,
        emoji: config?.emoji || "📷",
        image: imageArray[0], // Show first image in the gallery
        description: config?.description || `Images representing ${categoryId}`,
        totalImages: imageArray.length,
      };
    });

  const [activeIndex, setActiveIndex] = useState<number>(
    Math.floor(categories.length / 2) || 0
  );

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🖼️</div>
        <p className="text-muted-foreground">No images available to display</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="w-fit mx-auto gap-1 flex pb-8 pt-4 px-4">
        {categories.map((category, i) => (
          <motion.div
            key={category.id}
            whileTap={{ scale: 0.95 }}
            className={`rounded-xl relative ${
              activeIndex === i
                ? "w-[350px] md:w-[450px]"
                : "w-[60px] md:w-[80px]"
            } h-[300px] md:h-[400px] flex-shrink-0 transition-[width] ease-in-out duration-500 origin-center cursor-pointer`}
            onClick={() => setActiveIndex(i)}
            onMouseEnter={() => setActiveIndex(i)}
          >
            <motion.img
              src={category.image}
              alt={`${category.name} - ${category.emoji}`}
              className="w-full rounded-xl h-full object-cover"
            />

            {/* Category indicator for collapsed state */}
            {activeIndex !== i && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                <div className="text-center text-white">
                  {/* <div className="text-2xl md:text-3xl mb-1">
                    {category.emoji}
                  </div> */}
                  <div className="text-xs font-medium transform -rotate-90 whitespace-nowrap">
                    {category.name}
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeIndex === i && (
                <motion.article
                  variants={article}
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  className="absolute flex rounded-xl flex-col justify-end h-full top-0 p-4 md:p-6 space-y-2 overflow-hidden bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                >
                  <motion.div
                    variants={article}
                    className="flex items-center gap-2 mb-2"
                  >
                    {/* <span className="text-2xl md:text-3xl">
                      {category.emoji}
                    </span> */}
                    {category.totalImages > 1 && (
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                        +{category.totalImages - 1} more
                      </span>
                    )}
                  </motion.div>

                  <motion.h1
                    variants={article}
                    className="text-xl font-mono md:text-2xl font-bold text-white"
                  >
                    {category.name}
                  </motion.h1>

                  <motion.p
                    variants={article}
                    className="text-sm md:text-base text-white/90 leading-relaxed"
                  >
                    {category.description}
                  </motion.p>
                </motion.article>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {categories.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              activeIndex === i ? "bg-primary" : "bg-primary/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default CategoryExpandableGallery;
