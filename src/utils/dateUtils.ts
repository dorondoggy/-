/**
 * Thai Date Parsing and Calculation Utilities
 */

const THAI_MONTH_NAMES_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTH_NAMES_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTH_MAP: Record<string, number> = {
  'ม.ค.': 0, 'มกราคม': 0,
  'ก.พ.': 1, 'กุมภาพันธ์': 1,
  'มี.ค.': 2, 'มีนาคม': 2,
  'เม.ย.': 3, 'เมษายน': 3,
  'พ.ค.': 4, 'พฤษภาคม': 4,
  'มิ.ย.': 5, 'มิถุนายน': 5,
  'ก.ค.': 6, 'กรกฎาคม': 6,
  'ส.ค.': 7, 'สิงหาคม': 7,
  'ก.ย.': 8, 'กันยายน': 8,
  'ต.ค.': 9, 'ตุลาคม': 9,
  'พ.ย.': 10, 'พฤศจิกายน': 10,
  'ธ.ค.': 11, 'ธันวาคม': 11,
};

/**
 * Parses Thai date string (e.g., "21 มี.ค. 2568", "9 ต.ค. 2568", "2025-03-21") into Date object
 */
export function parseThaiDate(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // Handle standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parts = trimmed.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  // Handle Thai formats: e.g. "21 มี.ค. 2568" or "21 มี.ค. 68" or "21 มีนาคม 2568"
  // Match: Day Month Year
  const match = trimmed.match(/^(\d{1,2})\s+([^\s\d]+)\s+(\d{2,4})$/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthStr = match[2];
    let year = parseInt(match[3], 10);

    const monthIndex = THAI_MONTH_MAP[monthStr];
    if (monthIndex === undefined) return null;

    // Convert short 2-digit Buddhist year e.g. "68" -> 2568
    if (year < 100) {
      year += 2500;
    }

    // Convert Buddhist Era (พ.ศ.) to Common Era (ค.ศ.)
    let ceYear = year;
    if (year > 2400) {
      ceYear = year - 543;
    }

    const d = new Date(ceYear, monthIndex, day);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  // Fallback to Date.parse
  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Formats a Date object into Thai display format e.g. "21 มี.ค. 2568"
 */
export function formatThaiDate(date: Date | string | null | undefined, fullMonth: boolean = false): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? parseThaiDate(date) : date;
  if (!d || isNaN(d.getTime())) {
    return typeof date === 'string' ? date : '-';
  }

  const day = d.getDate();
  const monthIdx = d.getMonth();
  const beYear = d.getFullYear() + 543;
  const monthName = fullMonth ? THAI_MONTH_NAMES_FULL[monthIdx] : THAI_MONTH_NAMES_SHORT[monthIdx];

  return `${day} ${monthName} ${beYear}`;
}

/**
 * Formats a Date into standard ISO format (YYYY-MM-DD) for HTML date inputs
 */
export function toISODateInput(dateStr?: string | null): string {
  if (!dateStr) return '';
  const d = parseThaiDate(dateStr);
  if (!d) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts ISO input (YYYY-MM-DD) into Thai date string e.g. "21 มี.ค. 2568"
 */
export function fromISODateInput(isoStr: string): string {
  if (!isoStr) return '';
  const parts = isoStr.split('-').map(Number);
  if (parts.length !== 3) return '';
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return formatThaiDate(d);
}

/**
 * Calculates duration in days = Current Date (or reference date) - Start Date of that step
 * (สามารถคำนวณวันที่ในแต่ละขั้นตอนโดยเอาวันปัจจุบัน-วันที่เริ่มขึ้นตอนนั่้นๆ)
 */
export function calculateDaysDuration(
  startDateStr?: string | null,
  referenceDate: Date = new Date()
): number {
  if (!startDateStr) return 0;
  const start = parseThaiDate(startDateStr);
  if (!start) return 0;

  // Set times to midnight to calculate pure date differences
  const r = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  const diffTime = r.getTime() - s.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculate duration between two specific date strings
 */
export function calculateDurationBetween(
  startDateStr?: string | null,
  endDateStr?: string | null
): number | null {
  if (!startDateStr || !endDateStr) return null;
  const start = parseThaiDate(startDateStr);
  const end = parseThaiDate(endDateStr);
  if (!start || !end) return null;

  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Get current Thai date string
 */
export function getCurrentThaiDate(): string {
  return formatThaiDate(new Date());
}

export const WORKFLOW_STEP_NAMES = [
  'วันรับคำขอ',
  'สอบถามความเห็นอำเภอ',
  'ส่งจังหวัด/กลุ่มงานวิชาการที่ดิน',
  'ตรวจสอบทะเบียนวัด',
  'เสนอผู้ว่าราชการจังหวัด',
  'รายงานผลการอนุญาต',
  'จดทะเบียน',
  'รายงานผลการจดทะเบียน',
];

/**
 * เช็คค่าว่างในแต่ละขั้นตอน: ถ้าไม่มีค่าว่างให้นับเป็น 1 จนถึง 8 ขั้นตอน
 * - ตรวจสอบแต่ละขั้นตอน (1 ถึง 8) ว่ามีค่าว่างหรือไม่ (ไม่ใช่ค่าว่าง, ไม่ใช่ '-', ไม่ใช่ 'N/A')
 * - ถ้าไม่มีค่าว่าง ให้นับเป็นขั้นตอนที่ 1 จนถึง 8
 * - คำนวณวันเริ่มของขั้นตอน และระยะเวลาแบบเรียลไทม์ (วันปัจจุบัน - วันที่เริ่มขั้นตอน)
 */
export function isStepDateFilled(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const s = dateStr.trim();
  return s !== '' && s !== '-' && s.toLowerCase() !== 'n/a' && s.toLowerCase() !== 'null';
}

export interface StepCheckDetail {
  stepNumber: number;
  name: string;
  fieldSource: string;
  date: string;
  isFilled: boolean;
}

export function computeStepFromDates(dates: {
  dateStep1?: string;
  dateStep2?: string;
  dateStep3?: string;
  dateStep4?: string;
  dateStep5?: string;
  dateStep6?: string;
  dateStep7?: string;
  dateStep8?: string;
}): {
  stepNumber: number;
  stepName: string;
  startDate: string;
  completedStepsCount: number;
  stepDetails: StepCheckDetail[];
} {
  const stepsConfig = [
    { num: 1, date: dates.dateStep1 || '', name: 'วันรับคำขอ', fieldSource: 'วันที่ลงทะเบียน' },
    { num: 2, date: dates.dateStep2 || '', name: 'สอบถามความเห็นอำเภอ', fieldSource: 'วันที่สอบถาม' },
    { num: 3, date: dates.dateStep3 || '', name: 'ส่งจังหวัด/กลุ่มงานวิชาการที่ดิน', fieldSource: 'วันส่ง' },
    { num: 4, date: dates.dateStep4 || '', name: 'ตรวจสอบทะเบียนวัด', fieldSource: 'วันที่ตรวจสอบ' },
    { num: 5, date: dates.dateStep5 || '', name: 'เสนอผู้ว่าราชการจังหวัด', fieldSource: 'วันที่เสนอ' },
    { num: 6, date: dates.dateStep6 || '', name: 'รายงานผลการอนุญาต', fieldSource: 'วันที่เสนอผล' },
    { num: 7, date: dates.dateStep7 || '', name: 'จดทะเบียน', fieldSource: 'วันที่จดทะเบียน' },
    { num: 8, date: dates.dateStep8 || '', name: 'รายงานผลการจดทะเบียน', fieldSource: 'วันที่รายงานผล' },
  ];

  const stepDetails: StepCheckDetail[] = stepsConfig.map((s) => ({
    stepNumber: s.num,
    name: s.name,
    fieldSource: s.fieldSource,
    date: s.date.trim(),
    isFilled: isStepDateFilled(s.date),
  }));

  // ตรวจสอบค่าว่างในแต่ละขั้นตอน: ถ้าไม่มีค่าว่างให้นับเพิ่มทีละ 1 จนถึงสูงสุด 8 ขั้นตอน
  let count = 0;
  for (const item of stepDetails) {
    if (item.isFilled) {
      count++;
    }
  }

  // กำหนดลำดับขั้น 1 ถึง 8 ตามจำนวนขั้นตอนที่ไม่มีค่าว่าง (ถ้ายังไม่มีขั้นตอนใดเลยให้เป็นขั้นที่ 1)
  const stepNumber = count > 0 ? Math.min(8, count) : 1;
  const stepName = WORKFLOW_STEP_NAMES[stepNumber - 1] || `ขั้นตอนที่ ${stepNumber}`;

  // หาวันที่เริ่มของขั้นตอนปัจจุบัน
  let startDate = '';
  const currentStep = stepDetails[stepNumber - 1];
  if (currentStep && currentStep.isFilled) {
    startDate = currentStep.date;
  } else {
    // หากขั้นตอนปัจจุบันไม่มีวันที่ ให้ย้อนหาวันที่ล่าสุดที่มีข้อมูล
    for (let i = stepDetails.length - 1; i >= 0; i--) {
      if (stepDetails[i].isFilled) {
        startDate = stepDetails[i].date;
        break;
      }
    }
  }

  if (!startDate) {
    startDate = getCurrentThaiDate();
  }

  return {
    stepNumber,
    stepName,
    startDate,
    completedStepsCount: count,
    stepDetails,
  };
}

