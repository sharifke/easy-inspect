const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhotos() {
  try {
    // Check photos for this resultId
    const photos = await prisma.photo.findMany({
      where: {
        inspectionResultId: '4a6e922a-7d6d-412b-9563-fb2ee51d007f'
      }
    });

    console.log('Photos found:', JSON.stringify(photos, null, 2));

    // Check inspection result
    const result = await prisma.inspectionResult.findUnique({
      where: {
        id: '4a6e922a-7d6d-412b-9563-fb2ee51d007f'
      },
      include: {
        inspection: true
      }
    });

    console.log('\nInspection Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhotos();
