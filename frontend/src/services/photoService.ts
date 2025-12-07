import api from './api';
import type {
  Photo,
  PhotoResponse,
  PhotosResponse,
  PhotoAnnotations,
} from '../types/inspection';

export interface UploadPhotoData {
  file: File;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

export interface UpdateAnnotationsData {
  annotations: PhotoAnnotations;
}

/**
 * Photo Service
 * Handles all photo-related API calls for inspections
 */
export const photoService = {
  /**
   * Upload a photo for a specific inspection result
   */
  async uploadPhoto(
    inspectionId: string,
    resultId: string,
    data: UploadPhotoData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<Photo> {
    const formData = new FormData();
    formData.append('photo', data.file);

    if (data.gpsLatitude !== undefined) {
      formData.append('gpsLatitude', data.gpsLatitude.toString());
    }

    if (data.gpsLongitude !== undefined) {
      formData.append('gpsLongitude', data.gpsLongitude.toString());
    }

    const response = await api.post<PhotoResponse>(
      `/inspections/${inspectionId}/results/${resultId}/photos`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      }
    );

    return response.data.data.photo;
  },

  /**
   * Get all photos for a specific inspection result
   */
  async getPhotos(inspectionId: string, resultId: string): Promise<Photo[]> {
    const response = await api.get<PhotosResponse>(
      `/inspections/${inspectionId}/results/${resultId}/photos`
    );

    return response.data.data.photos;
  },

  /**
   * Get a single photo by ID
   */
  async getPhoto(
    inspectionId: string,
    resultId: string,
    photoId: string
  ): Promise<Photo> {
    const response = await api.get<PhotoResponse>(
      `/inspections/${inspectionId}/results/${resultId}/photos/${photoId}`
    );

    return response.data.data.photo;
  },

  /**
   * Delete a photo
   */
  async deletePhoto(
    inspectionId: string,
    resultId: string,
    photoId: string
  ): Promise<void> {
    await api.delete(
      `/inspections/${inspectionId}/results/${resultId}/photos/${photoId}`
    );
  },

  /**
   * Update photo annotations
   */
  async updateAnnotations(
    inspectionId: string,
    resultId: string,
    photoId: string,
    annotations: PhotoAnnotations
  ): Promise<Photo> {
    console.log('Sending annotations to API:', annotations);

    const response = await api.patch<PhotoResponse>(
      `/inspections/${inspectionId}/results/${resultId}/photos/${photoId}/annotations`,
      annotations // Send arrows, circles, text directly, not wrapped in annotations
    );

    console.log('Received photo from API:', response.data.data.photo);
    console.log('Photo annotations:', response.data.data.photo.annotations);

    return response.data.data.photo;
  },
};

/**
 * Utility functions for photo handling
 */

/**
 * Resize image to maximum dimensions while maintaining aspect ratio
 */
export const resizeImage = (
  file: File,
  _maxWidth: number = 2048,
  _maxHeight: number = 2048
): Promise<Blob> => {
  // TEMPORARY: Bypass all resizing logic to prevent black images and slowness
  return Promise.resolve(file);

  /*
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Fill with white background (handles transparent PNGs converting to JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedBlob = blob;
              resolve(resizedBlob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.80
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
  */
};

/**
 * Get current GPS position
 */
export const getCurrentPosition = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        // Don't reject, just return undefined coordinates
        console.warn('Could not get GPS position:', error);
        resolve({ latitude: 0, longitude: 0 });
      },
      {
        enableHighAccuracy: true,
        timeout: 2000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Check if browser supports camera API
 */
export const isCameraSupported = (): boolean => {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
};

/**
 * Request camera access
 */
export const requestCameraAccess = async (
  facingMode: 'user' | 'environment' = 'environment'
): Promise<MediaStream> => {
  if (!isCameraSupported()) {
    throw new Error('Camera is not supported by this browser');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });

    return stream;
  } catch (error: any) {
    if (error.name === 'NotAllowedError') {
      throw new Error('Camera access denied. Please grant camera permissions.');
    } else if (error.name === 'NotFoundError') {
      throw new Error('No camera found on this device.');
    } else {
      throw new Error('Failed to access camera: ' + error.message);
    }
  }
};

/**
 * Capture photo from video stream
 */
export const capturePhotoFromStream = (
  videoElement: HTMLVideoElement
): Promise<Blob> => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return Promise.reject(new Error('Could not get canvas context'));
  }

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to capture photo'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
};
