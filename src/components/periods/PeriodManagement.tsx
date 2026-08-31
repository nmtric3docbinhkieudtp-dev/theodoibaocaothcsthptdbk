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
  Check
} from 'lucide-react';
import { ReportPeriod, ReportType, UserRole } from '../../types';

interface PeriodManagementProps {
  onOpenSubmit: (periodId?: string) => void;
}

export const PeriodManagement: React.FC<PeriodManagementProps> = ({
  onOpenSubmit
}) => {
  const { isPrincipal, isAdmin, canManagePeriods, allUsers = [] } = useAuth();
  const { periods = [], departments = [], createPeriod, updatePeriod, deletePeriod, sendBulkReminders } = useReports();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ReportPeriod | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState<'HK1' | 'HK2' | 'Ca_Nam'>('HK1');
  const [deadline, setDeadline] = useState('');
  const [reportType, setReportType] = useState<ReportType>('hybrid');
  const [isRequired, setIsRequired] = useState(true);
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['all']);

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setAcademicYear('2025-2026');
    setSemester('HK1');
    // Default deadline 7 days from now
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    setDeadline(nextWeek.toISOString().slice(0, 16));
    setReportType('hybrid');
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
    setIsRequired(p.isRequired);
    setSelectedDepts(p.targetDepartmentIds);
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
    sendBulkReminders(period, allUsers);
    alert(`Đã gửi email và thông báo nhắc hạn đợt "${period.title}" tới tất cả các giáo viên trong danh sách!`);
  };

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
            Thiết lập thời hạn, quy định tệp đính kèm và gửi email thông báo tự động
          </p>
        </div>

        {canManagePeriods && (
          <button
            id="btn-create-period"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Đợt Báo Cáo Mới</span>
          </button>
        )}
      </div>

      {/* List of Periods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {periods.map((period: ReportPeriod) => {
          const isOverdue = new Date(period.deadline).getTime() < Date.now();
          const diffMs = new Date(period.deadline).getTime() - Date.now();
          const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

          return (
            <div
              key={period.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    isOverdue 
                      ? 'bg-rose-50 text-rose-700 border-rose-200' 
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {isOverdue ? '⚠️ Đã kết thúc hạn nộp' : `Đang mở (Còn ${daysRemaining} ngày)`}
                  </span>

                  <span className="text-[11px] text-slate-400 font-semibold">
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
                    <span>Định dạng yêu cầu:</span>
                    <span className="font-medium text-emerald-700">
                      {period.reportType === 'text_only' ? 'Văn bản nhập trực tiếp' : 'Hỗ trợ tệp đính kèm đa dạng'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Người khởi tạo:</span>
                    <span className="text-slate-500">{period.createdBy}</span>
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
                    title="Gửi email nhắc hạn cho tất cả giáo viên"
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
        subtitle="Hệ thống trường THCS & THPT Đốc Binh Kiều"
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
              placeholder="Ví dụ: Báo cáo công tác chuyên môn tháng 9..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-medium"
            />
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
            >
              {editingPeriod ? 'Lưu Thay Đổi' : 'Ban Hành Đợt Báo Cáo'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
