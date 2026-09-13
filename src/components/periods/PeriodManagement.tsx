import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { Modal } from '../common/Modal';
import { 
  CalendarRange, 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Trash2, 
  Edit, 
  Users, 
  Send,
  Building,
  Paperclip,
  Check,
  GraduationCap,
  Sparkles,
  School,
  RefreshCw,
  FolderX,
  UploadCloud,
  FileSpreadsheet,
  UserCheck,
  Cloud
} from 'lucide-react';
import { ReportPeriod, ReportType, UserRole, TargetAudienceType, PeriodFormTemplate } from '../../types';
import { 
  getAudienceLabel, 
  getRequiredUsersForPeriod, 
  hasSubmittedForPeriod,
  getPeriodSubmissionStats,
  isPeriodFullySubmitted
} from '../../utils/reportFilters';
import { CreatePeriodModal } from './CreatePeriodModal';

interface PeriodManagementProps {
  onOpenSubmit: (periodId?: string) => void;
  onOpenConsolidation?: (periodId?: string) => void;
  onOpenUnsubmittedUsers?: (periodId?: string) => void;
}

export const PeriodManagement: React.FC<PeriodManagementProps> = ({
  onOpenSubmit,
  onOpenConsolidation,
  onOpenUnsubmittedUsers
}) => {
  const { currentUser, isPrincipal, isAdmin, isDeptHead, canManagePeriods, allUsers = [] } = useAuth();
  const { 
    periods = [], 
    departments = [], 
    createPeriod, 
    updatePeriod, 
    closePeriod,
    reopenPeriod,
    deletePeriod, 
    clearAllPeriods,
    sendBulkReminders, 
    submissions = [],
    waiveAllLateStatus,
    syncPeriodsToFirebase,
    syncToFirebase,
    hasUnsyncedChanges,
    unsyncedChangesCount
  } = useReports();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null);
  const [periodStatusFilter, setPeriodStatusFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [isSyncingPeriods, setIsSyncingPeriods] = useState(false);
  
  // Deletion modals state
  const [periodToDelete, setPeriodToDelete] = useState<ReportPeriod | null>(null);
  const [isConfirmClearAllOpen, setIsConfirmClearAllOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSyncPeriodsToFirebase = async () => {
    setIsSyncingPeriods(true);
    try {
      const res = await syncToFirebase();
      showToast(res.message);
    } catch (e: any) {
      showToast('Lỗi đẩy dữ liệu lên Firebase: ' + (e.message || e));
    } finally {
      setIsSyncingPeriods(false);
    }
  };

  const handleClosePeriod = (periodId: string, periodTitle: string) => {
    closePeriod(periodId);
    showToast(`Đã kết thúc đợt báo cáo "${periodTitle}" thành công!`);
  };

  const handleReopenPeriod = (periodId: string, periodTitle: string) => {
    reopenPeriod(periodId);
    showToast(`Đã mở lại đợt báo cáo "${periodTitle}" thành công!`);
  };

  const handleWaivePeriodLate = async (periodId: string, periodTitle: string) => {
    const res = await waiveAllLateStatus(periodId);
    if (res.success) {
      showToast(`Đã miễn trừ thành công cho ${res.waivedCount} bài nộp trễ của đợt "${periodTitle}". Toàn bộ đã chuyển sang Đúng hạn!`);
    }
  };

  // Compute stats for all periods
  const periodsWithStats = useMemo(() => {
    return periods.map(p => {
      const stats = getPeriodSubmissionStats(p, submissions, allUsers);
      return {
        period: p,
        stats,
        is100Percent: stats.is100Percent,
        isCompleted: stats.isCompleted,
        isClosed: p.status === 'closed'
      };
    });
  }, [periods, submissions, allUsers]);

  const ongoingCount = useMemo(() => periodsWithStats.filter(item => !item.isCompleted).length, [periodsWithStats]);
  const completedCount = useMemo(() => periodsWithStats.filter(item => item.isCompleted).length, [periodsWithStats]);

  const filteredPeriods = useMemo(() => {
    if (periodStatusFilter === 'ongoing') return periodsWithStats.filter(item => !item.isCompleted);
    if (periodStatusFilter === 'completed') return periodsWithStats.filter(item => item.isCompleted);
    return periodsWithStats;
  }, [periodsWithStats, periodStatusFilter]);

  const [initialAudience, setInitialAudience] = useState<TargetAudienceType>('all');

  const handleOpenCreate = (presetAudience?: TargetAudienceType) => {
    setEditingPeriod(null);
    setInitialAudience(presetAudience || 'all');
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (p: ReportPeriod) => {
    setEditingPeriod(p);
    setInitialAudience(p.targetAudience || 'all');
    setIsCreateModalOpen(true);
  };

  const confirmSingleDelete = async () => {
    if (!periodToDelete) return;
    setIsDeleting(true);
    try {
      const deletedTitle = periodToDelete.title;
      await deletePeriod(periodToDelete.id);
      setPeriodToDelete(null);
      showToast(`Đã xóa vĩnh viễn đợt báo cáo "${deletedTitle}"!`);
    } catch (err) {
      console.error(err);
      showToast('❌ Có lỗi khi xóa đợt báo cáo, vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearAll = async () => {
    setIsDeleting(true);
    try {
      const res = await clearAllPeriods();
      setIsConfirmClearAllOpen(false);
      showToast(`Đã xóa sạch toàn bộ ${res.count} đợt báo cáo thành công! Quý Thầy/Cô có thể tự tạo lại từ đầu.`);
    } catch (err) {
      console.error(err);
      showToast('❌ Có lỗi khi xóa các đợt báo cáo, vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendReminder = (period: ReportPeriod) => {
    const targetUsers = getRequiredUsersForPeriod(period, allUsers);
    sendBulkReminders(period, targetUsers);
    
    const audienceNote = period.targetAudience === 'homeroom_teachers' 
      ? 'cho đúng 53 Giáo viên chủ nhiệm (GVCN)' 
      : 'cho các giáo viên trong phạm vi báo cáo';
      
    showToast(`Đã gửi email và thông báo nhắc hạn đợt "${period.title}" ${audienceNote}!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 max-w-md bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs font-medium leading-relaxed">{toastMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-emerald-600" />
            <span>Quản Lý Đợt Nộp Báo Cáo & Deadline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập thời hạn, phân nhóm đối tượng nộp (GVCN / Toàn trường / Tổ CM) và quản lý đợt nộp
          </p>
        </div>

        {canManagePeriods && (
          <div className="flex items-center flex-wrap gap-2">
            {periods.length > 0 && (
              <button
                id="btn-clear-all-periods"
                onClick={() => setIsConfirmClearAllOpen(true)}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 transition active:scale-98 cursor-pointer"
                title="Xóa toàn bộ các đợt báo cáo để tự tạo lại từ đầu"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa Hết ({periods.length}) Đợt</span>
              </button>
            )}

            <button
              id="btn-create-period-from-file"
              onClick={() => handleOpenCreate('all')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
              title="Tải lên tệp .docx, .txt hoặc .md có sẵn để hệ thống tự động bóc tách và tạo đợt báo cáo kèm Form web chuẩn"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Tạo Đợt Từ Tệp Mẫu (.docx/.txt/.md)</span>
            </button>

            <button
              id="btn-create-gvcn-period"
              onClick={() => handleOpenCreate('homeroom_teachers')}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
              title="Tạo nhanh đợt báo cáo chỉ dành riêng cho 53 GVCN"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Tạo Đợt Báo Cáo GVCN (53 Lớp)</span>
            </button>

            {onOpenUnsubmittedUsers && (isAdmin || isPrincipal || isDeptHead) && (
              <button
                id="btn-open-unsubmitted-users-top"
                type="button"
                onClick={() => onOpenUnsubmittedUsers()}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                title="Xem danh sách những người chưa nộp báo cáo để kịp thời đôn đốc trước khi hết hạn"
              >
                <Clock className="w-4 h-4 text-slate-950" />
                <span>DS Chưa Nộp & Nhắc Hạn</span>
              </button>
            )}

            {onOpenConsolidation && (
              <button
                id="btn-open-consolidation-top"
                type="button"
                onClick={() => onOpenConsolidation('all')}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                title="Tổng hợp chi tiết kết quả báo cáo của 53 lớp / toàn trường"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Tổng Hợp Số Liệu 53 Lớp</span>
              </button>
            )}

            {(isAdmin || isPrincipal) && (
              <button
                id="btn-sync-periods-to-firebase"
                type="button"
                onClick={handleSyncPeriodsToFirebase}
                disabled={isSyncingPeriods}
                className={`relative px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition active:scale-98 cursor-pointer ${
                  hasUnsyncedChanges
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 animate-pulse ring-4 ring-amber-300 ring-offset-2 hover:from-amber-600 hover:to-rose-700'
                    : 'bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white shadow-xs'
                }`}
                title={
                  hasUnsyncedChanges
                    ? `⚠️ CÓ ${unsyncedChangesCount} DỮ LIỆU MỚI! Nhấn để đẩy lên Firebase Firestore ngay để tránh quên!`
                    : "Đẩy các đợt báo cáo đã tạo/sửa lên Cloud Firestore (Chỉ tiêu tốn 1 lượt ghi cho đợt mới)"
                }
              >
                {hasUnsyncedChanges && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-90"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-600 border-2 border-white"></span>
                  </span>
                )}
                {isSyncingPeriods ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Cloud className={`w-4 h-4 ${hasUnsyncedChanges ? 'text-amber-100 animate-bounce' : 'text-sky-200'}`} />
                )}
                <span>
                  {isSyncingPeriods 
                    ? 'Đang đẩy lên Cloud...' 
                    : hasUnsyncedChanges 
                      ? `Đẩy Lên Firebase Ngay! (${unsyncedChangesCount} mới)` 
                      : 'Đẩy Đợt Báo Cáo Lên Firebase'}
                </span>
              </button>
            )}

            <button
              id="btn-create-period"
              onClick={() => handleOpenCreate('all')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đợt Báo Cáo Mới</span>
            </button>
          </div>
        )}
      </div>

      {/* Info notice for Admin about manual Firestore push */}
      {(isAdmin || isPrincipal) && (
        <div className={`p-3 px-4 rounded-xl border text-xs flex items-center justify-between gap-3 shadow-2xs transition-all ${
          hasUnsyncedChanges 
            ? 'bg-gradient-to-r from-amber-50 to-rose-50 border-amber-300 text-amber-950 ring-1 ring-amber-300/60'
            : 'bg-sky-50/80 border-sky-200/80 text-sky-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${hasUnsyncedChanges ? 'bg-rose-500 animate-ping' : 'bg-sky-500 animate-pulse'}`}></span>
            <span>
              {hasUnsyncedChanges ? (
                <>
                  <strong className="text-rose-700">⚠️ NHẮC NHỞ QUAN TRỌNG:</strong> Có <strong>{unsyncedChangesCount} dữ liệu mới/thay đổi</strong> chưa được đẩy lên Firebase Firestore! Thầy vui lòng bấm nút nhấp nháy <strong>"Đẩy Lên Firebase Ngay!"</strong> màu cam-đỏ ở trên để tránh quên dữ liệu.
                </>
              ) : (
                <>
                  <strong>Kiểm soát ghi Firebase:</strong> Toàn bộ đợt báo cáo đã đồng bộ an toàn với Cloud Firestore. Khi có bất kỳ thay đổi nào mới, nút đồng bộ sẽ tự động nhấp nháy cảnh báo ngay lập tức.
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Quick Summary Pill Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl font-semibold">
            <button
              onClick={() => setPeriodStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                periodStatusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({periods.length})
            </button>
            <button
              onClick={() => setPeriodStatusFilter('ongoing')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                periodStatusFilter === 'ongoing'
                  ? 'bg-white text-amber-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Đang mở</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {ongoingCount}
              </span>
            </button>
            <button
              onClick={() => setPeriodStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                periodStatusFilter === 'completed'
                  ? 'bg-white text-emerald-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Đã hoàn thành</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                {completedCount}
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-slate-500">
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
            Số đợt GVCN: <strong className="text-amber-800">{periods.filter(p => p.targetAudience === 'homeroom_teachers').length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-emerald-600" />
            Đội ngũ GVCN: <strong className="text-emerald-800">53 Lớp</strong>
          </span>
        </div>
      </div>

      {/* Empty State when no periods exist */}
      {periods.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CalendarRange className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">Hiện tại chưa có đợt báo cáo nào</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tất cả các đợt báo cáo cũ đã được dọn sạch. Quý Thầy/Cô Quản trị hoặc Ban Giám Hiệu có thể tự tạo các đợt báo cáo mới theo đúng nhu cầu thực tế của nhà trường.
            </p>
          </div>
          {canManagePeriods && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleOpenCreate('all')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Tạo Đợt Báo Cáo Từ Tệp Mẫu (.docx/.txt/.md)</span>
              </button>
              <button
                onClick={() => handleOpenCreate('homeroom_teachers')}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Tạo Đợt Báo Cáo GVCN (53 Lớp)</span>
              </button>
              <button
                onClick={() => handleOpenCreate('all')}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Đợt Báo Cáo Chung</span>
              </button>
            </div>
          )}
        </div>
      ) : filteredPeriods.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Không có đợt báo cáo nào trong mục này</h3>
          <p className="text-xs text-slate-500">
            Vui lòng chọn tab "Tất cả" hoặc tạo thêm đợt báo cáo mới.
          </p>
        </div>
      ) : (
        /* List of Periods */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPeriods.map(({ period, stats, is100Percent, isCompleted, isClosed }) => {
            const isOverdue = !isCompleted && new Date(period.deadline).getTime() < Date.now();
            const diffMs = new Date(period.deadline).getTime() - Date.now();
            const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            
            const isAllHomeroom = period.targetAudience === 'homeroom_teachers';
            const isMainCampusHomeroom = period.targetAudience === 'gvcn_diem_chinh';
            const isDbkHomeroom = period.targetAudience === 'gvcn_doc_binh_kieu';
            const isTkHomeroom = period.targetAudience === 'gvcn_tan_kieu';
            const isHomeroomPeriod = isAllHomeroom || isMainCampusHomeroom || isDbkHomeroom || isTkHomeroom;
            const requiredUsers = stats.requiredUsers;
            const periodSubmissions = submissions.filter(s => s.periodId === period.id && s.status !== 'draft');
            const submittedCount = stats.submittedCount;

            return (
              <div
                key={period.id}
                className={`bg-white rounded-2xl p-5 border shadow-2xs hover:shadow-xs transition flex flex-col justify-between ${
                  isCompleted
                    ? 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-b from-emerald-50/15 to-white'
                    : isHomeroomPeriod 
                    ? 'border-amber-200 hover:border-amber-400 ring-1 ring-amber-100' 
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isCompleted ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{is100Percent ? '✅ Đã hoàn thành (100% nộp đủ)' : '🔒 Đã kết thúc đợt'}</span>
                        </span>
                      ) : (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isOverdue 
                            ? 'bg-rose-50 text-rose-700 border-rose-200' 
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}>
                          {isOverdue ? '⚠️ Đã kết thúc hạn nộp' : `Đang mở (Còn ${daysRemaining} ngày)`}
                        </span>
                      )}

                      {isAllHomeroom ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-amber-600" />
                          Chỉ 53 GVCN
                        </span>
                      ) : isMainCampusHomeroom ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-emerald-600" />
                          GVCN Điểm chính (14 lớp)
                        </span>
                      ) : isDbkHomeroom ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-300 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-sky-600" />
                          GVCN Điểm ĐBK (24 lớp)
                        </span>
                      ) : isTkHomeroom ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-300 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-teal-600" />
                          GVCN Điểm Tân Kiều (15 lớp)
                        </span>
                      ) : period.targetAudience === 'specific_users' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-300 flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-indigo-600" />
                          Chỉ định đích danh ({period.targetUserIds?.length || requiredUsers.length} Thầy/Cô)
                        </span>
                      ) : period.targetAudience === 'dept_heads_only' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-300 flex items-center gap-1">
                          <Users className="w-3 h-3 text-blue-600" />
                          19 Tổ trưởng & Tổ phó CM
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {getAudienceLabel(period.targetAudience, period.targetDepartmentIds, period.targetUserIds)}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-semibold shrink-0">
                      {period.semester} • {period.academicYear}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {period.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {period.description}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Hạn nộp chót:</span>
                      <span className="font-bold text-slate-900">
                        {new Date(period.deadline).toLocaleString('vi-VN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">Đối tượng báo cáo:</span>
                      <span className="font-bold text-amber-700">
                        {isAllHomeroom 
                          ? '53 Thầy/Cô GVCN (Cả 3 điểm)' 
                          : isMainCampusHomeroom
                          ? '14 Thầy/Cô GVCN Điểm chính (THPT)'
                          : isDbkHomeroom
                          ? '24 Thầy/Cô GVCN Điểm Đốc Binh Kiều'
                          : isTkHomeroom
                          ? '15 Thầy/Cô GVCN Điểm Tân Kiều'
                          : period.targetAudience === 'specific_users'
                          ? `Chỉ định đích danh ${period.targetUserIds?.length || requiredUsers.length} Thầy/Cô`
                          : period.targetAudience === 'dept_heads_only'
                          ? '19 Tổ trưởng & Tổ phó chuyên môn'
                          : `${requiredUsers.length} cán bộ/giáo viên`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Tiến độ đã nộp:</span>
                      <span className={`font-bold ${isCompleted ? 'text-emerald-700 font-black' : 'text-emerald-700'}`}>
                        {submittedCount} / {requiredUsers.length} người ({stats.completionRate}%)
                      </span>
                    </div>

                    {isCompleted ? (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-800 font-medium">Tình trạng thực hiện:</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>100% Thầy/Cô đã hoàn tất nộp đủ</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-amber-800 font-medium">Chưa nộp (cần nhắc):</span>
                        {onOpenUnsubmittedUsers ? (
                          <button
                            type="button"
                            onClick={() => onOpenUnsubmittedUsers(period.id)}
                            className="font-bold text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{stats.pendingCount} người (Xem DS)</span>
                          </button>
                        ) : (
                          <span className="font-bold text-amber-700">
                            {stats.pendingCount} người
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span>Định dạng yêu cầu:</span>
                      <span className="font-medium text-slate-700">
                        {period.reportType === 'text_only' ? 'Văn bản trực tiếp' : 'Hỗ trợ đính kèm tệp'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center flex-wrap gap-2">
                    {submissions.some(s => s.periodId === period.id && s.authorId === currentUser.id && s.status !== 'draft') ? (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bạn đã nộp</span>
                      </div>
                    ) : isCompleted ? (
                      <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Đã hoàn thành</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenSubmit(period.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Nộp báo cáo</span>
                      </button>
                    )}

                    {/* Admin / Principal: Button to End Period (Kết thúc đợt) or Reopen (Mở lại) */}
                    {canManagePeriods && (
                      !isClosed ? (
                        <button
                          type="button"
                          onClick={() => handleClosePeriod(period.id, period.title)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                          title="Kết thúc và chốt số liệu cho đợt báo cáo này"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Kết thúc đợt</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleReopenPeriod(period.id, period.title)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                          title="Mở lại đợt báo cáo này nếu cần nhận thêm báo cáo"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                          <span>Mở lại đợt</span>
                        </button>
                      )
                    )}

                    {onOpenConsolidation && (isAdmin || isPrincipal) && (
                      <button
                        type="button"
                        onClick={() => onOpenConsolidation(period.id)}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Tổng hợp chi tiết kết quả báo cáo của đợt này"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
                        <span>Tổng Hợp Số Liệu</span>
                      </button>
                    )}

                    {onOpenUnsubmittedUsers && (isAdmin || isPrincipal || isDeptHead) && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => onOpenUnsubmittedUsers(period.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Xem danh sách chi tiết những người chưa nộp báo cáo đợt này và gửi nhắc nhở"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>DS Chưa Nộp ({stats.pendingCount})</span>
                      </button>
                    )}

                    {(isAdmin || isPrincipal) && periodSubmissions.some(s => s.isLate) && (
                      <button
                        type="button"
                        onClick={() => handleWaivePeriodLate(period.id, period.title)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Chuyển toàn bộ báo cáo nộp trễ của đợt này thành đúng hạn do sự cố hệ thống"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Miễn trừ trễ ({periodSubmissions.filter(s => s.isLate).length})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(isAdmin || isPrincipal || isDeptHead) && !isCompleted && stats.pendingCount > 0 && (
                      <button
                        onClick={() => handleSendReminder(period)}
                        title={isHomeroomPeriod ? "Gửi email nhắc hạn cho các GVCN chưa nộp" : "Gửi email nhắc hạn cho giáo viên"}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Mail className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">Gửi Email nhắc</span>
                      </button>
                    )}

                    {canManagePeriods && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(period)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Chỉnh sửa đợt báo cáo"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPeriodToDelete(period)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Xóa đợt báo cáo này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Confirmation Modal: Delete Single Period */}
      <Modal
        isOpen={!!periodToDelete}
        onClose={() => setPeriodToDelete(null)}
        title="Xác Nhận Xóa Đợt Báo Cáo"
        subtitle="Hệ thống quản lý báo cáo THCS & THPT Đốc Binh Kiều"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-rose-950">
                Thầy/Cô có chắc chắn muốn xóa đợt báo cáo này?
              </p>
              <p className="mt-1 font-semibold text-slate-800">
                "{periodToDelete?.title}"
              </p>
              <p className="mt-2 text-[11px] text-rose-700">
                Hành động này sẽ xóa đợt báo cáo khỏi hệ thống và Firebase.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setPeriodToDelete(null)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={confirmSingleDelete}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xóa...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Xóa Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* In-App Confirmation Modal: Clear ALL Periods */}
      <Modal
        isOpen={isConfirmClearAllOpen}
        onClose={() => setIsConfirmClearAllOpen(false)}
        title="Xác Nhận Xóa Hết Toàn Bộ Đợt Báo Cáo"
        subtitle="Khởi tạo lại danh sách đợt báo cáo từ đầu"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-rose-950">
                Xóa tất cả {periods.length} đợt báo cáo hiện có?
              </p>
              <p className="mt-1 text-slate-700">
                Toàn bộ các đợt báo cáo mẫu/thử nghiệm sẽ được dọn sạch hoàn toàn khỏi hệ thống và Firebase để Quý Thầy/Cô tự thiết lập lại từ đầu.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setIsConfirmClearAllOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={confirmClearAll}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang dọn sạch...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xác Nhận Xóa Hết</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create / Edit Period Modal with smart File Import, Deadline Presets & Enforcement */}
      <CreatePeriodModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPeriod(null);
        }}
        editingPeriod={editingPeriod}
        initialAudience={initialAudience}
        onSuccess={(periodTitle) => {
          showToast(`Đã lưu đợt báo cáo "${periodTitle}" thành công!`);
        }}
      />

    </div>
  );
};
