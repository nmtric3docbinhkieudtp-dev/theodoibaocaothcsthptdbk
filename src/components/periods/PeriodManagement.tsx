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
  School
} from 'lucide-react';
import { ReportPeriod, ReportType, UserRole, TargetAudienceType } from '../../types';
import { getAudienceLabel, getRequiredUsersForPeriod } from '../../utils/reportFilters';

interface PeriodManagementProps {
  onOpenSubmit: (periodId?: string) => void;
}

export const PeriodManagement: React.FC<PeriodManagementProps> = ({
  onOpenSubmit
}) => {
  const { isPrincipal, isAdmin, canManagePeriods, allUsers = [] } = useAuth();
  const { periods = [], departments = [], createPeriod, updatePeriod, deletePeriod, sendBulkReminders, submissions = [] } = useReports();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [semester, setSemester] = useState<'HK1' | 'HK2' | 'Ca_Nam'>('HK1');
  const [deadline, setDeadline] = useState('');
  const [reportType, setReportType] = useState<ReportType>('hybrid');
  const [targetAudience, setTargetAudience] = useState<TargetAudienceType>('all');
  const [isRequired, setIsRequired] = useState(true);
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['all']);

  const handleOpenCreate = (presetAudience?: TargetAudienceType) => {
    setTitle('');
    setDescription('');
    setAcademicYear('2026-2027');
    setSemester('HK1');
    // Default deadline 7 days from now
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setDeadline(nextWeek.toISOString().slice(0, 16));
    setReportType('hybrid');
    setTargetAudience(presetAudience || 'all');
    setIsRequired(true);
    setSelectedDepts(['all']);
    setEditingPeriod(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (p: ReportPeriod) => {
    setEditingPeriod(p);
    setTitle(p.title);
    setDescription(p.description);
    setAcademicYear(p.academicYear);
    setSemester(p.semester as any);
    setDeadline(new Date(p.deadline).toISOString().slice(0, 16));
    setReportType(p.reportType);
    setTargetAudience(p.targetAudience || 'all');
    setIsRequired(p.isRequired);
    setSelectedDepts(p.targetDepartmentIds || ['all']);
    setIsCreateModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      alert('Vui lòng nhập đầy đủ tiêu đề và hạn chót!');
      return;
    }

    const deadlineIso = new Date(deadline).toISOString();
    const isPast = new Date(deadline).getTime() < Date.now();

    if (editingPeriod) {
      updatePeriod(editingPeriod.id, {
        title,
        description,
        academicYear,
        semester,
        deadline: deadlineIso,
        reportType,
        targetAudience,
        isRequired,
        targetDepartmentIds: selectedDepts,
        status: isPast ? 'closed' : 'active'
      });
    } else {
      createPeriod({
        title,
        description,
        academicYear,
        semester,
        startDate: new Date().toISOString(),
        deadline: deadlineIso,
        reportType,
        targetAudience,
        isRequired,
        targetDepartmentIds: selectedDepts,
        targetRoles: ['teacher', 'dept_head'],
        status: isPast ? 'closed' : 'active',
        createdBy: 'Ban Giám Hiệu'
      });
    }

    setIsCreateModalOpen(false);
  };

  const handleSendReminder = (period: ReportPeriod) => {
    const targetUsers = getRequiredUsersForPeriod(period, allUsers);
    sendBulkReminders(period, targetUsers);
    
    const audienceNote = period.targetAudience === 'homeroom_teachers' 
      ? 'cho đúng 53 Giáo viên chủ nhiệm (GVCN)' 
      : 'cho các giáo viên trong phạm vi báo cáo';
      
    alert(`Đã gửi email và thông báo nhắc hạn đợt "${period.title}" ${audienceNote}!`);
  };

  const homeroomCount = allUsers.filter(u => u.isHomeroomTeacher).length || 53;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-emerald-600" />
            <span>Quản Lý Đợt Nộp Báo Cáo & Deadline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập thời hạn, phân nhóm đối tượng nộp (GVCN / Toàn trường / Tổ CM) và gửi email nhắc tự động
          </p>
        </div>

        {canManagePeriods && (
          <div className="flex items-center gap-2">
            <button
              id="btn-create-gvcn-period"
              onClick={() => {
                handleOpenCreate('homeroom_teachers');
                setTitle('Báo cáo công tác Giáo viên chủ nhiệm (GVCN) tháng ');
                setDescription('Dành cho 53 Giáo viên chủ nhiệm: Cập nhật sĩ số học sinh, nề nếp chuyên cần, các trường hợp khó khăn và kế hoạch phối hợp phụ huynh.');
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
              title="Tạo nhanh đợt báo cáo chỉ dành riêng cho 53 GVCN"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Tạo Đợt Báo Cáo GVCN (53 Lớp)</span>
            </button>

            <button
              id="btn-create-period"
              onClick={() => handleOpenCreate('all')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Đợt Báo Cáo Chung</span>
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

      {/* List of Periods */}
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
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {getAudienceLabel(period.targetAudience, period.targetDepartmentIds)}
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
                      {isHomeroomPeriod ? '53 Thầy/Cô Giáo viên chủ nhiệm' : `${requiredUsers.length} cán bộ/giáo viên`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Tiến độ đã nộp:</span>
                    <span className="font-bold text-emerald-700">
                      {periodSubmissions.length} / {requiredUsers.length} người
                    </span>
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
                <button
                  onClick={() => onOpenSubmit(period.id)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Nộp báo cáo</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleSendReminder(period)}
                    title={isHomeroomPeriod ? "Gửi email nhắc hạn cho các GVCN chưa nộp" : "Gửi email nhắc hạn cho giáo viên"}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline">Gửi Email nhắc</span>
                  </button>

                  {canManagePeriods && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(period)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                        title="Chỉnh sửa đợt"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa đợt báo cáo "${period.title}"?`)) {
                            deletePeriod(period.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa đợt"
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

      {/* Create / Edit Period Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingPeriod ? 'Chỉnh Sửa Đợt Báo Cáo' : 'Tạo Đợt Báo Cáo Mới'}
        subtitle="Hệ thống quản lý báo cáo trường THCS & THPT Đốc Binh Kiều"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên Đợt Báo Cáo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Báo cáo công tác Giáo viên chủ nhiệm tháng 9..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Target Audience Selector (GVCN vs Toàn trường vs Khác) */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
            <label className="block text-xs font-bold text-amber-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-amber-700" />
                Đối tượng thực hiện báo cáo <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-semibold text-amber-800">
                {targetAudience === 'homeroom_teachers' ? 'Chỉ 53 Giáo viên chủ nhiệm mới thấy' : 'Theo phạm vi đã chọn'}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTargetAudience('homeroom_teachers')}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                  targetAudience === 'homeroom_teachers'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-amber-200 hover:bg-amber-100/50'
                }`}
              >
                <GraduationCap className={`w-5 h-5 shrink-0 mt-0.5 ${targetAudience === 'homeroom_teachers' ? 'text-white' : 'text-amber-600'}`} />
                <div>
                  <div className="font-bold text-xs">Chỉ Giáo viên chủ nhiệm (GVCN)</div>
                  <div className={`text-[11px] ${targetAudience === 'homeroom_teachers' ? 'text-amber-100' : 'text-slate-500'}`}>
                    53 lớp (14 THPT + 24 ĐBK + 15 Tân Kiều). Người khác không thấy.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('all')}
                className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                  targetAudience === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <School className={`w-5 h-5 shrink-0 mt-0.5 ${targetAudience === 'all' ? 'text-white' : 'text-emerald-600'}`} />
                <div>
                  <div className="font-bold text-xs">Toàn trường (120 Cán bộ - GV - NV)</div>
                  <div className={`text-[11px] ${targetAudience === 'all' ? 'text-emerald-100' : 'text-slate-500'}`}>
                    Tất cả cán bộ giáo viên, nhân viên 7 tổ toàn trường.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('dept_heads_only')}
                className={`p-2 rounded-xl border text-left flex items-start gap-2 transition cursor-pointer ${
                  targetAudience === 'dept_heads_only'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 mt-0.5 ${targetAudience === 'dept_heads_only' ? 'text-white' : 'text-blue-600'}`} />
                <div>
                  <div className="font-bold text-xs">Chỉ Tổ trưởng & Tổ phó</div>
                  <div className={`text-[11px] ${targetAudience === 'dept_heads_only' ? 'text-blue-100' : 'text-slate-500'}`}>
                    15 thầy/cô lãnh đạo các tổ chuyên môn.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('teachers_only')}
                className={`p-2 rounded-xl border text-left flex items-start gap-2 transition cursor-pointer ${
                  targetAudience === 'teachers_only'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 shrink-0 mt-0.5 ${targetAudience === 'teachers_only' ? 'text-white' : 'text-purple-600'}`} />
                <div>
                  <div className="font-bold text-xs">Giáo viên giảng dạy (106 GV)</div>
                  <div className={`text-[11px] ${targetAudience === 'teachers_only' ? 'text-purple-100' : 'text-slate-500'}`}>
                    6 tổ chuyên môn (không bao gồm tổ Văn phòng).
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô tả & Hướng dẫn thực hiện
            </label>
            <textarea
              rows={3}
              placeholder="Nêu rõ yêu cầu nội dung cần nộp, lưu ý các biểu mẫu đính kèm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Năm học
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Học kỳ
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="HK1">Học kỳ I</option>
                <option value="HK2">Học kỳ II</option>
                <option value="Ca_Nam">Cả Năm</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thời hạn chót (Deadline) <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Loại hình báo cáo
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="hybrid">Kết hợp (Nhập văn bản + Tệp đính kèm)</option>
                <option value="with_attachment">Bắt buộc có tệp đính kèm</option>
                <option value="text_only">Chỉ nhập văn bản trực tiếp</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {editingPeriod ? 'Lưu Thay Đổi' : 'Ban Hành Đợt Báo Cáo'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
