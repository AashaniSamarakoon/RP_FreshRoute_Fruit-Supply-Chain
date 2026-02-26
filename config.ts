// Use environment variable when available; Expo only exposes variables prefixed with EXPO_PUBLIC_
// keep static fallbacks for local development.
export const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL;
// export const BACKEND_URL = "http://192.168.1.55:4000";
// export const BACKEND_URL = "http://192.168.43.12:4000";
