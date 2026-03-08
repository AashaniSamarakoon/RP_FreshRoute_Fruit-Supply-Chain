import { BACKEND_URL } from "@/config";
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

// wrapper that automatically appends auth header if token is available
// when using Supabase for sign‑in we no longer read the raw token from
// storage; instead we ask the SDK for the current session so that we
// benefit from automatic refresh and persistence behaviour.
async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  // try to get the active session from the Supabase client
  const {
    data: { session },
  } = await supabase.auth.getSession();
  // The supabase client already persists tokens to AsyncStorage on our
  // behalf, but we keep the older 'token' key around for any legacy
  // code that might still read it.  We optionally mirror the value here.
  const token =
    session?.access_token || (await AsyncStorage.getItem("token")) || "";
  if (token) {
    console.log("[api] using token", token.slice(0, 10), "…");
  } else {
    console.warn("[api] no auth token available");
  }

  // build headers: omit Content-Type for FormData to let RN set boundary
  let headers: Record<string, string>;
  if (init.body instanceof FormData) {
    headers = {
      ...(init.headers as object),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>;
    console.log("[api] POST formdata to", input);
  } else {
    headers = {
      "Content-Type": "application/json",
      ...(init.headers as object),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    console.log("[api] request", input, init.method, init.body);
  }

  // debug: show headers (mask token) when verbose logging enabled
  if (process.env.NODE_ENV !== 'production') {
    const loggedHeaders = { ...headers } as any;
    if (loggedHeaders.Authorization) {
      loggedHeaders.Authorization = loggedHeaders.Authorization.replace(/Bearer\s+(.{4}).+/, 'Bearer $1…');
    }
    console.log('[api] fetch headers', loggedHeaders);
  }

  let response;
  try {
    response = await fetch(input, { ...init, headers });
  } catch (netErr) {
    // network-level failure (DNS, connectivity, etc.)
    console.error("[api] network error", { url: input, err: netErr });
    throw netErr; // rethrow so caller sees TypeError
  }

  if (!response.ok) {
    const errBody = await response.text().catch(() => null);
    const msg = errBody || `HTTP ${response.status}`;
    console.error("[api] server error", {
      url: input,
      status: response.status,
      body: errBody,
    });
    throw new Error(msg);
  }
  return response.json();
}

function buildUrl(path: string) {
  if (!BACKEND_URL) {
    throw new Error(
      "BACKEND_URL is not defined. please set EXPO_PUBLIC_BACKEND_URL or update config.ts",
    );
  }
  const url = `${BACKEND_URL}${path}`;
  console.log("[api] building url", url);
  return url;
}

const api = {
  get: (path: string) => fetchWithAuth(buildUrl(path), { method: "GET" }),
  post: (path: string, body: any) =>
    fetchWithAuth(buildUrl(path), {
      method: "POST",
      body: JSON.stringify(body),
    }),
  postForm: (path: string, form: any) =>
    fetchWithAuth(buildUrl(path), { method: "POST", body: form }),
  put: (path: string, body: any) =>
    fetchWithAuth(buildUrl(path), {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: (path: string, body: any) =>
    fetchWithAuth(buildUrl(path), {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  del: (path: string) => fetchWithAuth(buildUrl(path), { method: "DELETE" }),
};

export default api;