export const enviroment = process.env.NODE_ENV;

// Audio configuration
export const AUDIO_CONFIG = {
  backgroundMusicUrl:
    process.env.NEXT_PUBLIC_BACKGROUND_MUSIC_URL ||
    "https://ur-partner.s3.us-east-2.amazonaws.com/assets/uplift-piano-riff.wav",
  fallbackUrl: "throw", // Fallback to local file if S3 fails
} as const;
