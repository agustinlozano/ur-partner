"use client";

import * as React from "react";
import { Search, X, Check, Loader2, ImageIcon, ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Public shape (mirrors a subset of Unsplash API response we expect to render)
export interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  alt?: string | null;
  color?: string | null;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full?: string;
  };
  user: {
    name: string;
    username: string;
    profile_image?: { small?: string };
  };
  links: { html: string };
}

export interface UnsplashImageSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photos: UnsplashPhoto[];
  isLoading: boolean;
  hasMore?: boolean;
  onSearch: (query: string) => void;
  onSelect: (photo: UnsplashPhoto) => void;
  onLoadMore?: () => void;
  selectedPhotoId?: string;
  error?: string;
  initialQuery?: string;
  suggestions?: string[]; // e.g. ["nature","city","abstract"]
  emptyState?: React.ReactNode;
  footnote?: React.ReactNode; // optional extra footer content
  className?: string;
}

// Presentational only – no networking. Consumer handles data & state.
export function UnsplashImageSelectorDialog(
  props: Omit<UnsplashImageSelectorProps, "open" | "onOpenChange"> & {
    trigger?: React.ReactNode;
    dialogTitle?: string;
    dialogDescription?: string;
    size?: "md" | "lg" | "xl";
  }
) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {props.trigger ?? (
          <Button variant="outline" size="sm">
            <ImageIcon className="size-4" /> Pick Unsplash Image
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className={cn(
          "flex h-[min(90vh,780px)] w-[min(1000px,100vw-2rem)] flex-col gap-0 p-0 overflow-hidden",
          props.size === "md" && "w-[min(760px,100vw-2rem)]",
          props.size === "xl" && "w-[min(1200px,100vw-2rem)]"
        )}
        showCloseButton
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {props.dialogTitle ?? "Select an Unsplash Image"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {props.dialogDescription ??
              "Search millions of free high‑resolution photos. Attribution applied automatically."}
          </DialogDescription>
        </DialogHeader>
        <UnsplashImageSelector
          {...props}
          open={open}
          onOpenChange={setOpen}
          className="flex-1"
        />
      </DialogContent>
    </Dialog>
  );
}

export function ControlledUnsplashImageSelectorDialog(
  props: Omit<UnsplashImageSelectorProps, "open" | "onOpenChange"> & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dialogTitle?: string;
    dialogDescription?: string;
    size?: "md" | "lg" | "xl";
    trigger?: React.ReactNode; // optional external trigger
  }
) {
  const { open, onOpenChange } = props;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {props.trigger && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}
      <DialogContent
        className={cn(
          "flex h-[min(90vh,780px)] w-[min(1000px,100vw-2rem)] flex-col gap-0 p-0 overflow-hidden",
          props.size === "md" && "w-[min(760px,100vw-2rem)]",
          props.size === "xl" && "w-[min(1200px,100vw-2rem)]"
        )}
        showCloseButton
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <DialogTitle className="text-base font-semibold tracking-tight">
            {props.dialogTitle ?? "Select an Unsplash Image"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {props.dialogDescription ??
              "Search millions of free high‑resolution photos. Attribution applied automatically."}
          </DialogDescription>
        </DialogHeader>
        <UnsplashImageSelector
          {...props}
          open={open}
          onOpenChange={onOpenChange}
          className="flex-1"
        />
      </DialogContent>
    </Dialog>
  );
}

