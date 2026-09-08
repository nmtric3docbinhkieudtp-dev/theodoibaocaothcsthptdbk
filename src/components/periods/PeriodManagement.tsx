import React, { useState } from 'react';
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
  UserCheck
} from 'lucide-react';
import { ReportPeriod, ReportType, UserRole, TargetAudienceType, PeriodFormTemplate } from '../../types';
import { getAudienceLabel, getRequiredUsersForPeriod } from '../../utils/reportFilters';
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
    deletePeriod, 
    clearAllPeriods,
    sendBulkReminders, 
    submissions = [] 
  } = useReports();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null);
  
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

      {/* Quick Summary Pill Bar */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          Tổng số đợt: <strong className="text-slate-900">{periods.length}</strong>
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
          Số đợt dành riêng cho GVCN: <strong className="text-amber-800">{periods.filter(p => p.targetAudience === 'homeroom_teachers').length}</strong>
        </span>
        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-1.5">
          <School className="w-3.5 h-3.5 text-emerald-600" />
          Đội ngũ GVCN: <strong className="text-emerald-800">53 Lớp</strong> (14 THPT + 24 ĐBK + 15 Tân Kiều)
        </span>
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
      ) : (
        /* List of Periods */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {periods.map((period: ReportPeriod) => {
            const isOverdue = new Date(period.deadline).getTime() < Date.now();
            const diffMs = new Date(period.deadline).getTime() - Date.now();
            const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            
            const isHomeroomPeriod = period.targetAudience === 'homeroom_teachers';
            const requiredUsers = getRequiredUsersForPeriod(period, allUsers);
            const periodSubmissions = submissions.filter(s => s.periodId === period.id && s.status !== 'draft');

            return (
              <div
                key={period.id}
                className={`bg-white rounded-2xl p-5 border shadow-2xs hover:shadow-xs transition flex flex-col justify-between ${
                  isHomeroomPeriod 
                    ? 'border-amber-200 hover:border-amber-400 ring-1 ring-amber-100' 
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isOverdue 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      }`}>
                        {isOverdue ? '⚠️ Đã kết thúc hạn nộp' : `Đang mở (Còn ${daysRemaining} ngày)`}
                      </span>

                      {isHomeroomPeriod ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <GraduationCap className="w-3 h-3 text-amber-600" />
                          Chỉ 53 GVCN
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
                        {isHomeroomPeriod 
                          ? '53 Thầy/Cô Giáo viên chủ nhiệm' 
                          : period.targetAudience === 'specific_users'
                          ? `Chỉ định đích danh ${period.targetUserIds?.length || requiredUsers.length} Thầy/Cô`
                          : period.targetAudience === 'dept_heads_only'
                          ? '19 Tổ trưởng & Tổ phó chuyên môn'
                          : `${requiredUsers.length} cán bộ/giáo viên`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Tiến độ đã nộp:</span>
                      <span className="font-bold text-emerald-700">
                        {periodSubmissions.length} / {requiredUsers.length} người
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-amber-800 font-medium">Chưa nộp (cần nhắc):</span>
                      {onOpenUnsubmittedUsers ? (
                        <button
                          type="button"
                          onClick={() => onOpenUnsubmittedUsers(period.id)}
                          className="font-bold text-amber-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>{Math.max(0, requiredUsers.length - periodSubmissions.length)} người (Xem DS)</span>
                        </button>
                      ) : (
                        <span className="font-bold text-amber-700">
                          {Math.max(0, requiredUsers.length - periodSubmissions.length)} người
                        </span>
                      )}
                    </div>

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
                  <div className="flex items-center gap-2">
                    {submissions.some(s => s.periodId === period.id && s.authorId === currentUser.id && s.status !== 'draft') ? (
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Bạn đã nộp</span>
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

                    {onOpenUnsubmittedUsers && (isAdmin || isPrincipal || isDeptHead) && (
                      <button
                        type="button"
                        onClick={() => onOpenUnsubmittedUsers(period.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Xem danh sách chi tiết những người chưa nộp báo cáo đợt này và gửi nhắc nhở"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>DS Chưa Nộp ({Math.max(0, requiredUsers.length - periodSubmissions.length)})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(isAdmin || isPrincipal || isDeptHead) && (
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
