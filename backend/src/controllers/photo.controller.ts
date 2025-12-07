import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import ExifParser from 'exif-parser';
import { randomUUID } from 'crypto';
import prisma from '../utils/prisma';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);

/**
 * Helper function to extract GPS data from EXIF
 */
const extractGpsData = async (filePath: string): Promise<{ latitude?: number; longitude?: number }> => {
  try {
    const buffer = await fs.readFile(filePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();

    if (result.tags?.GPSLatitude && result.tags?.GPSLongitude) {
      return {
        latitude: result.tags.GPSLatitude,
        longitude: result.tags.GPSLongitude,
      };
    }
  } catch (error) {
    console.log('No GPS data found in image or error reading EXIF:', error);
  }
  return {};
};

/**
 * Helper function to generate thumbnail
 */
const generateThumbnail = async (
  sourcePath: string,
  thumbnailPath: string
): Promise<void> => {
  // TEMPORARY: Bypass sharp to debug black image/slowness
  await sharp(sourcePath)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(300, 300, {
      fit: 'cover',
      position: 'center',
    })
    .flatten({ background: '#ffffff' }) // Replace transparency with white
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  // Just copy the original as thumbnail for now

};

/**
 * Helper function to verify user has access to inspection
 */
const verifyInspectionAccess = async (
  inspectionId: string,
  userId: string,
  userRole: string
): Promise<{ hasAccess: boolean; inspection?: any }> => {
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
  });

  if (!inspection) {
    return { hasAccess: false };
  }

  if (userRole === 'ADMIN' || inspection.inspectorId === userId) {
    return { hasAccess: true, inspection };
  }

  return { hasAccess: false, inspection };
};

/**
 * Upload photo for inspection result
 * POST /api/inspections/:id/results/:resultId/photos
 */
