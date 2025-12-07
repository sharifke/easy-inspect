const sharp = require('sharp');
const path = require('path');

const inputPath = '/home/sharif/projecten/inspektor/elektroinspect/backend/uploads/inspections/dec07012-761e-45cb-a765-69d66eb09d8f/4a6e922a-7d6d-412b-9563-fb2ee51d007f/811bf98e-e827-4eea-9d99-b6890c786e83.jpg';
const outputPath = '/home/sharif/projecten/inspektor/elektroinspect/backend/uploads/inspections/dec07012-761e-45cb-a765-69d66eb09d8f/4a6e922a-7d6d-412b-9563-fb2ee51d007f/thumb_811bf98e-e827-4eea-9d99-b6890c786e83.jpg';

async function regenerateThumbnail() {
  try {
    await sharp(inputPath)
      .resize(300, 300, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    console.log('Thumbnail regenerated successfully!');
  } catch (error) {
    console.error('Error regenerating thumbnail:', error);
  }
}

regenerateThumbnail();
