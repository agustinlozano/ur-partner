import { create } from "zustand";
import type { UnsplashPhoto } from "@/components/unsplash-image-selector";

interface UnsplashSelectorState {
  open: boolean;
  photos: UnsplashPhoto[];
  query: string;
  page: number;
  hasMore: boolean;
  isLoading: boolean;
  error?: string;
  selectedPhotoId?: string;
  resolving: ((photo: UnsplashPhoto | null) => void) | null;
  cache: Record<
    string,
    {
      page: number;
      photos: UnsplashPhoto[];
      hasMore: boolean;
      timestamp: number;
    }
  >;
  abortController?: AbortController | null;
  // actions
  openDialog: (initialQuery?: string) => Promise<UnsplashPhoto | null>;
  close: () => void;
  search: (q: string) => void;
  loadMore: () => void;
  select: (p: UnsplashPhoto) => void;
  retry: () => void;
  _fetchPage: (opts?: { append?: boolean }) => Promise<void>;
}

const PER_PAGE = 30;
const CACHE_TTL = 1000 * 60 * 5; // 5 min

export const useUnsplashSelectorStore = create<UnsplashSelectorState>(
  (set, get) => ({
    open: false,
    photos: [],
    query: "",
    page: 1,
    hasMore: false,
    isLoading: false,
    resolving: null,
    cache: {},
    abortController: undefined,

    openDialog: (initialQuery = "") =>
      new Promise<UnsplashPhoto | null>((resolve) => {
        const st = get();
        st.abortController?.abort();
        set({
          open: true,
          photos: [],
          query: initialQuery,
          page: 1,
          hasMore: false,
          error: undefined,
          selectedPhotoId: undefined,
          resolving: resolve,
        });
        if (initialQuery) get().search(initialQuery);
      }),

    close: () => {
      const { resolving, abortController } = get();
      abortController?.abort();
      resolving?.(null);
      set({ open: false, resolving: null, abortController: undefined });
    },

    _fetchPage: async ({ append }: { append?: boolean } = {}) => {
      const { query, page, photos, cache, abortController } = get();
      if (!query.trim()) {
        set({ photos: [], hasMore: false, isLoading: false });
        return;
      }

      // Cache key per query
      const cacheKey = query.toLowerCase();
      // Serve from cache if page=1 and fresh
      if (
        !append &&
        page === 1 &&
        cache[cacheKey] &&
        Date.now() - cache[cacheKey].timestamp < CACHE_TTL
      ) {
        const entry = cache[cacheKey];
        set({
          photos: entry.photos,
          hasMore: entry.hasMore,
          isLoading: false,
          error: undefined,
        });
        return;
      }

      abortController?.abort();
      const ac = new AbortController();
      set({ isLoading: true, error: undefined, abortController: ac });

      try {
        const url = new URL("https://api.unsplash.com/search/photos");
        url.searchParams.set("query", query);
        url.searchParams.set("page", String(page));
        url.searchParams.set("per_page", String(PER_PAGE));
        const key = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
        if (!key) throw new Error("Missing Unsplash access key");
        url.searchParams.set("client_id", key);

        const res = await fetch(url.toString(), { signal: ac.signal });
        if (!res.ok) throw new Error(`Unsplash API error ${res.status}`);
        const data = await res.json();
        const newPhotos: UnsplashPhoto[] = (data.results || []).map(
          mapApiPhoto
        );
        const merged = append ? [...photos, ...newPhotos] : newPhotos;
        const hasMore = newPhotos.length === PER_PAGE;
        set((s) => ({
          photos: merged,
          hasMore,
          isLoading: false,
          cache: {
            ...s.cache,
            [cacheKey]: {
              page,
              photos: merged,
              hasMore,
              timestamp: Date.now(),
            },
          },
          abortController: undefined,
        }));
      } catch (e: any) {
        if (e?.name === "AbortError") return; // silent
        set({
          error: e.message || "Failed to fetch",
          isLoading: false,
          abortController: undefined,
        });
      }
    },

    search: (q: string) => {
      set({ query: q, page: 1 });
      get()._fetchPage();
    },

    loadMore: () => {
      const { hasMore, isLoading } = get();
      if (!hasMore || isLoading) return;
      set((s) => ({ page: s.page + 1 }));
      get()._fetchPage({ append: true });
    },

    select: (p: UnsplashPhoto) => {
      set({ selectedPhotoId: p.id });
      const { resolving } = get();
      resolving?.(p);
      set({ open: false, resolving: null });
    },

    retry: () => {
      get()._fetchPage();
    },
  })
);

function mapApiPhoto(raw: any): UnsplashPhoto {
  return {
    id: raw.id,
    width: raw.width,
    height: raw.height,
    alt: raw.alt_description,
    color: raw.color,
    urls: {
      thumb: raw.urls.thumb,
      small: raw.urls.small,
      regular: raw.urls.regular,
      full: raw.urls.full,
    },
    user: {
      name: raw.user?.name,
      username: raw.user?.username,
      profile_image: raw.user?.profile_image
        ? { small: raw.user.profile_image.small }
        : undefined,
    },
    links: { html: raw.links?.html },
  };
}

// Imperative helper
export function pickUnsplashImage(initialQuery = "") {
  return useUnsplashSelectorStore.getState().openDialog(initialQuery);
}
