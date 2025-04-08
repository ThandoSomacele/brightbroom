// src/lib/utils/image-utils.ts

/**
 * Maximum allowed image file size in bytes
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Default image dimensions for profile images
 */
export const DEFAULT_PROFILE_IMAGE_DIMENSIONS = {
  width: 500,
  height: 500,
};

/**
 * Validates if a file is an acceptable image
 * 
 * @param file The file to validate
 * @param maxSize Maximum file size in bytes
 * @returns Object with validation result and error message if any
 */
export function validateImageFile(
  file: File,
  maxSize: number = MAX_IMAGE_SIZE
): { valid: boolean; error?: string } {
  // Check if it's an image file
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'Selected file is not an image',
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024) * 10) / 10;
    return {
      valid: false,
      error: `Image is too large (maximum size: ${maxSizeMB}MB)`,
    };
  }

  return { valid: true };
}

/**
 * Loads an image from a file and returns its dimensions
 * 
 * @param file The image file
 * @returns Promise resolving to the image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resizes an image client-side before upload
 * 
 * @param file Original image file
 * @param maxWidth Maximum width to resize to
 * @param maxHeight Maximum height to resize to
 * @param quality JPEG quality (0-1)
 * @returns Promise resolving to a new File with the resized image
 */
export async function resizeImageBeforeUpload(
  file: File,
  maxWidth: number = 1000,
  maxHeight: number = 1000,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height));
            height = maxHeight;
          }
        }
        
        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image on canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create blob from canvas'));
              return;
            }
            
            // Create new file from blob
            const resizedFile = new File(
              [blob],
              file.name,
              {
                type: 'image/jpeg',
                lastModified: new Date().getTime(),
              }
            );
            
            resolve(resizedFile);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for resizing'));
      };
      
      img.src = URL.createObjectURL(file);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Creates a thumbnail from an image file
 * 
 * @param file Image file
 * @param width Thumbnail width
 * @param height Thumbnail height
 * @returns Promise resolving to a data URL containing the thumbnail
 */
export async function createThumbnail(
  file: File,
  width: number = 100,
  height: number = 100
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw thumbnail with cover positioning
        const aspectRatio = img.width / img.height;
        let drawWidth, drawHeight, offsetX = 0, offsetY = 0;
        
        if (width / height > aspectRatio) {
          // Canvas is wider than the image aspect ratio
          drawWidth = width;
          drawHeight = width / aspectRatio;
          offsetY = (height - drawHeight) / 2;
        } else {
          // Canvas is taller than the image aspect ratio
          drawWidth = height * aspectRatio;
          drawHeight = height;
          offsetX = (width - drawWidth) / 2;
        }
        
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for thumbnail'));
      };
      
      img.src = URL.createObjectURL(file);
    } catch (err) {
      reject(err);
    }
  });
}
