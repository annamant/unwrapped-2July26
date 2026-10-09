/**
 * Fail if client and server wave1 pin lists drift.
 * The client keeps its own copy so Railway can build client/ alone.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const serverPath = resolve(root, "server/src/data/wave1DirectoryPins.json");
const clientPath = resolve(root, "client/src/data/wave1DirectoryPins.json");

const serverJson = readFileSync(serverPath, "utf8");
const clientJson = readFileSync(clientPath, "utf8");

if (serverJson !== clientJson) {
  console.error("fail wave1DirectoryPins.json differs between client and server");
  console.error(`  server: ${serverPath}`);
  console.error(`  client: ${clientPath}`);
  process.exit(1);
}

const pins = JSON.parse(serverJson);
if (!Array.isArray(pins) || pins.length === 0) {
  console.error("fail wave1DirectoryPins.json is empty or not an array");
  process.exit(1);
}

console.log(`ok   wave1 pins client/server identical (${pins.length} shops)`);
