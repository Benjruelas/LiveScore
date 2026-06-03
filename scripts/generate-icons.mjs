import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0f3d2e"/>
  <text x="256" y="300" font-size="200" text-anchor="middle" fill="#34d399">⛳</text>
</svg>`;

writeFileSync(join(publicDir, "icon.svg"), svg);
writeFileSync(join(publicDir, "icon-192.png"), "");
writeFileSync(join(publicDir, "icon-512.png"), "");

console.log("Wrote icon.svg — for PWA, add PNGs or use sharp to rasterize.");
