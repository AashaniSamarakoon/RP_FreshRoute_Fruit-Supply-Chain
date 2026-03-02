const os = require("os");
const fs = require("fs");
const path = require("path");

const PORT = 4000;
const CONFIG_PATH = path.join(__dirname, "..", "config.js");

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
  console.warn("Could not detect local IP; config.js unchanged.");
  process.exit(0);
}

const newUrl = `http://${ip}:${PORT}`;

let content = fs.readFileSync(CONFIG_PATH, "utf8");
content = content.replace(
  /^export const BACKEND_URL = "http:\/\/[^"]+";/m,
  `export const BACKEND_URL = "${newUrl}";`
);

fs.writeFileSync(CONFIG_PATH, content);
console.log("Backend URL updated to", newUrl);
