import { BACKEND_URL } from "@/config";
import { supabase } from "@/utils/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEBUG_API = process.env.EXPO_PUBLIC_DEBUG_API === "true";

class ApiError extends Error {
  status: number;
  url: string;
  body?: string | null;

  constructor(params: { status: number; url: string; body?: string | null }) {
    super(params.body || `HTTP ${params.status}`);
    this.name = "ApiError";
    this.status = params.status;
    this.url = params.url;
    this.body = params.body;
  }
}

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
  if (!token && DEBUG_API) {
    console.warn("[api] no auth token available");
  }

  // build headers: omit Content-Type for FormData to let RN set boundary
  let headers: Record<string, string>;
  if (init.body instanceof FormData) {
    headers = {
      ...(init.headers as object),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    } as Record<string, string>;
    if (DEBUG_API) console.log("[api] POST formdata to", input);
  } else {
    headers = {
      "Content-Type": "application/json",
      ...(init.headers as object),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (DEBUG_API) console.log("[api] request", input, init.method);
  }

  // debug: show headers (mask token) when verbose logging enabled
  if (DEBUG_API) {
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
    // Don't log errors for known missing endpoints that have fallbacks
    const isKnownMissingEndpoint =
      (input.toString().includes('/api/orders/overview') && response.status === 404) ||
      (input.toString().includes('/api/sms-preferences') && response.status === 404) ||
      // Pro endpoints may be mounted under /pro/* (without /api prefix) on some backends.
      ((input.toString().includes('/api/pro/status') || input.toString().includes('/pro/status')) && response.status === 404) ||
      ((input.toString().includes('/api/pro/subscribe/init') || input.toString().includes('/pro/subscribe/init')) && response.status === 404) ||
      ((input.toString().includes('/api/pro/personal-market-forecast') || input.toString().includes('/pro/personal-market-forecast')) && response.status === 404);
    if (!isKnownMissingEndpoint) {
      console.error("[api] server error", {
        url: input,
        status: response.status,
        body: errBody,
      });
    }
    throw new ApiError({ status: response.status, url: String(input), body: msg });
  }
  return response.json();
}

function buildUrl(path: string) {
  if (!BACKEND_URL) {
    throw new Error(
      "BACKEND_URL is not defined. please set EXPO_PUBLIC_BACKEND_URL or update config.ts",
    );
  }
  // If the caller provides an absolute URL, use it as-is.
  if (/^https?:\/\//i.test(path)) {
    console.log("[api] building url", path);
    return path;
  }
  const url = `${BACKEND_URL}${path}`;
  if (DEBUG_API) console.log("[api] building url", url);
  return url;
}

