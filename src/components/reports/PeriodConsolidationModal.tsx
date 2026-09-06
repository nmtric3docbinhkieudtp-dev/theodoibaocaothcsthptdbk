import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { ExportService } from '../../services/exportService';
import { 
  aggregatePeriodReportData, 
  generateSample53Submissions, 
  generateConsolidatedExecutiveSummary,
  PeriodConsolidationResult,
  ConsolidatedStudent
} from '../../utils/consolidationHelper';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Users, 
  GraduationCap, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Layers, 
  School,
  ChevronDown,
  RefreshCw,
  Info,
  Calendar,
  Phone,
  MapPin,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { ReportPeriod } from '../../types';

interface PeriodConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriodId?: string;
}

export const PeriodConsolidationModal: React.FC<PeriodConsolidationModalProps> = ({
  isOpen,
  onClose,
  defaultPeriodId
}) => {
  const { currentUser, allUsers, isAdmin, isPrincipal } = useAuth();
  const { submissions, periods, schoolInfo, submitReport, clearTestReports } = useReports();

  // Selected period state
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    if (defaultPeriodId) return defaultPeriodId;
    // Prefer period with 'gvcn' or 'tập trung' or first active
    const homeroomPeriod = periods.find(p => p.id.includes('gvcn') || p.title.toLowerCase().includes('chủ nhiệm') || p.title.toLowerCase().includes('tập trung'));
    return homeroomPeriod?.id || periods[0]?.id || 'all';
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<'dynamic' | 'matrix' | 'absent' | 'classes' | 'talents' | 'feedbacks' | 'ai'>('dynamic');

  // Filter states
  const [searchAbsent, setSearchAbsent] = useState('');
  const [searchDynamic, setSearchDynamic] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [searchFeedback, setSearchFeedback] = useState('');

  // Loading & Action states
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [copiedAI, setCopiedAI] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  // Active period object
  const activePeriod = useMemo(() => {
    if (selectedPeriodId === 'all') return null;
    return periods.find(p => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Aggregate consolidated data
  const consolidatedData: PeriodConsolidationResult = useMemo(() => {
    return aggregatePeriodReportData(activePeriod, submissions, allUsers);
  }, [activePeriod, submissions, allUsers]);

  // Auto select best tab when period changes
  React.useEffect(() => {
    if (consolidatedData.dynamicTables.length > 0) {
      setActiveTab('dynamic');
    } else if (consolidatedData.fieldMatrix.columns.length > 0) {
      setActiveTab('matrix');
    } else if (consolidatedData.absentStudents.length > 0) {
      setActiveTab('absent');
    } else {
      setActiveTab('classes');
    }
  }, [selectedPeriodId, consolidatedData.dynamicTables.length, consolidatedData.absentStudents.length, consolidatedData.fieldMatrix.columns.length]);

  // Filter dynamic tables
  const filteredDynamicTables = useMemo(() => {
    return consolidatedData.dynamicTables.map(tbl => {
      const rows = tbl.rows.filter(r => {
        if (gradeFilter !== 'all' && String(r.grade) !== gradeFilter) return false;
        if (campusFilter !== 'all' && r.campus !== campusFilter) return false;
        if (searchDynamic.trim()) {
          const q = searchDynamic.toLowerCase().trim();
          const inClass = r.className.toLowerCase().includes(q);
          const inAuthor = r.authorName.toLowerCase().includes(q);
          const inData = Object.values(r.data).some(val => String(val).toLowerCase().includes(q));
          if (!inClass && !inAuthor && !inData) return false;
        }
        return true;
      });
      return { ...tbl, filteredRows: rows };
    });
  }, [consolidatedData.dynamicTables, gradeFilter, campusFilter, searchDynamic]);

  // Filter matrix rows
  const filteredMatrixRows = useMemo(() => {
    return consolidatedData.fieldMatrix.rows.filter(r => {
      if (gradeFilter !== 'all' && String(r.grade) !== gradeFilter) return false;
      if (campusFilter !== 'all' && r.campus !== campusFilter) return false;
      if (searchDynamic.trim()) {
        const q = searchDynamic.toLowerCase().trim();
        const inClass = r.className.toLowerCase().includes(q);
        const inAuthor = r.authorName.toLowerCase().includes(q);
        const inValues = Object.values(r.values).some(val => String(val).toLowerCase().includes(q));
        if (!inClass && !inAuthor && !inValues) return false;
      }
      return true;
    });
  }, [consolidatedData.fieldMatrix.rows, gradeFilter, campusFilter, searchDynamic]);

  // Filter absent students
  const filteredAbsentStudents = useMemo(() => {
    return consolidatedData.absentStudents.filter(s => {
      if (gradeFilter !== 'all' && String(s.grade) !== gradeFilter) return false;
      if (campusFilter !== 'all' && s.campus !== campusFilter) return false;
      if (searchAbsent.trim()) {
        const q = searchAbsent.toLowerCase().trim();
        const matchesName = s.studentName.toLowerCase().includes(q);
        const matchesClass = s.className.toLowerCase().includes(q);
        const matchesReason = s.reason.toLowerCase().includes(q);
        const matchesTeacher = s.teacherName.toLowerCase().includes(q);
        const matchesAddress = s.currentAddress.toLowerCase().includes(q);
        if (!matchesName && !matchesClass && !matchesReason && !matchesTeacher && !matchesAddress) {
          return false;
        }
      }
      return true;
    });
  }, [consolidatedData.absentStudents, gradeFilter, campusFilter, searchAbsent]);

  // Filter text feedbacks
  const filteredFeedbacks = useMemo(() => {
    if (!searchFeedback.trim()) return consolidatedData.feedbacks;
    const q = searchFeedback.toLowerCase().trim();
    return consolidatedData.feedbacks.filter(f => 
      f.className.toLowerCase().includes(q) ||
      f.authorName.toLowerCase().includes(q) ||
      f.content.toLowerCase().includes(q) ||
      f.notes.toLowerCase().includes(q)
    );
  }, [consolidatedData.feedbacks, searchFeedback]);

  // AI Executive Summary
  const aiSummaryText = useMemo(() => {
    return generateConsolidatedExecutiveSummary(consolidatedData);
  }, [consolidatedData]);

  if (!isOpen) return null;

  // Handle Export Excel
  const handleExportExcel = () => {
    setExportingExcel(true);
    try {
      ExportService.exportConsolidatedPeriodToExcel(
        consolidatedData,
        schoolInfo,
        `Tong_Hop_53_Lop_${activePeriod ? activePeriod.id : 'Toan_Truong'}`
      );
    } catch (err: any) {
      alert('Lỗi xuất Excel: ' + (err?.message || err));
    } finally {
      setExportingExcel(false);
    }
  };

  // Handle Export Word
  const handleExportWord = () => {
    setExportingWord(true);
    try {
      ExportService.exportConsolidatedPeriodToWord(
        consolidatedData,
        schoolInfo,
        currentUser
      );
    } catch (err: any) {
      alert('Lỗi xuất Word: ' + (err?.message || err));
    } finally {
      setExportingWord(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    ExportService.printConsolidatedContentReport(
      consolidatedData,
      schoolInfo,
      currentUser
    );
  };

  // Handle Copy AI Summary
  const handleCopyAISummary = () => {
    navigator.clipboard.writeText(aiSummaryText);
    setCopiedAI(true);
    setTimeout(() => setCopiedAI(false), 2000);
  };

  // Handle generate 53 sample submissions for simulation testing
  const handleGenerateSample53 = async () => {
    if (!activePeriod) {
      alert('Vui lòng chọn một đợt báo cáo cụ thể để nạp dữ liệu mẫu!');
      return;
    }
    const confirm = window.confirm(
      `Thầy có muốn hệ thống tự động sinh dữ liệu báo cáo thử nghiệm cho đầy đủ 53 lớp chủ nhiệm vào đợt "${activePeriod.title}"?\n\nĐiều này giúp Thầy kiểm tra ngay bảng tổng hợp học sinh chưa ra lớp, sĩ số toàn trường, năng khiếu và kiến nghị của 53 GVCN.`
    );
    if (!confirm) return;

    setIsGeneratingSample(true);
    try {
      const sampleSubs = generateSample53Submissions(activePeriod.id, activePeriod.title, allUsers);
      for (const sub of sampleSubs) {
        await submitReport({
          periodId: sub.periodId,
          title: sub.title,
          content: sub.content,
          structuredData: sub.structuredData,
          attachments: [],
          isDraft: false,
          isHomeroomReport: true,
          homeroomClass: sub.homeroomClass,
          homeroomStudentCount: sub.homeroomStudentCount,
          homeroomCampus: sub.homeroomCampus
        });
      }
      alert('Đã sinh dữ liệu thử nghiệm 53 lớp thành công! Thầy có thể xem bảng tổng hợp ngay bây giờ.');
    } catch (e: any) {
      alert('Lỗi khi nạp dữ liệu mẫu: ' + e.message);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  if (!isOpen || (!isAdmin && !isPrincipal)) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Tổng Hợp Báo Cáo Toàn Trường & 53 Lớp
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dành cho Ban Giám Hiệu
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tổng hợp chi tiết danh sách học sinh chưa ra lớp, thống kê sĩ số 53 lớp, năng khiếu và ý kiến kiến nghị
              </p>
            </div>
          </div>

          {/* Period selector in header & Close button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/90 rounded-xl px-3 py-1.5 border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="text-xs bg-transparent text-white font-medium focus:outline-hidden cursor-pointer max-w-[200px] sm:max-w-xs truncate"
              >
                <option value="all" className="bg-slate-800 text-white">-- Toàn bộ các đợt nộp --</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-800 text-white">{p.title}</option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar & Metric Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
          
          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs font-semibold text-slate-700">
              {consolidatedData.isSpecificUsersAudience ? (
                <UserCheck className="w-4 h-4 text-indigo-600" />
              ) : (
                <Users className="w-4 h-4 text-emerald-600" />
              )}
              <span>Tiến độ nộp:</span>
              <span className="font-bold text-emerald-700">
                {consolidatedData.submittedCount} / {
                  consolidatedData.isSpecificUsersAudience 
                    ? `${consolidatedData.totalSpecificUsers} người` 
                    : consolidatedData.isDeptHeadAudience 
                    ? '19 người' 
                    : '53 lớp'
                } ({consolidatedData.completionRate}%)
              </span>
            </div>

            {consolidatedData.isSpecificUsersAudience ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 shadow-2xs font-semibold text-indigo-800">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Chỉ định đích danh:</span>
                <span className="font-bold text-indigo-950">{consolidatedData.totalSpecificUsers} Thầy/Cô</span>
              </div>
            ) : consolidatedData.isDeptHeadAudience ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 shadow-2xs font-semibold text-blue-800">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Đối tượng:</span>
                <span className="font-bold text-blue-950">19 Tổ trưởng & Tổ phó CM</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs font-semibold text-slate-700">
                <School className="w-4 h-4 text-blue-600" />
                <span>Sĩ số toàn trường:</span>
                <span className="font-bold text-slate-900">{consolidatedData.totalEnrolledStudents.toLocaleString('vi-VN')}</span>
              </div>
            )}

            {consolidatedData.totalAbsentStudents > 0 && (
              <div 
                onClick={() => setActiveTab('absent')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs font-semibold text-rose-700 cursor-pointer hover:bg-rose-100 transition"
                title="Nhấp để xem danh sách chi tiết"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>Chưa ra lớp:</span>
                <span className="font-bold text-rose-700 bg-rose-200/70 px-1.5 py-0.5 rounded-md">{consolidatedData.totalAbsentStudents} học sinh</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Chưa nộp:</span>
              <span className={`font-bold ${consolidatedData.pendingCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {consolidatedData.pendingCount} {consolidatedData.isSpecificUsersAudience || consolidatedData.isDeptHeadAudience ? 'người' : 'lớp'}
              </span>
            </div>
          </div>

          {/* Master Export Buttons */}
          <div className="flex items-center gap-2">
            {consolidatedData.submittedCount < 5 && activePeriod && (
              <button
                type="button"
                onClick={handleGenerateSample53}
                disabled={isGeneratingSample}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Tạo nhanh 53 báo cáo mẫu để xem trước kết quả tổng hợp toàn trường"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isGeneratingSample ? 'Đang tạo mẫu...' : 'Nạp mẫu 53 lớp test'}</span>
              </button>
            )}

            <button
              id="btn-consolidated-export-excel"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportingExcel ? 'Đang xuất...' : 'Xuất Excel 53 Lớp (.xlsx)'}</span>
            </button>

            <button
              id="btn-consolidated-export-word"
              onClick={handleExportWord}
              disabled={exportingWord}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{exportingWord ? 'Đang xuất...' : 'Xuất Word (.doc)'}</span>
            </button>

            <button
              id="btn-consolidated-print"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>In A4</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto">
          {consolidatedData.dynamicTables.length > 0 && (
            <button
              onClick={() => setActiveTab('dynamic')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dynamic'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>1. Tổng Hợp Dữ Liệu 53 Lớp</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {consolidatedData.totalDynamicRows} bản ghi
              </span>
            </button>
          )}

          {consolidatedData.fieldMatrix.columns.length > 0 && (
            <button
              onClick={() => setActiveTab('matrix')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>Ma Trận Chỉ Số</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                {consolidatedData.fieldMatrix.columns.length} chỉ số
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('classes')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'classes'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {consolidatedData.isSpecificUsersAudience ? (
              <>
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Tiến Độ Người Báo Cáo Được Chỉ Định</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {consolidatedData.submittedCount}/{consolidatedData.totalSpecificUsers}
                </span>
              </>
            ) : consolidatedData.isDeptHeadAudience ? (
              <>
                <Users className="w-4 h-4 text-blue-600" />
                <span>Tiến Độ 19 Tổ Trưởng & Tổ Phó</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {consolidatedData.submittedCount}/19
                </span>
              </>
            ) : (
              <>
                <School className="w-4 h-4 text-emerald-600" />
                <span>Tiến Độ & Sĩ Số 53 Lớp</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  53
                </span>
              </>
            )}
          </button>

          {consolidatedData.totalAbsentStudents > 0 && (
            <button
              onClick={() => setActiveTab('absent')}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'absent'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Học Sinh Chưa Ra Lớp</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                {consolidatedData.totalAbsentStudents}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('talents')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'talents'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Năng Khiếu & Ban Cán Sự</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {consolidatedData.talents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feedbacks')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'feedbacks'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>Nội Dung Báo Cáo ({consolidatedData.feedbacks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Tóm Tắt & Chỉ Đạo BGH</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
          
          {/* TAB 1: HỌC SINH CHƯA RA LỚP TOÀN TRƯỜNG */}
          {activeTab === 'absent' && (
            <div className="space-y-4">
              
              {/* Filter controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm tên học sinh, lý do vắng, lớp, nơi ở, số điện thoại..."
                      value={searchAbsent}
                      onChange={(e) => setSearchAbsent(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
                  >
                    <option value="all">Tất cả các khối (6-12)</option>
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>

                  <select
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
                  >
                    <option value="all">Tất cả điểm trường</option>
                    <option value="THPT">Điểm THPT</option>
                    <option value="DBK">Điểm THCS Đốc Binh Kiều</option>
                    <option value="TK">Điểm THCS Tân Kiều</option>
                  </select>
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  Hiển thị <span className="font-bold text-rose-600">{filteredAbsentStudents.length}</span> / {consolidatedData.totalAbsentStudents} học sinh chưa ra lớp
                </div>
              </div>

              {/* Master Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80 bg-rose-50/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                      Danh Sách Tổng Hợp Học Sinh Chưa Ra Lớp Toàn Trường (Gộp từ 53 Lớp)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 italic">
                    Dữ liệu cập nhật trực tiếp theo các biểu mẫu nộp của 53 GVCN
                  </span>
                </div>

                {filteredAbsentStudents.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-800">
                      {consolidatedData.absentStudents.length === 0 
                        ? 'Tuyệt vời! Không có học sinh nào vắng (100% ra lớp)' 
                        : 'Không tìm thấy học sinh phù hợp với bộ lọc'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {consolidatedData.absentStudents.length === 0 
                        ? 'Các lớp đã báo cáo đều ghi nhận học sinh ra lớp đầy đủ.' 
                        : 'Thầy vui lòng thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[58vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10 shadow-2xs">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-20 text-center">Lớp</th>
                          <th className="p-3 w-24">Khối / Điểm</th>
                          <th className="p-3 w-40">GVCN</th>
                          <th className="p-3 w-48">Họ và tên học sinh</th>
                          <th className="p-3 w-24">Lớp cũ</th>
                          <th className="p-3 min-w-[200px]">Nơi ở hiện nay</th>
                          <th className="p-3 w-32">Số ĐT Phụ huynh</th>
                          <th className="p-3 min-w-[220px]">Lý do chưa ra lớp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAbsentStudents.map((s, idx) => (
                          <tr key={`${s.className}-${s.studentName}-${idx}`} className="hover:bg-rose-50/30 transition">
                            <td className="p-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                            <td className="p-3 text-center font-bold text-emerald-700 bg-slate-50/60">{s.className}</td>
                            <td className="p-3 text-slate-600">
                              <span className="font-semibold">Khối {s.grade}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {s.campus === 'THPT' ? 'Điểm THPT' : (s.campus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều')}
                              </span>
                            </td>
                            <td className="p-3 text-slate-800 font-medium">{s.teacherName}</td>
                            <td className="p-3 font-bold text-slate-900">{s.studentName}</td>
                            <td className="p-3 text-slate-600">{s.previousClass}</td>
                            <td className="p-3 text-slate-700 text-[11px]">{s.currentAddress}</td>
                            <td className="p-3 text-slate-800 font-medium">
                              {s.parentPhone !== '-' ? (
                                <a href={`tel:${s.parentPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-blue-500" />
                                  <span>{s.parentPhone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3 text-rose-700 font-medium bg-rose-50/20">{s.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BẢNG SĨ SỐ 53 LỚP / TIẾN ĐỘ NGƯỜI BÁO CÁO */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              {consolidatedData.isSpecificUsersAudience ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Bảng Theo Dõi Tiến Độ Báo Cáo - {consolidatedData.totalSpecificUsers} Cán Bộ / Giáo Viên Được Chỉ Định Đích Danh
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg">
                      Đã nộp: {consolidatedData.submittedCount} / {consolidatedData.totalSpecificUsers} người ({consolidatedData.completionRate}%)
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[64vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-48">Họ và Tên Thầy/Cô</th>
                          <th className="p-3 w-40">Chức Vụ</th>
                          <th className="p-3 w-40">Tổ / Bộ Phận</th>
                          <th className="p-3 w-32">Môn / Nhiệm vụ</th>
                          <th className="p-3 w-32">Cơ sở / Đơn vị</th>
                          <th className="p-3 w-32 text-center">Trạng thái nộp</th>
                          <th className="p-3 w-36 text-center">Thời gian nộp</th>
                          <th className="p-3 min-w-[220px]">Tiêu đề báo cáo / Trích yếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.specificUserStats.map((u) => (
                          <tr key={u.userId} className={`hover:bg-slate-50 transition ${!u.hasSubmitted ? 'bg-amber-50/30' : ''}`}>
                            <td className="p-3 text-center text-slate-500 font-medium">{u.stt}</td>
                            <td className="p-3 font-bold text-slate-900">{u.teacherName}</td>
                            <td className="p-3 text-slate-700 font-medium">{u.roleTitle}</td>
                            <td className="p-3 text-slate-600">{u.departmentName || '-'}</td>
                            <td className="p-3 text-slate-600">{u.subject || '-'}</td>
                            <td className="p-3 text-slate-600">{u.originalSchool || '-'}</td>
                            <td className="p-3 text-center">
                              {u.hasSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã nộp</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <span>Chờ nộp</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center text-slate-600">
                              {u.submittedAt ? new Date(u.submittedAt).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td className="p-3 text-slate-700">
                              {u.reportTitle && <p className="font-semibold text-slate-900">{u.reportTitle}</p>}
                              {u.summaryNote && <p className="text-[11px] text-slate-500 italic mt-0.5">{u.summaryNote}</p>}
                              {!u.reportTitle && !u.summaryNote && <span className="text-slate-400 italic">Chưa có nội dung</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : consolidatedData.isDeptHeadAudience ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Bảng Theo Dõi Tiến Độ Báo Cáo 19 Tổ Trưởng & Tổ Phó Chuyên Môn
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                      Đã nộp: {consolidatedData.submittedCount} / 19 người ({consolidatedData.completionRate}%)
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[64vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-48">Họ và Tên Thầy/Cô</th>
                          <th className="p-3 w-40">Chức Vụ</th>
                          <th className="p-3 w-40">Tổ Chuyên Môn</th>
                          <th className="p-3 w-32">Môn Giảng Dạy</th>
                          <th className="p-3 w-32">Đơn Vị Cũ</th>
                          <th className="p-3 w-32 text-center">Trạng thái nộp</th>
                          <th className="p-3 w-36 text-center">Thời gian nộp</th>
                          <th className="p-3 min-w-[220px]">Tiêu đề báo cáo / Trích yếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.deptHeadStats.map((dh) => (
                          <tr key={dh.userId} className={`hover:bg-slate-50 transition ${!dh.hasSubmitted ? 'bg-amber-50/30' : ''}`}>
                            <td className="p-3 text-center text-slate-500 font-medium">{dh.stt}</td>
                            <td className="p-3 font-bold text-slate-900">{dh.teacherName}</td>
                            <td className="p-3 text-slate-700 font-medium">{dh.roleTitle}</td>
                            <td className="p-3 text-slate-600">{dh.departmentName}</td>
                            <td className="p-3 text-slate-600">{dh.subject || '-'}</td>
                            <td className="p-3 text-slate-600">{dh.originalSchool || '-'}</td>
                            <td className="p-3 text-center">
                              {dh.hasSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã nộp</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <span>Chờ nộp</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center text-slate-600">
                              {dh.submittedAt ? new Date(dh.submittedAt).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td className="p-3 text-slate-700">
                              {dh.reportTitle && <p className="font-semibold text-slate-900">{dh.reportTitle}</p>}
                              {dh.summaryNote && <p className="text-[11px] text-slate-500 italic mt-0.5">{dh.summaryNote}</p>}
                              {!dh.reportTitle && !dh.summaryNote && <span className="text-slate-400 italic">Chưa có nội dung</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Bảng Thống Kê Sĩ Số & Tỷ Lệ Ra Lớp 53 Lớp Chủ Nhiệm (Năm Học 2026 - 2027)
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      Tổng cộng: {consolidatedData.totalEnrolledStudents} học sinh
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[64vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-20 text-center">Lớp</th>
                          <th className="p-3 w-28">Điểm trường</th>
                          <th className="p-3 w-40">GVCN</th>
                          <th className="p-3 w-20 text-center">Sĩ số</th>
                          <th className="p-3 w-16 text-center">Nam</th>
                          <th className="p-3 w-16 text-center">Nữ</th>
                          <th className="p-3 w-20 text-center">Hiện diện</th>
                          <th className="p-3 w-20 text-center">Vắng</th>
                          <th className="p-3 w-24 text-center">Tỷ lệ (%)</th>
                          <th className="p-3 w-28 text-center">Trạng thái</th>
                          <th className="p-3 min-w-[200px]">Phản ánh / Ghi chú của GVCN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.classStats.map((c) => (
                          <tr key={c.className} className={`hover:bg-slate-50 transition ${!c.hasSubmitted ? 'bg-amber-50/30' : ''}`}>
                            <td className="p-3 text-center text-slate-500 font-medium">{c.stt}</td>
                            <td className="p-3 text-center font-bold text-slate-900 bg-slate-50/60">{c.className}</td>
                            <td className="p-3 text-slate-600">
                              {c.campus === 'THPT' ? 'Điểm THPT' : (c.campus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều')}
                            </td>
                            <td className="p-3 text-slate-800 font-medium">{c.teacherName}</td>
                            <td className="p-3 text-center font-bold text-slate-900">{c.totalStudents}</td>
                            <td className="p-3 text-center text-slate-600">{c.maleStudents}</td>
                            <td className="p-3 text-center text-slate-600">{c.femaleStudents}</td>
                            <td className="p-3 text-center font-bold text-emerald-700">{c.presentStudents}</td>
                            <td className={`p-3 text-center font-bold ${c.absentStudentsCount > 0 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-400'}`}>
                              {c.absentStudentsCount}
                            </td>
                            <td className="p-3 text-center font-bold">
                              {c.hasSubmitted ? (
                                <span className={`px-2 py-0.5 rounded-md ${c.attendanceRate >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {c.attendanceRate}%
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {c.hasSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã nộp</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <span>Chờ nộp</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 text-[11px] italic truncate max-w-xs" title={c.notes}>
                              {c.notes || '-'}
                            </td>
                          </tr>
                        ))}

                        {/* Dòng Tổng cộng toàn trường */}
                        <tr className="bg-slate-900 text-white font-bold sticky bottom-0 z-10 shadow-lg">
                          <td colSpan={4} className="p-3 text-center uppercase tracking-wider text-emerald-300">
                            TỔNG CỘNG TOÀN TRƯỜNG (53 LỚP)
                          </td>
                          <td className="p-3 text-center text-white">{consolidatedData.totalEnrolledStudents}</td>
                          <td className="p-3 text-center text-slate-300">{consolidatedData.totalMaleStudents}</td>
                          <td className="p-3 text-center text-slate-300">{consolidatedData.totalFemaleStudents}</td>
                          <td className="p-3 text-center text-emerald-400">{consolidatedData.totalPresentStudents}</td>
                          <td className="p-3 text-center text-rose-400">{consolidatedData.totalAbsentStudents}</td>
                          <td className="p-3 text-center text-emerald-300">{consolidatedData.overallAttendanceRate}%</td>
                          <td className="p-3 text-center text-slate-300">{consolidatedData.submittedCount}/53 lớp</td>
                          <td className="p-3 text-slate-400 font-normal text-[11px]">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HỌC SINH NĂNG KHIẾU & BAN CÁN SỰ */}
          {activeTab === 'talents' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Năng khiếu & giải thưởng */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80 bg-amber-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Học Sinh Năng Khiếu & Giải Thưởng ({consolidatedData.talents.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Phục vụ bồi dưỡng HSG & Hội khỏe Phù Đổng</span>
                </div>

                {consolidatedData.talents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Chưa có lớp nào gửi danh sách học sinh năng khiếu.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[55vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-10 text-center">STT</th>
                          <th className="p-2.5 w-16 text-center">Lớp</th>
                          <th className="p-2.5 w-36">Họ tên học sinh</th>
                          <th className="p-2.5">Cuộc thi / Năng khiếu</th>
                          <th className="p-2.5 w-24 text-center">Giải thưởng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.talents.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700">{t.className}</td>
                            <td className="p-2.5 font-bold text-slate-900">{t.studentName}</td>
                            <td className="p-2.5 text-slate-700">{t.competition}</td>
                            <td className="p-2.5 text-center font-semibold text-amber-700 bg-amber-50/50">{t.prize}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Ban cán sự lớp */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80 bg-blue-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                      Danh Bạ Ban Cán Sự Lớp ({consolidatedData.cadres.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Dành cho BGH & Đoàn - Đội liên hệ</span>
                </div>

                {consolidatedData.cadres.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Chưa có lớp nào cập nhật ban cán sự.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[55vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-10 text-center">STT</th>
                          <th className="p-2.5 w-16 text-center">Lớp</th>
                          <th className="p-2.5 w-32">Chức vụ</th>
                          <th className="p-2.5">Họ và tên</th>
                          <th className="p-2.5 w-28">Số điện thoại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.cadres.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700">{c.className}</td>
                            <td className="p-2.5 font-semibold text-blue-700">{c.role}</td>
                            <td className="p-2.5 font-bold text-slate-900">{c.studentName}</td>
                            <td className="p-2.5 text-slate-600 font-medium">
                              {c.phone !== '-' ? (
                                <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline">
                                  {c.phone}
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NỘI DUNG CHI TIẾT & Ý KIẾN CỦA 53 NGƯỜI */}
          {activeTab === 'feedbacks' && (
            <div className="space-y-4">
              
              {/* Search bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên giáo viên, lớp, nội dung đề xuất hoặc từ khóa kiến nghị..."
                    value={searchFeedback}
                    onChange={(e) => setSearchFeedback(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500 shrink-0">
                  {filteredFeedbacks.length} báo cáo có nội dung
                </span>
              </div>

              {/* Feedback cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeedbacks.map((f, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {f.className !== '-' ? `Lớp ${f.className}` : f.departmentName}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{f.authorName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {f.submittedAt ? new Date(f.submittedAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>

                    {f.notes && (
                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 text-xs text-amber-950">
                        <span className="font-bold text-amber-900 block mb-0.5">📌 Đề xuất / Ý kiến gửi BGH:</span>
                        <p className="italic">{f.notes}</p>
                      </div>
                    )}

                    {f.content && (
                      <div className="text-xs text-slate-600 line-clamp-4 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {f.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: DYNAMIC TABLES (TỔNG HỢP DỮ LIỆU TỪ 53 LỚP / TOÀN TRƯỜNG) */}
          {activeTab === 'dynamic' && (
            <div className="space-y-6">
              {/* Filter controls for dynamic table */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm trong bảng dữ liệu: tên học sinh, lớp, người nộp, ghi chú..."
                      value={searchDynamic}
                      onChange={(e) => setSearchDynamic(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-indigo-600"
                  >
                    <option value="all">Tất cả các khối</option>
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>

                  <select
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-indigo-600"
                  >
                    <option value="all">Tất cả điểm trường</option>
                    <option value="THPT">Điểm THPT</option>
                    <option value="DBK">Điểm THCS Đốc Binh Kiều</option>
                    <option value="TK">Điểm THCS Tân Kiều</option>
                  </select>
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  Tổng hợp: <strong className="text-indigo-700">{consolidatedData.totalDynamicRows} bản ghi</strong> từ các lớp đã nộp
                </div>
              </div>

              {filteredDynamicTables.map((tbl) => (
                <div key={tbl.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          {tbl.title}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Bảng dữ liệu gom từ tất cả các lớp của đợt báo cáo
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {tbl.filteredRows.length} / {tbl.rows.length} dòng hiển thị
                    </span>
                  </div>

                  {tbl.filteredRows.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Không tìm thấy bản ghi nào phù hợp với bộ lọc hiện tại.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[55vh]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 shadow-2xs">
                          <tr>
                            <th className="p-2.5 w-10 text-center">STT</th>
                            <th className="p-2.5 w-20 text-center">Lớp</th>
                            <th className="p-2.5 w-28 text-center">Cơ sở</th>
                            <th className="p-2.5 w-36">Người nộp / GVCN</th>
                            {tbl.headers.map((h, hIdx) => (
                              <th key={hIdx} className="p-2.5 min-w-[120px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tbl.filteredRows.map((r, rIdx) => (
                            <tr key={rIdx} className="hover:bg-indigo-50/40 transition">
                              <td className="p-2.5 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                              <td className="p-2.5 text-center font-bold text-indigo-700">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                                  {r.className}
                                </span>
                              </td>
                              <td className="p-2.5 text-center text-slate-600 text-[11px]">
                                {r.campus === 'THPT' ? 'Điểm THPT' : (r.campus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều')}
                              </td>
                              <td className="p-2.5 font-medium text-slate-800">{r.authorName}</td>
                              {tbl.headers.map((h, hIdx) => (
                                <td key={hIdx} className="p-2.5 text-slate-700">
                                  {r.data[h] !== undefined && r.data[h] !== '' ? String(r.data[h]) : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB: MATRIX (MA TRẬN CHỈ SỐ BIỂU MẪU) */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo lớp, người nộp hoặc giá trị..."
                      value={searchDynamic}
                      onChange={(e) => setSearchDynamic(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-teal-600"
                  >
                    <option value="all">Tất cả các khối</option>
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>

                  <select
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-teal-600"
                  >
                    <option value="all">Tất cả điểm trường</option>
                    <option value="THPT">Điểm THPT</option>
                    <option value="DBK">Điểm THCS Đốc Binh Kiều</option>
                    <option value="TK">Điểm THCS Tân Kiều</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 shadow-2xs">
                      <tr>
                        <th className="p-2.5 w-10 text-center">STT</th>
                        <th className="p-2.5 w-20 text-center">Lớp</th>
                        <th className="p-2.5 w-24 text-center">Cơ sở</th>
                        <th className="p-2.5 w-36">Người báo cáo</th>
                        <th className="p-2.5 w-24 text-center">Trạng thái</th>
                        {consolidatedData.fieldMatrix.columns.map((col) => (
                          <th key={col.id} className="p-2.5 text-center min-w-[120px]">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMatrixRows.map((r) => (
                        <tr key={r.className} className={`hover:bg-teal-50/40 transition ${!r.hasSubmitted ? 'bg-slate-50/60 opacity-70' : ''}`}>
                          <td className="p-2.5 text-center text-slate-400 font-mono">{r.stt}</td>
                          <td className="p-2.5 text-center font-bold text-teal-700">{r.className}</td>
                          <td className="p-2.5 text-center text-slate-500 text-[11px]">{r.campus}</td>
                          <td className="p-2.5 text-slate-800 font-medium">{r.authorName}</td>
                          <td className="p-2.5 text-center">
                            {r.hasSubmitted ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Đã nộp</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">Chưa nộp</span>
                            )}
                          </td>
                          {consolidatedData.fieldMatrix.columns.map((col) => (
                            <td key={col.id} className={`p-2.5 ${col.type === 'number' ? 'text-center font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {r.values[col.id] !== undefined && r.values[col.id] !== '' ? String(r.values[col.id]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    {Object.keys(consolidatedData.fieldMatrix.numericTotals).length > 0 && (
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={5} className="p-2.5 text-center uppercase tracking-wider text-slate-800">
                            TỔNG CỘNG TOÀN TRƯỜNG ({consolidatedData.submittedCount}/53 lớp)
                          </td>
                          {consolidatedData.fieldMatrix.columns.map((col) => (
                            <td key={col.id} className="p-2.5 text-center text-teal-900 font-bold text-sm">
                              {col.type === 'number' ? consolidatedData.fieldMatrix.numericTotals[col.id] || 0 : '-'}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TRỢ LÝ AI TỔNG HỢP CHO BAN GIÁM HIỆU */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Báo Cáo Tóm Tắt & Phân Tích Điều Hành Cho Ban Giám Hiệu
                    </h3>
                    <p className="text-xs text-purple-200 mt-0.5">
                      Hệ thống tự động đọc và tổng hợp toàn bộ số liệu học sinh chưa ra lớp, sĩ số và phản ánh từ 53 GVCN
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAISummary}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedAI ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAI ? 'Đã sao chép!' : 'Sao chép nội dung'}</span>
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {aiSummaryText}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>
              Trường THCS & THPT Đốc Binh Kiều • Tổng số 53 lớp chủ nhiệm (18 THPT, 20 THCS ĐBK, 15 THCS TK)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
