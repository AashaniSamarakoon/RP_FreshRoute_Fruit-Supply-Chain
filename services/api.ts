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

  const headers = {
    "Content-Type": "application/json",
    ...(init.headers as object),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(input, { ...init, headers });
  if (!response.ok) {
    const errBody = await response.text().catch(() => null);
    const msg = errBody || `HTTP ${response.status}`;
    throw new Error(msg);
  }
  return response.json();
}

const api = {
  get: (path: string) =>
    fetchWithAuth(`${BACKEND_URL}${path}`, { method: "GET" }),
  post: (path: string, body: any) =>
    fetchWithAuth(`${BACKEND_URL}${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  postForm: (path: string, form: any) =>
    fetchWithAuth(`${BACKEND_URL}${path}`, { method: "POST", body: form }),
  put: (path: string, body: any) =>
    fetchWithAuth(`${BACKEND_URL}${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  del: (path: string) =>
    fetchWithAuth(`${BACKEND_URL}${path}`, { method: "DELETE" }),
};

export default api;
