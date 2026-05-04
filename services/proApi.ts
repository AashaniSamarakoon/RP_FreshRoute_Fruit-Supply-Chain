import api from "@/services/api";

export type ProStatusResponse = {
  isPro: boolean;
  [key: string]: unknown;
};

export type ProRequiredError = {
  code: "PRO_REQUIRED";
  message?: string;
  action?: { endpoint?: string };
  [key: string]: unknown;
};

export type ProEndpointMissingError = {
  code: "PRO_ENDPOINT_MISSING";
  message?: string;
  tried?: string[];
  [key: string]: unknown;
};

export type ProSubscribeInitResponse = {
  paymentObject?: Record<string, any>;
  [key: string]: unknown;
};

function tryParseJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function parseApiError(error: unknown): {
  raw: unknown;
  text?: string;
  json?: any;
  proRequired?: ProRequiredError;
  endpointMissing?: ProEndpointMissingError;
} {
  const text = error instanceof Error ? error.message : undefined;
  const json = text ? tryParseJson(text) : null;

  const proRequired: ProRequiredError | undefined =
    json && typeof json === "object" && json.code === "PRO_REQUIRED" ? json : undefined;

  const endpointMissing: ProEndpointMissingError | undefined =
    json && typeof json === "object" && json.code === "PRO_ENDPOINT_MISSING"
      ? json
      : undefined;

  return { raw: error, text, json, proRequired, endpointMissing };
}

export const proApi = {
  async getStatus(): Promise<ProStatusResponse> {
    const resp: any = await api.get("/api/pro/status");
    const isPro = !!(resp?.isPro ?? resp?.pro ?? resp?.active);
    return { ...resp, isPro };
  },

  async subscribeInit(): Promise<ProSubscribeInitResponse> {
    const resp: any = await api.post("/api/pro/subscribe/init", {});

    // Backend returns the full PayHere object directly.
    const paymentObject = resp;
    return { ...resp, paymentObject };
  },

  async getPersonalMarketForecast(params: {
    days?: number;
    target?: "price" | "demand";
    location?: string;
  }): Promise<any> {
    const days = params.days ?? 14;
    const target = params.target ?? "price";

    const query = new URLSearchParams();
    query.set("days", String(days));
    query.set("target", target);
    if (params.location) query.set("location", params.location);

    const qs = query.toString();
    return api.get(`/api/pro/personal-market-forecast?${qs}`);
  },
};
