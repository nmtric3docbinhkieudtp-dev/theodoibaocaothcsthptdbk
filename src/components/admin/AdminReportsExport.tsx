import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { ExportService } from '../../services/exportService';
import { 
  aggregatePeriodReportData, 
  PeriodConsolidationResult,
  ConsolidatedDynamicTableRow 
} from '../../utils/consolidationHelper';
import { HOMEROOM_ROSTER_53, OFFICIAL_DEPARTMENTS } from '../../data/staffRoster';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Filter, 
  Calendar, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  FileCheck, 
  Sparkles, 
  School, 
  AlertCircle, 
  Users, 
  Layers, 
  ChevronRight, 
  Phone,
  Search,
  Check,
  Copy,
  Clock,
  Star,
  Eye,
  Send,
  BarChart3,
  Table as TableIcon,
  CheckSquare,
  X,
  ChevronDown,
  UserX,
  HelpCircle,
  Info,
  Radio,
  ListOrdered,
  Paperclip,
  Maximize2
} from 'lucide-react';
import { ReportSubmission, CustomFormField, CustomDynamicTable } from '../../types';

interface AdminReportsExportProps {
  onOpenConsolidation?: (periodId?: string) => void;
  onOpenDetail?: (submission: ReportSubmission) => void;
}

export const AdminReportsExport: React.FC<AdminReportsExportProps> = ({
  onOpenConsolidation,
  onOpenDetail
}) => {
  const { currentUser, isPrincipal, isAdmin, allUsers } = useAuth();
  const { submissions = [], periods = [], departments = [], schoolInfo } = useReports();

  // 1. STRICT PERIOD SELECTION - Default to the first available period or homeroom period
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    if (periods.length === 0) return '';
    const homeroom = periods.find(p => p.id.includes('gvcn') || p.title.toLowerCase().includes('chủ nhiệm') || p.title.toLowerCase().includes('tập trung'));
    return homeroom?.id || periods[0]?.id || '';
  });

  // Ensure valid selectedPeriodId if periods change
  const activePeriod = useMemo(() => {
    if (!selectedPeriodId && periods.length > 0) return periods[0];
    return periods.find(p => p.id === selectedPeriodId) || periods[0] || null;
  }, [periods, selectedPeriodId]);

  // Keep state in sync if activePeriod was defaulted
  React.useEffect(() => {
    if (activePeriod && activePeriod.id !== selectedPeriodId) {
      setSelectedPeriodId(activePeriod.id);
    }
  }, [activePeriod, selectedPeriodId]);

  // 2. STRICT PERIOD SUBMISSIONS - ONLY submissions belonging strictly to this period!
  const periodSubmissions = useMemo(() => {
    if (!activePeriod) return [];
    return submissions.filter(s => s.periodId === activePeriod.id);
  }, [submissions, activePeriod]);

  // Consolidated data for this active period
  const consolidatedData: PeriodConsolidationResult = useMemo(() => {
    return aggregatePeriodReportData(activePeriod, submissions, allUsers);
  }, [activePeriod, submissions, allUsers]);

  // Sub-tabs navigation
  const isHomeroomPeriod = useMemo(() => {
    if (!activePeriod) return false;
    return activePeriod.targetAudience === 'homeroom_teachers' ||
      activePeriod.title.toLowerCase().includes('chủ nhiệm') ||
      activePeriod.title.toLowerCase().includes('53 lớp') ||
      periodSubmissions.some(s => s.isHomeroomReport);
  }, [activePeriod, periodSubmissions]);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'questions' | 'matrix' | 'tables' | 'submissions' | 'homeroom'>('questions');

  // When active period changes, adjust tab sensibly if homeroom tab was active on a non-homeroom period
  React.useEffect(() => {
    if (!isHomeroomPeriod && activeTab === 'homeroom') {
      setActiveTab('questions');
    }
  }, [isHomeroomPeriod, activeTab]);

  // Inspection drawer state for quick reading within tab
  const [inspectedSubmission, setInspectedSubmission] = useState<ReportSubmission | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | 'submitted' | 'pending' | 'late'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Loading states
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  // Copy helper
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Restrict access
  if (!isAdmin && !isPrincipal) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-xs max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Quyền Truy Cập Dành Riêng Cho Quản Trị Viên</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Trung tâm xuất & tổng hợp dữ liệu báo cáo dành riêng cho Ban Giám hiệu và Quản trị viên nhà trường để xem kết quả và trích xuất số liệu.
          </p>
        </div>
      </div>
    );
  }

  // If no periods exist
  if (periods.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-4 shadow-xs max-w-lg mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900">Chưa Có Đợt Báo Cáo Nào</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Hệ thống hiện tại chưa có đợt báo cáo nào được ban hành. Vui lòng tạo đợt báo cáo mới ở tab &quot;Quản Lý Đợt Báo Cáo&quot;.
          </p>
        </div>
      </div>
    );
  }

  // 3. TARGET AUDIENCE & UN-SUBMITTED COMPUTATION FOR THIS STRICT PERIOD
  const targetInfo = useMemo(() => {
    if (!activePeriod) {
      return { label: 'Toàn trường', total: 0, pendingList: [] };
    }

    const submittedSet = new Set(
      periodSubmissions
        .filter(s => s.status !== 'draft')
        .map(s => {
          if (s.homeroomClass) return s.homeroomClass.trim().toUpperCase();
          if (s.structuredData?.homeroomMinutes?.className) return s.structuredData.homeroomMinutes.className.trim().toUpperCase();
          return s.authorId;
        })
    );

    if (activePeriod.targetAudience === 'homeroom_teachers') {
      const pending = HOMEROOM_ROSTER_53.filter(hr => !submittedSet.has(hr.className.trim().toUpperCase()));
      return {
        label: '53 Giáo viên chủ nhiệm (18 THPT • 20 THCS ĐBK • 15 THCS Tân Kiều)',
        total: 53,
        pendingList: pending.map(p => ({
          name: p.teacherName,
          unit: `Lớp ${p.className} (${p.campus})`,
          phone: '-',
          role: 'GVCN'
        }))
      };
    }

    if (activePeriod.targetAudience === 'dept_heads_only') {
      const targetDepts = activePeriod.targetDepartmentIds && !activePeriod.targetDepartmentIds.includes('all')
        ? OFFICIAL_DEPARTMENTS.filter(d => activePeriod.targetDepartmentIds.includes(d.id))
        : OFFICIAL_DEPARTMENTS;

      const pending = targetDepts.filter(d => !submittedSet.has(d.headUserId));
      return {
        label: `${targetDepts.length} Tổ trưởng chuyên môn`,
        total: targetDepts.length,
        pendingList: pending.map(d => ({
          name: d.headUserName,
          unit: d.name,
          phone: '-',
          role: 'Tổ trưởng'
        }))
      };
    }

    if (activePeriod.targetAudience === 'specific_users' && activePeriod.targetUserIds) {
      const pending = activePeriod.targetUserIds.filter(uid => !submittedSet.has(uid));
      return {
        label: `${activePeriod.targetUserIds.length} Cán bộ / Thầy Cô được chỉ định đích danh`,
        total: activePeriod.targetUserIds.length,
        pendingList: pending.map(uid => {
          const u = allUsers.find(x => x.id === uid);
          return {
            name: u?.name || `Mã: ${uid}`,
            unit: u?.departmentName || 'Cá nhân',
            phone: u?.phone || '-',
            role: u?.roleTitle || 'Giáo viên'
          };
        })
      };
    }

    // Default: Teachers in department
    const targetDeptIds = activePeriod.targetDepartmentIds || ['all'];
    const targetTeachers = allUsers.filter(u => {
      if (u.role === 'admin' || u.role === 'principal') return false;
      if (targetDeptIds.includes('all')) return true;
      return targetDeptIds.includes(u.departmentId);
    });

    const pending = targetTeachers.filter(t => !submittedSet.has(t.id));
    return {
      label: `Toàn thể Giáo viên bộ môn (${targetTeachers.length} Thầy/Cô)`,
      total: targetTeachers.length,
      pendingList: pending.map(t => ({
        name: t.name,
        unit: t.departmentName,
        phone: t.phone || '-',
        role: t.roleTitle || 'Giáo viên'
      }))
    };
  }, [activePeriod, periodSubmissions, allUsers]);

  // Statistics for this specific period
  const stats = useMemo(() => {
    const validSubs = periodSubmissions.filter(s => s.status !== 'draft');
    const onTimeCount = validSubs.filter(s => !s.isLate).length;
    const lateCount = validSubs.filter(s => s.isLate).length;
    const approvedCount = validSubs.filter(s => s.status === 'principal_approved').length;
    const totalExpected = Math.max(targetInfo.total, validSubs.length, 1);
    const rate = Math.round((validSubs.length / totalExpected) * 100);

    return {
      submittedCount: validSubs.length,
      totalExpected,
      rate,
      onTimeCount,
      lateCount,
      approvedCount,
      pendingCount: Math.max(0, totalExpected - validSubs.length)
    };
  }, [periodSubmissions, targetInfo.total]);

  // Questions / Form Fields from activePeriod template or submitted data
  const formQuestions = useMemo(() => {
    const fieldsMap = new Map<string, CustomFormField>();
    // 1. From template
    if (activePeriod?.formTemplate?.fields) {
      activePeriod.formTemplate.fields.forEach(f => {
        if (f.type !== 'table') fieldsMap.set(f.id, f);
      });
    }
    // 2. From submissions if template was blank or had custom additions
    periodSubmissions.forEach(sub => {
      (sub.structuredData?.customFields || []).forEach((f: CustomFormField) => {
        if (f.type !== 'table' && !fieldsMap.has(f.id)) {
          fieldsMap.set(f.id, f);
        }
      });
    });
    return Array.from(fieldsMap.values());
  }, [activePeriod, periodSubmissions]);

  // Dynamic tables list
  const dynamicTables = consolidatedData.dynamicTables || [];

  // Export handlers
  const handleExportExcel = () => {
    if (!activePeriod) return;
    setExportingExcel(true);
    try {
      ExportService.exportConsolidatedPeriodToExcel(
        consolidatedData,
        schoolInfo,
        `Tong_Hop_${activePeriod.id}`
      );
    } catch (e: any) {
      alert('Lỗi xuất Excel: ' + (e.message || 'Không thể tạo file'));
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportWord = () => {
    if (!activePeriod) return;
    setExportingWord(true);
    try {
      ExportService.exportConsolidatedPeriodToWord(
        consolidatedData,
        schoolInfo,
        currentUser
      );
    } catch (e: any) {
      alert('Lỗi xuất Word: ' + (e.message || 'Không thể tạo file'));
    } finally {
      setExportingWord(false);
    }
  };

  const handlePrint = () => {
    if (!activePeriod) return;
    ExportService.printConsolidatedContentReport(
      consolidatedData,
      schoolInfo,
      currentUser
    );
  };

  return (
    <div className="space-y-6">

      {/* TOP HEADER & TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Trung Tâm Xuất & Tổng Hợp Dữ Liệu Báo Cáo</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp kết quả báo cáo do các thành viên gửi đến, phân tích chi tiết theo từng nội dung và trích xuất văn bản
          </p>
        </div>

        {onOpenConsolidation && (
          <button
            type="button"
            onClick={() => onOpenConsolidation(selectedPeriodId)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer self-start sm:self-auto"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mở Toàn Màn Hình</span>
          </button>
        )}
      </div>

      {/* 🎯 PROMINENT PERIOD SELECTOR BANNER (100% STRICT PERIOD ISOLATION) */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500/30 p-5 shadow-xs space-y-4 bg-gradient-to-br from-white via-emerald-50/20 to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Selector Dropdown */}
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đang chọn xem kết quả đợt báo cáo:</span>
            </label>
            <div className="relative">
              <select
                id="select-active-period"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full text-sm font-bold text-slate-900 bg-white px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition pr-10 cursor-pointer"
              >
                {periods.map(p => {
                  const pSubs = submissions.filter(s => s.periodId === p.id && s.status !== 'draft');
                  return (
                    <option key={p.id} value={p.id}>
                      {p.title} ({pSubs.length} bài đã nộp • Hạn chót: {new Date(p.deadline).toLocaleDateString('vi-VN')})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quick Action Buttons for the selected period */}
          <div className="flex flex-wrap items-center gap-2 pt-1 lg:pt-0">
            <button
              id="btn-export-excel"
              disabled={exportingExcel}
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{exportingExcel ? 'Đang tạo Excel...' : 'Xuất Excel (.xlsx)'}</span>
            </button>

            <button
              id="btn-export-word"
              disabled={exportingWord}
              onClick={handleExportWord}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{exportingWord ? 'Đang tạo Word...' : 'Xuất Word (.doc)'}</span>
            </button>

            <button
              id="btn-print-report"
              onClick={handlePrint}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>In A4</span>
            </button>
          </div>
        </div>

        {/* Period Details Bar */}
        {activePeriod && (
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đối tượng:</span>
              <span className="text-emerald-700 font-bold">{targetInfo.label}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Hạn chót nộp:</span>
              <span className="font-bold text-slate-800">
                {new Date(activePeriod.deadline).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Học kỳ:</span>
              <span className="font-semibold text-slate-700">{activePeriod.semester === 'HK1' ? 'Học kỳ 1' : activePeriod.semester === 'HK2' ? 'Học kỳ 2' : 'Cả năm'} ({activePeriod.academicYear})</span>
            </div>
          </div>
        )}

        {/* Metric Counter Cards for this Specific Period */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase flex items-center justify-between">
              <span>Tiến độ hoàn thành</span>
              <span className="text-emerald-600 font-extrabold">{stats.rate}%</span>
            </div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {stats.submittedCount} <span className="text-xs text-slate-400 font-semibold">/ {stats.totalExpected} bài</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, stats.rate)}%` }} 
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">Nộp đúng hạn</div>
            <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
              {stats.onTimeCount} <span className="text-xs text-emerald-600 font-semibold">bài</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-1">Đảm bảo kỷ luật thời gian</div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200/80 shadow-2xs">
            <div className="text-[11px] font-bold text-rose-800 uppercase flex items-center gap-1">
              <span>Ghi nhận trễ hạn</span>
            </div>
            <div className="text-lg font-extrabold text-rose-700 mt-0.5">
              {stats.lateCount} <span className="text-xs text-rose-600 font-semibold">bài</span>
            </div>
            <div className="text-[10px] text-rose-600 font-medium mt-1">
              {stats.lateCount > 0 ? 'Cần lưu ý nhắc nhở' : 'Không có bài nào trễ'}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200/80 shadow-2xs">
            <div className="text-[11px] font-bold text-teal-800 uppercase">Chưa nộp báo cáo</div>
            <div className="text-lg font-extrabold text-teal-800 mt-0.5">
              {stats.pendingCount} <span className="text-xs text-teal-600 font-semibold">thành viên</span>
            </div>
            <div className="text-[10px] text-teal-700 font-medium mt-1">
              {stats.pendingCount === 0 ? '✅ Đã hoàn thành 100%' : 'Đang chờ nộp tiếp'}
            </div>
          </div>
        </div>

      </div>

      {/* 🧭 NAVIGATION TABS FOR PERIOD DATA (XEM TOÀN DIỆN TỪNG NỘI DUNG) */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setActiveTab('questions')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'questions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>1. Tổng Hợp Theo Câu Hỏi & Tiêu Chí ({formQuestions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'matrix'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>2. Ma Trận Toàn Trường (Bảng Ngang)</span>
        </button>

        {dynamicTables.length > 0 && (
          <button
            onClick={() => setActiveTab('tables')}
            className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>3. Bảng Số Liệu Động ({dynamicTables.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeTab === 'submissions'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>4. Danh Sách Bài Nộp ({stats.submittedCount}) & Chưa Nộp ({stats.pendingCount})</span>
        </button>

        {isHomeroomPeriod && (
          <button
            onClick={() => setActiveTab('homeroom')}
            className={`flex-1 min-w-[160px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'homeroom'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <School className="w-4 h-4" />
            <span>5. Sĩ Số & 53 Lớp Chủ Nhiệm</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📊 TAB 1: TỔNG HỢP THEO TỪNG CÂU HỎI & NỘI DUNG (GOOGLE FORMS STYLE) */}
      {/* ========================================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-5">
          {formQuestions.length === 0 ? (
            /* Khi đợt báo cáo không có custom form fields, hiển thị nội dung văn bản tổng hợp */
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Nội dung báo cáo tự luận của các thành viên ({periodSubmissions.filter(s => s.status !== 'draft').length} bài)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">Đợt báo cáo này sử dụng mẫu văn bản tự do</span>
              </div>

              {periodSubmissions.filter(s => s.status !== 'draft').length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  Chưa có thành viên nào nộp báo cáo trong đợt này.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {periodSubmissions.filter(s => s.status !== 'draft').map((sub) => (
                    <div key={sub.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 hover:border-emerald-300 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{sub.authorName}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {sub.homeroomClass ? `Lớp ${sub.homeroomClass}` : sub.departmentName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 line-clamp-4 whitespace-pre-line leading-relaxed">
                        {sub.content || sub.structuredData?.homeroomMinutes?.additionalNotes || sub.structuredData?.customNotes || 'Không có nội dung văn bản'}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-500">
                        <span>Nộp lúc: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : '-'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (onOpenDetail) onOpenDetail(sub);
                            else setInspectedSubmission(sub);
                          }}
                          className="font-bold text-emerald-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Xem toàn bộ</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Có các câu hỏi biểu mẫu điện tử -> Tổng hợp chi tiết theo từng câu */
            formQuestions.map((field, qIdx) => {
              // Section Header
              if (field.type === 'section') {
                return (
                  <div key={field.id} className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-700" />
                    <span>{field.label}</span>
                  </div>
                );
              }

              // Collect responses for this question from non-draft submissions
              const validSubs = periodSubmissions.filter(s => s.status !== 'draft');
              const answers = validSubs.map(s => ({
                authorName: s.authorName,
                unit: s.homeroomClass ? `Lớp ${s.homeroomClass}` : s.departmentName,
                val: s.structuredData?.customFieldValues?.[field.id]
              })).filter(a => a.val !== undefined && a.val !== '' && a.val !== null);

              return (
                <div key={field.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  {/* Question Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                          {field.label}
                        </h3>
                        {field.description && (
                          <p className="text-[11px] text-slate-500 italic mt-0.5">{field.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto shrink-0">
                      {answers.length} / {validSubs.length} đã phản hồi
                    </span>
                  </div>

                  {/* 1. RADIO / DROPDOWN OPTION BREAKDOWN */}
                  {(field.type === 'radio' || field.type === 'dropdown' || field.type === 'select') && (
                    <div className="space-y-2.5">
                      {(field.options && field.options.length > 0 ? field.options : ['Lựa chọn 1', 'Lựa chọn 2']).map((opt, optIdx) => {
                        const matching = answers.filter(a => a.val === opt);
                        const pct = answers.length > 0 ? Math.round((matching.length / answers.length) * 100) : 0;
                        return (
                          <div key={optIdx} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{opt}</span>
                              </span>
                              <span className="font-bold text-slate-700">
                                {matching.length} lượt <span className="text-slate-400 font-normal">({pct}%)</span>
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            {matching.length > 0 && (
                              <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 pt-0.5">
                                <span className="font-medium text-slate-400">Các thành viên chọn:</span>
                                {matching.slice(0, 10).map((m, mIdx) => (
                                  <span key={mIdx} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                    {m.authorName} ({m.unit})
                                  </span>
                                ))}
                                {matching.length > 10 && (
                                  <span className="text-emerald-700 font-bold">+{matching.length - 10} người khác</span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. CHECKBOXES BREAKDOWN */}
                  {field.type === 'checkbox' && (
                    <div className="space-y-2.5">
                      {field.options && field.options.length > 0 ? (
                        field.options.map((opt, optIdx) => {
                          const matching = answers.filter(a => Array.isArray(a.val) && a.val.includes(opt));
                          const pct = answers.length > 0 ? Math.round((matching.length / answers.length) * 100) : 0;
                          return (
                            <div key={optIdx} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>{opt}</span>
                                </span>
                                <span className="font-bold text-slate-700">
                                  {matching.length} lượt <span className="text-slate-400 font-normal">({pct}%)</span>
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-teal-500 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              {matching.length > 0 && (
                                <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 pt-0.5">
                                  {matching.slice(0, 10).map((m, mIdx) => (
                                    <span key={mIdx} className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                      {m.authorName} ({m.unit})
                                    </span>
                                  ))}
                                  {matching.length > 10 && (
                                    <span className="text-teal-700 font-bold">+{matching.length - 10} người khác</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        // Single true/false checkbox
                        (() => {
                          const trueList = answers.filter(a => Boolean(a.val));
                          const pct = answers.length > 0 ? Math.round((trueList.length / answers.length) * 100) : 0;
                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-emerald-700">Đã đạt chuẩn / Hoàn thành:</span>
                                <span className="font-extrabold text-emerald-800">{trueList.length} / {answers.length} ({pct}%)</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                  {/* 3. LINEAR SCALE (1-5) BREAKDOWN */}
                  {field.type === 'scale' && (() => {
                    const min = field.scaleMin || 1;
                    const max = field.scaleMax || 5;
                    const numAnswers = answers.map(a => Number(a.val)).filter(n => !isNaN(n));
                    const avg = numAnswers.length > 0 
                      ? (numAnswers.reduce((sum, v) => sum + v, 0) / numAnswers.length).toFixed(1) 
                      : '0';
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                          <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                            <span>Điểm đánh giá trung bình toàn trường:</span>
                          </div>
                          <div className="text-lg font-extrabold text-amber-800">
                            {avg} <span className="text-xs font-semibold text-amber-600">/ {max}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: max - min + 1 }).map((_, sIdx) => {
                            const val = min + sIdx;
                            const count = numAnswers.filter(n => n === val).length;
                            const pct = numAnswers.length > 0 ? Math.round((count / numAnswers.length) * 100) : 0;
                            return (
                              <div key={val} className="text-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="text-xs font-bold text-slate-800">Mức {val}</div>
                                <div className="text-base font-extrabold text-emerald-700 mt-0.5">{count}</div>
                                <div className="text-[10px] text-slate-400 font-semibold">{pct}%</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4. NUMBER BREAKDOWN */}
                  {field.type === 'number' && (() => {
                    const numVals = answers.map(a => Number(a.val)).filter(n => !isNaN(n));
                    const totalSum = numVals.reduce((sum, v) => sum + v, 0);
                    const avg = numVals.length > 0 ? (totalSum / numVals.length).toFixed(1) : '0';
                    const maxVal = numVals.length > 0 ? Math.max(...numVals) : 0;
                    return (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                          <div className="text-[10px] font-bold text-emerald-800 uppercase">Tổng cộng ghi nhận</div>
                          <div className="text-lg font-extrabold text-emerald-900 mt-0.5">{totalSum.toLocaleString('vi-VN')}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center">
                          <div className="text-[10px] font-bold text-blue-800 uppercase">Trung bình</div>
                          <div className="text-lg font-extrabold text-blue-900 mt-0.5">{avg}</div>
                        </div>
                        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-center">
                          <div className="text-[10px] font-bold text-purple-800 uppercase">Cao nhất</div>
                          <div className="text-lg font-extrabold text-purple-900 mt-0.5">{maxVal}</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 5. TEXT / TEXTAREA RESPONSES */}
                  {(field.type === 'text' || field.type === 'textarea') && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold text-slate-700">
                        Chi tiết câu trả lời từ các thành viên ({answers.length} phản hồi):
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                        {answers.length === 0 ? (
                          <div className="text-xs text-slate-400 italic py-2">Chưa có ai điền nội dung câu này.</div>
                        ) : (
                          answers.map((ans, aIdx) => (
                            <div key={aIdx} className="pt-2 first:pt-0 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-900">{ans.authorName} ({ans.unit})</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyText(String(ans.val), `ans-${field.id}-${aIdx}`)}
                                  className="text-[10px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  {copiedKey === `ans-${field.id}-${aIdx}` ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-600" />
                                      <span>Đã sao chép</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Sao chép</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg whitespace-pre-line leading-relaxed border border-slate-100">
                                {String(ans.val)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* 6. DATE / TIME / FILE */}
                  {(field.type === 'date' || field.type === 'time' || field.type === 'file') && (
                    <div className="text-xs text-slate-700">
                      <div className="font-bold mb-1.5">Các giá trị ghi nhận:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {answers.slice(0, 15).map((ans, aIdx) => (
                          <span key={aIdx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium">
                            {ans.authorName} ({ans.unit}): <strong>{String(ans.val)}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📑 TAB 2: MA TRẬN DỮ LIỆU TOÀN TRƯỜNG (FULL HORIZONTAL MATRIX TABLE) */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-3">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-emerald-600" />
                <span>Bảng Ma Trận Tổng Hợp Câu Trả Lời Toàn Trường ({consolidatedData.fieldMatrix.rows.length} thành viên)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mỗi hàng là một thành viên/lớp, mỗi cột là một câu hỏi trong biểu mẫu báo cáo
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc lớp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600 w-48"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                <tr>
                  <th className="p-3 w-12 text-center sticky left-0 bg-slate-100 border-r border-slate-200">STT</th>
                  <th className="p-3 w-44 sticky left-12 bg-slate-100 border-r border-slate-200">Người Nộp</th>
                  <th className="p-3 w-28 text-center">Lớp / Tổ</th>
                  <th className="p-3 w-24 text-center">Trạng Thái</th>
                  {consolidatedData.fieldMatrix.columns.map((col) => (
                    <th key={col.id} className="p-3 min-w-[180px] max-w-xs border-l border-slate-200">
                      <div className="truncate" title={col.label}>{col.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consolidatedData.fieldMatrix.rows
                  .filter(r => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase().trim();
                    return r.authorName.toLowerCase().includes(q) || r.className.toLowerCase().includes(q);
                  })
                  .map((row, rIdx) => (
                    <tr key={rIdx} className={`hover:bg-slate-50 transition ${!row.hasSubmitted ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-3 text-center text-slate-400 sticky left-0 bg-white border-r border-slate-200 font-semibold">
                        {rIdx + 1}
                      </td>
                      <td className="p-3 font-bold text-slate-900 sticky left-12 bg-white border-r border-slate-200">
                        {row.authorName}
                      </td>
                      <td className="p-3 text-center font-semibold text-emerald-700 bg-slate-50/50">
                        {row.className}
                      </td>
                      <td className="p-3 text-center">
                        {row.hasSubmitted ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Đã nộp
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            Chưa nộp
                          </span>
                        )}
                      </td>
                      {consolidatedData.fieldMatrix.columns.map((col) => {
                        const val = row.values[col.id];
                        return (
                          <td key={col.id} className="p-3 border-l border-slate-100 text-slate-700">
                            {col.type === 'checkbox' ? (
                              Array.isArray(val) ? (
                                val.length > 0 ? (
                                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded">
                                    {val.join(', ')}
                                  </span>
                                ) : '-'
                              ) : val ? (
                                <span className="text-emerald-600 font-bold">✓ Đạt</span>
                              ) : '-'
                            ) : col.type === 'scale' ? (
                              val ? (
                                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                                  ⭐ Mức {val}
                                </span>
                              ) : '-'
                            ) : (
                              val !== undefined && val !== '' ? (
                                <div className="line-clamp-2" title={String(val)}>
                                  {String(val)}
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📋 TAB 3: BẢNG SỐ LIỆU ĐỘNG (CONSOLIDATED DYNAMIC TABLES) */}
      {/* ========================================================================= */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          {dynamicTables.map((tbl) => (
            <div key={tbl.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-emerald-50/50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-emerald-600" />
                    <span>{tbl.title}</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Gộp tất cả dữ liệu từ {tbl.classesCount} lớp/thành viên • Tổng cộng {tbl.totalRows} dòng
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[50vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-12 text-center">STT</th>
                      <th className="p-3 w-28 text-center">Lớp / Đơn Vị</th>
                      <th className="p-3 w-36">Người Báo Cáo</th>
                      {tbl.headers.map((h, hIdx) => (
                        <th key={hIdx} className="p-3 min-w-[140px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tbl.rows.map((r, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 transition">
                        <td className="p-3 text-center text-slate-400 font-semibold">{rIdx + 1}</td>
                        <td className="p-3 text-center font-bold text-emerald-700 bg-slate-50/50">{r.className}</td>
                        <td className="p-3 font-semibold text-slate-800">{r.authorName}</td>
                        {tbl.headers.map((h, hIdx) => (
                          <td key={hIdx} className="p-3 text-slate-700">
                            {r.data[h] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 👥 TAB 4: DANH SÁCH BÀI NỘP & NGƯỜI CHƯA NỘP (SUBMISSIONS & DIRECT READER) */}
      {/* ========================================================================= */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          
          {/* Sub-navigation pill: Đã nộp vs Chưa nộp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSubmissionStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  submissionStatusFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Tất cả bài đã nộp ({stats.submittedCount})
              </button>

              <button
                type="button"
                onClick={() => setSubmissionStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  submissionStatusFilter === 'pending'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Chưa nộp ({stats.pendingCount})</span>
              </button>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm người nộp, lớp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600 w-full sm:w-56"
              />
            </div>
          </div>

          {/* VIEW A: DANH SÁCH CHƯA NỘP (CẦN ĐÔN ĐỐC) */}
          {submissionStatusFilter === 'pending' ? (
            <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                    Danh Sách Thành Viên Chưa Nộp Báo Cáo ({targetInfo.pendingList.length} thành viên)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const names = targetInfo.pendingList.map(p => `${p.name} (${p.unit})`).join('\n');
                    handleCopyText(names, 'pending-list');
                  }}
                  className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'pending-list' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Sao chép danh sách nhắc nhở</span>
                </button>
              </div>

              {targetInfo.pendingList.length === 0 ? (
                <div className="p-8 text-center text-xs text-emerald-700 font-bold">
                  🎉 Toàn bộ thành viên đã nộp báo cáo đầy đủ! Không có ai còn nợ báo cáo.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12 text-center">STT</th>
                        <th className="p-3 w-48">Họ và Tên</th>
                        <th className="p-3 w-40">Đơn Vị / Lớp</th>
                        <th className="p-3 w-32">Chức Vụ</th>
                        <th className="p-3 w-32 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {targetInfo.pendingList
                        .filter(p => {
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase().trim();
                          return p.name.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q);
                        })
                        .map((p, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/40 transition">
                            <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{p.name}</td>
                            <td className="p-3 text-slate-700 font-medium">{p.unit}</td>
                            <td className="p-3 text-slate-600">{p.role}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Chưa nộp
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* VIEW B: DANH SÁCH CÁC BÀI ĐÃ NỘP (CÓ NÚT XEM CHI TIẾT TRỰC TIẾP) */
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh Sách Bài Báo Cáo Đã Nộp Trong Đợt ({periodSubmissions.filter(s => s.status !== 'draft').length} bài)
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  Nhấp vào &quot;Xem Chi Tiết&quot; để đọc toàn bộ bài nộp của thành viên
                </div>
              </div>

              {periodSubmissions.filter(s => s.status !== 'draft').length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Chưa có bài nộp nào trong đợt này.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12 text-center">STT</th>
                        <th className="p-3 w-40">Người Nộp</th>
                        <th className="p-3 w-32">Lớp / Tổ</th>
                        <th className="p-3">Tiêu Đề Báo Cáo</th>
                        <th className="p-3 w-32 text-center">Thời Gian Nộp</th>
                        <th className="p-3 w-28 text-center">Kỷ Luật</th>
                        <th className="p-3 w-28 text-center">Phê Duyệt</th>
                        <th className="p-3 w-24 text-center">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {periodSubmissions
                        .filter(s => s.status !== 'draft')
                        .filter(s => {
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase().trim();
                          return s.authorName.toLowerCase().includes(q) || 
                            (s.homeroomClass && s.homeroomClass.toLowerCase().includes(q)) ||
                            s.departmentName.toLowerCase().includes(q);
                        })
                        .map((sub, idx) => (
                          <tr key={sub.id} className="hover:bg-slate-50 transition">
                            <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{sub.authorName}</td>
                            <td className="p-3 text-slate-700 font-medium">
                              {sub.homeroomClass ? `Lớp ${sub.homeroomClass}` : sub.departmentName}
                            </td>
                            <td className="p-3 text-slate-800 font-semibold max-w-xs truncate" title={sub.title}>
                              {sub.title}
                            </td>
                            <td className="p-3 text-center text-slate-600 text-[11px]">
                              {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : '-'}
                            </td>
                            <td className="p-3 text-center">
                              {sub.isLate ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Trễ hạn
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Đúng hạn
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                sub.status === 'principal_approved'
                                  ? 'bg-teal-100 text-teal-800'
                                  : sub.status === 'dept_approved'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {sub.status === 'principal_approved' ? 'BGH đã duyệt' : sub.status === 'dept_approved' ? 'Tổ đã duyệt' : 'Chờ duyệt'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenDetail) {
                                    onOpenDetail(sub);
                                  } else {
                                    setInspectedSubmission(sub);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer mx-auto"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Xem</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🏫 TAB 5: SĨ SỐ & 53 LỚP CHỦ NHIỆM (HIỂN THỊ KHI LÀ ĐỢT GVCN) */}
      {/* ========================================================================= */}
      {activeTab === 'homeroom' && isHomeroomPeriod && (
        <div className="space-y-5">
          
          {/* Sĩ số toàn trường KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Tiến độ nộp 53 lớp</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">
                {consolidatedData.submittedCount} / 53 <span className="text-xs font-semibold text-slate-400">({consolidatedData.completionRate}%)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Sĩ số ghi nhận</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {consolidatedData.totalEnrolledStudents.toLocaleString('vi-VN')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs">
              <div className="text-[11px] font-bold text-rose-500 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Học sinh chưa ra lớp</span>
              </div>
              <div className="text-xl font-extrabold text-rose-700 mt-1">
                {consolidatedData.totalAbsentStudents} <span className="text-xs font-semibold text-rose-500">học sinh</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Tỷ lệ ra lớp</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {consolidatedData.overallAttendanceRate}%
              </div>
            </div>
          </div>

          {/* Section: Học sinh chưa ra lớp */}
          <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-rose-200 bg-rose-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  Danh Sách Tổng Hợp Học Sinh Chưa Ra Lớp ({consolidatedData.absentStudents.length} em)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 italic">Tổng hợp từ 53 lớp</span>
            </div>

            {consolidatedData.absentStudents.length === 0 ? (
              <div className="p-8 text-center text-xs text-emerald-700 font-bold">
                100% học sinh ra lớp đầy đủ. Không ghi nhận học sinh vắng trong các lớp đã nộp.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[40vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-12 text-center">STT</th>
                      <th className="p-3 w-20 text-center">Lớp</th>
                      <th className="p-3 w-36">GVCN</th>
                      <th className="p-3 w-44">Họ và tên học sinh</th>
                      <th className="p-3">Nơi ở hiện nay</th>
                      <th className="p-3 w-32">SĐT Phụ huynh</th>
                      <th className="p-3">Lý do chưa ra lớp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidatedData.absentStudents.map((s, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/30 transition">
                        <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-3 text-center font-bold text-emerald-700 bg-slate-50">{s.className}</td>
                        <td className="p-3 text-slate-800 font-medium">{s.teacherName}</td>
                        <td className="p-3 font-bold text-slate-900">{s.studentName}</td>
                        <td className="p-3 text-slate-600 text-[11px]">{s.currentAddress}</td>
                        <td className="p-3 text-slate-700 font-medium">
                          {s.parentPhone !== '-' ? (
                            <a href={`tel:${s.parentPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{s.parentPhone}</span>
                            </a>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-rose-700 font-medium">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Bảng Sĩ Số 53 Lớp */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bảng Sĩ Số 53 Lớp Chủ Nhiệm
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700">
                Sĩ số: {consolidatedData.totalEnrolledStudents} HS (Hiện diện: {consolidatedData.totalPresentStudents} • Vắng: {consolidatedData.totalAbsentStudents})
              </span>
            </div>

            <div className="overflow-x-auto max-h-[45vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3 w-20 text-center">Lớp</th>
                    <th className="p-3 w-24">Điểm</th>
                    <th className="p-3 w-40">GVCN</th>
                    <th className="p-3 w-16 text-center">Sĩ số</th>
                    <th className="p-3 w-20 text-center">Hiện diện</th>
                    <th className="p-3 w-20 text-center">Vắng</th>
                    <th className="p-3 w-20 text-center">Tỷ lệ</th>
                    <th className="p-3 w-24 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consolidatedData.classStats.map((c) => (
                    <tr key={c.className} className={`hover:bg-slate-50 ${!c.hasSubmitted ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-2.5 text-center text-slate-400">{c.stt}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900 bg-slate-50">{c.className}</td>
                      <td className="p-2.5 text-slate-500">{c.campus}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{c.teacherName}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900">{c.totalStudents}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">{c.presentStudents}</td>
                      <td className={`p-2.5 text-center font-bold ${c.absentStudentsCount > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}>
                        {c.absentStudentsCount}
                      </td>
                      <td className="p-2.5 text-center font-semibold">
                        {c.hasSubmitted ? `${c.attendanceRate}%` : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        {c.hasSubmitted ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Đã nộp
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            Chờ nộp
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 QUICK SLIDE-OVER READER (TRÌNH ĐỌC BÀI NỘP TRỰC TIẾP TRONG TAB) */}
      {/* ========================================================================= */}
      {inspectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {inspectedSubmission.homeroomClass ? `Lớp ${inspectedSubmission.homeroomClass}` : inspectedSubmission.departmentName}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    inspectedSubmission.isLate ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {inspectedSubmission.isLate ? 'Nộp trễ hạn' : 'Nộp đúng hạn'}
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900 leading-snug">
                  {inspectedSubmission.title}
                </h2>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>Người nộp: <strong>{inspectedSubmission.authorName}</strong></span>
                  <span>•</span>
                  <span>{inspectedSubmission.submittedAt ? new Date(inspectedSubmission.submittedAt).toLocaleString('vi-VN') : '-'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectedSubmission(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Custom Form Answers */}
              {formQuestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Nội Dung Trả Lời Biểu Mẫu Điện Tử</span>
                  </h3>
                  <div className="space-y-3">
                    {formQuestions.map((q) => {
                      const val = inspectedSubmission.structuredData?.customFieldValues?.[q.id];
                      if (q.type === 'section') {
                        return (
                          <div key={q.id} className="p-2.5 rounded-lg bg-amber-50 text-amber-900 font-bold text-xs uppercase">
                            {q.label}
                          </div>
                        );
                      }
                      return (
                        <div key={q.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                          <div className="text-xs font-bold text-slate-700">{q.label}</div>
                          <div className="text-xs text-slate-900 font-medium whitespace-pre-line">
                            {q.type === 'checkbox' ? (
                              Array.isArray(val) ? (
                                val.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {val.map((item: string, idx: number) => (
                                      <span key={idx} className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                        ✓ {item}
                                      </span>
                                    ))}
                                  </div>
                                ) : <span className="text-slate-400 italic">Chưa chọn</span>
                              ) : (
                                val ? '✓ Đạt chuẩn / Hoàn thành' : 'Chưa hoàn thành'
                              )
                            ) : q.type === 'scale' ? (
                              val ? <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-xs">⭐ Mức {val} / {q.scaleMax || 5}</span> : '-'
                            ) : (
                              val !== undefined && val !== '' ? String(val) : <span className="text-slate-400 italic">Không có dữ liệu</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Text content if any */}
              {inspectedSubmission.content && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Nội Dung Báo Cáo Văn Bản</span>
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                    {inspectedSubmission.content}
                  </div>
                </div>
              )}

              {/* Dynamic tables filled by this user */}
              {(inspectedSubmission.structuredData?.customTables || []).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Bảng Số Liệu Kèm Theo
                  </h3>
                  {(inspectedSubmission.structuredData?.customTables || []).map((tbl: CustomDynamicTable, tIdx: number) => (
                    <div key={tIdx} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 p-2.5 font-bold text-xs text-slate-800">{tbl.title}</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="p-2 w-10 text-center">STT</th>
                              {tbl.headers.map((h, hIdx) => (
                                <th key={hIdx} className="p-2">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tbl.rows.map((r, rIdx) => (
                              <tr key={rIdx}>
                                <td className="p-2 text-center text-slate-400">{rIdx + 1}</td>
                                {tbl.headers.map((h, hIdx) => (
                                  <td key={hIdx} className="p-2">{r[h] || '-'}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Review History */}
              {(inspectedSubmission.deptHeadReview || inspectedSubmission.principalReview) && (
                <div className="space-y-3 p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                  <div className="text-xs font-bold text-blue-900 uppercase">Ý kiến phê duyệt</div>
                  {inspectedSubmission.deptHeadReview && (
                    <div className="text-xs text-slate-700">
                      <strong>Tổ trưởng ({inspectedSubmission.deptHeadReview.reviewerName}):</strong> {inspectedSubmission.deptHeadReview.comment || 'Đã đồng ý duyệt'}
                    </div>
                  )}
                  {inspectedSubmission.principalReview && (
                    <div className="text-xs text-slate-700">
                      <strong>BGH ({inspectedSubmission.principalReview.reviewerName}):</strong> {inspectedSubmission.principalReview.comment || 'Đã phê duyệt'}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
              {onOpenDetail && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenDetail(inspectedSubmission);
                    setInspectedSubmission(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Mở xem toàn màn hình</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectedSubmission(null)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
