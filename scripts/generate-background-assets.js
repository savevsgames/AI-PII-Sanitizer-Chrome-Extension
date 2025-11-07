/**
 * Generate background image assets
 * Creates gradient backgrounds and thumbnails for the background library
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const OUTPUT_DIR = path.join(__dirname, '../src/popup/assets/backgrounds');
const THUMB_DIR = path.join(OUTPUT_DIR, 'thumbs');

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(THUMB_DIR)) fs.mkdirSync(THUMB_DIR, { recursive: true });

/**
 * Create a gradient background
 */
function createGradient(width, height, color1, color2, type = 'radial') {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  let gradient;
  if (type === 'radial') {
    gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.7
    );
  } else {
    gradient = ctx.createLinearGradient(0, 0, 0, height);
  }

  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

/**
 * Create default minimal background
 */
function createDefault(width, height) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  if (width < 400) {
    // Add text for thumbnail
    ctx.fillStyle = '#666';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Default', width / 2, height / 2);
  }

  return canvas;
}

/**
 * Save canvas as JPEG
 */
function saveImage(canvas, filename) {
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.9 });
  fs.writeFileSync(filename, buffer);
  console.log(`✓ Created ${path.basename(filename)}`);
}

// Generate backgrounds
console.log('Generating background images...\n');

// 1. Purple Dreams (FREE)
console.log('1. Purple Dreams');
const purpleFull = createGradient(1920, 1080, '#667eea', '#764ba2', 'radial');
const purpleThumb = createGradient(320, 180, '#667eea', '#764ba2', 'radial');
saveImage(purpleFull, path.join(OUTPUT_DIR, 'gradient-purple.jpg'));
saveImage(purpleThumb, path.join(THUMB_DIR, 'gradient-purple.jpg'));

// 2. Ocean Blue (FREE)
console.log('\n2. Ocean Blue');
const blueFull = createGradient(1920, 1080, '#4facfe', '#00f2fe', 'linear');
const blueThumb = createGradient(320, 180, '#4facfe', '#00f2fe', 'linear');
saveImage(blueFull, path.join(OUTPUT_DIR, 'gradient-blue.jpg'));
saveImage(blueThumb, path.join(THUMB_DIR, 'gradient-blue.jpg'));

// 3. Default (FREE)
console.log('\n3. Default');
const defaultFull = createDefault(1920, 1080);
const defaultThumb = createDefault(320, 180);
saveImage(defaultFull, path.join(OUTPUT_DIR, 'default.jpg'));
saveImage(defaultThumb, path.join(THUMB_DIR, 'default.jpg'));

// 4. Create SVG for default thumbnail
const defaultSvg = `<svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
  <rect width="320" height="180" fill="#1a1a2e"/>
  <text x="160" y="95" font-family="system-ui" font-size="14" fill="#666" text-anchor="middle">Default Background</text>
</svg>`;
fs.writeFileSync(path.join(THUMB_DIR, 'default.svg'), defaultSvg);
console.log(`✓ Created default.svg`);

// 5. Sunset Glow (PRO)
console.log('\n4. Sunset Glow (PRO)');
const sunsetFull = createGradient(1920, 1080, '#f093fb', '#f5576c', 'linear');
const sunsetThumb = createGradient(320, 180, '#f093fb', '#f5576c', 'linear');
saveImage(sunsetFull, path.join(OUTPUT_DIR, 'gradient-sunset.jpg'));
saveImage(sunsetThumb, path.join(THUMB_DIR, 'gradient-sunset.jpg'));

console.log('\n✅ All gradient backgrounds generated!');
console.log('\n📝 Next steps:');
console.log('  1. Manually create thumbnail for space-stars.jpg (320x180)');
console.log('  2. Add more PRO backgrounds as needed');
console.log('  3. Update backgrounds.ts with correct asset paths');
