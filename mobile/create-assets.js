/**
 * Simple script to create placeholder assets
 * Run: node create-assets.js
 * 
 * Note: This creates a basic SVG that can be converted to PNG
 * For production, replace these with actual branded assets
 */

const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create a simple SVG icon (1024x1024)
const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#1890ff"/>
  <text x="512" y="600" font-family="Arial, sans-serif" font-size="300" font-weight="bold" fill="white" text-anchor="middle">BD</text>
</svg>`;

// Create a simple splash SVG (1242x2436)
const splashSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1242" height="2436" viewBox="0 0 1242 2436" xmlns="http://www.w3.org/2000/svg">
  <rect width="1242" height="2436" fill="#1890ff"/>
<<<<<<< HEAD
  <text x="621" y="1200" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">ShipEASE</text>
=======
  <text x="621" y="1200" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">BestDeal</text>
>>>>>>> origin/master
  <text x="621" y="1350" font-family="Arial, sans-serif" font-size="80" fill="white" text-anchor="middle">Shipping</text>
</svg>`;

// Create favicon SVG (48x48)
const faviconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <rect width="48" height="48" fill="#1890ff"/>
  <text x="24" y="32" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">BD</text>
</svg>`;

// Write SVG files (Expo can use SVG for web, but for native you'll need PNG)
fs.writeFileSync(path.join(assetsDir, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(assetsDir, 'splash.svg'), splashSvg);
fs.writeFileSync(path.join(assetsDir, 'favicon.svg'), faviconSvg);

console.log('✅ Created placeholder SVG assets in assets/ folder');
console.log('');
console.log('⚠️  For Expo Go development, SVG files work for web.');
console.log('   For iOS/Android, you need PNG files.');
console.log('');
console.log('📝 To create PNG files:');
console.log('   1. Use an online SVG to PNG converter');
console.log('   2. Or use ImageMagick: convert icon.svg -resize 1024x1024 icon.png');
console.log('   3. Or design proper assets in Figma/Photoshop');
console.log('');
console.log('📋 Required PNG sizes:');
console.log('   - icon.png: 1024x1024');
console.log('   - splash.png: 1242x2436 (or use backgroundColor only)');
console.log('   - adaptive-icon.png: 1024x1024 (same as icon)');
console.log('   - favicon.png: 48x48');
console.log('   - notification-icon.png: 96x96');




<<<<<<< HEAD
=======

>>>>>>> origin/master
