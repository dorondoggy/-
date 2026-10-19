import React, { useState, useEffect, useMemo } from 'react';
import { TempleRecord, WORKFLOW_STEPS, DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME } from './types';
import { INITIAL_TEMPLE_RECORDS } from './data/initialData';
import { Header, ActiveTab } from './components/Header';
import { DashboardStats } from './components/DashboardStats';
import { TempleTable } from './components/TempleTable';
import { KanbanBoard } from './components/KanbanBoard';
import { TempleFormModal } from './components/TempleFormModal';
import { TempleDetailModal } from './components/TempleDetailModal';
import { ImageViewerModal } from './components/ImageViewerModal';
import { SheetsSyncBanner } from './components/SheetsSyncBanner';
import { calculateDaysDuration, getCurrentThaiDate, computeStepFromDates } from './utils/dateUtils';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  getAccessToken 
} from './services/firebaseAuth';
import { 
  getSpreadsheetInfo, 
  fetchTempleRecordsFromSheet, 
  updateTempleRecordInSheet, 
  appendTempleRecordToSheet, 
  deleteTempleRecordFromSheet,
  seedSpreadsheetWithData,
  SpreadsheetInfo 
} from './services/googleSheets';
import { User } from 'firebase/auth';

const STORAGE_KEY = 'temple_workflow_records_v2';

