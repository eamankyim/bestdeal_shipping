/**
 * Generate PNG assets from SVG for Expo
 * Run: node generate-assets.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple blue square PNG
async function createPNG(filename, size, text = 'BD') {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#1890ff"/>
      <text x="${size/2}" y="${size/2 + size/8}" font-family="Arial, sans-serif" font-size="${size/4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>
  `;

  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(assetsDir, filename));
    console.log(`✅ Created ${filename} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error creating ${filename}:`, error.message);
  }
}

async function generateAssets() {
  console.log('🎨 Generating PNG assets...\n');
  
  await createPNG('icon.png', 1024, 'BD');
  await createPNG('adaptive-icon.png', 1024, 'BD');
  await createPNG('favicon.png', 48, 'BD');
  await createPNG('notification-icon.png', 96, 'BD');
  
  // Create splash (different aspect ratio)
  const splashSvg = `
    <svg width="1242" height="2436" xmlns="http://www.w3.org/2000/svg">
      <rect width="1242" height="2436" fill="#1890ff"/>
      <text x="621" y="1200" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">ShipEASE</text>
      <text x="621" y="1350" font-family="Arial, sans-serif" font-size="80" fill="white" text-anchor="middle">Shipping</text>
    </svg>
  `;
  
  try {
    await sharp(Buffer.from(splashSvg))
      .png()
      .toFile(path.join(assetsDir, 'splash.png'));
    console.log('✅ Created splash.png (1242x2436)');
  } catch (error) {
    console.error('❌ Error creating splash.png:', error.message);
  }
  
  console.log('\n✨ All assets generated!');
  console.log('📱 You can now run: npm start');
}

generateAssets().catch(console.error);




