import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { ExportService } from '../../services/exportService';
import { getRequiredUsersForPeriod, getAudienceLabel } from '../../utils/reportFilters';
import { ReportPeriod, User, ReportSubmission } from '../../types';
import { 
  X, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  FileSpreadsheet, 
  GraduationCap, 
  UserCheck, 
  Send, 
  AlertCircle,
  Building,
  School,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface UnsubmittedUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriodId?: string;
  onOpenReportDetail?: (submission: ReportSubmission) => void;
}

export const UnsubmittedUsersModal: React.FC<UnsubmittedUsersModalProps> = ({
  isOpen,
  onClose,
  defaultPeriodId,
  onOpenReportDetail
}) => {
  const { allUsers = [], currentUser, isAdmin, isPrincipal, isDeptHead } = useAuth();
  const { 
    periods = [], 
    submissions = [], 
    departments = [], 
    schoolInfo, 
    sendBulkReminders, 
    sendDeadlineReminderToUser,
    confirmSubmissionForTeacher
  } = useReports();

  // Selected period state
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    if (defaultPeriodId) return defaultPeriodId;
    const active = periods.find(p => p.status === 'active');
    return active?.id || periods[0]?.id || '';
  });

  // Keep state in sync if defaultPeriodId changes
  React.useEffect(() => {
    if (defaultPeriodId) {
      setSelectedPeriodId(defaultPeriodId);
    } else if (!selectedPeriodId && periods.length > 0) {
      const active = periods.find(p => p.status === 'active');
      setSelectedPeriodId(active?.id || periods[0]?.id || '');
    }
  }, [defaultPeriodId, periods]);

  // Tab filter: 'unsubmitted' (default) | 'submitted' | 'all'
  const [statusFilter, setStatusFilter] = useState<'unsubmitted' | 'submitted' | 'all'>('unsubmitted');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Feedback states
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [remindedUserIds, setRemindedUserIds] = useState<Record<string, boolean>>({});
  const [bulkSentSuccess, setBulkSentSuccess] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

  // Active period object
  const currentPeriod = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId) || periods[0] || null;
  }, [periods, selectedPeriodId]);

  // Deadline calculations
  const deadlineInfo = useMemo(() => {
    if (!currentPeriod) return { isOverdue: false, remainingText: '', diffHours: 0 };
    const diffMs = new Date(currentPeriod.deadline).getTime() - Date.now();
    const isOverdue = diffMs < 0;

    if (isOverdue) {
      const pastHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60));
      const pastDays = Math.floor(pastHours / 24);
      return {
        isOverdue: true,
        remainingText: `Đã quá hạn ${pastDays > 0 ? `${pastDays} ngày` : `${pastHours} giờ`}`,
        diffHours: -pastHours
      };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0) {
      return {
        isOverdue: false,
        remainingText: `Hạn chót hôm nay (còn ${hours} giờ)`,
        diffHours: hours
      };
    }

    return {
      isOverdue: false,
      remainingText: `Còn ${days} ngày ${hours} giờ`,
      diffHours: days * 24 + hours
    };
  }, [currentPeriod]);

  // All required users for this period
  const requiredUsers = useMemo(() => {
    if (!currentPeriod) return [];
    return getRequiredUsersForPeriod(currentPeriod, allUsers);
  }, [currentPeriod, allUsers]);

  // Submissions for this period (excluding drafts)
  const periodSubmissions = useMemo(() => {
    if (!currentPeriod) return [];
    return submissions.filter(s => s.periodId === currentPeriod.id && s.status !== 'draft');
  }, [currentPeriod, submissions]);

  // Map authorId -> Submission
  const submissionByAuthorId = useMemo(() => {
    const map = new Map<string, ReportSubmission>();
    for (const sub of periodSubmissions) {
      map.set(sub.authorId, sub);
    }
    return map;
  }, [periodSubmissions]);

  // Unsubmitted and Submitted lists
  const { unsubmittedList, submittedList } = useMemo(() => {
    const unsubmitted: Array<User & { submissionStatus: string; submittedAt: string | null; submission?: ReportSubmission }> = [];
    const submitted: Array<User & { submissionStatus: string; submittedAt: string | null; submission?: ReportSubmission }> = [];

    for (const user of requiredUsers) {
      const sub = submissionByAuthorId.get(user.id);
      if (sub) {
        submitted.push({
          ...user,
          submissionStatus: 'submitted',
          submittedAt: sub.submittedAt || null,
          submission: sub
        });
      } else {
        unsubmitted.push({
          ...user,
          submissionStatus: 'unsubmitted',
          submittedAt: null
        });
      }
    }

    return { unsubmittedList: unsubmitted, submittedList: submitted };
  }, [requiredUsers, submissionByAuthorId]);

  // Filtered roster for table display
  const displayedUsers = useMemo(() => {
    let source = statusFilter === 'unsubmitted' 
      ? unsubmittedList 
      : statusFilter === 'submitted' 
      ? submittedList 
      : [...unsubmittedList, ...submittedList];

    return source.filter(u => {
      // Filter by department
      if (deptFilter !== 'all' && u.departmentId !== deptFilter) return false;

      // Filter by campus
      if (campusFilter !== 'all') {
        if (campusFilter === 'THPT' && u.homeroomCampus !== 'THPT' && u.originalSchool !== 'THPTĐBK') return false;
        if (campusFilter === 'DBK' && u.homeroomCampus !== 'DBK' && u.originalSchool !== 'THCSĐBK') return false;
        if (campusFilter === 'TK' && u.homeroomCampus !== 'TK' && u.originalSchool !== 'THCSTK') return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchRole = (u.roleTitle || '').toLowerCase().includes(q);
        const matchDept = (u.departmentName || '').toLowerCase().includes(q);
        const matchClass = (u.homeroomClass || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchSubject = (u.subject || '').toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchDept && !matchClass && !matchPhone && !matchEmail && !matchSubject) {
          return false;
        }
      }

      return true;
    });
  }, [statusFilter, unsubmittedList, submittedList, deptFilter, campusFilter, searchTerm]);

  // Handle Copy Zalo Reminder Text
  const handleCopyZalo = () => {
    if (!currentPeriod) return;

    const listText = unsubmittedList.map((u, idx) => {
      const roleOrClass = u.isHomeroomTeacher 
        ? `GVCN ${u.homeroomClass} (${u.homeroomCampus === 'THPT' ? 'Điểm THPT' : (u.homeroomCampus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều')})`
        : `${u.roleTitle} - ${u.departmentName}`;
      const phoneText = u.phone && u.phone !== '-' ? ` (SĐT: ${u.phone})` : '';
      return `${idx + 1}. ${u.name} - ${roleOrClass}${phoneText}`;
    }).join('\n');

    const message = `📢 [THÔNG BÁO NHẮC HẠN NỘP BÁO CÁO - ${schoolInfo.name.toUpperCase()}]
📌 Đợt báo cáo: ${currentPeriod.title}
⏰ Thời hạn chót: ${new Date(currentPeriod.deadline).toLocaleString('vi-VN')} (${deadlineInfo.remainingText})
📊 Tiến độ: Đã hoàn thành ${submittedList.length}/${requiredUsers.length} (${Math.round((submittedList.length / Math.max(requiredUsers.length, 1)) * 100)}%)

Kính gửi quý Thầy/Cô, hiện tại hệ thống ghi nhận còn ${unsubmittedList.length} Thầy/Cô chưa hoàn tất báo cáo:
${listText}

👉 Kính nhờ quý Thầy/Cô khẩn trương truy cập phần mềm và nộp báo cáo trước thời hạn quy định để tránh bị ghi nhận nộp trễ và kịp thời tổng hợp dữ liệu nhà trường.
Trân trọng cảm ơn quý Thầy/Cô!`;

    navigator.clipboard.writeText(message);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  // Handle Bulk Email Reminders
  const handleSendBulkEmail = () => {
    if (!currentPeriod || unsubmittedList.length === 0) return;
    sendBulkReminders(currentPeriod, unsubmittedList);
    setBulkSentSuccess(true);
    setTimeout(() => setBulkSentSuccess(false), 4000);
  };

  // Handle Individual Reminder
  const handleRemindSingleUser = (user: User) => {
    if (!currentPeriod) return;
    sendDeadlineReminderToUser(user, currentPeriod);
    setRemindedUserIds(prev => ({ ...prev, [user.id]: true }));
    setTimeout(() => {
      setRemindedUserIds(prev => ({ ...prev, [user.id]: false }));
    }, 4000);
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    if (!currentPeriod) return;
    setExportingExcel(true);
    try {
      ExportService.exportUnsubmittedUsersToExcel(
        currentPeriod, 
        displayedUsers, 
        schoolInfo,
        statusFilter === 'unsubmitted' ? 'DS_Giao_Vien_Chua_Nop' : 'Theo_Doi_Tien_Do_Bao_Cao'
      );
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi tạo tệp Excel, vui lòng thử lại.');
    } finally {
      setExportingExcel(false);
    }
  };

  if (!isOpen) return null;

  const completionPercent = requiredUsers.length > 0 
    ? Math.round((submittedList.length / requiredUsers.length) * 100) 
    : 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200/90 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                  Theo Dõi Đôn Đốc & Nhắc Hạn
                </span>
                {currentPeriod && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    deadlineInfo.isOverdue 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {deadlineInfo.remainingText}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate mt-0.5">
                Danh Sách Giáo Viên Chưa Nộp Báo Cáo
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Period Selector & Statistics Overview */}
        <div className="px-5 py-3.5 sm:px-6 bg-slate-50 border-b border-slate-200/80 space-y-3">
          
          {/* Period Selection Dropdown & Audience Details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 min-w-[260px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Chọn đợt báo cáo để kiểm tra danh sách:
              </label>
              <div className="relative">
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2 pr-8 focus:ring-2 focus:ring-amber-500 focus:outline-hidden shadow-2xs"
                >
                  {periods.map(p => {
                    const isOver = new Date(p.deadline).getTime() < Date.now();
                    const statusText = isOver ? 'Đã hết hạn' : 'Đang mở';
                    return (
                      <option key={p.id} value={p.id}>
                        [{statusText}] {p.title} (Hạn: {new Date(p.deadline).toLocaleDateString('vi-VN')})
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {currentPeriod && (
              <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 shrink-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Đối tượng nộp:</span>
                  <strong className="text-amber-800">
                    {getAudienceLabel(currentPeriod.targetAudience, currentPeriod.targetDepartmentIds, currentPeriod.targetUserIds)}
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Hạn chót:</span>
                  <strong className="text-slate-900">
                    {new Date(currentPeriod.deadline).toLocaleString('vi-VN')}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">Cần nộp</div>
                <div className="text-base font-black text-slate-900">{requiredUsers.length} người</div>
              </div>
              <Users className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Đã nộp</div>
                <div className="text-base font-black text-emerald-700">{submittedList.length} người</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-amber-700 uppercase">Chưa nộp</div>
                <div className="text-base font-black text-amber-900 flex items-center gap-1.5">
                  <span>{unsubmittedList.length} người</span>
                  {unsubmittedList.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
              </div>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold text-teal-600 uppercase">Tỷ lệ nộp</div>
                <div className="text-base font-black text-teal-700">{completionPercent}%</div>
              </div>
              <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center font-bold text-[10px] text-teal-700">
                {completionPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls & Action Buttons */}
        <div className="px-5 py-3 sm:px-6 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          
          {/* Status Tabs: Chưa nộp | Đã nộp | Tất cả */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setStatusFilter('unsubmitted')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'unsubmitted'
                  ? 'bg-amber-500 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Chưa nộp</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'unsubmitted' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {unsubmittedList.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'submitted'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Đã nộp</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'submitted' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {submittedList.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Tất cả</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {requiredUsers.length}
              </span>
            </button>
          </div>

          {/* Search & Dept Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, lớp, môn, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-amber-600"
              />
            </div>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-amber-600"
            >
              <option value="all">Tất cả tổ chuyên môn</option>
              {departments.filter(d => d.id !== 'bgh').map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            {currentPeriod?.targetAudience === 'homeroom_teachers' && (
              <select
                value={campusFilter}
                onChange={(e) => setCampusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-amber-600"
              >
                <option value="all">Tất cả điểm trường</option>
                <option value="THPT">Điểm THPT (14 lớp)</option>
                <option value="DBK">Điểm Đốc Binh Kiều (24 lớp)</option>
                <option value="TK">Điểm Tân Kiều (15 lớp)</option>
              </select>
            )}

            {/* ACTION 1: Copy Zalo message */}
            <button
              type="button"
              onClick={handleCopyZalo}
              disabled={unsubmittedList.length === 0}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-98 cursor-pointer ${
                copiedZalo
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs ring-2 ring-amber-300/40'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Sao chép văn bản thông báo nhắc hạn hoàn chỉnh để gửi vào nhóm Zalo"
            >
              {copiedZalo ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedZalo ? 'Đã sao chép Zalo!' : '📋 Sao chép nhắc Zalo'}</span>
            </button>

            {/* ACTION 2: Bulk Email Reminder */}
            {(isAdmin || isPrincipal || isDeptHead) && (
              <button
                type="button"
                onClick={handleSendBulkEmail}
                disabled={unsubmittedList.length === 0}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition active:scale-98 cursor-pointer ${
                  bulkSentSuccess 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Gửi email nhắc hạn cho tất cả giáo viên chưa nộp trong đợt này"
              >
                {bulkSentSuccess ? <Check className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                <span>{bulkSentSuccess ? 'Đã gửi Email!' : 'Gửi Email nhắc tất cả'}</span>
              </button>
            )}

            {/* ACTION 3: Export Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exportingExcel || displayedUsers.length === 0}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              title="Xuất danh sách ra tệp Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {displayedUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">
                {statusFilter === 'unsubmitted' 
                  ? 'Tuyệt vời! 100% Thầy/Cô đã hoàn tất nộp báo cáo đúng hạn.'
                  : 'Không tìm thấy giáo viên nào phù hợp với điều kiện tìm kiếm.'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {statusFilter === 'unsubmitted'
                  ? 'Không còn ai chưa nộp báo cáo trong đợt này. Quý Thầy/Cô Quản trị có thể tiến hành tổng hợp số liệu.'
                  : 'Vui lòng xóa ô tìm kiếm hoặc chọn lại bộ lọc tổ chuyên môn / điểm trường.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto max-h-[58vh]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10 shadow-2xs">
                    <tr>
                      <th className="p-3 w-12 text-center">STT</th>
                      <th className="p-3 min-w-[200px]">Họ và Tên Cán Bộ / Giáo Viên</th>
                      <th className="p-3 w-36">Chức Vụ</th>
                      <th className="p-3 w-40">Tổ Chuyên Môn</th>
                      <th className="p-3 w-36">Lớp CN / Điểm</th>
                      <th className="p-3 w-32">Số Điện Thoại</th>
                      <th className="p-3 w-32 text-center">Tình Trạng</th>
                      <th className="p-3 w-40 text-center">Thời Gian Nộp</th>
                      <th className="p-3 w-32 text-right">Đôn Đốc / Nhắc Nhở</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedUsers.map((user, idx) => {
                      const isSubmitted = user.submissionStatus === 'submitted';
                      const isReminded = remindedUserIds[user.id];

                      return (
                        <tr 
                          key={user.id} 
                          className={`transition ${!isSubmitted ? 'hover:bg-amber-50/40 bg-amber-50/15' : 'hover:bg-slate-50'}`}
                        >
                          <td className="p-3 text-center text-slate-500 font-medium">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                isSubmitted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                              }`}>
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span>{user.name}</span>
                                  {user.isHomeroomTeacher && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                                      <GraduationCap className="w-2.5 h-2.5 text-amber-700" />
                                      GVCN {user.homeroomClass}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">
                            {user.roleTitle}
                          </td>
                          <td className="p-3 text-slate-600">
                            {user.departmentName}
                          </td>
                          <td className="p-3 text-slate-600">
                            {user.isHomeroomTeacher ? (
                              <div>
                                <span className="font-bold text-slate-900">Lớp {user.homeroomClass}</span>
                                <span className="text-[10px] text-slate-400 block">
                                  {user.homeroomCampus === 'THPT' ? 'Điểm THPT' : (user.homeroomCampus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều')}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">{user.subject || '-'}</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {user.phone && user.phone !== '-' ? (
                              <a 
                                href={`tel:${user.phone}`} 
                                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                                title="Bấm để gọi điện đôn đốc"
                              >
                                <Phone className="w-3 h-3 text-blue-500" />
                                <span>{user.phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isSubmitted ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Đã nộp</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                <span>Chưa nộp</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center text-slate-600">
                            {user.submittedAt ? (
                              <div>
                                <span className="font-semibold text-slate-900">{new Date(user.submittedAt).toLocaleDateString('vi-VN')}</span>
                                <span className="text-[10px] text-slate-400 block">{new Date(user.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ) : (
                              <span className="text-amber-700 font-medium text-[11px]">
                                {deadlineInfo.isOverdue ? 'Quá hạn' : deadlineInfo.remainingText}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {isSubmitted ? (
                              user.submission && onOpenReportDetail ? (
                                <button
                                  type="button"
                                  onClick={() => onOpenReportDetail(user.submission!)}
                                  className="px-2 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold inline-flex items-center gap-1 border border-emerald-200 cursor-pointer"
                                >
                                  <span>Xem bài</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Đã nộp</span>
                              )
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                {(isAdmin || isPrincipal) && currentPeriod && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (window.confirm(`Xác nhận Thầy/Cô ${user.name} đã hoàn thành và nộp báo cáo đợt này?\n\nHệ thống sẽ lập tức cập nhật trạng thái "Đã nộp" và đồng bộ liên máy cho toàn trường.`)) {
                                        await confirmSubmissionForTeacher(user, currentPeriod);
                                      }
                                    }}
                                    className="px-2 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer"
                                    title={`Xác nhận đã nộp cho ${user.name}`}
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Xác nhận nộp</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemindSingleUser(user)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition cursor-pointer ${
                                    isReminded
                                      ? 'bg-slate-200 text-slate-700'
                                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                                  }`}
                                  title={`Gửi email nhắc hạn cho ${user.name}`}
                                >
                                  {isReminded ? <Check className="w-3 h-3" /> : <Mail className="w-3 h-3 text-amber-800" />}
                                  <span>{isReminded ? 'Đã gửi' : 'Nhắc'}</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 sm:px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500">
            Hiển thị <strong>{displayedUsers.length}</strong> giáo viên • Đợt: <strong>{currentPeriod?.title}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyZalo}
              disabled={unsubmittedList.length === 0}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Sao chép Zalo ({unsubmittedList.length})</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
