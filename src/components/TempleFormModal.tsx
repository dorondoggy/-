import React, { useState, useRef } from 'react';
import { TempleRecord, WORKFLOW_STEPS } from '../types';
import { 
  X, 
  Save, 
  Image as ImageIcon, 
  Calendar, 
  Upload, 
  Link as LinkIcon, 
  Clock, 
  Trash2, 
  Sparkles, 
  CheckCircle, 
  FileCheck2,
  ExternalLink,
  HardDrive
} from 'lucide-react';
import { 
  formatThaiDate, 
  toISODateInput, 
  fromISODateInput, 
  calculateDaysDuration,
  getCurrentThaiDate,
  computeStepFromDates
} from '../utils/dateUtils';
import { getOptimizedImageUrl, processImageUpload } from '../utils/imageUtils';
import { DEFAULT_DRIVE_FOLDER_ID } from '../types';
import { uploadImageToGoogleDrive } from '../services/googleDrive';
import { getAccessToken, googleSignIn } from '../services/firebaseAuth';
import { TempleImage } from './TempleImage';
import { UploadSuccessModal, UploadSuccessData } from './UploadSuccessModal';

interface TempleFormModalProps {
  temple?: TempleRecord | null;
  onSave: (record: TempleRecord) => void;
  onClose: () => void;
  existingBranches: string[];
}

