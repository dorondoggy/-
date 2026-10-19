import React, { useState } from 'react';
import { TempleRecord, WORKFLOW_STEPS } from '../types';
import { TempleImage } from './TempleImage';
import { ChevronRight, Eye, Search, Filter, Sparkles } from 'lucide-react';

interface KanbanBoardProps {
  records: TempleRecord[];
  onViewRecord: (record: TempleRecord) => void;
  onAdvanceStep: (record: TempleRecord) => void;
  onOpenAddModal: () => void;
  onOpenImageViewer: (url: string, title: string, subtitle?: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  records,
  onViewRecord,
  onAdvanceStep,
  onOpenAddModal,
  onOpenImageViewer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const branches = Array.from(new Set(records.map((r) => r.branch.trim()))).filter(Boolean).sort();

  const filteredRecords = records.filter((r) => {
    if (selectedBranch && r.branch !== selectedBranch) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        r.templeName.toLowerCase().includes(q) ||
        r.branch.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.note.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Board Controls */}
      <div className="bg-white/95 p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อวัดในบอร์ด 8 ขั้นตอน..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 shadow-2xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>สาขา:</span>
          </div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 shadow-2xs"
          >
            <option value="">ทุกสาขา ({records.length})</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 8 Columns Container (Horizontal Scroll) */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[2000px] items-start">
          {WORKFLOW_STEPS.map((step) => {
            const stepRecords = filteredRecords.filter((r) => r.stepNumber === step.number);

            return (
              <div
                key={step.number}
                className="w-[245px] shrink-0 bg-slate-100/70 rounded-2xl border border-slate-200/80 flex flex-col max-h-[calc(100vh-230px)] shadow-2xs overflow-hidden"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-200/80 bg-white shrink-0 relative">
                  <div className={`h-1 w-full absolute top-0 left-0 bg-gradient-to-r ${step.gradient}`} />
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold font-mono text-white bg-gradient-to-tr ${step.gradient} shadow-2xs`}
                      >
                        {step.number}
                      </span>
                      <h3 className="font-bold text-xs text-slate-900 truncate" title={step.name}>
                        {step.name}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
                      {stepRecords.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 truncate font-mono">
                    {step.fieldSource}
                  </p>
                </div>

                {/* Cards List */}
                <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
                  {stepRecords.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      ไม่มีรายการในขั้นตอนนี้
                    </div>
                  ) : (
                    stepRecords.map((temple) => {
                      const days = temple.daysDuration || 0;
                      let daysBadge = 'bg-slate-100 text-slate-700';
                      if (step.number >= 7) {
                        daysBadge = 'bg-emerald-100 text-emerald-800 font-bold';
                      } else if (days > 365) {
                        daysBadge = 'bg-rose-100 text-rose-800 font-bold';
                      } else if (days > 180) {
                        daysBadge = 'bg-amber-100 text-amber-800 font-semibold';
                      }

                      return (
                        <div
                          key={temple.id}
                          className="bg-white p-3 rounded-xl border border-slate-200/90 hover:border-sky-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5"
                        >
                          <div>
                            <div className="flex items-start gap-2.5 mb-2">
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
                              <div className="min-w-0 flex-1">
                                <h4
                                  onClick={() => onViewRecord(temple)}
                                  className="font-bold text-xs text-slate-900 group-hover:text-sky-700 cursor-pointer truncate transition-colors"
                                  title={temple.templeName}
                                >
                                  {temple.templeName}
                                </h4>
                                <div className="text-[10px] text-slate-500 mt-0.5 truncate font-medium">
                                  {temple.branch}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate">
                                  อ.{temple.district} {temple.subdistrict && `· ต.${temple.subdistrict}`}
                                </div>
                              </div>
                            </div>

                            {/* Note preview if any */}
                            {temple.note && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 line-clamp-2 italic mb-2">
                                {temple.note}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className={`px-2 py-0.5 rounded-md font-mono tabular-nums text-[10px] shadow-2xs ${daysBadge}`}>
                              {days} วัน
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => onViewRecord(temple)}
                                className="p-1 text-slate-400 hover:text-sky-700 rounded-md transition-colors cursor-pointer"
                                title="ดูรายละเอียด"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {temple.stepNumber < 8 && (
                                <button
                                  onClick={() => onAdvanceStep(temple)}
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-gradient-to-r from-sky-50 to-indigo-50 text-sky-800 hover:from-sky-100 hover:to-indigo-100 border border-sky-200/80 rounded-md text-[10px] font-semibold transition-all shadow-2xs cursor-pointer"
                                  title="เลื่อนสู่ขั้นถัดไป"
                                >
                                  <span>เลื่อน</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              )}
                              {temple.stepNumber === 8 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[9px] font-bold">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>สำเร็จ</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
