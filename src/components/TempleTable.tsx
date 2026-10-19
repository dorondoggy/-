import React, { useState, useMemo } from 'react';
import { TempleRecord, WORKFLOW_STEPS } from '../types';
import { TempleImage } from './TempleImage';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  ArrowUpDown, 
  ChevronRight, 
  RotateCcw,
  Plus
} from 'lucide-react';

interface TempleTableProps {
  records: TempleRecord[];
  onViewRecord: (record: TempleRecord) => void;
  onEditRecord: (record: TempleRecord) => void;
  onDeleteRecord: (id: string) => void;
  onAdvanceStep: (record: TempleRecord) => void;
  onOpenAddModal: () => void;
  onResetData: () => void;
  onOpenImageViewer: (url: string, title: string, subtitle?: string) => void;
  selectedStepFilter: number | null;
  selectedBranchFilter: string | null;
  onStepFilterChange: (step: number | null) => void;
  onBranchFilterChange: (branch: string | null) => void;
}

export const TempleTable: React.FC<TempleTableProps> = ({
  records,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  onAdvanceStep,
  onOpenAddModal,
  onResetData,
  onOpenImageViewer,
  selectedStepFilter,
  selectedBranchFilter,
  onStepFilterChange,
  onBranchFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [durationFilter, setDurationFilter] = useState<'all' | 'delayed-90' | 'delayed-180' | 'delayed-365'>('all');
  const [sortField, setSortField] = useState<'templeName' | 'stepNumber' | 'daysDuration' | 'startDate'>('stepNumber');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Extract unique branches
  const branches = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.branch) set.add(r.branch.trim());
    });
    return Array.from(set).sort();
  }, [records]);

  // Filtering
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      if (search) {
        const matchesName = r.templeName.toLowerCase().includes(search);
        const matchesBranch = r.branch.toLowerCase().includes(search);
        const matchesDistrict = r.district.toLowerCase().includes(search);
        const matchesSubdistrict = r.subdistrict.toLowerCase().includes(search);
        const matchesNote = r.note.toLowerCase().includes(search);
        if (!matchesName && !matchesBranch && !matchesDistrict && !matchesSubdistrict && !matchesNote) {
          return false;
        }
      }

      // Step Filter (1 - 8)
      if (selectedStepFilter !== null && r.stepNumber !== selectedStepFilter) {
        return false;
      }

      // Branch Filter
      if (selectedBranchFilter !== null && r.branch !== selectedBranchFilter) {
        return false;
      }

      // Duration Filter
      const days = r.daysDuration || 0;
      if (durationFilter === 'delayed-90' && days < 90) return false;
      if (durationFilter === 'delayed-180' && days < 180) return false;
      if (durationFilter === 'delayed-365' && days < 365) return false;

      return true;
    });
  }, [records, searchTerm, selectedStepFilter, selectedBranchFilter, durationFilter]);

  // Sorting
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let comp = 0;
      if (sortField === 'templeName') {
        comp = a.templeName.localeCompare(b.templeName, 'th');
      } else if (sortField === 'stepNumber') {
        comp = a.stepNumber - b.stepNumber;
      } else if (sortField === 'daysDuration') {
        comp = (a.daysDuration || 0) - (b.daysDuration || 0);
      } else {
        comp = a.id.localeCompare(b.id);
      }
      return sortAsc ? comp : -comp;
    });
  }, [filteredRecords, sortField, sortAsc]);

  const toggleSort = (field: 'templeName' | 'stepNumber' | 'daysDuration' | 'startDate') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Export CSV handler matching all 8 steps columns
  const handleExportCSV = () => {
    const headers = [
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

    const rows = sortedRecords.map((r) => [
      `"${r.branch || ''}"`,
      `"${r.templeName || ''}"`,
      `"${r.district || ''}"`,
      `"${r.subdistrict || ''}"`,
      `"${r.dateStep1 || ''}"`,
      `"${r.dateStep2 || ''}"`,
      `"${r.dateStep3 || ''}"`,
      `"${r.dateStep4 || ''}"`,
      `"${r.dateStep5 || ''}"`,
      `"${r.dateStep6 || ''}"`,
      `"${r.dateStep7 || ''}"`,
      `"${r.dateStep8 || ''}"`,
      r.stepNumber,
      `"${r.stepName || ''}"`,
      `"${r.startDate || ''}"`,
      r.daysDuration || 0,
      `"${(r.note || '').replace(/"/g, '""')}"`,
      `"${r.imageUrl || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายละเอียดวัด_8ขั้นตอน_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white/95 rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Control Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200/90 bg-gradient-to-r from-slate-50/90 via-sky-50/20 to-slate-50/90 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อวัด, สาขา, อำเภอ, ตำบล หรือหมายเหตุ..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-all cursor-pointer hover:border-slate-400"
              title="ส่งออกไฟล์ CSV โครงสร้าง 8 ขั้นตอน"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition-all cursor-pointer hover:border-slate-400"
              title="รีเซ็ตกลับเป็นข้อมูลชีตรายละเอียดวัดเดิม"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>คืนค่าเดิม</span>
            </button>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มวัด</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <div className="flex items-center gap-1 text-slate-500 mr-1 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>ตัวกรอง:</span>
          </div>

          {/* Branch Filter */}
          <select
            value={selectedBranchFilter || ''}
            onChange={(e) => onBranchFilterChange(e.target.value || null)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs focus:ring-1 focus:ring-sky-500 shadow-2xs"
          >
            <option value="">ทุกสาขา ({records.length})</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Step Filter (1 - 8) */}
          <select
            value={selectedStepFilter !== null ? selectedStepFilter : ''}
            onChange={(e) => onStepFilterChange(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs focus:ring-1 focus:ring-sky-500 shadow-2xs"
          >
            <option value="">ทุกขั้นตอน (1 - 8)</option>
            {WORKFLOW_STEPS.map((s) => (
              <option key={s.number} value={s.number}>
                ขั้นที่ {s.number}: {s.name} ({s.fieldSource})
              </option>
            ))}
          </select>

          {/* Duration Filter */}
          <select
            value={durationFilter}
            onChange={(e) => setDurationFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs focus:ring-1 focus:ring-sky-500 shadow-2xs"
          >
            <option value="all">ทุกระยะเวลา</option>
            <option value="delayed-90">เกิน 90 วัน (&gt; 3 เดือน)</option>
            <option value="delayed-180">เกิน 180 วัน (&gt; 6 เดือน)</option>
            <option value="delayed-365">เกิน 365 วัน (&gt; 1 ปี)</option>
          </select>

          {(selectedBranchFilter || selectedStepFilter !== null || durationFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                onBranchFilterChange(null);
                onStepFilterChange(null);
                setDurationFilter('all');
                setSearchTerm('');
              }}
              className="text-xs text-sky-700 hover:text-sky-800 underline font-semibold ml-2 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}

          <div className="ml-auto text-xs text-slate-500 font-mono">
            แสดง <span className="font-bold text-slate-900">{sortedRecords.length}</span> จาก {records.length} รายการ
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 text-xs font-semibold border-b border-slate-200">
              <th className="py-3 px-3 w-16 text-center">รูปภาพ</th>
              <th
                onClick={() => toggleSort('templeName')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>ชื่อวัด / ที่ตั้ง</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th
                onClick={() => toggleSort('stepNumber')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>ขั้นตอน (1-8)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">วันเริ่มขั้นตอนนี้</th>
              <th
                onClick={() => toggleSort('daysDuration')}
                className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>ระยะเวลา (วัน)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-3">ความคืบหน้า 8 ขั้น</th>
              <th className="py-3 px-3 max-w-xs">หมายเหตุ</th>
              <th className="py-3 px-3 text-center w-28">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-medium text-slate-600">ไม่พบรายการข้อมูลวัดที่ตรงกับเงื่อนไข</p>
                    <p className="text-xs text-slate-400">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedRecords.map((temple) => {
                const days = temple.daysDuration || 0;
                let durationColor = 'bg-slate-100 text-slate-700 border-slate-200';
                if (temple.stepNumber >= 7) {
                  durationColor = 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold';
                } else if (days > 365) {
                  durationColor = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
                } else if (days > 180) {
                  durationColor = 'bg-amber-50 text-amber-800 border-amber-200';
                } else {
                  durationColor = 'bg-sky-50 text-sky-700 border-sky-200';
                }

                return (
                  <tr
                    key={temple.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Image Thumbnail */}
                    <td className="py-2.5 px-3 text-center align-middle">
                      <TempleImage
                        url={temple.imageUrl}
                        alt={temple.templeName}
                        size="sm"
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
                    </td>

                    {/* Temple Name & Location */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                        {temple.templeName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-700 font-semibold">{temple.branch}</span>
                        <span>·</span>
                        <span>อ.{temple.district}</span>
                        {temple.subdistrict && (
                          <>
                            <span>·</span>
                            <span>ต.{temple.subdistrict}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Step Number & Name (1 - 8) */}
                    <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-white ${
                            temple.stepNumber === 8
                              ? 'bg-gradient-to-tr from-teal-500 to-emerald-600 shadow-2xs'
                              : temple.stepNumber === 7
                              ? 'bg-emerald-600'
                              : 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                          }`}
                        >
                          {temple.stepNumber}
                        </span>
                        <div>
                          <div className="font-bold text-slate-800 text-xs sm:text-sm">
                            {temple.stepName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ขั้น {temple.stepNumber} จาก 8
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Step Start Date */}
                    <td className="py-2.5 px-3 align-middle whitespace-nowrap">
                      <div className="text-xs font-mono tabular-nums text-slate-700 font-medium">
                        {temple.startDate || '-'}
                      </div>
                    </td>

                    {/* Days Elapsed Duration (Current Date - Start Date) */}
                    <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono tabular-nums border shadow-2xs ${durationColor}`}
                        title="คำนวณจากวันปัจจุบัน - วันที่เริ่มขั้นตอนนี้"
                      >
                        {days} วัน
                      </span>
                    </td>

                    {/* Mini 8-step progress dots */}
                    <td className="py-2.5 px-3 align-middle">
                      <div className="flex items-center gap-1" title={`ขั้นตอนปัจจุบัน: ${temple.stepNumber}/8`}>
                        {WORKFLOW_STEPS.map((s) => (
                          <div
                            key={s.number}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                              s.number < temple.stepNumber
                                ? 'bg-sky-600'
                                : s.number === temple.stepNumber
                                ? s.number === 8
                                  ? 'bg-teal-500 ring-2 ring-teal-300'
                                  : s.number === 7
                                  ? 'bg-emerald-600 ring-2 ring-emerald-300'
                                  : 'bg-sky-500 ring-2 ring-sky-300'
                                : 'bg-slate-200'
                            }`}
                            title={`ขั้นที่ ${s.number}: ${s.name} (${s.fieldSource})`}
                          />
                        ))}
                      </div>
                    </td>

                    {/* Note */}
                    <td className="py-2.5 px-3 align-middle max-w-xs">
                      {temple.note ? (
                        <p className="text-xs text-slate-600 truncate" title={temple.note}>
                          {temple.note}
                        </p>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewRecord(temple)}
                          className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                          title="ดูรายละเอียดและไทม์ไลน์ 8 ขั้นตอน"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditRecord(temple)}
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="แก้ไขข้อมูลวัด"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {temple.stepNumber < 8 && (
                          <button
                            onClick={() => onAdvanceStep(temple)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="เลื่อนสู่ขั้นตอนถัดไป"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onDeleteRecord(temple.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="ลบรายการ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
