export interface TempleRecord {
  id: string;
  rowIndex?: number;       // หมายเลขแถวใน Google Sheets (แถวที่ 2, 3, ...) สำหรับอัปเดตและลบ
  branch: string;          // สาขา (เช่น สาขาราษีไศล, สาขาขุนหาญ)
  templeName: string;      // ชื่อวัด
  district: string;        // อำเภอ
  subdistrict: string;     // ตำบล
  dateStep1?: string;      // ขั้นที่ 1: วันรับคำขอ (ใช้วันที่ลงทะเบียน)
  dateStep2?: string;      // ขั้นที่ 2: สอบถามความเห็นอำเภอ (ใช้วันที่สอบถาม)
  dateStep3?: string;      // ขั้นที่ 3: ส่งจังหวัด/กลุ่มงานวิชาการที่ดิน (ใช้วันส่ง)
  dateStep4?: string;      // ขั้นที่ 4: ตรวจสอบทะเบียนวัด (ใช้วันที่ตรวจสอบ)
  dateStep5?: string;      // ขั้นที่ 5: เสนอผู้ว่าราชการจังหวัด (ใช้วันที่เสนอ)
  dateStep6?: string;      // ขั้นที่ 6: รายงานผลการอนุญาต (ใช้วันที่เสนอผล)
  dateStep7?: string;      // ขั้นที่ 7: จดทะเบียน (ใช้วันที่จดทะเบียน)
  dateStep8?: string;      // ขั้นที่ 8: รายงานผลการจดทะเบียน (ใช้วันที่รายงานผล)
  stepNumber: number;      // ลำดับขั้น (1 - 8)
  stepName: string;        // สถานะขั้นตอน
  startDate: string;       // วันเริ่มขั้นตอนปัจจุบัน
  daysDuration?: number;   // ระยะเวลาที่คำนวณ (วัน)
  note: string;            // หมายเหตุ
  imageUrl?: string;       // URL รูปภาพ / Base64 Data URL จากการ Upload / Google Drive URL
}

export interface WorkflowStep {
  number: number;
  name: string;
  shortName: string;
  fieldSource: string;
  dateKey: keyof TempleRecord;
  description: string;
  color: string;
  glowColor: string;
  gradient: string;
  badgeBg: string;
  borderClass: string;
}

export const DEFAULT_SPREADSHEET_ID = '1BYpAwK6mLh-KxwFcJv14ZfLqY9wTkM--RlzVYCAbt8s';
export const DEFAULT_SHEET_NAME = 'รายละเอียดวัด';
export const DEFAULT_DRIVE_FOLDER_ID = '1thfbk1xvscShl1UWDPu-lluqtd6sZRum';

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: 1,
    name: 'วันรับคำขอ',
    shortName: 'รับคำขอ',
    fieldSource: 'วันที่ลงทะเบียน',
    dateKey: 'dateStep1',
    description: 'ยื่นคำขอและลงทะเบียนรับเรื่องการขออนุญาตสร้างและตั้งวัด',
    color: 'text-sky-600',
    glowColor: 'shadow-sky-500/20',
    gradient: 'from-sky-500 to-blue-600',
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    borderClass: 'border-sky-300',
  },
  {
    number: 2,
    name: 'สอบถามความเห็นอำเภอ',
    shortName: 'สอบถามอำเภอ',
    fieldSource: 'วันที่สอบถาม',
    dateKey: 'dateStep2',
    description: 'ส่งเรื่องสอบถามความเห็นจากนายอำเภอและหน่วยงานในพื้นที่',
    color: 'text-indigo-600',
    glowColor: 'shadow-indigo-500/20',
    gradient: 'from-indigo-500 to-blue-700',
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    borderClass: 'border-indigo-300',
  },
  {
    number: 3,
    name: 'ส่งจังหวัด/กลุ่มงานวิชาการที่ดิน',
    shortName: 'ส่งจังหวัด/ที่ดิน',
    fieldSource: 'วันส่ง',
    dateKey: 'dateStep3',
    description: 'รวบรวมเอกสารส่งจังหวัดและกลุ่มงานวิชาการที่ดินพิจารณา',
    color: 'text-violet-600',
    glowColor: 'shadow-violet-500/20',
    gradient: 'from-violet-500 to-purple-600',
    badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
    borderClass: 'border-violet-300',
  },
  {
    number: 4,
    name: 'ตรวจสอบทะเบียนวัด',
    shortName: 'ตรวจทะเบียนวัด',
    fieldSource: 'วันที่ตรวจสอบ',
    dateKey: 'dateStep4',
    description: 'ตรวจสอบความถูกต้องของที่ดินและทะเบียนวัดกับสำนักพุทธฯ / กรมที่ดิน',
    color: 'text-pink-600',
    glowColor: 'shadow-pink-500/20',
    gradient: 'from-pink-500 to-rose-600',
    badgeBg: 'bg-pink-50 text-pink-700 border-pink-200',
    borderClass: 'border-pink-300',
  },
  {
    number: 5,
    name: 'เสนอผู้ว่าราชการจังหวัด',
    shortName: 'เสนอผู้ว่าฯ',
    fieldSource: 'วันที่เสนอ',
    dateKey: 'dateStep5',
    description: 'จัดทำหนังสือและเอกสารเสนอผู้ว่าราชการจังหวัดลงนามอนุญาต',
    color: 'text-amber-600',
    glowColor: 'shadow-amber-500/20',
    gradient: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
    borderClass: 'border-amber-300',
  },
  {
    number: 6,
    name: 'รายงานผลการอนุญาต',
    shortName: 'รายงานอนุญาต',
    fieldSource: 'วันที่เสนอผล',
    dateKey: 'dateStep6',
    description: 'รายงานผลการพิจารณาอนุญาตสร้างวัดไปยังผู้ว่าราชการและหน่วยงาน',
    color: 'text-yellow-600',
    glowColor: 'shadow-yellow-500/20',
    gradient: 'from-yellow-500 to-amber-600',
    badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    borderClass: 'border-yellow-300',
  },
  {
    number: 7,
    name: 'จดทะเบียน',
    shortName: 'จดทะเบียน',
    fieldSource: 'วันที่จดทะเบียน',
    dateKey: 'dateStep7',
    description: 'ดำเนินการจัดทำเอกสารและจดทะเบียนตั้งวัดอย่างเป็นทางการ',
    color: 'text-emerald-600',
    glowColor: 'shadow-emerald-500/20',
    gradient: 'from-emerald-500 to-teal-600',
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderClass: 'border-emerald-300',
  },
  {
    number: 8,
    name: 'รายงานผลการจดทะเบียน',
    shortName: 'รายงานผลจดทะเบียน',
    fieldSource: 'วันที่รายงานผล',
    dateKey: 'dateStep8',
    description: 'รายงานผลการจดทะเบียนตั้งวัดเสร็จสมบูรณ์ 100% ต่อจังหวัดและกรมที่ดิน',
    color: 'text-teal-600',
    glowColor: 'shadow-teal-500/20',
    gradient: 'from-teal-400 to-emerald-600',
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200',
    borderClass: 'border-teal-300',
  },
];
