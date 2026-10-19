import React, { useRef } from 'react';
import { TempleRecord, WORKFLOW_STEPS } from '../types';
import { TempleImage } from './TempleImage';
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Edit3, 
  ExternalLink,
  ChevronRight,
  Printer,
  Sparkles,
  Upload
} from 'lucide-react';
import { 
  formatThaiDate, 
  calculateDaysDuration, 
  calculateDurationBetween,
  getCurrentThaiDate
} from '../utils/dateUtils';
import { getOptimizedImageUrl, processImageUpload } from '../utils/imageUtils';
import { DEFAULT_DRIVE_FOLDER_ID } from '../types';
import { uploadImageToGoogleDrive } from '../services/googleDrive';
import { getAccessToken, googleSignIn } from '../services/firebaseAuth';
import { UploadSuccessModal, UploadSuccessData } from './UploadSuccessModal';

interface TempleDetailModalProps {
  temple: TempleRecord | null;
  onClose: () => void;
  onEdit: (temple: TempleRecord) => void;
  onAdvanceStep: (temple: TempleRecord) => void;
  onOpenImageViewer: (url: string, title: string, subtitle?: string) => void;
  onUpdateImage?: (templeId: string, newImageUrl: string) => void;
}

export const TempleDetailModal: React.FC<TempleDetailModalProps> = ({
  temple,
  onClose,
  onEdit,
  onAdvanceStep,
  onOpenImageViewer,
  onUpdateImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!temple) return null;

  const imageInfo = getOptimizedImageUrl(temple.imageUrl);
  const liveDays = calculateDaysDuration(temple.startDate, new Date());

  // Step dates array for all 8 steps
  const stepDates: Record<number, string | undefined> = {
    1: temple.dateStep1,
    2: temple.dateStep2,
    3: temple.dateStep3,
    4: temple.dateStep4,
    5: temple.dateStep5,
    6: temple.dateStep6,
    7: temple.dateStep7,
    8: temple.dateStep8,
  };

  const handlePrint = () => {
    window.print();
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateImage) return;
    try {
      const token = await getAccessToken();
      if (token) {
        const result = await uploadImageToGoogleDrive(
          file,
          DEFAULT_DRIVE_FOLDER_ID,
          token,
          temple.templeName
        );
        onUpdateImage(temple.id, result.webViewLink);
      } else {
        const base64 = await processImageUpload(file);
        onUpdateImage(temple.id, base64);
      }
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถอัปโหลดรูปภาพได้');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col ring-1 ring-slate-900/5">
        {/* Futuristic Top Bar Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 via-purple-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold font-mono text-white shadow-xs ${
                temple.stepNumber === 8
                  ? 'bg-gradient-to-tr from-teal-500 to-emerald-600'
                  : temple.stepNumber === 7
                  ? 'bg-emerald-600'
                  : 'bg-gradient-to-tr from-sky-600 to-indigo-600'
              }`}
            >
              {temple.stepNumber}
            </span>
            <div>
              <h3 className="font-bold text-lg text-slate-900 leading-tight">
                {temple.templeName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {temple.branch} · อ.{temple.district} {temple.subdistrict && `· ต.${temple.subdistrict}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              title="พิมพ์เอกสารสรุป"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEdit(temple)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไข</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Banner with Image and Key Details */}
          <div className="flex flex-col sm:flex-row gap-5 items-start p-4 bg-gradient-to-br from-slate-50 to-slate-100/60 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative group shrink-0">
              <TempleImage
                url={temple.imageUrl}
                alt={temple.templeName}
                size="lg"
                className="w-28 h-28 sm:w-32 sm:h-32 shadow-sm"
                onClick={() => {
                  if (temple.imageUrl) {
                    onOpenImageViewer(
                      temple.imageUrl,
                      temple.templeName,
                      `${temple.branch} · ${temple.district}`
                    );
                  }
                }}
              />
              {onUpdateImage && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 w-full py-1 px-2 text-[10px] font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                    title="เปลี่ยนหรืออัปโหลดรูปภาพใหม่"
                  >
                    <Upload className="w-3 h-3 text-sky-600" />
                    <span>เปลี่ยนรูป</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-sky-100 text-sky-900 border border-sky-200">
                  ขั้นตอนที่ {temple.stepNumber}: {temple.stepName}
                </span>
                {temple.stepNumber === 8 ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>รายงานผลจดทะเบียนเสร็จสมบูรณ์ 100%</span>
                  </span>
                ) : temple.stepNumber === 7 ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                    จดทะเบียนเรียบร้อยแล้ว
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                    อยู่ระหว่างดำเนินการ
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400">สาขา:</span>{' '}
                  <span className="font-semibold text-slate-900">{temple.branch}</span>
                </div>
                <div>
                  <span className="text-slate-400">อำเภอ/ตำบล:</span>{' '}
                  <span className="font-semibold text-slate-900">
                    อ.{temple.district} {temple.subdistrict && `ต.${temple.subdistrict}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">วันเริ่มขั้นตอนนี้:</span>{' '}
                  <span className="font-mono font-medium text-slate-900">{temple.startDate || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400">ระยะเวลาในขั้น:</span>{' '}
                  <span className="font-mono font-bold text-sky-700">{liveDays} วัน</span>
                </div>
              </div>

              {temple.imageUrl && (
                <div className="pt-1">
                  <button
                    onClick={() =>
                      onOpenImageViewer(
                        temple.imageUrl!,
                        temple.templeName,
                        `${temple.branch} · ${temple.district}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 font-semibold underline cursor-pointer"
                  >
                    <span>คลิกเพื่อดูภาพและเอกสารขนาดเต็ม</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Section: 8-Stage Interactive Timeline */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>การดำเนินงานทั้ง 8 ขั้นตอน (เช็คค่าว่าง)</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold">
                  ผ่านแล้ว {Object.values(stepDates).filter((d) => Boolean(d && d.trim() && d.trim() !== '-')).length}/8 ขั้นตอน
                </span>
                <span className="text-xs text-slate-500 font-mono font-bold">
                  {Math.round((temple.stepNumber / 8) * 100)}%
                </span>
              </div>
            </div>

            <div className="mt-4 relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {WORKFLOW_STEPS.map((step) => {
                const dateVal = stepDates[step.number];
                const isDateFilled = Boolean(dateVal && dateVal.trim() && dateVal.trim() !== '-');
                const isPassed = step.number < temple.stepNumber;
                const isCurrent = step.number === temple.stepNumber;
                const nextDate = stepDates[step.number + 1];
                const stepDuration = isPassed && dateVal && nextDate
                  ? calculateDurationBetween(dateVal, nextDate)
                  : isCurrent
                  ? liveDays
                  : null;

                return (
                  <div key={step.number} className="relative flex items-start justify-between gap-4">
                    {/* Circle Node with Glowing Gradient */}
                    <div
                      className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                        isDateFilled
                          ? 'bg-emerald-600 text-white ring-4 ring-white shadow-xs'
                          : isCurrent
                          ? `bg-gradient-to-tr ${step.gradient} text-white ring-4 ring-sky-100 shadow-md`
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isDateFilled ? '✓' : step.number}
                    </div>

                    {/* Step Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-bold ${
                            isCurrent
                              ? 'text-sky-900'
                              : isDateFilled
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          ขั้นที่ {step.number}: {step.name}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono">
                          ({step.fieldSource})
                        </span>

                        {isDateFilled ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ ไม่มีค่าว่าง (นับแล้ว)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            ○ ยังว่างอยู่
                          </span>
                        )}

                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 animate-pulse">
                            กำลังดำเนินการ
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {step.description}
                      </p>

                      <div className="mt-2 flex items-center gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>วันที่บันทึก:</span>
                          <span className="font-bold text-slate-900">
                            {dateVal || 'ยังไม่มีการลงวันที่ (ว่าง)'}
                          </span>
                        </div>

                        {stepDuration !== null && (
                          <div className="text-slate-500 font-mono">
                            ระยะเวลา:{' '}
                            <span className="font-bold text-slate-800">
                              {stepDuration} วัน
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick advance button for current step */}
                    {isCurrent && step.number < 8 && (
                      <button
                        onClick={() => onAdvanceStep(temple)}
                        className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <span>ผ่านขั้นนี้</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Notes & Remarks */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              หมายเหตุ / ผลการประสานงาน
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {temple.note || 'ไม่มีบันทึกหมายเหตุเพิ่มเติม'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/90 text-xs text-slate-500 shrink-0">
          <div>
            รหัสอ้างอิง: <span className="font-mono">{temple.id}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
