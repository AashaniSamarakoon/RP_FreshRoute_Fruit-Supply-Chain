// Use environment variable when available; Expo only exposes variables prefixed with EXPO_PUBLIC_
// keep static fallbacks for local development.
// Prefer environment variable so we can change the target for dev vs Expo Go vs production.
// In local development you may uncomment one of the hard‑coded addresses or set
// EXPO_PUBLIC_BACKEND_URL in your .env file or shell before launching Expo.
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  console.warn(
    "[config] BACKEND_URL is empty.  set EXPO_PUBLIC_BACKEND_URL or uncomment a fallback in config.ts",
  );
}

// export const BACKEND_URL = "http://192.168.1.55:4000";
// export const BACKEND_URL = "http://192.168.43.12:4000";