export function UnsplashImageSelector({
  photos,
  isLoading,
  hasMore,
  onSearch,
  onSelect,
  onLoadMore,
  selectedPhotoId,
  error,
  initialQuery = "",
  suggestions = ["dolphin", "new york", "running", "pizza", "yellow"],
  emptyState,
  footnote,
  className,
}: UnsplashImageSelectorProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [pendingQuery, setPendingQuery] = React.useState(initialQuery);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  // Debounce query changes to avoid layout shift & rapid calls.
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (pendingQuery.trim() !== query.trim()) {
        setQuery(pendingQuery);
        onSearch(pendingQuery.trim());
        // Scroll back to top once a new search fires
        queueMicrotask(() => {
          gridRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [pendingQuery, query, onSearch]);

  // Keyboard navigation (arrow keys) within grid
  const photoIds = React.useMemo(() => photos.map((p) => p.id), [photos]);
  const currentIndex = React.useMemo(
    () => (selectedPhotoId ? photoIds.indexOf(selectedPhotoId) : -1),
    [photoIds, selectedPhotoId]
  );

  const moveSelection = React.useCallback(
    (delta: number) => {
      if (!photoIds.length) return;
      const nextIndex = Math.min(
        photoIds.length - 1,
        Math.max(0, currentIndex + delta)
      );
      if (nextIndex !== currentIndex) {
        const photo = photos[nextIndex];
        onSelect(photo);
        const el = document.getElementById(`unsplash-photo-${photo.id}`);
        if (el) {
          el.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      }
    },
    [photoIds, currentIndex, photos, onSelect]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelection(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelection(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      // Assume ~5 columns typical wide layout
      moveSelection(5);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(-5);
    } else if (e.key === "Enter") {
      if (currentIndex >= 0) {
        e.preventDefault();
        onSelect(photos[currentIndex]);
      }
    }
  };

  const showEmpty = !isLoading && photos.length === 0 && !error;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Search Bar */}
      <div className="flex flex-col gap-2 px-6 pt-4 pb-3 border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search Unsplash photos..."
            value={pendingQuery}
            onChange={(e) => setPendingQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setQuery(pendingQuery);
                onSearch(pendingQuery.trim());
                gridRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            aria-label="Search photos"
            className="pl-9 pr-9"
          />
          {pendingQuery && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setPendingQuery("");
                setQuery("");
                onSearch("");
                inputRef.current?.focus();
              }}
              className="absolute right-2 inline-flex size-6 items-center justify-center rounded-sm text-muted-foreground/70 hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 text-[11px] font-medium">
          {suggestions.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={s === query ? "secondary" : "outline"}
              className="h-7 rounded-full px-3 border border-muted/50"
              onClick={() => {
                setPendingQuery(s);
                setQuery(s);
                onSearch(s);
                gridRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid Area */}
      <div className="relative flex min-h-0 flex-1" onKeyDown={onKeyDown}>
        <ScrollArea className="flex-1" ref={gridRef as any}>
          <div
            className={cn(
              "grid gap-3 p-6",
              // Responsive adaptive columns
              "grid-cols-[repeat(auto-fill,minmax(140px,1fr))]"
            )}
          >
            {photos.map((p) => (
              <PhotoCard
                key={p.id}
                photo={p}
                selected={p.id === selectedPhotoId}
                onSelect={() => onSelect(p)}
              />
            ))}
            {isLoading && (
              <LoadingGridPlaceholders existingCount={photos.length} />
            )}
            {showEmpty && (
              <div className="col-span-full flex flex-col items-center justify-center gap-4 py-16 text-center">
                <div className="rounded-full border size-14 grid place-content-center">
                  <ImageIcon className="size-6 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">No results</p>
                  <p className="text-xs text-muted-foreground">
                    Try a different search term or pick a suggestion above.
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div className="col-span-full flex flex-col items-center gap-4 py-16 text-center">
                <div className="rounded-full border size-14 grid place-content-center bg-destructive/5">
                  <X className="size-6 text-destructive" />
                </div>
                <div className="flex flex-col gap-1 max-w-sm">
                  <p className="text-sm font-medium">Something went wrong</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSearch(query)}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
          {/* Load more */}
          {hasMore && !showEmpty && !error && (
            <div className="flex justify-center py-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLoadMore?.()}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading && <Loader2 className="size-4 animate-spin" />}
                Load more
                <ArrowDown className="size-4" />
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer / Attribution */}
      <div className="flex items-center justify-between gap-4 px-6 py-3 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 text-[11px] leading-tight">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground/80">
          <span>
            Photos provided by{" "}
            <a
              href="https://unsplash.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:underline"
            >
              Unsplash
            </a>
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">
            Ensure you adhere to the Unsplash License.
          </span>
        </div>
        {footnote && <div className="ml-auto">{footnote}</div>}
      </div>
    </div>
  );
}

interface PhotoCardProps {
  photo: UnsplashPhoto;
  selected?: boolean;
  onSelect: () => void;
}

function PhotoCard({ photo, selected, onSelect }: PhotoCardProps) {
  // Reserve aspect ratio to avoid layout shift
  const ratioPercent = (photo.height / photo.width) * 100;
  const alt = photo.alt || "Unsplash photo";

  return (
    <div
      id={`unsplash-photo-${photo.id}`}
      className={cn(
        "group relative isolate rounded-md overflow-hidden border bg-muted/30 backdrop-blur-sm transition-all",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      style={{ backgroundColor: photo.color || undefined }}
    >
      <div
        style={{ paddingBottom: `${ratioPercent}%` }}
        className="block w-full"
        aria-hidden="true"
      />
      <img
        src={photo.urls.small || photo.urls.thumb}
        alt={alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 size-full object-cover pointer-events-none select-none transition-transform duration-300 group-hover:scale-105"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1.5">
        <Button
          size="sm"
          variant={selected ? "secondary" : "outline"}
          className={cn(
            "h-7 w-full rounded-sm text-[11px] font-medium backdrop-blur-sm",
            selected && "bg-primary text-primary-foreground border-primary"
          )}
          onClick={onSelect}
        >
          {selected ? (
            <span className="inline-flex items-center gap-1">
              <Check className="size-3.5" /> Selected
            </span>
          ) : (
            "Select"
          )}
        </Button>
      </div>
      <a
        href={photo.links.html}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-1.5 left-1.5 max-w-[75%] rounded-sm bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {photo.user.name}
      </a>
    </div>
  );
}

function LoadingGridPlaceholders({ existingCount }: { existingCount: number }) {
  // Always render at least enough placeholders to fill next row(s) for stability
  const placeholders = React.useMemo(() => {
    const target = Math.max(8, 12 - (existingCount % 12));
    return new Array(target).fill(0).map((_, i) => i);
  }, [existingCount]);
  return (
    <>
      {placeholders.map((i) => (
        <div key={i} className="relative rounded-md overflow-hidden border">
          <div
            className="block w-full"
            style={{ paddingBottom: `${(9 / 16) * 100}%` }}
          />
          <Skeleton className="absolute inset-0 size-full" />
        </div>
      ))}
    </>
  );
}

// Re‑export icons used externally if desired
export const UnsplashIcons = { Search, Check, X };