export default function App() {
  // Google Auth & Sync States
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load records from localStorage or initial dataset
  const [records, setRecords] = useState<TempleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: TempleRecord, idx: number) => ({
            ...r,
            rowIndex: r.rowIndex || idx + 2,
            daysDuration: calculateDaysDuration(r.startDate, new Date()),
          }));
        }
      }
    } catch (e) {
      console.error('Failed to parse saved records from localStorage', e);
    }
    return INITIAL_TEMPLE_RECORDS.map((r, idx) => ({
      ...r,
      rowIndex: idx + 2,
      daysDuration: calculateDaysDuration(r.startDate, new Date()),
    }));
  });

  // Current view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Filters shared between Dashboard and Table
  const [selectedStepFilter, setSelectedStepFilter] = useState<number | null>(null);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTemple, setEditingTemple] = useState<TempleRecord | null>(null);
  const [viewingTemple, setViewingTemple] = useState<TempleRecord | null>(null);

  // Lightbox Image Viewer state
  const [imageViewerState, setImageViewerState] = useState<{
    isOpen: boolean;
    url: string | null;
    title: string;
    subtitle?: string;
  }>({
    isOpen: false,
    url: null,
    title: '',
  });

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Sync data from Google Sheets
  const syncWithGoogleSheets = async (customToken?: string) => {
    try {
      setIsSyncing(true);
      setSyncError(null);
      const token = customToken || (await getAccessToken());
      if (!token) {
        throw new Error('กรุณาเข้าสู่ระบบ Google เพื่อเชื่อมต่อฐานข้อมูล');
      }

      // 1. Get spreadsheet metadata
      const info = await getSpreadsheetInfo(DEFAULT_SPREADSHEET_ID, token);
      setSpreadsheetInfo(info);

      // 2. Fetch rows
      const sheetRecords = await fetchTempleRecordsFromSheet(
        DEFAULT_SPREADSHEET_ID,
        info.targetSheetName,
        token
      );

      if (sheetRecords.length > 0) {
        setRecords(sheetRecords);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sheetRecords));
        setLastSyncedTime(new Date());
        showToast(`ดึงข้อมูลสำเร็จ ${sheetRecords.length} รายการจาก Google Sheets`);
      } else {
        // Sheet is currently empty; prompt or offer to seed with our initial records
        showToast('ชีตว่างอยู่ คุณสามารถกด "อัปเดตชุดข้อมูลลงชีต" เพื่อบันทึกข้อมูลเริ่มต้น');
        setLastSyncedTime(new Date());
      }
    } catch (err: any) {
      console.error('Sync failed', err);
      setSyncError(err.message || 'ไม่สามารถเชื่อมต่อ Google Sheets ได้');
    } finally {
      setIsSyncing(false);
    }
  };

  // Seed / Push local records to Google Sheet
  const handleSeedSheet = async () => {
    const token = await getAccessToken();
    if (!token) {
      alert('กรุณาเข้าสู่ระบบ Google ก่อนดำเนินการ');
      return;
    }

    const confirmed = window.confirm(
      `คุณต้องการบันทึกข้อมูลทั้งหมด ${records.length} รายการลงใน Google Sheets (ชีต: ${DEFAULT_SHEET_NAME}) ใช่หรือไม่? ข้อมูลเดิมในชีตจะถูกอัปเดต`
    );
    if (!confirmed) return;

    try {
      setIsSyncing(true);
      setSyncError(null);
      const sheetName = spreadsheetInfo?.targetSheetName || DEFAULT_SHEET_NAME;
      await seedSpreadsheetWithData(DEFAULT_SPREADSHEET_ID, sheetName, records, token);
      setLastSyncedTime(new Date());
      showToast('บันทึกข้อมูลทั้งหมดลง Google Sheets สำเร็จแล้ว!');
    } catch (err: any) {
      console.error('Seed failed', err);
      setSyncError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูลลงชีต');
    } finally {
      setIsSyncing(false);
    }
  };

  // Initialize Firebase Auth listener on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        // Auto sync with sheets when user signs in
        syncWithGoogleSheets(token);
      },
      () => {
        setUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Save to localStorage whenever records change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [records]);

  // Unique list of branches
  const existingBranches = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.branch) set.add(r.branch.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Google Sign-In Handler
  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setSyncError(null);
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        await syncWithGoogleSheets(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign in error', err);
      setSyncError(err.message || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Logout Handler
  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    showToast('ออกจากระบบ Google แล้ว (ใช้งานในโหมดแคชในเครื่อง)');
  };

  // Add / Edit Record Handlers
  const handleOpenAddModal = () => {
    setEditingTemple(null);
    setIsFormModalOpen(true);
  };

  const handleEditRecord = (temple: TempleRecord) => {
    setEditingTemple(temple);
    setIsFormModalOpen(true);
  };

  // Save Record (New or Existing) - Writes to Google Sheets if signed in!
  const handleSaveRecord = async (savedTemple: TempleRecord) => {
    const isUpdating = records.some((r) => r.id === savedTemple.id);
    const token = await getAccessToken();

    // If user is connected to Google Sheets, write to Google Sheets
    if (token) {
      try {
        const sheetName = spreadsheetInfo?.targetSheetName || DEFAULT_SHEET_NAME;

        if (isUpdating && savedTemple.rowIndex) {
          // Mandatory confirmation for mutating Google Sheet data
          const confirmed = window.confirm(
            `ยืนยันการบันทึกการแก้ไขข้อมูล "${savedTemple.templeName}" ไปยัง Google Sheets (แถวที่ ${savedTemple.rowIndex}) หรือไม่?`
          );
          if (!confirmed) return;

          showToast('กำลังบันทึกลง Google Sheets...');
          await updateTempleRecordInSheet(
            DEFAULT_SPREADSHEET_ID,
            sheetName,
            savedTemple.rowIndex,
            savedTemple,
            token
          );
          showToast(`บันทึกการแก้ไข "${savedTemple.templeName}" ลง Google Sheets สำเร็จ!`);
        } else {
          showToast('กำลังเพิ่มข้อมูลใหม่ลง Google Sheets...');
          const newRow = await appendTempleRecordToSheet(
            DEFAULT_SPREADSHEET_ID,
            sheetName,
            savedTemple,
            token
          );
          if (newRow > 0) {
            savedTemple.rowIndex = newRow;
          }
          showToast(`เพิ่ม "${savedTemple.templeName}" ลง Google Sheets (แถวที่ ${newRow || 'ใหม่'}) สำเร็จ!`);
        }
      } catch (err: any) {
        console.error('Google Sheets write failed', err);
        alert(`บันทึกในเครื่องสำเร็จ แต่ไม่สามารถเขียนลง Google Sheets ได้: ${err.message}`);
      }
    } else {
      showToast('บันทึกลงหน่วยความจำเครื่องแล้ว (เข้าสู่ระบบ Google เพื่อซิงค์ลงชีตจริง)');
    }

    // Update local state
    setRecords((prev) => {
      const index = prev.findIndex((r) => r.id === savedTemple.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = savedTemple;
        return updated;
      } else {
        return [savedTemple, ...prev];
      }
    });

    setIsFormModalOpen(false);
    setEditingTemple(null);
    if (viewingTemple && viewingTemple.id === savedTemple.id) {
      setViewingTemple(savedTemple);
    }
  };

  // Update image directly
  const handleUpdateImage = async (templeId: string, newImageUrl: string) => {
    const temple = records.find((r) => r.id === templeId);
    if (!temple) return;

    const updated = { ...temple, imageUrl: newImageUrl };
    const token = await getAccessToken();

    if (token && temple.rowIndex) {
      try {
        const sheetName = spreadsheetInfo?.targetSheetName || DEFAULT_SHEET_NAME;
        await updateTempleRecordInSheet(
          DEFAULT_SPREADSHEET_ID,
          sheetName,
          temple.rowIndex,
          updated,
          token
        );
        showToast('อัปเดตรูปภาพลง Google Sheets แล้ว');
      } catch (e: any) {
        console.error('Failed to update image to sheet', e);
      }
    }

    setRecords((prev) => prev.map((r) => (r.id === templeId ? updated : r)));
    if (viewingTemple && viewingTemple.id === templeId) {
      setViewingTemple(updated);
    }
  };

  // Delete Record Handler - with Mandatory confirmation for destructive operations
  const handleDeleteRecord = async (id: string) => {
    const temple = records.find((r) => r.id === id);
    if (!temple) return;

    const rowNotice = temple.rowIndex ? ` (แถวที่ ${temple.rowIndex} ใน Google Sheets)` : '';
    const confirmed = window.confirm(
      `คุณต้องการลบข้อมูล "${temple.templeName}"${rowNotice} ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`
    );
    if (!confirmed) return;

    const token = await getAccessToken();
    if (token && temple.rowIndex && spreadsheetInfo?.targetSheetId !== undefined) {
      try {
        showToast('กำลังลบข้อมูลจาก Google Sheets...');
        await deleteTempleRecordFromSheet(
          DEFAULT_SPREADSHEET_ID,
          spreadsheetInfo.targetSheetId,
          temple.rowIndex,
          token
        );
        showToast(`ลบ "${temple.templeName}" จาก Google Sheets แล้ว`);
      } catch (err: any) {
        console.error('Delete from sheet failed', err);
        alert(`เกิดข้อผิดพลาดในการลบจาก Google Sheets: ${err.message}`);
      }
    }

    setRecords((prev) => prev.filter((r) => r.id !== id));
    if (viewingTemple && viewingTemple.id === id) {
      setViewingTemple(null);
    }
  };

  // Advance Step Handler
  // Advance Step Handler: sets next step date, then computes step based on non-empty values (1 to 8)
  const handleAdvanceStep = async (temple: TempleRecord) => {
    if (temple.stepNumber >= 8) return;

    const nextStepNum = temple.stepNumber + 1;
    const todayThai = getCurrentThaiDate();

    const updated = { ...temple };
    if (nextStepNum === 2 && !updated.dateStep2) updated.dateStep2 = todayThai;
    if (nextStepNum === 3 && !updated.dateStep3) updated.dateStep3 = todayThai;
    if (nextStepNum === 4 && !updated.dateStep4) updated.dateStep4 = todayThai;
    if (nextStepNum === 5 && !updated.dateStep5) updated.dateStep5 = todayThai;
    if (nextStepNum === 6 && !updated.dateStep6) updated.dateStep6 = todayThai;
    if (nextStepNum === 7 && !updated.dateStep7) updated.dateStep7 = todayThai;
    if (nextStepNum === 8 && !updated.dateStep8) updated.dateStep8 = todayThai;

    // เช็คค่าว่างในแต่ละขั้นตอน ถ้าไม่มีค่าว่างให้นับเป็น 1 จนถึง 8 ขั้นตอน
    const computed = computeStepFromDates({
      dateStep1: updated.dateStep1,
      dateStep2: updated.dateStep2,
      dateStep3: updated.dateStep3,
      dateStep4: updated.dateStep4,
      dateStep5: updated.dateStep5,
      dateStep6: updated.dateStep6,
      dateStep7: updated.dateStep7,
      dateStep8: updated.dateStep8,
    });

    updated.stepNumber = computed.stepNumber;
    updated.stepName = computed.stepName;
    updated.startDate = computed.startDate;
    updated.daysDuration = calculateDaysDuration(computed.startDate, new Date());

    const token = await getAccessToken();
    if (token && temple.rowIndex) {
      try {
        const sheetName = spreadsheetInfo?.targetSheetName || DEFAULT_SHEET_NAME;
        await updateTempleRecordInSheet(
          DEFAULT_SPREADSHEET_ID,
          sheetName,
          temple.rowIndex,
          updated,
          token
        );
        showToast(`เลื่อน "${temple.templeName}" สู่ขั้นที่ ${updated.stepNumber} ใน Google Sheets แล้ว`);
      } catch (e: any) {
        console.error('Failed to sync step advance to sheet', e);
      }
    }

    setRecords((prev) => prev.map((r) => (r.id === temple.id ? updated : r)));
    if (viewingTemple && viewingTemple.id === temple.id) {
      setViewingTemple(updated);
    }
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตข้อมูลทั้งหมดกลับเป็นข้อมูลเริ่มต้นจากชีต "รายละเอียดวัด"? (ข้อมูลที่แก้ไขจะถูกแทนที่)'
      )
    ) {
      const reset = INITIAL_TEMPLE_RECORDS.map((r, idx) => ({
        ...r,
        rowIndex: idx + 2,
        daysDuration: calculateDaysDuration(r.startDate, new Date()),
      }));
      setRecords(reset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
      showToast('รีเซ็ตข้อมูลในเครื่องกลับเป็นค่าเริ่มต้นแล้ว');
    }
  };

  const handleOpenImageViewer = (url: string, title: string, subtitle?: string) => {
    setImageViewerState({
      isOpen: true,
      url,
      title,
      subtitle,
    });
  };

  const handleCloseImageViewer = () => {
    setImageViewerState((prev) => ({ ...prev, isOpen: false, url: null }));
  };

  const handleSelectStepFromDashboard = (step: number | null) => {
    setSelectedStepFilter(step);
    if (step !== null) {
      setActiveTab('table');
    }
  };

  const handleSelectBranchFromDashboard = (branch: string | null) => {
    setSelectedBranchFilter(branch);
    if (branch !== null) {
      setActiveTab('table');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={handleOpenAddModal}
        totalCount={records.length}
        user={user}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
        isLoggingIn={isLoggingIn}
        isSyncing={isSyncing}
        onSync={() => syncWithGoogleSheets()}
        sheetConnected={!!user}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Google Sheets Real-time Synchronization Banner */}
        <SheetsSyncBanner
          user={user}
          sheetTitle={spreadsheetInfo?.title}
          isSyncing={isSyncing}
          lastSyncedTime={lastSyncedTime}
          onSync={() => syncWithGoogleSheets()}
          onSeedSheet={handleSeedSheet}
          onLogin={handleGoogleLogin}
          isLoggingIn={isLoggingIn}
          syncError={syncError}
          totalRecordsCount={records.length}
        />

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <DashboardStats
            records={records}
            onSelectStep={handleSelectStepFromDashboard}
            onSelectBranch={handleSelectBranchFromDashboard}
            onViewRecord={(temple) => setViewingTemple(temple)}
            selectedStep={selectedStepFilter}
            selectedBranch={selectedBranchFilter}
          />
        )}

        {activeTab === 'table' && (
          <TempleTable
            records={records}
            onViewRecord={(temple) => setViewingTemple(temple)}
            onEditRecord={handleEditRecord}
            onDeleteRecord={handleDeleteRecord}
            onAdvanceStep={handleAdvanceStep}
            onOpenAddModal={handleOpenAddModal}
            onResetData={handleResetData}
            onOpenImageViewer={handleOpenImageViewer}
            selectedStepFilter={selectedStepFilter}
            selectedBranchFilter={selectedBranchFilter}
            onStepFilterChange={setSelectedStepFilter}
            onBranchFilterChange={setSelectedBranchFilter}
          />
        )}

        {activeTab === 'kanban' && (
          <KanbanBoard
            records={records}
            onViewRecord={(temple) => setViewingTemple(temple)}
            onAdvanceStep={handleAdvanceStep}
            onOpenAddModal={handleOpenAddModal}
            onOpenImageViewer={handleOpenImageViewer}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/90 bg-white/95 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            ระบบติดตามงานขออนุญาตสร้างและตั้งวัด 8 ขั้นตอน · ฐานข้อมูล Google Sheets ID: {DEFAULT_SPREADSHEET_ID}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {user ? `เชื่อมต่อด้วยบัญชี: ${user.email}` : 'สามารถเข้าสู่ระบบ Google เพื่อบันทึกและซิงค์ชีตจริง'}
          </div>
        </div>
      </footer>

      {/* Add / Edit Temple Modal */}
      {isFormModalOpen && (
        <TempleFormModal
          temple={editingTemple}
          onSave={handleSaveRecord}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingTemple(null);
          }}
          existingBranches={existingBranches}
        />
      )}

      {/* Detailed View Modal */}
      {viewingTemple && (
        <TempleDetailModal
          temple={viewingTemple}
          onClose={() => setViewingTemple(null)}
          onEdit={(temple) => {
            setViewingTemple(null);
            handleEditRecord(temple);
          }}
          onAdvanceStep={handleAdvanceStep}
          onOpenImageViewer={handleOpenImageViewer}
          onUpdateImage={handleUpdateImage}
        />
      )}

      {/* Fullscreen Lightbox Image Viewer */}
      {imageViewerState.isOpen && (
        <ImageViewerModal
          url={imageViewerState.url}
          title={imageViewerState.title}
          subtitle={imageViewerState.subtitle}
          onClose={handleCloseImageViewer}
        />
      )}
    </div>
  );
}
