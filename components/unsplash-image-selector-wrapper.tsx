"use client";

import * as React from "react";
import { ControlledUnsplashImageSelectorDialog } from "@/components/unsplash-image-selector";
import { useUnsplashSelectorStore } from "@/stores/unsplash-image-selector-store";

// Mount once near root (e.g. in layout) so dialog is globally available.
export function GlobalUnsplashImageSelector() {
  const {
    open,
    photos,
    isLoading,
    hasMore,
    error,
    selectedPhotoId,
    close,
    search,
    loadMore,
    select,
  } = useUnsplashSelectorStore();

  return (
    <ControlledUnsplashImageSelectorDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
      photos={photos}
      isLoading={isLoading}
      hasMore={hasMore}
      error={error}
      selectedPhotoId={selectedPhotoId}
      onSearch={search}
      onLoadMore={loadMore}
      onSelect={select}
      dialogTitle="Choose a photo"
      dialogDescription="Search free high‑resolution images from Unsplash"
    />
  );
}
