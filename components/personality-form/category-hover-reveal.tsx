"use client";

import { cn } from "@/lib/utils";
import { motion, useSpring } from "motion/react";
import React, { useState, MouseEvent, useRef } from "react";

interface CategoryHoverRevealProps {
  uploadedImages: { [categoryId: string]: string | string[] };
}

interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  images: string[];
}

const CATEGORY_CONFIG = {
  animal: { name: "Animal", emoji: "🐾" },
  place: { name: "Place", emoji: "🏞️" },
  plant: { name: "Plant", emoji: "🌱" },
  character: { name: "Character", emoji: "👤" },
  season: { name: "Season", emoji: "🍂" },
  hobby: { name: "Hobby", emoji: "🎨" },
  food: { name: "Food", emoji: "🍕" },
  colour: { name: "Color", emoji: "🎨" },
  drink: { name: "Drink", emoji: "🥤" },
};

function CategoryHoverReveal({ uploadedImages }: CategoryHoverRevealProps) {
  const [currentImage, setCurrentImage] = useState<{
    src: string;
    alt: string;
    opacity: number;
  }>({
    src: "",
    alt: "",
    opacity: 0,
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      };
    });

  const spring = {
    stiffness: 150,
    damping: 15,
    mass: 0.1,
  };

  const imagePos = {
    x: useSpring(0, spring),
    y: useSpring(0, spring),
  };

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const { clientX, clientY } = e;
    const relativeX = clientX - containerRect.left;
    const relativeY = clientY - containerRect.top;

    imagePos.x.set(relativeX - imageRef.current.offsetWidth / 2);
    imagePos.y.set(relativeY - imageRef.current.offsetHeight / 2);
  };

  const handleImageInteraction = (category: CategoryItem, opacity: number) => {
    if (opacity > 0 && category.images.length > 0) {
      // For categories with multiple images, show the first one
      // You could implement cycling through images here if desired
      const imageToShow = category.images[0];
      setCurrentImage({
        src: imageToShow,
        alt: `${category.name} - ${category.emoji}`,
        opacity,
      });
    } else {
      setCurrentImage((prev) => ({ ...prev, opacity }));
    }
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
    <section
      ref={containerRef}
      onMouseMove={handleMove}
      className={cn(
        "relative w-full max-w-4xl mx-auto p-2 md:p-8 rounded-2xl border border-purple-500/20 shadow-2xl",
        "bg-gradient-to-br from-slate-200 via-purple-200 to-slate-200",
        "dark:bg-gradient-to-br dark:from-slate-900 dark:via-purple-900 dark:to-slate-900"
      )}
    >
      {/* <div className="mb-8 mt-6 text-center">
        <h3 className="text-2xl font-bold mb-2 ">Personality Categories</h3>
        <p className="text-primary/75">
          Hover over each category to reveal the images
        </p>
      </div> */}

      {categories.map((category) => (
        <div
          key={category.id}
          onMouseEnter={() => handleImageInteraction(category, 1)}
          onMouseMove={() => handleImageInteraction(category, 1)}
          onMouseLeave={() => handleImageInteraction(category, 0)}
          className="w-full py-6 cursor-pointer flex justify-between items-center  border-b border-purple-500/30 last:border-none hover:bg-purple-500/10 transition-colors duration-200 rounded-lg px-4"
        >
          <div className="flex items-center gap-4">
            {/* <span className="text-3xl">{category.emoji}</span> */}
            <div>
              <p className="text-3xl font-bold font-mono text-primary/75">
                {category.name}
              </p>
              <p className="text-sm dark:text-purple-200 text-purple-800">
                {category.images.length} image
                {category.images.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-primary/75 text-sm">Hover to reveal</span>
          </div>
        </div>
      ))}

      {currentImage.src && (
        <motion.img
          ref={imageRef}
          src={currentImage.src}
          alt={"Personality Image"}
          className="w-[350px] h-[250px] rounded-xl object-cover absolute top-0 left-0 transition-opacity duration-200 ease-in-out pointer-events-none shadow-2xl border-2 border-purple-400/50"
          style={{
            x: imagePos.x,
            y: imagePos.y,
            opacity: currentImage.opacity,
          }}
        />
      )}
    </section>
  );
}

export default CategoryHoverReveal;