export const uploadPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
      return;
    }

    const { id: inspectionId, resultId } = req.params;

    // Verify inspection access
    const { hasAccess, inspection } = await verifyInspectionAccess(
      inspectionId,
      user.userId,
      user.role
    );

    if (!hasAccess) {
      res.status(403).json({
        status: 'error',
        message: 'You do not have permission to upload photos to this inspection',
      });
      return;
    }

    if (!inspection) {
      res.status(404).json({
        status: 'error',
        message: 'Inspection not found',
      });
      return;
    }

    // Cannot upload photos to completed inspections
    if (inspection.status === 'COMPLETED') {
      res.status(400).json({
        status: 'error',
        message: 'Cannot upload photos to completed inspections',
      });
      return;
    }

    // Verify inspection result exists and belongs to this inspection
    const inspectionResult = await prisma.inspectionResult.findUnique({
      where: { id: resultId },
    });

    if (!inspectionResult) {
      res.status(404).json({
        status: 'error',
        message: 'Inspection result not found',
      });
      return;
    }

    if (inspectionResult.inspectionId !== inspectionId) {
      res.status(400).json({
        status: 'error',
        message: 'Inspection result does not belong to this inspection',
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
      return;
    }

    const file = req.file;

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(file.mimetype)) {
      // Delete uploaded file
      await fs.unlink(file.path);
      res.status(400).json({
        status: 'error',
        message: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      // Delete uploaded file
      await fs.unlink(file.path);
      res.status(400).json({
        status: 'error',
        message: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
      return;
    }

    try {
      // Create directory structure: uploads/inspections/:inspectionId/:resultId/
      const photoDir = path.join(UPLOAD_DIR, 'inspections', inspectionId, resultId);
      await fs.mkdir(photoDir, { recursive: true });

      // Generate unique filename
      const ext = path.extname(file.originalname);
      const filename = `${randomUUID()}${ext}`;
      const photoPath = path.join(photoDir, filename);
      const thumbnailFilename = `thumb_${filename}`;
      const thumbnailPath = path.join(photoDir, thumbnailFilename);

      // Move file from temp location to final location
      await fs.rename(file.path, photoPath);

      // Process image in parallel
      const [gpsData] = await Promise.all([
        extractGpsData(photoPath),
        generateThumbnail(photoPath, thumbnailPath).catch(err => {
          console.error('Failed to generate thumbnail:', err);
          return null;
        }),
      ]);

      // Store relative paths in database
      const relativePhotoPath = path.join('inspections', inspectionId, resultId, filename);
      const relativeThumbnailPath = path.join('inspections', inspectionId, resultId, thumbnailFilename);

      // Check if thumbnail exists (it might have failed)
      let finalThumbnailPath: string | null = relativeThumbnailPath;
      try {
        await fs.access(thumbnailPath);
      } catch {
        finalThumbnailPath = null;
      }

      // Save photo record to database
      const photo = await prisma.photo.create({
        data: {
          inspectionResultId: resultId,
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: relativePhotoPath,
          thumbnailPath: finalThumbnailPath,
          gpsLatitude: gpsData.latitude,
          gpsLongitude: gpsData.longitude,
          takenAt: new Date(),
        },
      });

      // Return photo with relative URLs and parsed annotations
      const cacheBuster = Date.now(); // Add timestamp to prevent caching issues
      res.status(201).json({
        status: 'success',
        data: {
          photo: {
            ...photo,
            url: `/uploads/${photo.path}?t=${cacheBuster}`,
            thumbnailUrl: photo.thumbnailPath ? `/uploads/${photo.thumbnailPath}?t=${cacheBuster}` : null,
            annotations: typeof photo.annotations === 'string'
              ? JSON.parse(photo.annotations)
              : photo.annotations,
          },
        },
        message: 'Photo uploaded successfully',
      });
    } catch (error) {
      // Clean up uploaded file if database save fails
      try {
        await fs.unlink(file.path);
      } catch { }
      throw error;
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({
      res.status(500).json({
        status: 'error',
        message: `Failed to upload photo: ${(error as Error).message}`,
      });
    }
};

  /**
   * Get all photos for inspection result
   * GET /api/inspections/:id/results/:resultId/photos
   */
  export const getPhotos = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Not authenticated',
        });
        return;
      }

      const { id: inspectionId, resultId } = req.params;

      // Verify inspection access
      const { hasAccess } = await verifyInspectionAccess(
        inspectionId,
        user.userId,
        user.role
      );

      if (!hasAccess) {
        res.status(403).json({
          status: 'error',
          message: 'You do not have permission to view photos for this inspection',
        });
        return;
      }

      // Verify inspection result exists
      const inspectionResult = await prisma.inspectionResult.findUnique({
        where: { id: resultId },
      });

      if (!inspectionResult) {
        res.status(404).json({
          status: 'error',
          message: 'Inspection result not found',
        });
        return;
      }

      if (inspectionResult.inspectionId !== inspectionId) {
        res.status(400).json({
          status: 'error',
          message: 'Inspection result does not belong to this inspection',
        });
        return;
      }

      // Get photos
      const photos = await prisma.photo.findMany({
        where: { inspectionResultId: resultId },
        orderBy: { takenAt: 'desc' },
      });

      // Add relative URLs to photos and parse annotations
      const cacheBuster = Date.now(); // Add timestamp to prevent caching issues
      const photosWithUrls = photos.map((photo) => ({
        ...photo,
        url: `/uploads/${photo.path}?t=${cacheBuster}`,
        thumbnailUrl: photo.thumbnailPath ? `/uploads/${photo.thumbnailPath}?t=${cacheBuster}` : null,
        annotations: typeof photo.annotations === 'string'
          ? JSON.parse(photo.annotations)
          : photo.annotations,
      }));

      res.status(200).json({
        status: 'success',
        data: { photos: photosWithUrls },
        message: `Found ${photos.length} photo(s)`,
      });
    } catch (error) {
      console.error('Error fetching photos:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch photos',
      });
    }
  };

  /**
   * Delete photo
   * DELETE /api/inspections/:id/results/:resultId/photos/:photoId
   */
  export const deletePhoto = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Not authenticated',
        });
        return;
      }

      const { id: inspectionId, resultId, photoId } = req.params;

      // Verify inspection access
      const { hasAccess } = await verifyInspectionAccess(
        inspectionId,
        user.userId,
        user.role
      );

      if (!hasAccess) {
        res.status(403).json({
          status: 'error',
          message: 'You do not have permission to delete photos from this inspection',
        });
        return;
      }

      // Get photo
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
        include: { inspectionResult: true },
      });

      if (!photo) {
        res.status(404).json({
          status: 'error',
          message: 'Photo not found',
        });
        return;
      }

      // Verify photo belongs to the correct result and inspection
      if (photo.inspectionResultId !== resultId) {
        res.status(400).json({
          status: 'error',
          message: 'Photo does not belong to this inspection result',
        });
        return;
      }

      if (photo.inspectionResult.inspectionId !== inspectionId) {
        res.status(400).json({
          status: 'error',
          message: 'Photo does not belong to this inspection',
        });
        return;
      }

      // Delete files from filesystem
      try {
        const photoPath = path.join(UPLOAD_DIR, photo.path);
        await fs.unlink(photoPath);

        if (photo.thumbnailPath) {
          const thumbnailPath = path.join(UPLOAD_DIR, photo.thumbnailPath);
          await fs.unlink(thumbnailPath);
        }
      } catch (error) {
        console.error('Error deleting photo files:', error);
        // Continue with database deletion even if file deletion fails
      }

      // Delete photo record from database
      await prisma.photo.delete({
        where: { id: photoId },
      });

      res.status(200).json({
        status: 'success',
        message: 'Photo deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete photo',
      });
    }
  };

  /**
   * Update photo annotations
   * PATCH /api/inspections/:id/results/:resultId/photos/:photoId/annotations
   */
  export const updatePhotoAnnotations = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({
          status: 'error',
          message: 'Not authenticated',
        });
        return;
      }

      const { id: inspectionId, resultId, photoId } = req.params;
      const { arrows, circles, text } = req.body;

      // Verify inspection access
      const { hasAccess } = await verifyInspectionAccess(
        inspectionId,
        user.userId,
        user.role
      );

      if (!hasAccess) {
        res.status(403).json({
          status: 'error',
          message: 'You do not have permission to update annotations for this inspection',
        });
        return;
      }

      // Get photo
      const photo = await prisma.photo.findUnique({
        where: { id: photoId },
        include: { inspectionResult: true },
      });

      if (!photo) {
        res.status(404).json({
          status: 'error',
          message: 'Photo not found',
        });
        return;
      }

      // Verify photo belongs to the correct result and inspection
      if (photo.inspectionResultId !== resultId) {
        res.status(400).json({
          status: 'error',
          message: 'Photo does not belong to this inspection result',
        });
        return;
      }

      if (photo.inspectionResult.inspectionId !== inspectionId) {
        res.status(400).json({
          status: 'error',
          message: 'Photo does not belong to this inspection',
        });
        return;
      }

      // Prepare annotations object
      const annotations = {
        arrows: arrows || [],
        circles: circles || [],
        text: text || [],
      };

      console.log('Saving annotations:', JSON.stringify(annotations));

      // Update photo annotations
      const updatedPhoto = await prisma.photo.update({
        where: { id: photoId },
        data: {
          annotations: JSON.stringify(annotations),
        },
      });

      console.log('Saved annotations to DB:', updatedPhoto.annotations);

      // Return photo with relative URLs
      const parsedAnnotations = updatedPhoto.annotations
        ? JSON.parse(updatedPhoto.annotations)
        : { arrows: [], circles: [], text: [] };

      console.log('Returning parsed annotations:', JSON.stringify(parsedAnnotations));

      res.status(200).json({
        status: 'success',
        data: {
          photo: {
            ...updatedPhoto,
            url: `/uploads/${updatedPhoto.path}`,
            thumbnailUrl: updatedPhoto.thumbnailPath
              ? `/uploads/${updatedPhoto.thumbnailPath}`
              : null,
            annotations: parsedAnnotations,
          },
        },
        message: 'Photo annotations updated successfully',
      });
    } catch (error) {
      console.error('Error updating photo annotations:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update photo annotations',
      });
    }
  };
