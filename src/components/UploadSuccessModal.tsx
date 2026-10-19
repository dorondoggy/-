import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  HardDrive, 
  X,
  FileImage,
  Sparkles
} from 'lucide-react';
import { DEFAULT_DRIVE_FOLDER_ID } from '../types';
import { TempleImage } from './TempleImage';

export interface UploadSuccessData {
  fileName: string;
  url: string;
  folderId?: string;
  templeName?: string;
  fileSize?: string;
}

interface UploadSuccessModalProps {
  data: UploadSuccessData | null;
  onClose: () => void;
  onOpenImageViewer?: (url: string, title: string, subtitle?: string) => void;
}

export const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  data,
  onClose,
  onOpenImageViewer,
}) => {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const folderId = data.folderId || DEFAULT_DRIVE_FOLDER_ID;
  const driveFolderUrl = `https://drive.google.com/drive/folders/${folderId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/10 my-6 animate-in zoom-in-95 duration-200">
        {/* Top Gradient Banner */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header with Icon */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md ring-4 ring-emerald-50">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  อัปโหลดไฟล์ภาพสำเร็จเรียบร้อย!
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Google Drive</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ไฟล์รูปภาพถูกอัปโหลดขึ้นโฟลเดอร์ Google Drive และนำลิงก์ไปใส่ในช่อง Image เรียบร้อยแล้ว
              </p>
            </div>
          </div>

          {/* Preview & File Card */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200 flex items-center gap-4">
            <TempleImage
              url={data.url}
              alt={data.templeName || data.fileName}
              size="lg"
              className="w-20 h-20 rounded-xl shadow-xs cursor-pointer shrink-0"
              onClick={() => {
                if (onOpenImageViewer) {
                  onOpenImageViewer(data.url, data.templeName || data.fileName, 'รูปภาพที่อัปโหลดขึ้น Google Drive');
                }
              }}
            />

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <FileImage className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 truncate" title={data.fileName}>
                  {data.fileName}
                </span>
              </div>

              {data.templeName && (
                <div className="text-xs text-slate-600">
                  <span>สำหรับวัด: </span>
                  <span className="font-semibold text-slate-900">{data.templeName}</span>
                </div>
              )}

              {/* Destination Folder */}
              <div className="pt-0.5 flex items-center gap-1.5 text-xs text-slate-600 flex-wrap">
                <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>โฟลเดอร์:</span>
                <span className="font-mono font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200 text-[10px]">
                  {folderId}
                </span>
              </div>
            </div>
          </div>

          {/* URL & Quick Actions Box */}
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              ลิงก์รูปภาพในช่อง Image (Google Drive URL)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={data.url}
                className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-700 truncate select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="คัดลอกลิงก์"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>คัดลอกแล้ว</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>คัดลอกลิงก์</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                เมื่อกด <strong>"บันทึกข้อมูล"</strong> ลิงก์นี้จะถูกบันทึกลงคอลัมน์ <strong>Image</strong> ในชีตรายละเอียดวัดทันที
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <a
              href={driveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <span>เปิดดูในโฟลเดอร์ Drive</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 rounded-xl shadow-md transition-all cursor-pointer"
            >
              <span>ตกลง / รับทราบ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
