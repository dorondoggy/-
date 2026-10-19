import { TempleRecord, DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME } from '../types';
import { calculateDaysDuration, computeStepFromDates } from '../utils/dateUtils';

export interface SheetMetadata {
  title: string;
  sheetId: number;
}

export interface SpreadsheetInfo {
  spreadsheetId: string;
  title: string;
  sheets: SheetMetadata[];
  targetSheetName: string;
  targetSheetId: number;
}

export const SHEET_COLUMNS = [
  'สาขา',
  'ชื่อวัด',
  'อำเภอ',
  'ตำบล',
  'วันที่ลงทะเบียน',
  'วันที่สอบถาม',
  'วันส่ง',
  'วันที่ตรวจสอบ',
  'วันที่เสนอ',
  'วันที่เสนอผล',
  'วันที่จดทะเบียน',
  'วันที่รายงานผล',
  'ลำดับขั้น',
  'สถานะ',
  'วันเริ่ม',
  'ระยะเวลา',
  'หมายเหตุ',
  'Image'
];

/**
 * Fetch spreadsheet metadata to get sheets/tabs information
 */
export async function getSpreadsheetInfo(
  spreadsheetId: string,
  accessToken: string
): Promise<SpreadsheetInfo> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties(sheetId,title)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `ไม่สามารถเข้าถึง Google Sheets ได้ (HTTP ${res.status})`
    );
  }

  const data = await res.json();
  const sheets: SheetMetadata[] = (data.sheets || []).map((s: any) => ({
    title: s.properties?.title || 'Sheet1',
    sheetId: s.properties?.sheetId || 0,
  }));

  // Look for "รายละเอียดวัด" or fallback to first sheet
  const exactTarget = sheets.find(
    (s) => s.title.trim().toLowerCase() === DEFAULT_SHEET_NAME.toLowerCase()
  );
  const target = exactTarget || sheets[0] || { title: DEFAULT_SHEET_NAME, sheetId: 0 };

  return {
    spreadsheetId,
    title: data.properties?.title || 'Google Sheet',
    sheets,
    targetSheetName: target.title,
    targetSheetId: target.sheetId,
  };
}

/**
 * Helper to dynamically locate column indices from header row
 */
function findHeaderIndex(headers: string[], synonyms: string[], defaultIndex: number): number {
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').trim().toLowerCase();
    for (const s of synonyms) {
      if (h === s.toLowerCase() || h.includes(s.toLowerCase())) {
        return i;
      }
    }
  }
  return defaultIndex;
}

/**
 * Read all temple records from the spreadsheet
 */
export async function fetchTempleRecordsFromSheet(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<TempleRecord[]> {
  const range = `${encodeURIComponent(sheetName)}!A1:R1000`;
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถดึงข้อมูลจากชีตได้');
  }

  const data = await res.json();
  const rows: any[][] = data.values || [];

  if (rows.length <= 1) {
    // Only header or empty
    return [];
  }

  // Parse header row dynamically to find exact column indices
  const headerRow = (rows[0] || []).map((c: any) => (c || '').toString().trim());
  const colBranch = findHeaderIndex(headerRow, ['สาขา'], 0);
  const colTemple = findHeaderIndex(headerRow, ['ชื่อวัด', 'วัด'], 1);
  const colDistrict = findHeaderIndex(headerRow, ['อำเภอ'], 2);
  const colSubdistrict = findHeaderIndex(headerRow, ['ตำบล'], 3);
  const colStep1 = findHeaderIndex(headerRow, ['วันที่ลงทะเบียน', 'วันรับคำขอ', 'ลงทะเบียน'], 4);
  const colStep2 = findHeaderIndex(headerRow, ['วันที่สอบถาม', 'สอบถามความเห็นอำเภอ', 'สอบถาม'], 5);
  const colStep3 = findHeaderIndex(headerRow, ['วันส่ง', 'ส่งจังหวัด/กลุ่มงานวิชาการที่ดิน', 'ส่งจังหวัด'], 6);
  const colStep4 = findHeaderIndex(headerRow, ['วันที่ตรวจสอบ', 'ตรวจสอบทะเบียนวัด', 'ตรวจสอบ'], 7);
  const colStep5 = findHeaderIndex(headerRow, ['วันที่เสนอ', 'เสนอผู้ว่าราชการจังหวัด', 'เสนอผู้ว่า'], 8);
  const colStep6 = findHeaderIndex(headerRow, ['วันที่เสนอผล', 'รายงานผลการอนุญาต', 'เสนอผล'], 9);
  const colStep7 = findHeaderIndex(headerRow, ['วันที่จดทะเบียน', 'จดทะเบียน'], 10);
  const colStep8 = findHeaderIndex(headerRow, ['วันที่รายงานผล', 'รายงานผลการจดทะเบียน', 'รายงานผล'], 11);
  const colStepNum = findHeaderIndex(headerRow, ['ลำดับขั้น', 'ขั้นตอน', 'ขั้น'], 12);
  const colStepName = findHeaderIndex(headerRow, ['สถานะ', 'สถานะขั้นตอน'], 13);
  const colStartDate = findHeaderIndex(headerRow, ['วันเริ่ม', 'วันที่เริ่ม'], 14);
  const colNote = findHeaderIndex(headerRow, ['หมายเหตุ'], 16);
  // ช่อง Image: เก็บไฟล์รูป และ url ที่ upload เข้ามา
  const colImage = findHeaderIndex(headerRow, ['image', 'รูปภาพ', 'รูป', 'url รูปภาพ', 'url'], 17);

  // Parse rows (index 0 is header, rows start at index 1 -> sheet row 2)
  const records: TempleRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const branch = (row[colBranch] || '').toString().trim();
    const templeName = (row[colTemple] || '').toString().trim();
    if (!templeName && !branch) continue;

    const district = (row[colDistrict] || '').toString().trim();
    const subdistrict = (row[colSubdistrict] || '').toString().trim();
    const dateStep1 = (row[colStep1] || '').toString().trim();
    const dateStep2 = (row[colStep2] || '').toString().trim();
    const dateStep3 = (row[colStep3] || '').toString().trim();
    const dateStep4 = (row[colStep4] || '').toString().trim();
    const dateStep5 = (row[colStep5] || '').toString().trim();
    const dateStep6 = (row[colStep6] || '').toString().trim();
    const dateStep7 = (row[colStep7] || '').toString().trim();
    const dateStep8 = (row[colStep8] || '').toString().trim();

    // ตัวขั้นตอนให้เช็คค่าว่างในแต่ละขั้นตอน: ถ้าไม่มีค่าว่างให้นับเป็น 1 จนถึง 8 ขั้นตอน
    const computed = computeStepFromDates({
      dateStep1,
      dateStep2,
      dateStep3,
      dateStep4,
      dateStep5,
      dateStep6,
      dateStep7,
      dateStep8,
    });

    const stepNumber = computed.stepNumber;
    const stepName = (row[colStepName] || '').toString().trim() || computed.stepName;
    const startDate = (row[colStartDate] || '').toString().trim() || computed.startDate;
    const note = (row[colNote] || '').toString().trim();
    // ช่อง Image: เก็บไฟล์รูป และ url ที่ upload เข้ามา
    const imageUrl = (row[colImage] || '').toString().trim();

    // คำนวณระยะเวลาในขั้นตอนปัจจุบันแบบเรียลไทม์ (วันปัจจุบัน - วันที่เริ่มขั้นตอน)
    const daysDuration = calculateDaysDuration(startDate, new Date());

    records.push({
      id: `sheet-row-${i + 1}-${Date.now().toString(36)}`,
      rowIndex: i + 1, // Row number in sheet (1-indexed)
      branch,
      templeName,
      district,
      subdistrict,
      dateStep1,
      dateStep2,
      dateStep3,
      dateStep4,
      dateStep5,
      dateStep6,
      dateStep7,
      dateStep8,
      stepNumber,
      stepName,
      startDate,
      daysDuration,
      note,
      imageUrl,
    });
  }

  return records;
}

