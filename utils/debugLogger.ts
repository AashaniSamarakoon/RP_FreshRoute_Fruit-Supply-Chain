import AsyncStorage from "@react-native-async-storage/async-storage";

const LOG_KEY = "freshroute_debug_logs";
const MAX_ENTRIES = 80;

type DebugEntry = {
  timestamp: string;
  scope: string;
  event: string;
  details?: unknown;
};

const normalizeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
};

export async function logDebugEvent(
  scope: string,
  event: string,
  details?: unknown,
) {
  const entry: DebugEntry = {
    timestamp: new Date().toISOString(),
    scope,
    event,
    details,
  };

  console.log(`[${scope}] ${event}`, details ?? "");

  try {
    const stored = await AsyncStorage.getItem(LOG_KEY);
    const logs: DebugEntry[] = stored ? JSON.parse(stored) : [];
    logs.push(entry);
    await AsyncStorage.setItem(
      LOG_KEY,
      JSON.stringify(logs.slice(-MAX_ENTRIES)),
    );
  } catch (error) {
    console.warn("[DebugLogger] Failed to persist log entry", error);
  }
}

export async function logDebugError(
  scope: string,
  event: string,
  error: unknown,
  details?: Record<string, unknown>,
) {
  const normalized = normalizeError(error);
  console.error(`[${scope}] ${event}`, normalized, details ?? "");
  await logDebugEvent(scope, event, {
    ...details,
    error: normalized,
  });
}

export async function getDebugLogs() {
  const stored = await AsyncStorage.getItem(LOG_KEY);
  return stored ? (JSON.parse(stored) as DebugEntry[]) : [];
}

export async function clearDebugLogs() {
  await AsyncStorage.removeItem(LOG_KEY);
}
