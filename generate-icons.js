// Generates PWA icons as PNG using a simple SVG-to-PNG pipeline
// Run once: node generate-icons.js

const fs = require('fs');
const { execSync } = require('child_process');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1330"/>
      <stop offset="100%" stop-color="#081f1c"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFD980"/>
      <stop offset="100%" stop-color="#FFB12E"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="220" r="120" fill="none" stroke="url(#gold)" stroke-width="14" opacity=".3"/>
  <text x="256" y="300" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="220" fill="url(#gold)">B</text>
  <text x="256" y="420" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="56" fill="#FFD980" opacity=".7">2026</text>
</svg>`;

fs.writeFileSync('public/icons/icon.svg', svg);

// Try to use sips (macOS) to convert, otherwise keep SVG
try {
  // Write a temp SVG
  fs.writeFileSync('/tmp/begadang-icon.svg', svg);

  // Use qlmanage or sips on macOS to create PNGs
  // First try with qlmanage which handles SVG
  execSync('qlmanage -t -s 512 -o /tmp/ /tmp/begadang-icon.svg 2>/dev/null', { stdio: 'pipe' });
  const generated = '/tmp/begadang-icon.svg.png';
  if (fs.existsSync(generated)) {
    fs.copyFileSync(generated, 'public/icons/icon-512.png');
    execSync('sips -z 192 192 public/icons/icon-512.png --out public/icons/icon-192.png 2>/dev/null', { stdio: 'pipe' });
    console.log('Generated icon-192.png and icon-512.png');
  } else {
    throw new Error('qlmanage did not produce output');
  }
} catch {
  // Fallback: create a simple 1x1 PNG placeholder and note to replace
  console.log('Could not auto-generate PNGs. Creating SVG icon instead.');
  console.log('Icons saved as public/icons/icon.svg');
  console.log('You can convert to PNG with any image editor or online tool.');

  // Create minimal valid PNGs so the manifest doesn't 404
  // This is a tiny 1x1 dark blue PNG
  const tinyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  fs.writeFileSync('public/icons/icon-192.png', tinyPng);
  fs.writeFileSync('public/icons/icon-512.png', tinyPng);
}
