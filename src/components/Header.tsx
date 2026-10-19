import React from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  Table, 
  Kanban, 
  FileSpreadsheet, 
  Sparkles,
  ExternalLink,
  RefreshCw,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  CloudOff
} from 'lucide-react';
import { User } from 'firebase/auth';
import { DEFAULT_SPREADSHEET_ID } from '../types';

export type ActiveTab = 'dashboard' | 'table' | 'kanban';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  totalCount: number;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  isSyncing: boolean;
  onSync: () => void;
  sheetConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  totalCount,
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  isSyncing,
  onSync,
  sheetConnected,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-600 text-white flex items-center justify-center font-bold text-lg shadow-xs ring-1 ring-white/20">
              <FileSpreadsheet className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <a
                  href="/"
                  className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
                >
                  ระบบติดตามงานขออนุญาตตั้งวัด
                </a>
                <span className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                  <span>8 ขั้นตอน</span>
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span>ชีต: รายละเอียดวัด ({totalCount} รายการ)</span>
                <span>·</span>
                {sheetConnected ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>เชื่อมต่อ Google Sheets แล้ว</span>
                  </span>
                ) : (
                  <span className="text-slate-400 flex items-center gap-1">
                    <CloudOff className="w-3 h-3" />
                    <span>โหมดออฟไลน์/แคช</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>แดชบอร์ดสรุป</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>ตารางข้อมูลวัด</span>
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'kanban'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>บอร์ด 8 ขั้นตอน</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Google Authentication */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sync button */}
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="ดึงข้อมูลล่าสุดจาก Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-600' : 'text-slate-500'}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'รีเฟรชชีต'}</span>
            </button>

            {/* Google Sheets Link */}
            <a
              href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition-colors"
              title="เปิด Google Sheets ต้นฉบับในแท็บใหม่"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>เปิดชีต</span>
            </a>

            {/* Google Auth Status / Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-7 h-7 rounded-full border border-slate-300 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
                <span className="hidden xl:inline text-xs font-medium text-slate-700 truncate max-w-[100px]">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="ออกจากระบบ Google"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-all hover:border-slate-400 cursor-pointer disabled:opacity-50"
                title="เข้าสู่ระบบด้วย Google เพื่อซิงค์และบันทึกลง Google Sheets จริง"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span className="hidden sm:inline font-semibold">เข้าสู่ระบบ Google</span>
              </button>
            )}

            {/* Add Temple Button */}
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกวัด</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1 rounded-lg font-medium ${
              activeTab === 'dashboard' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            แดชบอร์ด
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1 rounded-lg font-medium ${
              activeTab === 'table' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            ตารางข้อมูล
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-3 py-1 rounded-lg font-medium ${
              activeTab === 'kanban' ? 'bg-slate-900 text-white' : 'text-slate-600'
            }`}
          >
            บอร์ด 8 ขั้นตอน
          </button>
        </div>
      </div>
    </header>
  );
};
