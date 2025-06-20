"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryExpandableGalleryProps {
  uploadedImages: { [categoryId: string]: string | string[] };
}

interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  images: string[];
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

const imageTransition = {
  initial: { opacity: 0, scale: 1.1 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.4, ease: "easeInOut" },
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
        images: imageArray,
        description: config?.description || `Images representing ${categoryId}`,
        totalImages: imageArray.length,
      };
    });

  const [activeIndex, setActiveIndex] = useState<number>(
    Math.floor(categories.length / 2) || 0
  );

  // Track current image index for each category
  const [categoryImageIndex, setCategoryImageIndex] = useState<{
    [key: string]: number;
  }>({});

  // Auto-cycle through images for categories with multiple images
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];

    categories.forEach((category) => {
      if (category.totalImages > 1) {
        const interval = setInterval(() => {
          setCategoryImageIndex((prev) => ({
            ...prev,
            [category.id]:
              ((prev[category.id] || 0) + 1) % category.totalImages,
          }));
        }, 3000); // Change image every 3 seconds

        intervals.push(interval);
      }
    });

    return () => {
      intervals.forEach((interval) => clearInterval(interval));
    };
  }, [categories]);

  // Manual navigation functions
  const nextImage = (
    categoryId: string,
    totalImages: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setCategoryImageIndex((prev) => ({
      ...prev,
      [categoryId]: ((prev[categoryId] || 0) + 1) % totalImages,
    }));
  };

  const prevImage = (
    categoryId: string,
    totalImages: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setCategoryImageIndex((prev) => ({
      ...prev,
      [categoryId]:
        prev[categoryId] === 0 || prev[categoryId] === undefined
          ? totalImages - 1
          : prev[categoryId] - 1,
    }));
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">🖼️</div>
        <p className="text-muted-foreground">No images available to display</p>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Desktop Layout - Horizontal */}
      <div className="hidden md:block overflow-x-hidden">
        <div className="w-fit mx-auto gap-1 flex pb-8 pt-4 px-4">
          {categories.map((category, i) => {
            const currentImageIndex = categoryImageIndex[category.id] || 0;
            const currentImage = category.images[currentImageIndex];

            return (
              <motion.div
                key={category.id}
                whileTap={{ scale: 0.95 }}
                className={`rounded-xl relative ${
                  activeIndex === i ? "w-[450px]" : "w-[80px]"
                } h-[400px] flex-shrink-0 transition-[width] ease-in-out duration-400 origin-center cursor-pointer overflow-hidden`}
                onClick={() => setActiveIndex(i)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {/* Image container with AnimatePresence for smooth transitions */}
                <div className="w-full h-full relative">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={`${category.id}-${currentImageIndex}`}
                      src={currentImage}
                      alt={`${category.name} - ${category.emoji} (${
                        currentImageIndex + 1
                      }/${category.totalImages})`}
                      className="w-full rounded-xl h-full object-cover absolute inset-0"
                      {...imageTransition}
                    />
                  </AnimatePresence>
                </div>

                {/* Navigation arrows for multiple images when expanded */}
                {activeIndex === i && category.totalImages > 1 && (
                  <>
                    <button
                      onClick={(e) =>
                        prevImage(category.id, category.totalImages, e)
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) =>
                        nextImage(category.id, category.totalImages, e)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Image dots indicator for multiple images when expanded */}
                {activeIndex === i && category.totalImages > 1 && (
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                    {category.images.map((_, imgIndex) => (
                      <button
                        key={imgIndex}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryImageIndex((prev) => ({
                            ...prev,
                            [category.id]: imgIndex,
                          }));
                        }}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          currentImageIndex === imgIndex
                            ? "bg-white"
                            : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Category indicator for collapsed state */}
                {activeIndex !== i && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                    <div className="text-center text-white">
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
                      className="absolute flex rounded-xl flex-col justify-end h-full top-0 p-6 space-y-2 overflow-hidden bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                    >
                      <motion.div
                        variants={article}
                        className="flex items-center gap-2 mb-2"
                      >
                        {category.totalImages > 1 && (
                          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                            {currentImageIndex + 1}/{category.totalImages}
                          </span>
                        )}
                      </motion.div>

                      <motion.h1
                        variants={article}
                        className="text-2xl font-mono font-bold text-white"
                      >
                        {category.name}
                      </motion.h1>

                      <motion.p
                        variants={article}
                        className="text-base text-white/90 leading-relaxed"
                      >
                        {category.description}
                      </motion.p>
                    </motion.article>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation dots for desktop */}
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

      {/* Mobile Layout - Vertical */}
      <div className="md:hidden space-y-2 px-4">
        {categories.map((category, i) => {
          const currentImageIndex = categoryImageIndex[category.id] || 0;
          const currentImage = category.images[currentImageIndex];

          return (
            <motion.div
              key={category.id}
              whileTap={{ scale: 0.98 }}
              className={`rounded-xl relative w-full transition-all ease-in-out duration-500 cursor-pointer overflow-hidden ${
                activeIndex === i ? "h-[300px]" : "h-[80px]"
              }`}
              onClick={() => setActiveIndex(i)}
            >
              {/* Image container with AnimatePresence for smooth transitions */}
              <div className="w-full h-full relative">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${category.id}-${currentImageIndex}-mobile`}
                    src={currentImage}
                    alt={`${category.name} - ${category.emoji} (${
                      currentImageIndex + 1
                    }/${category.totalImages})`}
                    className="w-full rounded-xl h-full object-cover absolute inset-0"
                    {...imageTransition}
                  />
                </AnimatePresence>
              </div>

              {/* Navigation arrows for multiple images when expanded - Mobile */}
              {activeIndex === i && category.totalImages > 1 && (
                <>
                  <button
                    onClick={(e) =>
                      prevImage(category.id, category.totalImages, e)
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) =>
                      nextImage(category.id, category.totalImages, e)
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Image dots indicator for multiple images when expanded - Mobile */}
              {activeIndex === i && category.totalImages > 1 && (
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {category.images.map((_, imgIndex) => (
                    <button
                      key={imgIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategoryImageIndex((prev) => ({
                          ...prev,
                          [category.id]: imgIndex,
                        }));
                      }}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentImageIndex === imgIndex
                          ? "bg-white"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Category indicator for collapsed state - Mobile */}
              {activeIndex !== i && (
                <div className="absolute inset-0 flex items-center justify-between bg-black/50 rounded-xl px-4">
                  <div className="text-white">
                    <h3 className="text-lg font-mono font-bold">
                      {category.name}
                    </h3>
                    <p className="text-xs text-white/80">Tap to expand</p>
                  </div>
                  {category.totalImages > 1 && (
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                      {currentImageIndex + 1}/{category.totalImages}
                    </span>
                  )}
                </div>
              )}

              <AnimatePresence mode="wait">
                {activeIndex === i && (
                  <motion.article
                    variants={article}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    className="absolute flex rounded-xl flex-col justify-end h-full top-0 p-4 space-y-2 overflow-hidden bg-gradient-to-t from-black/70 via-black/20 to-transparent"
                  >
                    <motion.div
                      variants={article}
                      className="flex items-center gap-2 mb-2"
                    >
                      {category.totalImages > 1 && (
                        <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                          {currentImageIndex + 1}/{category.totalImages}
                        </span>
                      )}
                    </motion.div>

                    <motion.h1
                      variants={article}
                      className="text-xl font-mono font-bold text-white"
                    >
                      {category.name}
                    </motion.h1>

                    <motion.p
                      variants={article}
                      className="text-sm text-white/90 leading-relaxed"
                    >
                      {category.description}
                    </motion.p>
                  </motion.article>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryExpandableGallery;
