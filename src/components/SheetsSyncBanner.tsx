import React from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  Database,
  Lock
} from 'lucide-react';
import { DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME, DEFAULT_DRIVE_FOLDER_ID } from '../types';
import { User } from 'firebase/auth';

interface SheetsSyncBannerProps {
  user: User | null;
  sheetTitle?: string;
  isSyncing: boolean;
  lastSyncedTime: Date | null;
  onSync: () => void;
  onSeedSheet: () => void;
  onLogin: () => void;
  isLoggingIn: boolean;
  syncError: string | null;
  totalRecordsCount: number;
}

export const SheetsSyncBanner: React.FC<SheetsSyncBannerProps> = ({
  user,
  sheetTitle,
  isSyncing,
  lastSyncedTime,
  onSync,
  onSeedSheet,
  onLogin,
  isLoggingIn,
  syncError,
  totalRecordsCount,
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-sky-50/60 p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <span>ฐานข้อมูล Google Sheets:</span>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-emerald-200 text-emerald-800">
                  {DEFAULT_SHEET_NAME}
                </span>
              </h2>
              {user ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-white/90 border border-emerald-300 px-2 py-0.5 rounded-full shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>เชื่อมต่อสำเร็จ (บันทึก/แก้ไขจริง)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>รอเข้าสู่ระบบ Google เพื่อบันทึกจริง</span>
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap font-mono">
              <span className="truncate max-w-xs text-slate-500" title={DEFAULT_SPREADSHEET_ID}>
                ID: {DEFAULT_SPREADSHEET_ID}
              </span>
              <span>·</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-800 underline font-sans font-medium flex items-center gap-1"
              >
                <span>เปิดดูตารางใน Google Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>·</span>
              <a
                href={`https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 hover:text-sky-800 underline font-sans font-medium flex items-center gap-1"
                title={`โฟลเดอร์สำหรับเก็บไฟล์รูปภาพวัด: ${DEFAULT_DRIVE_FOLDER_ID}`}
              >
                <span>โฟลเดอร์รูปภาพ Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              {lastSyncedTime && (
                <>
                  <span>·</span>
                  <span className="text-slate-400 font-sans">
                    ซิงค์ล่าสุด: {lastSyncedTime.toLocaleTimeString('th-TH')}
                  </span>
                </>
              )}
            </div>

            {syncError && (
              <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{syncError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {user ? (
            <>
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
                <span>{isSyncing ? 'กำลังซิงค์...' : 'ดึงข้อมูลล่าสุด'}</span>
              </button>

              <button
                onClick={onSeedSheet}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                title="ส่งข้อมูลทั้งหมดจากหน้านี้เขียนทับหรืออัปเดตลงในชีต"
              >
                <UploadCloud className="w-3.5 h-3.5 text-sky-600" />
                <span>อัปเดตชุดข้อมูลลงชีต</span>
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบเพื่อเชื่อมต่อชีตจริง'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
