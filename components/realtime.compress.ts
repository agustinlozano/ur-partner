/**
 * Fast image compression for websocket thumbnails
 * Optimized for speed and minimal output size
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp";
}

export interface CompressResult {
  base64: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
}

/**
 * Fast image compression using canvas
 * Creates tiny thumbnails perfect for websocket transmission
 */
export async function compressImageToBase64(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    maxWidth = 64,
    maxHeight = 64,
    quality = 0.3,
    format = "jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context not available"));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Set canvas size
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Enable image smoothing for better quality at small sizes
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "low";

        // Draw and compress
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to base64 with compression
        const mimeType = format === "webp" ? "image/webp" : "image/jpeg";
        const base64 = canvas.toDataURL(mimeType, quality);

        // Calculate compression stats
        const originalSize = file.size;
        const compressedSize = Math.round((base64.length * 3) / 4); // Approximate base64 to bytes
        const compressionRatio = Math.round(
          (1 - compressedSize / originalSize) * 100
        );

        resolve({
          base64,
          originalSize,
          compressedSize,
          compressionRatio,
          dimensions: { width: newWidth, height: newHeight },
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));

    // Create object URL for faster loading
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Cleanup object URL after loading
    const originalOnLoad = img.onload;
    img.onload = (event) => {
      URL.revokeObjectURL(objectUrl);
      if (originalOnLoad) {
        originalOnLoad.call(img, event);
      }
    };
  });
}

/**
 * Ultra-fast compression for websocket thumbnails
 * Even smaller output, optimized for real-time transmission
 */
export async function compressForWebsocket(
  file: File,
  maxSize: number = 32
): Promise<string> {
  const result = await compressImageToBase64(file, {
    maxWidth: maxSize,
    maxHeight: maxSize,
    quality: 0.1,
    format: "jpeg",
  });

  return result.base64;
}

/**
 * Batch compression for multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressOptions = {}
): Promise<CompressResult[]> {
  const promises = files.map((file) => compressImageToBase64(file, options));
  return Promise.all(promises);
}

/**
 * Calculate optimal dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down if larger than max dimensions
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Utility to check if image compression is supported
 */
export function isCompressionSupported(): boolean {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  return !!(ctx && canvas.toDataURL);
}

/**
 * Get estimated transmission time for different connection speeds
 */
export function estimateTransmissionTime(base64: string): {
  size: number;
  wifi: number;
  mobile4g: number;
  mobile3g: number;
} {
  const sizeInBytes = Math.round((base64.length * 3) / 4);
  const sizeInKb = sizeInBytes / 1024;

  return {
    size: sizeInBytes,
    wifi: Math.round(sizeInKb / 1000), // ~1MB/s
    mobile4g: Math.round(sizeInKb / 100), // ~100KB/s
    mobile3g: Math.round(sizeInKb / 25), // ~25KB/s
  };
}

/**
 * Create a tiny thumbnail optimized for websocket preview
 * Perfect for showing image previews in chat or notifications
 */
export async function createWebsocketThumbnail(
  file: File,
  size: number = 24
): Promise<string> {
  const result = await compressImageToBase64(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.1, // Very low quality for tiny previews
    format: "jpeg",
  });

  // Should be under 1KB for fast transmission
  console.log(`Thumbnail created: ${result.compressedSize} bytes`);
  return result.base64;
}
