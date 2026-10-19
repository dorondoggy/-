/**
 * Utilities for converting Google Drive, uploaded local files, and web URLs into high quality displayable images
 */

export interface ImageDisplayInfo {
  isGoogleDrive: boolean;
  isUploadedBase64: boolean;
  fileId: string | null;
  displayUrl: string;
  driveViewerUrl: string | null;
  fallbackUrl: string;
}

/**
 * Extracts Google Drive File ID from various URL patterns
 */
export function extractGoogleDriveId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If already a base64 data URL, not a drive ID
  if (trimmed.startsWith('data:image/')) return null;

  // Pattern 1: id=... (e.g. drive.google.com/uc?id=... or open?id=...)
  const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId && matchId[1]) return matchId[1];

  // Pattern 2: /file/d/... or /d/...
  const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) return matchD[1];

  // Pattern 3: thumbnail?id=...
  const matchThumb = trimmed.match(/thumbnail\?id=([a-zA-Z0-9_-]+)/);
  if (matchThumb && matchThumb[1]) return matchThumb[1];

  return null;
}

/**
 * Converts a raw URL or uploaded base64 data into an image URL suitable for <img> tag rendering
 */
export function getOptimizedImageUrl(url?: string | null): ImageDisplayInfo {
  if (!url || !url.trim()) {
    return {
      isGoogleDrive: false,
      isUploadedBase64: false,
      fileId: null,
      displayUrl: '',
      driveViewerUrl: null,
      fallbackUrl: '',
    };
  }

  const trimmed = url.trim();

  // Check if it's an uploaded base64 Data URL
  if (trimmed.startsWith('data:image/')) {
    return {
      isGoogleDrive: false,
      isUploadedBase64: true,
      fileId: null,
      displayUrl: trimmed,
      driveViewerUrl: null,
      fallbackUrl: trimmed,
    };
  }

  const fileId = extractGoogleDriveId(trimmed);

  if (fileId) {
    // Google Drive direct high-res thumbnail endpoint
    return {
      isGoogleDrive: true,
      isUploadedBase64: false,
      fileId,
      displayUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
      driveViewerUrl: `https://drive.google.com/file/d/${fileId}/view`,
      fallbackUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
    };
  }

  return {
    isGoogleDrive: false,
    isUploadedBase64: false,
    fileId: null,
    displayUrl: trimmed,
    driveViewerUrl: null,
    fallbackUrl: trimmed,
  };
}

/**
 * Reads a user-uploaded image file and converts it to a compressed Base64 data URL
 */
export function processImageUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('กรุณาเลือกไฟล์ที่เป็นรูปภาพเท่านั้น (JPG, PNG, WebP)'));
      return;
    }

    // Maximum file size 10MB
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('ขนาดไฟล์ใหญ่เกินไป (กรุณาใช้ภาพขนาดไม่เกิน 10MB)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize to fit cleanly within Google Sheets cell character limits (50k chars)
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
          // If still over 42,000 chars, compress more aggressively to never exceed Google Sheets limit
          if (compressedDataUrl.length > 42000) {
            compressedDataUrl = canvas.toDataURL('image/jpeg', 0.45);
          }
          resolve(compressedDataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('เกิดข้อผิดพลาดในการอ่านไฟล์'));
    reader.readAsDataURL(file);
  });
}