/**
 * Convert a TempleRecord into an array of cell values matching columns A through R
 * ช่อง Image (คอลัมน์ R หรือ 18) จะเก็บไฟล์รูปภาพ (Base64) หรือ URL ที่ผู้ใช้อัปโหลดเข้ามา
 */
export function recordToRowValues(r: TempleRecord): any[] {
  return [
    r.branch || '',
    r.templeName || '',
    r.district || '',
    r.subdistrict || '',
    r.dateStep1 || '',
    r.dateStep2 || '',
    r.dateStep3 || '',
    r.dateStep4 || '',
    r.dateStep5 || '',
    r.dateStep6 || '',
    r.dateStep7 || '',
    r.dateStep8 || '',
    r.stepNumber || 1,
    r.stepName || '',
    r.startDate || '',
    r.daysDuration || 0,
    r.note || '',
    r.imageUrl || '', // ช่อง Image: บันทึกรูปภาพ (ไฟล์รูป base64 หรือ URL)
  ];
}

/**
 * Update an existing temple record in Google Sheets
 */
export async function updateTempleRecordInSheet(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  record: TempleRecord,
  accessToken: string
): Promise<void> {
  const range = `${encodeURIComponent(sheetName)}!A${rowIndex}:R${rowIndex}`;
  const rowValues = recordToRowValues(record);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `ไม่สามารถอัปเดตแถวที่ ${rowIndex} ในชีตได้`);
  }
}

/**
 * Append a new temple record to Google Sheets
 */
export async function appendTempleRecordToSheet(
  spreadsheetId: string,
  sheetName: string,
  record: TempleRecord,
  accessToken: string
): Promise<number> {
  const range = `${encodeURIComponent(sheetName)}!A:R`;
  const rowValues = recordToRowValues(record);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถเพิ่มข้อมูลลงชีตได้');
  }

  const data = await res.json();
  // Extract appended row index from updatedRange (e.g. "รายละเอียดวัด!A53:R53")
  const updatedRange: string = data.updates?.updatedRange || '';
  const match = updatedRange.match(/!A(\d+):/);
  const newRowIndex = match ? parseInt(match[1], 10) : 0;
  return newRowIndex;
}

/**
 * Delete a temple record row from Google Sheets
 */
export async function deleteTempleRecordFromSheet(
  spreadsheetId: string,
  sheetId: number,
  rowIndex: number,
  accessToken: string
): Promise<void> {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1, // 0-indexed, inclusive
                endIndex: rowIndex,       // 0-indexed, exclusive
              },
            },
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `ไม่สามารถลบแถวที่ ${rowIndex} ในชีตได้`);
  }
}

/**
 * Initialize or seed the spreadsheet with headers and records if empty
 */
export async function seedSpreadsheetWithData(
  spreadsheetId: string,
  sheetName: string,
  records: TempleRecord[],
  accessToken: string
): Promise<void> {
  const range = `${encodeURIComponent(sheetName)}!A1:R`;
  const allRows = [SHEET_COLUMNS, ...records.map(recordToRowValues)];

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: allRows,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'ไม่สามารถบันทึกข้อมูลตั้งต้นลงชีตได้');
  }
}
