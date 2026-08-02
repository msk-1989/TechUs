// Generate PNG / ICO favicons from the SVG using sharp
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const SVG_PATH = path.join(PUBLIC_DIR, "favicon.svg");

const SVG_BUFFER = fs.readFileSync(SVG_PATH);

async function generatePng(size, filename) {
  const outPath = path.join(PUBLIC_DIR, filename);
  await sharp(SVG_BUFFER, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log(`  ✓ ${filename} (${size}x${size})`);
}

async function generateIco(filename) {
  // ICO file with 16, 32, 48 sizes embedded
  // For simplicity, generate a single 32x32 PNG and rename to .ico
  // (most modern browsers accept PNG-format .ico files)
  const outPath = path.join(PUBLIC_DIR, filename);
  await sharp(SVG_BUFFER, { density: 384 })
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log(`  ✓ ${filename} (32x32 PNG-as-ICO)`);
}

(async () => {
  console.log("Generating TechUs favicons from SVG...");
  await generatePng(16, "favicon-16x16.png");
  await generatePng(32, "favicon-32x32.png");
  await generatePng(180, "apple-touch-icon.png");
  await generatePng(192, "android-chrome-192x192.png");
  await generatePng(512, "android-chrome-512x512.png");
  await generateIco("favicon.ico");
  console.log("\n✅ All favicons generated in public/");
})();