export const TempleFormModal: React.FC<TempleFormModalProps> = ({
  temple,
  onSave,
  onClose,
  existingBranches,
}) => {
  const isEditing = !!temple;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [branch, setBranch] = useState(temple?.branch || existingBranches[0] || 'สาขาราษีไศล');
  const [customBranch, setCustomBranch] = useState('');
  const [templeName, setTempleName] = useState(temple?.templeName || '');
  const [district, setDistrict] = useState(temple?.district || '');
  const [subdistrict, setSubdistrict] = useState(temple?.subdistrict || '');
  const [imageUrl, setImageUrl] = useState(temple?.imageUrl || '');
  const [note, setNote] = useState(temple?.note || '');
  const [isUploading, setIsUploading] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');

  // The 8 Step Dates
  const [dateStep1, setDateStep1] = useState(temple?.dateStep1 || '');
  const [dateStep2, setDateStep2] = useState(temple?.dateStep2 || '');
  const [dateStep3, setDateStep3] = useState(temple?.dateStep3 || '');
  const [dateStep4, setDateStep4] = useState(temple?.dateStep4 || '');
  const [dateStep5, setDateStep5] = useState(temple?.dateStep5 || '');
  const [dateStep6, setDateStep6] = useState(temple?.dateStep6 || '');
  const [dateStep7, setDateStep7] = useState(temple?.dateStep7 || '');
  const [dateStep8, setDateStep8] = useState(temple?.dateStep8 || '');

  // Current Step & Start Date
  const [stepNumber, setStepNumber] = useState<number>(temple?.stepNumber || 1);
  const [startDate, setStartDate] = useState(temple?.startDate || temple?.dateStep1 || getCurrentThaiDate());

  // Error state
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [successModalData, setSuccessModalData] = useState<UploadSuccessData | null>(null);

  // Handle file upload directly to Google Drive folder: 1thfbk1xvscShl1UWDPu-lluqtd6sZRum
  const handleProcessFile = async (file: File) => {
    try {
      setIsUploading(true);
      setErrorMsg('');
      setUploadStatus('กำลังตรวจสอบสิทธิ์การเข้าถึง Google Drive...');

      let token = await getAccessToken();

      // If token is not in memory, ask user to sign in to upload to Google Drive
      if (!token) {
        setUploadStatus('กำลังเปิดหน้าต่างเข้าสู่ระบบ Google เพื่ออัปโหลดเข้า Drive...');
        try {
          const authRes = await googleSignIn();
          if (authRes) {
            token = authRes.accessToken;
          }
        } catch (authErr) {
          console.warn('Google sign-in skipped or cancelled, using local fallback', authErr);
        }
      }

      if (token) {
        setUploadStatus(`กำลังอัปโหลดไปยัง Google Drive (โฟลเดอร์: ${DEFAULT_DRIVE_FOLDER_ID})...`);
        const result = await uploadImageToGoogleDrive(
          file,
          DEFAULT_DRIVE_FOLDER_ID,
          token,
          templeName.trim() || temple?.templeName || 'รูปวัด'
        );
        // Save the Google Drive direct URL / view link into imageUrl (which is stored in column Image)
        setImageUrl(result.webViewLink);
        setUploadStatus(`✓ อัปโหลดเข้า Google Drive สำเร็จ! (${result.fileName})`);
        
        // Open Success Popup Alert
        setSuccessModalData({
          fileName: result.fileName,
          url: result.webViewLink,
          folderId: DEFAULT_DRIVE_FOLDER_ID,
          templeName: templeName.trim() || temple?.templeName,
        });
      } else {
        // Fallback to local Base64 when not signed in
        setUploadStatus('กำลังประมวลผลรูปภาพ...');
        const base64 = await processImageUpload(file);
        setImageUrl(base64);
        setUploadStatus('✓ บันทึกรูปภาพในเครื่องเรียบร้อยแล้ว');
        
        // Open Success Popup Alert
        setSuccessModalData({
          fileName: file.name,
          url: base64,
          templeName: templeName.trim() || temple?.templeName,
        });
      }
    } catch (err: any) {
      console.error('Google Drive upload error', err);
      try {
        // Fallback to local base64 if network or permission error
        const base64 = await processImageUpload(file);
        setImageUrl(base64);
        setErrorMsg(`อัปโหลดเข้า Drive ขัดข้อง: ${err.message} (ระบบบันทึกรูปภาพสำรองไว้ให้แล้ว)`);
        setSuccessModalData({
          fileName: file.name,
          url: base64,
          templeName: templeName.trim() || temple?.templeName,
        });
      } catch (fallbackErr: any) {
        setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  // Real-time computed step based on non-empty values
  const computedStep = computeStepFromDates({
    dateStep1,
    dateStep2,
    dateStep3,
    dateStep4,
    dateStep5,
    dateStep6,
    dateStep7,
    dateStep8,
  });

  // Date changes for the 8 steps: checks empty values; if not empty, counts it from 1 to 8 steps
  const handleDateChange = (stepNum: number, isoValue: string) => {
    const thaiDate = isoValue ? fromISODateInput(isoValue) : '';
    
    const d1 = stepNum === 1 ? thaiDate : dateStep1;
    const d2 = stepNum === 2 ? thaiDate : dateStep2;
    const d3 = stepNum === 3 ? thaiDate : dateStep3;
    const d4 = stepNum === 4 ? thaiDate : dateStep4;
    const d5 = stepNum === 5 ? thaiDate : dateStep5;
    const d6 = stepNum === 6 ? thaiDate : dateStep6;
    const d7 = stepNum === 7 ? thaiDate : dateStep7;
    const d8 = stepNum === 8 ? thaiDate : dateStep8;

    if (stepNum === 1) setDateStep1(thaiDate);
    if (stepNum === 2) setDateStep2(thaiDate);
    if (stepNum === 3) setDateStep3(thaiDate);
    if (stepNum === 4) setDateStep4(thaiDate);
    if (stepNum === 5) setDateStep5(thaiDate);
    if (stepNum === 6) setDateStep6(thaiDate);
    if (stepNum === 7) setDateStep7(thaiDate);
    if (stepNum === 8) setDateStep8(thaiDate);

    // Auto calculate step number by checking non-empty values (1 to 8)
    const computed = computeStepFromDates({
      dateStep1: d1,
      dateStep2: d2,
      dateStep3: d3,
      dateStep4: d4,
      dateStep5: d5,
      dateStep6: d6,
      dateStep7: d7,
      dateStep8: d8,
    });

    setStepNumber(computed.stepNumber);
    setStartDate(computed.startDate);
  };

  const handleStepSelect = (num: number) => {
    setStepNumber(num);
    const dateMap: Record<number, string> = {
      1: dateStep1,
      2: dateStep2,
      3: dateStep3,
      4: dateStep4,
      5: dateStep5,
      6: dateStep6,
      7: dateStep7,
      8: dateStep8,
    };
    if (dateMap[num]) {
      setStartDate(dateMap[num]);
    }
  };

  // Real-time calculation: วันปัจจุบัน - วันที่เริ่มขั้นตอน
  const calculatedDays = calculateDaysDuration(startDate, new Date());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templeName.trim()) {
      setErrorMsg('กรุณากรอกชื่อวัด');
      return;
    }

    const finalBranch = branch === '__custom__' ? customBranch.trim() : branch;
    if (!finalBranch) {
      setErrorMsg('กรุณาระบุสาขา');
      return;
    }

    const currentStepObj = WORKFLOW_STEPS.find((s) => s.number === stepNumber);
    const stepName = currentStepObj ? currentStepObj.name : `ขั้นตอนที่ ${stepNumber}`;

    const record: TempleRecord = {
      id: temple?.id || `temple-${Date.now()}`,
      rowIndex: temple?.rowIndex,
      branch: finalBranch,
      templeName: templeName.trim(),
      district: district.trim(),
      subdistrict: subdistrict.trim(),
      dateStep1: dateStep1.trim(),
      dateStep2: dateStep2.trim(),
      dateStep3: dateStep3.trim(),
      dateStep4: dateStep4.trim(),
      dateStep5: dateStep5.trim(),
      dateStep6: dateStep6.trim(),
      dateStep7: dateStep7.trim(),
      dateStep8: dateStep8.trim(),
      stepNumber,
      stepName,
      startDate: startDate.trim() || getCurrentThaiDate(),
      daysDuration: calculatedDays,
      note: note.trim(),
      imageUrl: imageUrl.trim(),
    };

    onSave(record);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col ring-1 ring-slate-900/5">
        {/* Futuristic Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-indigo-500 via-purple-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-slate-900">
                {isEditing ? 'แก้ไขข้อมูลวัดและขั้นตอน' : 'บันทึกข้อมูลการขออนุญาตตั้งวัดใหม่'}
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-xs">
                8 ขั้นตอน
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ฐานข้อมูลชีต: รายละเอียดวัด · รองรับการอัปโหลดรูปภาพและคำนวณวันแบบเรียลไทม์
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
              <span className="font-bold">แจ้งเตือน:</span> {errorMsg}
            </div>
          )}

          {/* Section 1: Basic Information & Image Upload */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100 flex items-center gap-1.5">
              <span>1. ข้อมูลทั่วไปและรูปภาพประกอบ</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Branch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สาขา / สำนักงาน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {existingBranches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="__custom__">+ ระบุสาขาใหม่...</option>
                </select>
                {branch === '__custom__' && (
                  <input
                    type="text"
                    value={customBranch}
                    onChange={(e) => setCustomBranch(e.target.value)}
                    placeholder="พิมพ์ชื่อสาขาใหม่..."
                    className="mt-2 w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    required
                  />
                )}
              </div>

              {/* Temple Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อวัด <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={templeName}
                  onChange={(e) => setTempleName(e.target.value)}
                  placeholder="เช่น วัดดวนน้อย, วัดหนองพังสามัคคี"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none font-medium"
                  required
                />
              </div>

              {/* District */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อำเภอ
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="เช่น ราษีไศล, ขุขันธ์, ไพรบึง"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Subdistrict */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ตำบล
                </label>
                <input
                  type="text"
                  value={subdistrict}
                  onChange={(e) => setSubdistrict(e.target.value)}
                  placeholder="เช่น เมืองแคน, ปราสาทเยอ"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modern Image Upload & URL Management - Stored in Column 'Image' */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-sky-600" />
                    <span>ช่อง Image: รูปภาพวัด / เอกสาร</span>
                  </label>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                    บันทึกลงคอลัมน์ Image
                  </span>
                </div>
                
                {/* Mode Selector */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      imageTab === 'upload'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3 h-3 inline mr-1" />
                    อัปโหลดไฟล์รูป
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      imageTab === 'url'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3 h-3 inline mr-1" />
                    ใส่ URL / Google Drive
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {/* Upload or URL input area */}
                <div className="flex-1 w-full">
                  {/* Google Drive Destination Folder Notice */}
                  <div className="mb-2.5 px-3 py-2 rounded-xl bg-sky-50/90 border border-sky-200/90 flex items-center justify-between gap-2 flex-wrap text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 text-sky-950">
                      <HardDrive className="w-4 h-4 text-sky-600 shrink-0" />
                      <span className="font-medium">โฟลเดอร์ Google Drive:</span>
                      <span className="font-mono font-bold text-sky-800 bg-white px-2 py-0.5 rounded border border-sky-200 text-[11px]">
                        {DEFAULT_DRIVE_FOLDER_ID}
                      </span>
                    </div>
                    <a
                      href={`https://drive.google.com/drive/folders/${DEFAULT_DRIVE_FOLDER_ID}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-700 hover:text-sky-900 font-semibold underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>เปิดโฟลเดอร์</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {imageTab === 'upload' ? (
                    <div>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-sky-300/80 hover:border-sky-500 bg-white/80 hover:bg-sky-50/40 p-4 rounded-xl text-center cursor-pointer transition-all duration-200 group relative"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">
                          {isUploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากรูปมาวางที่นี่'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          รูปจะถูกอัปโหลดขึ้นโฟลเดอร์ Google Drive ({DEFAULT_DRIVE_FOLDER_ID}) และบันทึกลิงก์ลงช่อง Image
                        </p>

                        {uploadStatus && (
                          <div className="mt-2 text-xs font-medium text-sky-700 bg-sky-50/90 py-1 px-2.5 rounded-lg border border-sky-200 inline-block animate-pulse">
                            {uploadStatus}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="url"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="https://drive.google.com/uc?id=... หรือ URL รูปภาพ"
                        className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        รองรับลิงก์ Google Drive และ Web Image URL โดยจะบันทึกในช่อง Image
                      </p>
                    </div>
                  )}

                  {imageUrl && (
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>มีรูปภาพพร้อมเก็บในช่อง Image ({imageUrl.startsWith('data:') ? 'ไฟล์รูปภาพ Base64' : 'URL รูปภาพ'})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ลบรูปภาพ</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Preview Thumbnail */}
                <div className="shrink-0 flex flex-col items-center">
                  <TempleImage
                    url={imageUrl}
                    alt={templeName || 'รูปตัวอย่าง'}
                    size="lg"
                    className="shadow-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">ช่อง Image</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: The 8 Workflow Steps Dates */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>2. วันที่ดำเนินการทั้ง 8 ขั้นตอน (เช็คค่าว่าง 1 ถึง 8 ขั้น)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                ไม่มีค่าว่างจะนับเป็น 1 จนถึง 8 ขั้นตอน
              </span>
            </div>

            {/* Dynamic Empty Check Indicator Banner */}
            <div className="p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-md border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 border border-indigo-400/40 flex items-center justify-center font-extrabold text-base text-white font-mono shadow-xs">
                  {computedStep.completedStepsCount}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>เช็คค่าว่าง: ดำเนินการแล้ว {computedStep.completedStepsCount} จาก 8 ขั้นตอน</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold">
                      {computedStep.completedStepsCount === 8 ? 'เสร็จสิ้น 100%' : `ขั้นที่ ${computedStep.stepNumber}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    สถานะขั้นตอน: <span className="font-semibold text-sky-300">{computedStep.stepName}</span>
                  </div>
                </div>
              </div>

              {/* 8-step pill buttons */}
              <div className="flex items-center gap-1">
                {computedStep.stepDetails.map((detail) => (
                  <button
                    key={detail.stepNumber}
                    type="button"
                    onClick={() => handleStepSelect(detail.stepNumber)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold font-mono flex items-center justify-center transition-all cursor-pointer ${
                      detail.isFilled
                        ? 'bg-emerald-500 text-white shadow-xs hover:bg-emerald-600 ring-1 ring-emerald-300'
                        : detail.stepNumber === computedStep.stepNumber
                        ? 'bg-sky-600 text-white ring-2 ring-sky-300'
                        : 'bg-slate-800/80 text-slate-500 border border-slate-700 hover:text-slate-300'
                    }`}
                    title={`ขั้นที่ ${detail.stepNumber}: ${detail.name} (${detail.fieldSource}) - ${
                      detail.isFilled ? 'ไม่มีค่าว่าง (นับแล้ว)' : 'ยังว่างอยู่'
                    }`}
                  >
                    {detail.stepNumber}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Step 1: วันรับคำขอ (ใช้วันที่ลงทะเบียน) */}
              <div className="p-3 rounded-xl border border-sky-200/90 bg-sky-50/40 hover:bg-sky-50/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-sky-900 block">
                      ขั้นที่ 1: วันรับคำขอ
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ช่อง: วันที่ลงทะเบียน)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dateStep1 ? (
                      <>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ นับแล้ว
                        </span>
                        <span className="text-xs font-medium text-sky-700 bg-white px-2 py-0.5 rounded-md border border-sky-200 font-mono">
                          {dateStep1}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ○ ว่าง
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={toISODateInput(dateStep1)}
                  onChange={(e) => handleDateChange(1, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Step 2: สอบถามความเห็นอำเภอ (ใช้วันที่สอบถาม) */}
              <div className="p-3 rounded-xl border border-indigo-200/90 bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 block">
                      ขั้นที่ 2: สอบถามความเห็นอำเภอ
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ช่อง: วันที่สอบถาม)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dateStep2 ? (
                      <>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ นับแล้ว
                        </span>
                        <span className="text-xs font-medium text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-mono">
                          {dateStep2}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ○ ว่าง
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={toISODateInput(dateStep2)}
                  onChange={(e) => handleDateChange(2, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Step 3: ส่งจังหวัด/กลุ่มงานวิชาการที่ดิน (ใช้วันส่ง) */}
              <div className="p-3 rounded-xl border border-violet-200/90 bg-violet-50/40 hover:bg-violet-50/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-violet-900 block">
                      ขั้นที่ 3: ส่งจังหวัด/กลุ่มงานวิชาการที่ดิน
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ช่อง: วันส่ง)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dateStep3 ? (
                      <>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ นับแล้ว
                        </span>
                        <span className="text-xs font-medium text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200 font-mono">
                          {dateStep3}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ○ ว่าง
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={toISODateInput(dateStep3)}
                  onChange={(e) => handleDateChange(3, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-violet-500"
                />
              </div>

              {/* Step 4: ตรวจสอบทะเบียนวัด (ใช้วันที่ตรวจสอบ) */}
              <div className="p-3 rounded-xl border border-pink-200/90 bg-pink-50/40 hover:bg-pink-50/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-pink-900 block">
                      ขั้นที่ 4: ตรวจสอบทะเบียนวัด
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ช่อง: วันที่ตรวจสอบ)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dateStep4 ? (
                      <>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ นับแล้ว
                        </span>
                        <span className="text-xs font-medium text-pink-700 bg-white px-2 py-0.5 rounded-md border border-pink-200 font-mono">
                          {dateStep4}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ○ ว่าง
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={toISODateInput(dateStep4)}
                  onChange={(e) => handleDateChange(4, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* Step 5: เสนอผู้ว่าราชการจังหวัด (ใช้วันที่เสนอ) */}
              <div className="p-3 rounded-xl border border-amber-200/90 bg-amber-50/40 hover:bg-amber-50/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      ขั้นที่ 5: เสนอผู้ว่าราชการจังหวัด
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ช่อง: วันที่เสนอ)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dateStep5 ? (
                      <>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ นับแล้ว
                        </span>
                        <span className="text-xs font-medium text-amber-800 bg-white px-2 py-0.5 rounded-md border border-amber-200 font-mono">
                          {dateStep5}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ○ ว่าง
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={toISODateInput(dateStep5)}
                  onChange={(e) => handleDateChange(5, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Step 6: รายงานผลการอนุญาต (ใช้วันที่เสนอผล) */}
              <div className="p-3 rounded-xl border border-yellow-200/90 bg-yellow-50/40 hover:bg-yellow-50/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-yellow-900 block">
                      ขั้นที่ 6: รายงานผลการอนุญาต
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ช่อง: วันที่เสนอผล)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dateStep6 ? (
                      <>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ นับแล้ว
                        </span>
                        <span className="text-xs font-medium text-yellow-800 bg-white px-2 py-0.5 rounded-md border border-yellow-200 font-mono">
                          {dateStep6}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ○ ว่าง
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={toISODateInput(dateStep6)}
                  onChange={(e) => handleDateChange(6, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-yellow-500"
                />
              </div>

              {/* Step 7: จดทะเบียน (ใช้วันที่จดทะเบียน) */}
              <div className="p-3 rounded-xl border border-emerald-200/90 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">
                      ขั้นที่ 7: จดทะเบียน
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ช่อง: วันที่จดทะเบียน)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dateStep7 ? (
                      <>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ นับแล้ว
                        </span>
                        <span className="text-xs font-medium text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 font-mono">
                          {dateStep7}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ○ ว่าง
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={toISODateInput(dateStep7)}
                  onChange={(e) => handleDateChange(7, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Step 8: รายงานผลการจดทะเบียน (ใช้วันที่รายงานผล) */}
              <div className="p-3 rounded-xl border border-teal-300 bg-gradient-to-br from-teal-50/60 to-emerald-50/60 hover:from-teal-50 hover:to-emerald-50 transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-teal-900 block flex items-center gap-1">
                      <span>ขั้นที่ 8: รายงานผลการจดทะเบียน</span>
                      <Sparkles className="w-3 h-3 text-teal-600" />
                    </span>
                    <span className="text-[10px] text-slate-500">
                      (ช่อง: วันที่รายงานผล - ขั้นตอนเสร็จสมบูรณ์)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {dateStep8 ? (
                      <>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                          ✓ นับแล้ว
                        </span>
                        <span className="text-xs font-semibold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-300 font-mono">
                          {dateStep8}
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        ○ ว่าง
                      </span>
                    )}
                  </div>
                </div>
                <input
                  type="date"
                  value={toISODateInput(dateStep8)}
                  onChange={(e) => handleDateChange(8, e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-teal-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Current Status & Real-time Duration */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
              3. สถานะปัจจุบันและการคำนวณระยะเวลา
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Step Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ลำดับขั้นตอนปัจจุบัน (1 - 8)
                </label>
                <select
                  value={stepNumber}
                  onChange={(e) => handleStepSelect(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  {WORKFLOW_STEPS.map((s) => (
                    <option key={s.number} value={s.number}>
                      ขั้นที่ {s.number}: {s.name} ({s.fieldSource})
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date of current step */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  วันเริ่มขั้นตอนปัจจุบัน (วันเริ่ม)
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={toISODateInput(startDate)}
                    onChange={(e) => setStartDate(fromISODateInput(e.target.value))}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="text"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    placeholder="21 มี.ค. 2568"
                    className="w-28 px-2 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Dimensional Real-time Duration Card */}
            <div className="relative overflow-hidden p-4 bg-gradient-to-r from-sky-50 via-indigo-50/60 to-purple-50 border border-sky-200/80 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    ระยะเวลาในขั้นตอนปัจจุบัน (คำนวณแบบเรียลไทม์)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    วันปัจจุบัน ({formatThaiDate(new Date())}) - วันเริ่ม ({startDate || '-'})
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-3xl font-extrabold font-mono tabular-nums text-sky-900">
                  {calculatedDays}
                </span>
                <span className="text-xs text-sky-800 ml-1 font-medium">วัน</span>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                หมายเหตุ / ผลการตรวจสอบและประสานงาน
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="ระบุข้อเท็จจริง เช่น หารือกรมที่ดิน, ตรวจสอบเรื่องเพื่อเสนอผู้ว่าฯ พิจารณา, ฯลฯ"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 active:from-sky-800 active:to-indigo-800 rounded-xl shadow-md transition-all hover:shadow-lg cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลวัด'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Upload Success Popup Notification */}
      {successModalData && (
        <UploadSuccessModal
          data={successModalData}
          onClose={() => setSuccessModalData(null)}
        />
      )}
    </div>
  );
};
