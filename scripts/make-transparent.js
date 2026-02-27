#!/usr/bin/env node
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputPath = process.argv[2] || path.join(__dirname, '../.cursor/projects/Users-yuhi-Desktop-Billia/assets/______________1_-dbb88b75-f4d4-4b8c-a8fd-6e97811c96ee.png');
const outputPath = process.argv[3] || path.join(__dirname, '../public/logo.png');

async function makeWhiteTransparent() {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 250; // 白に近い色を透明に
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r >= threshold && g >= threshold && b >= threshold) {
      data[i + 3] = 0;
    }
  }

  await sharp(Buffer.from(data), {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .png()
    .toFile(outputPath);

  console.log(`Saved: ${outputPath}`);
}

makeWhiteTransparent().catch(console.error);
