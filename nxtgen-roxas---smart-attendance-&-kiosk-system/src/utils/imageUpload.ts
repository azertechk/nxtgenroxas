/**
 * Image processing utility for child and lifeshaper photo uploads.
 * Automatically resizes image to compact dimensions and compresses it to base64
 * for lightning-fast performance, offline support, and low localStorage storage footprint.
 */

import { getAccessToken, uploadPhotoToGoogleDrive } from '../services/googleWorkspace';

/**
 * Automatically backs up uploaded photo to Google Drive (folder 'NXTGEN Photos')
 * if Google Account is currently connected.
 */
export const backupPhotoToDriveIfConnected = async (dataUrl: string, fileName: string) => {
  try {
    const token = await getAccessToken();
    if (token && dataUrl.startsWith('data:')) {
      await uploadPhotoToGoogleDrive(token, dataUrl, fileName);
    }
  } catch (err) {
    // Non-fatal background sync warning
    console.warn('Google Drive photo upload skipped or pending connection:', err);
  }
};

export const resizeImageFile = (
  file: File,
  maxWidth = 360,
  maxHeight = 360,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select an image file (JPEG, PNG, WEBP, etc.)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Failed to read image file data.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while scaling to max dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // Fallback if canvas context is unavailable
          resolve(dataUrl);
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        reject(new Error('Invalid image file format or corrupted image.'));
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      reject(new Error('Could not read the uploaded file.'));
    };

    reader.readAsDataURL(file);
  });
};
