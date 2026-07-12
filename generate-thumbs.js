const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const avatarsDir = path.join(__dirname, 'public', 'avatars');
const thumbsDir = path.join(__dirname, 'public', 'avatars', 'thumbs');
const thumbSize = 48; // 48x48 pixels for leaderboard thumbnails
const zoomFactor = 1.02; // 2% zoom to clip edges

// Create thumbs directory if it doesn't exist
if (!fs.existsSync(thumbsDir)) {
  fs.mkdirSync(thumbsDir, { recursive: true });
}

// Get all PNG files from avatars directory
const avatarFiles = fs.readdirSync(avatarsDir)
  .filter(file => file.endsWith('.png') && !file.startsWith('.'));

console.log(`Found ${avatarFiles.length} avatar files to process...`);
console.log('Thumbnail generation started...');

// Process each avatar
(async () => {
  let hasFailures = false;

  for (const file of avatarFiles) {
    const inputPath = path.join(avatarsDir, file);
    const outputPath = path.join(thumbsDir, file);

    try {
      await sharp(inputPath)
        .resize(Math.round(thumbSize * zoomFactor), Math.round(thumbSize * zoomFactor), {
          fit: 'cover',
          position: 'center'
        })
        .resize(thumbSize, thumbSize, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 80 })
        .toFile(outputPath);

      console.log(`✓ Generated thumbnail for ${file}`);
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error.message);
      hasFailures = true;
    }
  }

  console.log('Thumbnail generation complete!');

  if (hasFailures) {
    process.exitCode = 1;
  }
})();
