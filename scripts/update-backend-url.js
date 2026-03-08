const os = require("os");
const fs = require("fs");
const path = require("path");

const PORT = 4000;
const ROOT = path.join(__dirname, "..");
const CONFIG_JS_PATH = path.join(ROOT, "config.js");
const CONFIG_TS_PATH = path.join(ROOT, "config.ts");
const ENV_PATH = path.join(ROOT, ".env");

function getLocalIP() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (err) {
    console.warn("Could not read network interfaces:", err.message);
  }
  return null;
}

const ip = getLocalIP();
if (!ip) {
  console.warn("Could not detect local IP; config and .env unchanged.");
  process.exit(0);
}

const newUrl = `http://${ip}:${PORT}`;

// 1. Update config.ts (source of truth for the app) – set fallback URL
try {
  let content = fs.readFileSync(CONFIG_TS_PATH, "utf8");
  content = content.replace(
    /export const BACKEND_URL = process\.env\.EXPO_PUBLIC_BACKEND_URL \|\| "[^"]*";/,
    `export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "${newUrl}";`
  );
  fs.writeFileSync(CONFIG_TS_PATH, content);
  console.log("[config.ts] Backend URL fallback set to", newUrl);
} catch (err) {
  console.warn("Could not update config.ts:", err.message);
}

// 2. Set EXPO_PUBLIC_BACKEND_URL in .env so config.ts gets it from environment
try {
  let envContent = "";
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, "utf8");
  }
  const envLine = `EXPO_PUBLIC_BACKEND_URL=${newUrl}`;
  if (envContent.includes("EXPO_PUBLIC_BACKEND_URL=")) {
    envContent = envContent.replace(
      /EXPO_PUBLIC_BACKEND_URL=.*/,
      envLine
    );
  } else {
    envContent = envContent.trimEnd() + (envContent ? "\n" : "") + envLine + "\n";
  }
  fs.writeFileSync(ENV_PATH, envContent);
  console.log("[.env] EXPO_PUBLIC_BACKEND_URL set to", newUrl);
} catch (err) {
  console.warn("Could not update .env:", err.message);
}

// 3. Optionally keep config.js in sync for any legacy imports
try {
  if (fs.existsSync(CONFIG_JS_PATH)) {
    let content = fs.readFileSync(CONFIG_JS_PATH, "utf8");
    content = content.replace(
      /^export const BACKEND_URL = "http:\/\/[^"]+";/m,
      `export const BACKEND_URL = "${newUrl}";`
    );
    fs.writeFileSync(CONFIG_JS_PATH, content);
    console.log("[config.js] Backend URL updated to", newUrl);
  }
} catch (err) {
  console.warn("Could not update config.js:", err.message);
}