/** Parse multipart response for GET .../complaints/:id (complaint + image_0, image_1, ...) */
async function fetchComplaintDetailWithImages(
  id: string,
  basePath: string = "/api/buyer/complaints"
): Promise<{
  complaint: Record<string, unknown>;
  images: string[];
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token =
    session?.access_token || (await AsyncStorage.getItem("token")) || "";
  const url = buildUrl(`${basePath}/${id}`);
  const response = await fetch(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const errBody = await response.text().catch(() => null);
    throw new Error(errBody || `HTTP ${response.status}`);
  }
  const contentType = response.headers.get("Content-Type") || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
  const boundary = boundaryMatch
    ? (boundaryMatch[1] ?? boundaryMatch[2]).trim()
    : null;
  if (!boundary) {
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      const c = data?.complaint ?? data;
      return { complaint: c, images: c?.images ?? [] };
    } catch {
      throw new Error("Invalid response: no boundary and not JSON");
    }
  }
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const delimiter = new TextEncoder().encode("\r\n--" + boundary);
  const indices: number[] = [];
  for (let i = 0; i <= bytes.length - delimiter.length; i++) {
    let match = true;
    for (let j = 0; j < delimiter.length; j++) {
      if (bytes[i + j] !== delimiter[j]) {
        match = false;
        break;
      }
    }
    if (match) indices.push(i);
  }
  const complaintParts: Record<string, unknown> = {};
  const imageParts: { name: string; body: Uint8Array }[] = [];
  const partStarts: number[] = [0];
  const partEnds: number[] = [indices[0] ?? bytes.length];
  for (let i = 0; i < indices.length - 1; i++) {
    partStarts.push(indices[i] + delimiter.length);
    partEnds.push(indices[i + 1]);
  }
  for (let p = 0; p < partStarts.length; p++) {
    let part = bytes.subarray(partStarts[p], partEnds[p]);
    if (part[0] === 0x2d) {
      for (let i = 0; i <= part.length - 2; i++) {
        if (part[i] === 0x0d && part[i + 1] === 0x0a) {
          part = part.subarray(i + 2);
          break;
        }
        if (part[i] === 0x0a) {
          part = part.subarray(i + 1);
          break;
        }
      }
    } else if (part[0] === 0x0d && part[1] === 0x0a) part = part.subarray(2);
    const crlfcrlf = new Uint8Array([0x0d, 0x0a, 0x0d, 0x0a]);
    const lflf = new Uint8Array([0x0a, 0x0a]);
    let headerEnd = -1;
    let bodyStart = 0;
    for (let i = 0; i <= part.length - 4; i++) {
      if (
        part[i] === crlfcrlf[0] &&
        part[i + 1] === crlfcrlf[1] &&
        part[i + 2] === crlfcrlf[2] &&
        part[i + 3] === crlfcrlf[3]
      ) {
        headerEnd = i;
        bodyStart = i + 4;
        break;
      }
    }
    if (headerEnd < 0) {
      for (let i = 0; i <= part.length - 2; i++) {
        if (part[i] === lflf[0] && part[i + 1] === lflf[1]) {
          headerEnd = i;
          bodyStart = i + 2;
          break;
        }
      }
    }
    if (headerEnd < 0) continue;
    const headerBytes = part.subarray(0, headerEnd);
    const body = part.subarray(bodyStart);
    const headerText = new TextDecoder("utf-8").decode(headerBytes);
    const nameMatch = headerText.match(/name=["']?([^"'\s;]+)["']?/i);
    const name = nameMatch ? nameMatch[1].trim() : "";
    if (name === "complaint") {
      let jsonText = new TextDecoder("utf-8").decode(body);
      jsonText = jsonText.replace(/\r\n$|\n$|\r$/, "").trim();
      try {
        const parsed = JSON.parse(jsonText);
        Object.assign(complaintParts, parsed);
      } catch (_) {
        complaintParts.raw = jsonText;
      }
    } else if (name.startsWith("image_")) {
      imageParts.push({ name, body: body.slice() });
    }
  }
  imageParts.sort((a, b) => {
    const n0 = parseInt(a.name.replace("image_", ""), 10);
    const n1 = parseInt(b.name.replace("image_", ""), 10);
    return n0 - n1;
  });
  const images = imageParts.map(({ body }) => {
    const b64 = arrayBufferToBase64(body.buffer);
    return `data:image/jpeg;base64,${b64}`;
  });
  const complaint =
    complaintParts &&
      typeof complaintParts.complaint === "object" &&
      complaintParts.complaint !== null
      ? (complaintParts.complaint as Record<string, unknown>)
      : complaintParts;
  return { complaint, images };
}

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function arrayBufferToBase64(buffer: ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer);
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += BASE64_CHARS[a >> 2];
    out += BASE64_CHARS[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? BASE64_CHARS[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? BASE64_CHARS[c & 63] : "=";
  }
  return out;
}

const api = {
  get: (path: string) => fetchWithAuth(buildUrl(path), { method: "GET" }),
  getComplaintDetail: (id: string) =>
    fetchComplaintDetailWithImages(id, "/api/buyer/complaints"),
  getAdminComplaintDetail: (id: string) =>
    fetchComplaintDetailWithImages(id, "/api/admin/complaints"),
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
  // helper collection for the new predictStock endpoints
  predictStock: {
    list: () => fetchWithAuth(buildUrl("/predictStock"), { method: "GET" }),
    get: (id: string) => fetchWithAuth(buildUrl(`/predictStock/${id}`), { method: "GET" }),
    update: (id: string, body: any) =>
      fetchWithAuth(buildUrl(`/predictStock/${id}`), {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      fetchWithAuth(buildUrl(`/predictStock/${id}`), { method: "DELETE" }),
  },
  // new endpoints matching the current backend naming for add/update/delete
  addPredictStock: {
    add: (body: any) =>
      fetchWithAuth(buildUrl("/api/farmer/add-predict-stock"), {
        method: "POST",
        body,
      }),
    update: (id: string, body: any) =>
      fetchWithAuth(buildUrl(`/api/farmer/add-predict-stock/${id}`), {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      fetchWithAuth(buildUrl(`/api/farmer/add-predict-stock/${id}`), {
        method: "DELETE",
      }),
  },
  // buyer-side order mutators (used for placed orders)
  buyerOrder: {
    update: (orderId: string, body: any) =>
      fetchWithAuth(buildUrl(`/api/buyer/orders/${orderId}`), {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (orderId: string) =>
      fetchWithAuth(buildUrl(`/api/buyer/orders/${orderId}`), {
        method: "DELETE",
      }),
  },
};

export default api;
