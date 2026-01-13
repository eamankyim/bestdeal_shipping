/**
 * Resize frontend logos to mobile app asset sizes
 * Run: node use-frontend-assets.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');

async function resizeAsset(input, output, size) {
  try {
    await sharp(input)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(output);
    console.log(`✅ Created ${output} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating ${output}:`, error.message);
    return false;
  }
}

async function createSplashFromLogo() {
  const logoPath = path.join(assetsDir, 'AppLogo.png');
  const splashPath = path.join(assetsDir, 'splash.png');
  
  if (!fs.existsSync(logoPath)) {
    console.log('⚠️  AppLogo.png not found, skipping splash');
    return;
  }

  try {
    // Create splash screen with logo centered on blue background
    const logo = await sharp(logoPath)
      .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    const splashSvg = `
      <svg width="1242" height="2436" xmlns="http://www.w3.org/2000/svg">
        <rect width="1242" height="2436" fill="#1890ff"/>
        <image x="421" y="1018" width="400" height="400" href="data:image/png;base64,${logo.toString('base64')}"/>
      </svg>
    `;

    await sharp(Buffer.from(splashSvg))
      .png()
      .toFile(splashPath);
    console.log(`✅ Created splash.png (1242x2436) with logo`);
  } catch (error) {
    console.error('❌ Error creating splash:', error.message);
  }
}

async function processAssets() {
  console.log('🎨 Processing frontend logos for mobile app...\n');

  const logo512 = path.join(assetsDir, 'logo512.png');
  const appLogo = path.join(assetsDir, 'AppLogo.png');
  
  // Determine which logo to use as base
  let baseLogo = logo512;
  if (fs.existsSync(appLogo)) {
    baseLogo = appLogo;
    console.log('📦 Using AppLogo.png as base\n');
  } else if (fs.existsSync(logo512)) {
    baseLogo = logo512;
    console.log('📦 Using logo512.png as base\n');
  } else {
    console.log('❌ No suitable logo found!');
    return;
  }

  // Create all required sizes
  await resizeAsset(baseLogo, path.join(assetsDir, 'icon.png'), 1024);
  await resizeAsset(baseLogo, path.join(assetsDir, 'adaptive-icon.png'), 1024);
  await resizeAsset(baseLogo, path.join(assetsDir, 'notification-icon.png'), 96);
  
  // Create favicon from logo192 or resize from base
  const logo192 = path.join(assetsDir, 'logo192.png');
  if (fs.existsSync(logo192)) {
    await resizeAsset(logo192, path.join(assetsDir, 'favicon.png'), 48);
  } else {
    await resizeAsset(baseLogo, path.join(assetsDir, 'favicon.png'), 48);
  }

  // Create splash screen
  await createSplashFromLogo();

  console.log('\n✨ All assets processed!');
  console.log('📱 Your app now uses the frontend logos!');
}

processAssets().catch(console.error);




