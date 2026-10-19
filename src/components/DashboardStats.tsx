import React from 'react';
import { TempleRecord, WORKFLOW_STEPS } from '../types';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  MapPin,
  Layers,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { TempleImage } from './TempleImage';

interface DashboardStatsProps {
  records: TempleRecord[];
  onSelectStep: (stepNumber: number | null) => void;
  onSelectBranch: (branch: string | null) => void;
  onViewRecord: (record: TempleRecord) => void;
  selectedStep: number | null;
  selectedBranch: string | null;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  records,
  onSelectStep,
  onSelectBranch,
  onViewRecord,
  selectedStep,
  selectedBranch,
}) => {
  const totalRecords = records.length;
  // Step 7 or 8 are registered/completed
  const registeredRecords = records.filter((r) => r.stepNumber >= 7).length;
  const inProgressRecords = records.filter((r) => r.stepNumber < 7).length;

  // Overdue / Long running items (> 180 days)
  const delayedRecords = records.filter((r) => (r.daysDuration || 0) > 180);

  // Average duration
  const totalDays = records.reduce((acc, curr) => acc + (curr.daysDuration || 0), 0);
  const avgDays = totalRecords > 0 ? Math.round(totalDays / totalRecords) : 0;

  // Breakdown by 8 steps
  const stepCounts = WORKFLOW_STEPS.map((step) => {
    const matched = records.filter((r) => r.stepNumber === step.number);
    const avgStepDays =
      matched.length > 0
        ? Math.round(
            matched.reduce((acc, r) => acc + (r.daysDuration || 0), 0) / matched.length
          )
        : 0;
    return {
      step,
      count: matched.length,
      percentage: totalRecords > 0 ? Math.round((matched.length / totalRecords) * 100) : 0,
      avgDays: avgStepDays,
      records: matched,
    };
  });

  // Breakdown by branch
  const branchMap: Record<string, number> = {};
  records.forEach((r) => {
    const b = r.branch.trim() || 'ไม่ระบุ';
    branchMap[b] = (branchMap[b] || 0) + 1;
  });
  const branchList = Object.entries(branchMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* 4 Dimensional Futuristic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total */}
        <div className="relative overflow-hidden bg-white/95 rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-sky-400/10 via-sky-300/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              จำนวนวัดทั้งหมดในระบบ
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
              {totalRecords}
            </span>
            <span className="text-xs font-semibold text-slate-500">แห่ง</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>ฐานข้อมูลรายละเอียดวัด จ.ศรีสะเกษ</span>
            <span className="text-[10px] font-mono text-sky-700 font-semibold">8 ขั้นตอน</span>
          </div>
        </div>

        {/* Metric 2: Registered */}
        <div className="relative overflow-hidden bg-white/95 rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-emerald-400/15 via-teal-300/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              จดทะเบียน / รายงานผล
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-emerald-600">
              {registeredRecords}
            </span>
            <span className="text-xs text-slate-500">
              แห่ง ({totalRecords > 0 ? Math.round((registeredRecords / totalRecords) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            ขั้นที่ 7 (จดทะเบียน) & ขั้นที่ 8 (รายงานผล)
          </div>
        </div>

        {/* Metric 3: In Progress */}
        <div className="relative overflow-hidden bg-white/95 rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-amber-400/15 via-orange-300/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              อยู่ระหว่างดำเนินการ
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-amber-600">
              {inProgressRecords}
            </span>
            <span className="text-xs text-slate-500">
              แห่ง ({totalRecords > 0 ? Math.round((inProgressRecords / totalRecords) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            ขั้นตอนที่ 1 ถึง 6
          </div>
        </div>

        {/* Metric 4: Average Days */}
        <div className="relative overflow-hidden bg-white/95 rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-purple-400/15 via-indigo-300/5 to-transparent rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              ระยะเวลาเฉลี่ยในขั้นตอน
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-slate-900">
              {avgDays}
            </span>
            <span className="text-xs text-slate-500">วัน</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-rose-600 font-bold">{delayedRecords.length} แห่ง</span>
            <span>ดำเนินการนาน &gt; 180 วัน</span>
          </div>
        </div>
      </div>

      {/* Modern 8-Step Dimensional Pipeline Visualizer */}
      <div className="bg-white/95 rounded-2xl border border-slate-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              <span>ภาพรวมความคืบหน้าการดำเนินงานทั้ง 8 ขั้นตอน</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกขั้นตอนใดเพื่อกรองดูรายการวัดและรายละเอียดแบบเรียลไทม์
            </p>
          </div>
          {selectedStep !== null && (
            <button
              onClick={() => onSelectStep(null)}
              className="text-xs text-sky-700 hover:text-sky-800 font-semibold underline self-start sm:self-auto cursor-pointer"
            >
              แสดงทุกขั้นตอน (ล้างตัวกรอง)
            </button>
          )}
        </div>

        {/* 8 Step Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-4">
          {stepCounts.map(({ step, count, percentage, avgDays }) => {
            const isSelected = selectedStep === step.number;
            return (
              <button
                key={step.number}
                onClick={() => onSelectStep(isSelected ? null : step.number)}
                className={`group relative text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/20 shadow-md -translate-y-0.5'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-xs'
                }`}
              >
                {/* Step Header */}
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono text-white bg-gradient-to-tr ${step.gradient} shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      {step.number}
                    </span>
                    <span className="text-[10px] font-mono tabular-nums text-slate-400 font-semibold">
                      {percentage}%
                    </span>
                  </div>

                  <h3 className="font-bold text-xs text-slate-900 mt-2 line-clamp-2 leading-tight">
                    {step.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                    {step.fieldSource}
                  </p>
                </div>

                {/* Step Count & Duration */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-extrabold font-mono tabular-nums text-slate-900">
                      {count}
                    </span>
                    <span className="text-[10px] text-slate-400">แห่ง</span>
                  </div>
                  {count > 0 && (
                    <span className="text-[10px] font-mono text-slate-400" title={`เฉลี่ย ${avgDays} วัน`}>
                      ~{avgDays}ว.
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Branch Distribution & Attention Needed Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Branch Distribution */}
        <div className="lg:col-span-5 bg-white/95 rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-600" />
              <span>การกระจายตามสาขา / สำนักงาน</span>
            </h2>
            {selectedBranch && (
              <button
                onClick={() => onSelectBranch(null)}
                className="text-xs text-sky-700 hover:text-sky-800 underline cursor-pointer"
              >
                ดูทุกสาขา
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {branchList.map(([branch, count]) => {
              const isSelected = selectedBranch === branch;
              const percent = totalRecords > 0 ? (count / totalRecords) * 100 : 0;
              return (
                <button
                  key={branch}
                  onClick={() => onSelectBranch(isSelected ? null : branch)}
                  className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-sky-500 bg-sky-50/80 font-semibold shadow-xs'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-800 font-medium truncate max-w-[70%]">
                      {branch}
                    </span>
                    <span className="font-mono tabular-nums text-slate-700 font-bold">
                      {count} แห่ง ({Math.round(percent)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isSelected
                          ? 'bg-gradient-to-r from-sky-500 to-indigo-600'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Attention Needed */}
        <div className="lg:col-span-7 bg-white/95 rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-900">
                รายการที่รอดำเนินการนาน (เกิน 180 วัน)
              </h2>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              {delayedRecords.length} แห่ง
            </span>
          </div>

          <div className="mt-3 divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
            {delayedRecords
              .sort((a, b) => (b.daysDuration || 0) - (a.daysDuration || 0))
              .slice(0, 8)
              .map((temple) => (
                <div
                  key={temple.id}
                  onClick={() => onViewRecord(temple)}
                  className="py-3 flex items-start justify-between gap-3 hover:bg-slate-50/80 p-2 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <TempleImage
                      url={temple.imageUrl}
                      alt={temple.templeName}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors truncate">
                          {temple.templeName}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold shrink-0">
                          ขั้น {temple.stepNumber}: {temple.stepName}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-slate-700">{temple.branch}</span>
                        <span>·</span>
                        <span>อ.{temple.district}</span>
                        {temple.subdistrict && (
                          <>
                            <span>·</span>
                            <span>ต.{temple.subdistrict}</span>
                          </>
                        )}
                      </div>
                      {temple.note && (
                        <p className="text-xs text-amber-900 mt-1 line-clamp-1 italic bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          {temple.note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-mono font-bold text-xs tabular-nums shadow-2xs">
                      {temple.daysDuration} วัน
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1">
                      เริ่ม {temple.startDate}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
