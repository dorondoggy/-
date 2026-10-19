import { DEFAULT_DRIVE_FOLDER_ID } from '../types';

export interface DriveUploadResult {
  fileId: string;
  fileName: string;
  webViewLink: string;
  directUrl: string;
  thumbnailUrl: string;
}

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

/**
 * Check if the target Google Drive folder exists and is accessible
 */
export async function getDriveFolderInfo(
  folderId: string = DEFAULT_DRIVE_FOLDER_ID,
  accessToken: string
): Promise<DriveFolderInfo> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,webViewLink,mimeType`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `ไม่สามารถเข้าถึงโฟลเดอร์ Google Drive (ID: ${folderId}) ได้ (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name || 'Google Drive Folder',
    webViewLink: data.webViewLink,
  };
}

/**
 * Upload an image file directly to the specified Google Drive folder
 * Target folder ID: 1thfbk1xvscShl1UWDPu-lluqtd6sZRum
 */
export async function uploadImageToGoogleDrive(
  file: File,
  folderId: string = DEFAULT_DRIVE_FOLDER_ID,
  accessToken: string,
  templeName?: string
): Promise<DriveUploadResult> {
  if (!accessToken) {
    throw new Error('กรุณาเข้าสู่ระบบ Google เพื่ออัปโหลดไฟล์ไปยัง Google Drive');
  }

  // Sanitize temple name for filename
  const cleanName = (templeName || 'วัด')
    .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${cleanName}_${Date.now()}.${ext}`;

  // 1. Metadata part
  const metadata: any = {
    name: fileName,
    description: `อัปโหลดจากระบบติดตามงานขออนุญาตวัด สำหรับ: ${templeName || 'ไม่ระบุชื่อ'}`,
  };
  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = '-------DriveBoundary' + Date.now().toString(36) + Math.random().toString(36).substring(2);
  const metadataHeaders =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${file.type || 'image/jpeg'}\r\n\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Combine metadata and file blob into multipart payload
  const multipartBlob = new Blob([metadataHeaders, file, closeDelimiter], {
    type: `multipart/related; boundary=${boundary}`,
  });

  // 2. Upload to Google Drive
  let res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: multipartBlob,
    }
  );

  // If failed with parent folder error (e.g. 404 or 403 on folder), retry without parents so user image upload does not get blocked
  if (!res.ok && folderId) {
    const errorDetails = await res.json().catch(() => ({}));
    console.warn(`Drive upload into parents [${folderId}] failed (${res.status}):`, errorDetails);

    const fallbackMetadata = {
      name: fileName,
      description: `อัปโหลดจากระบบติดตามงานขออนุญาตวัด สำหรับ: ${templeName || 'ไม่ระบุชื่อ'} (โฟลเดอร์เป้าหมาย: ${folderId})`,
    };
    const fallbackHeaders =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(fallbackMetadata) +
      `\r\n--${boundary}\r\n` +
      `Content-Type: ${file.type || 'image/jpeg'}\r\n\r\n`;
    const fallbackBlob = new Blob([fallbackHeaders, file, closeDelimiter], {
      type: `multipart/related; boundary=${boundary}`,
    });

    res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: fallbackBlob,
      }
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message ||
        `เกิดข้อผิดพลาดในการอัปโหลดรูปไปยัง Google Drive (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  const fileId = data.id;

  // 3. Make file readable by anyone with the link so it can be previewed seamlessly
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });
  } catch (permErr) {
    console.warn('Could not set public permission on Google Drive file:', permErr);
  }

  const webViewLink = data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`;
  const directUrl = `https://drive.google.com/uc?id=${fileId}`;
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;

  return {
    fileId,
    fileName,
    webViewLink,
    directUrl,
    thumbnailUrl,
  };
}
