/* global __dirname */

const fs = require("fs");
const path = require("path");

const modulePath = path.join(
  __dirname,
  "..",
  "node_modules",
  "@payhere",
  "payhere-mobilesdk-reactnative",
  "android",
  "src",
  "main",
  "java",
  "lk",
  "payhere",
  "PayhereOfficialModule.java",
);

if (!fs.existsSync(modulePath)) {
  console.warn("[patch-payhere-sdk] PayHere native module not found; skipping.");
  process.exit(0);
}

let source = fs.readFileSync(modulePath, "utf8");

if (source.includes("private void invokeAndClearCallback(WritableMap map)")) {
  console.log("[patch-payhere-sdk] PayHere native module already patched.");
  process.exit(0);
}

source = source
  .replace(
    'throw new RuntimeException("callback must not be null");',
    'this.log("PayHere callback was already consumed before error result");\n            return;',
  )
  .replace(
    'throw new RuntimeException("callback must not be null");',
    'this.log("PayHere callback was already consumed before dismiss result");\n            return;',
  )
  .replace(
    'throw new RuntimeException("callback must not be null");',
    'this.log("PayHere callback was already consumed before completed result");\n            return;',
  )
  .replace("lastCallback.invoke(map);", "this.invokeAndClearCallback(map);")
  .replace("lastCallback.invoke(map);", "this.invokeAndClearCallback(map);")
  .replace("lastCallback.invoke(map);", "this.invokeAndClearCallback(map);")
  .replace(
    "\n    /**\n     * Extracts a String Key from a HashMap.",
    `
    private void invokeAndClearCallback(WritableMap map){
        Callback callback = lastCallback;
        lastCallback = null;
        reactContext.removeActivityEventListener(this);

        if (callback != null){
            callback.invoke(map);
        }
    }

    /**
     * Extracts a String Key from a HashMap.`,
  );

fs.writeFileSync(modulePath, source);
console.log("[patch-payhere-sdk] Patched PayHere native callback cleanup.");
