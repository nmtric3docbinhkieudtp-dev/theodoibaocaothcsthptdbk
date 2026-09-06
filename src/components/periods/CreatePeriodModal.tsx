import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useReports } from '../../context/ReportContext';
import { useAuth } from '../../context/AuthContext';
import { 
  CalendarRange, 
  Clock, 
  Sparkles, 
  UploadCloud, 
  GraduationCap, 
  School, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Table as TableIcon,
  X,
  Eye,
  Layers,
  ChevronDown,
  UserCheck,
  Search,
  CheckSquare,
  Square,
  UserPlus,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  ReportPeriod, 
  ReportType, 
  TargetAudienceType, 
  PeriodFormTemplate, 
  CustomFormField, 
  CustomDynamicTable 
} from '../../types';
import { extractTextFromFile, parseFormContent, parseTemplateFile, ParsedTemplateResult } from '../../utils/formFileParser';

interface CreatePeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPeriod?: ReportPeriod | null;
  initialAudience?: TargetAudienceType;
  onSuccess?: (periodTitle: string) => void;
}

export const CreatePeriodModal: React.FC<CreatePeriodModalProps> = ({
  isOpen,
  onClose,
  editingPeriod,
  initialAudience = 'all',
  onSuccess
}) => {
  const { createPeriod, updatePeriod, departments = [] } = useReports();
  const { allUsers = [] } = useAuth();

  // Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [defaultTemplateContent, setDefaultTemplateContent] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [semester, setSemester] = useState<'HK1' | 'HK2' | 'Ca_Nam'>('HK1');
  const [reportType, setReportType] = useState<ReportType>('hybrid');
  const [targetAudience, setTargetAudience] = useState<TargetAudienceType>('all');
  const [selectedDepts, setSelectedDepts] = useState<string[]>(['all']);

  // Specific individual users selection
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userCampusFilter, setUserCampusFilter] = useState<'all' | 'THPT' | 'THCS_DBK' | 'THCS_TK'>('all');
  const [userDeptFilter, setUserDeptFilter] = useState<string>('all');

  // Filtered staff list for specific_users picker
  const selectableStaff = useMemo(() => {
    return allUsers.filter(u => {
      // Exclude BGH from standard lists unless searched
      if (!userSearchQuery.trim() && (u.departmentId === 'bgh' || u.role === 'principal')) {
        return false;
      }

      // Search query
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchDept = u.departmentName.toLowerCase().includes(q);
        const matchSchool = (u.originalSchool || '').toLowerCase().includes(q);
        const matchRole = (u.roleTitle || '').toLowerCase().includes(q);
        const matchSubject = (u.subject || '').toLowerCase().includes(q);
        const matchClass = (u.homeroomClass || '').toLowerCase().includes(q);
        if (!matchName && !matchDept && !matchSchool && !matchRole && !matchSubject && !matchClass) {
          return false;
        }
      }

      // Campus filter
      if (userCampusFilter !== 'all') {
        const sch = (u.originalSchool || '').toLowerCase();
        if (userCampusFilter === 'THPT' && !sch.includes('thpt')) return false;
        if (userCampusFilter === 'THCS_DBK' && !sch.includes('đốc binh kiều') && !sch.includes('doc binh kieu')) return false;
        if (userCampusFilter === 'THCS_TK' && !sch.includes('tân kiều') && !sch.includes('tan kieu')) return false;
      }

      // Department filter
      if (userDeptFilter !== 'all') {
        if (u.departmentId !== userDeptFilter) return false;
      }

      return true;
    });
  }, [allUsers, userSearchQuery, userCampusFilter, userDeptFilter]);

  const toggleUserSelection = (userId: string) => {
    setTargetUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllFilteredUsers = () => {
    const idsToAdd = selectableStaff.map(u => u.id);
    setTargetUserIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
  };

  const deselectAllUsers = () => {
    setTargetUserIds([]);
  };

  // Deadline & Time Setting (Ấn định thời gian)
  const [deadline, setDeadline] = useState('');

  // Form template from file upload
  const [importedTemplate, setImportedTemplate] = useState<PeriodFormTemplate | null>(null);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseFileName, setParseFileName] = useState<string | null>(null);
  const [previewFormOpen, setPreviewFormOpen] = useState(false);

  // Helper for quick deadline presets
  const applyDeadlinePreset = (preset: 'today_17' | 'today_23' | 'sunday_23' | 'plus_3' | 'plus_7' | 'plus_15' | 'end_month') => {
    const now = new Date();
    let target = new Date();

    if (preset === 'today_17') {
      target.setHours(17, 0, 0, 0);
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }
    } else if (preset === 'today_23') {
      target.setHours(23, 59, 0, 0);
    } else if (preset === 'sunday_23') {
      // Find upcoming Sunday
      const day = now.getDay();
      const diffToSunday = (7 - day) % 7;
      target.setDate(now.getDate() + (diffToSunday === 0 ? 7 : diffToSunday));
      target.setHours(23, 59, 0, 0);
    } else if (preset === 'plus_3') {
      target.setDate(now.getDate() + 3);
      target.setHours(17, 0, 0, 0);
    } else if (preset === 'plus_7') {
      target.setDate(now.getDate() + 7);
      target.setHours(17, 0, 0, 0);
    } else if (preset === 'plus_15') {
      target.setDate(now.getDate() + 15);
      target.setHours(17, 0, 0, 0);
    } else if (preset === 'end_month') {
      // Last day of current month at 23:59
      target = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0);
    }

    // Format for datetime-local: YYYY-MM-DDTHH:mm
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localIso = new Date(target.getTime() - tzOffset).toISOString().slice(0, 16);
    setDeadline(localIso);
  };

  // Reset or initialize on open / editing
  useEffect(() => {
    if (!isOpen) return;

    if (editingPeriod) {
      setTitle(editingPeriod.title);
      setDescription(editingPeriod.description || '');
      setDefaultTemplateContent(editingPeriod.defaultTemplateContent || '');
      setAcademicYear(editingPeriod.academicYear || '2026-2027');
      setSemester(editingPeriod.semester as any || 'HK1');
      setReportType(editingPeriod.reportType || 'hybrid');
      setTargetAudience(editingPeriod.targetAudience || 'all');
      setSelectedDepts(editingPeriod.targetDepartmentIds || ['all']);
      setTargetUserIds(editingPeriod.targetUserIds || []);
      setUserSearchQuery('');
      setUserCampusFilter('all');
      setUserDeptFilter('all');
      
      if (editingPeriod.deadline) {
        const d = new Date(editingPeriod.deadline);
        const tzOffset = d.getTimezoneOffset() * 60000;
        setDeadline(new Date(d.getTime() - tzOffset).toISOString().slice(0, 16));
      }
      if (editingPeriod.formTemplate) {
        setImportedTemplate(editingPeriod.formTemplate);
      } else {
        setImportedTemplate(null);
      }
      setParseFileName(null);
    } else {
      // Fresh new period
      setTitle('');
      setDescription('');
      setDefaultTemplateContent('');
      setAcademicYear('2026-2027');
      setSemester('HK1');
      setReportType('hybrid');
      setTargetAudience(initialAudience);
      setSelectedDepts(['all']);
      setTargetUserIds([]);
      setUserSearchQuery('');
      setUserCampusFilter('all');
      setUserDeptFilter('all');
      setImportedTemplate(null);
      setParseFileName(null);

      // Default deadline: 7 days later at 17:00
      applyDeadlinePreset('plus_7');
    }
  }, [isOpen, editingPeriod, initialAudience]);

  // Handle file upload for automatic form creation
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    setParseFileName(file.name);

    try {
      const parsed: ParsedTemplateResult = await parseTemplateFile(file);

      // If title is currently empty, take the parsed title
      if (!title.trim() && parsed.title) {
        setTitle(parsed.title);
      }

      // If description empty, give a clear summary
      if (!description.trim()) {
        setDescription(`Yêu cầu nộp báo cáo theo mẫu trực tuyến gồm ${parsed.fields.length} mục thông tin và ${parsed.tables.length} bảng số liệu. Thầy/Cô điền trực tiếp vào form trên hệ thống trước thời hạn.`);
      }

      // Auto set audience if recommended
      if (parsed.recommendedAudience && targetAudience === 'all') {
        setTargetAudience(parsed.recommendedAudience);
      }

      setImportedTemplate({
        fields: parsed.fields,
        tables: parsed.tables,
        defaultTemplateContent: parsed.fullRawText
      });

      // Show preview
      setPreviewFormOpen(true);
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert('Lỗi xử lý tệp: ' + err.message);
    } finally {
      setIsParsingFile(false);
      e.target.value = '';
    }
  };

  // Calculate remaining or late duration preview
  const getDeadlinePreview = () => {
    if (!deadline) return null;
    const deadlineTime = new Date(deadline).getTime();
    if (isNaN(deadlineTime)) return null;

    const now = Date.now();
    const diff = deadlineTime - now;
    const dateFormatted = new Date(deadline).toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (diff < 0) {
      const pastHours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
      return {
        text: `Đã qua thời điểm này (${pastHours} giờ trước)`,
        isPast: true,
        formatted: dateFormatted
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    let countdown = '';
    if (days > 0) countdown += `${days} ngày `;
    if (hours > 0 || days > 0) countdown += `${hours} giờ `;
    countdown += `${minutes} phút nữa`;

    return {
      text: `Còn ${countdown}`,
      isPast: false,
      formatted: dateFormatted
    };
  };

  const deadlinePreview = getDeadlinePreview();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập Tên Đợt Báo Cáo!');
      return;
    }
    if (!deadline) {
      alert('Vui lòng ấn định Thời Hạn Chót (Deadline) để hệ thống ghi nhận trễ hạn!');
      return;
    }

    if (targetAudience === 'specific_users' && targetUserIds.length === 0) {
      alert('Vui lòng chọn ít nhất một Thầy/Cô được chỉ định trong danh sách!');
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
        targetUserIds: targetAudience === 'specific_users' ? targetUserIds : undefined,
        isRequired: true,
        targetDepartmentIds: selectedDepts,
        status: isPast ? 'closed' : 'active',
        formTemplate: importedTemplate || editingPeriod.formTemplate,
        defaultTemplateContent: defaultTemplateContent || importedTemplate?.defaultTemplateContent || editingPeriod.defaultTemplateContent
      });
      if (onSuccess) onSuccess(title);
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
        targetUserIds: targetAudience === 'specific_users' ? targetUserIds : undefined,
        isRequired: true,
        targetDepartmentIds: selectedDepts,
        targetRoles: ['teacher', 'dept_head'],
        status: isPast ? 'closed' : 'active',
        createdBy: 'Ban Giám Hiệu',
        defaultTemplateContent: defaultTemplateContent || importedTemplate?.defaultTemplateContent || undefined,
        formTemplate: importedTemplate || undefined
      });
      if (onSuccess) onSuccess(title);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingPeriod ? 'Chỉnh Sửa Yêu Cầu Báo Cáo' : 'Ban Hành Yêu Cầu Báo Cáo Mới'}
      subtitle="Dành cho Ban Giám Hiệu & Quản trị viên: Thiết lập biểu mẫu chuẩn và ấn định thời hạn chót"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Role Confirmation Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-3 shadow-2xs">
          <School className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <div className="font-extrabold text-emerald-900 text-xs sm:text-sm">
              Quyền Ban Giám Hiệu / Quản Trị Hệ Thống
            </div>
            <div className="text-[11px] text-slate-700 mt-0.5">
              Thầy/Cô đang tạo <strong>Yêu cầu báo cáo</strong> cho giáo viên, nhân viên toàn trường. Thầy/Cô có thể tải file Word (.docx) hoặc Markdown (.md) lên để hệ thống tự động sinh ra Form trực tuyến chuẩn. Giáo viên sẽ vào điền báo cáo theo đúng form và thời hạn Thầy/Cô ấn định.
            </div>
          </div>
        </div>

        {/* 1. Report Title */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
            <span>Tên Đợt / Yêu Cầu Báo Cáo <span className="text-rose-500">*</span></span>
            <span className="text-[11px] text-slate-500 font-normal">Tên hiển thị cho toàn trường</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ví dụ: Báo cáo thống kê học sinh chưa ra lớp đầu năm học 2026 – 2027..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-bold text-slate-900 bg-white"
          />
        </div>

        {/* 2. SMART FILE UPLOAD TO AUTO-CREATE FORM */}
        <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-emerald-300/80 hover:border-emerald-500 transition space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Tự Động Tạo Form Trực Tuyến Từ Tệp Mẫu (.docx / .md / .txt)
                </div>
                <div className="text-[11px] text-slate-500">
                  Hệ thống tự động bóc tách các trường câu hỏi và các bảng số liệu để giáo viên điền
                </div>
              </div>
            </div>

            <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0 active:scale-98">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isParsingFile ? 'Đang đọc tệp...' : 'Tải Lên Tệp Mẫu (.docx / .md)'}</span>
              <input
                type="file"
                accept=".docx,.doc,.txt,.md,.json"
                onChange={handleFileUpload}
                disabled={isParsingFile}
                className="hidden"
              />
            </label>
          </div>

          {/* If a template is already loaded */}
          {importedTemplate && (
            <div className="p-3 bg-white rounded-xl border border-emerald-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Đã bóc tách thành công: <strong>{importedTemplate.fields?.length || 0} trường thông tin</strong> và <strong>{importedTemplate.tables?.length || 0} bảng dữ liệu</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewFormOpen(!previewFormOpen)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{previewFormOpen ? 'Thu gọn xem trước' : 'Xem trước form giáo viên sẽ thấy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImportedTemplate(null);
                      setParseFileName(null);
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer ml-2"
                  >
                    Gỡ bỏ mẫu
                  </button>
                </div>
              </div>

              {/* Collapsible Preview of Parsed Form */}
              {previewFormOpen && (
                <div className="pt-2 border-t border-slate-100 space-y-3 max-h-64 overflow-y-auto pr-1">
                  {importedTemplate.fields && importedTemplate.fields.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Danh sách các câu hỏi / trường nhập liệu ({importedTemplate.fields.length}):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {importedTemplate.fields.map((f, i) => (
                          <div key={f.id || i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate mr-2">{f.label}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 text-slate-700 shrink-0">
                              {f.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {importedTemplate.tables && importedTemplate.tables.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Danh sách các bảng số liệu ({importedTemplate.tables.length}):
                      </div>
                      {importedTemplate.tables.map((tbl, i) => (
                        <div key={tbl.id || i} className="p-2 rounded-lg bg-emerald-50/50 border border-emerald-200 text-xs space-y-1">
                          <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <TableIcon className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{tbl.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Các cột: {tbl.headers.join(' • ')} ({tbl.rows?.length || 0} dòng mẫu)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. KEY FEATURE: DEADLINE & TIME SETTING (ẤN ĐỊNH THỜI GIAN) */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <label className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <span>ẤN ĐỊNH THỜI HẠN CHÓT NỘP BÁO CÁO (DEADLINE)</span>
                  <span className="text-rose-600 font-black">*</span>
                </label>
                <div className="text-[11px] text-amber-900 leading-relaxed mt-0.5">
                  Giáo viên/Nhân viên nộp sau mốc thời gian này sẽ <strong>tự động bị hệ thống ghi nhận là TRỄ HẠN</strong>, tính số ngày/giờ trễ và bắt buộc giải trình lý do gửi BGH.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1.5">
              Chọn nhanh mốc thời hạn:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyDeadlinePreset('today_17')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-950 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
              >
                🕒 Chiều nay (17:00)
              </button>
              <button
                type="button"
                onClick={() => applyDeadlinePreset('sunday_23')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-950 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
              >
                📅 Hết tuần này (CN 23:59)
              </button>
              <button
                type="button"
                onClick={() => applyDeadlinePreset('plus_3')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-950 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
              >
                ⏳ +3 Ngày tới
              </button>
              <button
                type="button"
                onClick={() => applyDeadlinePreset('plus_7')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-600 text-white border border-amber-700 hover:bg-amber-700 transition cursor-pointer shadow-2xs"
              >
                ⏳ +7 Ngày (1 tuần)
              </button>
              <button
                type="button"
                onClick={() => applyDeadlinePreset('plus_15')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-950 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
              >
                ⏳ +15 Ngày
              </button>
              <button
                type="button"
                onClick={() => applyDeadlinePreset('end_month')}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-950 border border-amber-300 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
              >
                🗓️ Cuối tháng này
              </button>
            </div>
          </div>

          {/* DateTime-Local Input & Visual Status Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Chọn ngày & giờ chính xác:
              </label>
              <input
                type="datetime-local"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white font-black text-slate-900 shadow-2xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Countdown / Visual indicator */}
            <div className="flex items-center">
              {deadlinePreview ? (
                <div className={`w-full p-3 rounded-xl border text-xs ${
                  deadlinePreview.isPast 
                    ? 'bg-rose-50 border-rose-200 text-rose-800' 
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}>
                  <div className="font-extrabold flex items-center gap-1.5">
                    {deadlinePreview.isPast ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    ) : (
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>{deadlinePreview.text}</span>
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    Hạn chót: <strong>{deadlinePreview.formatted}</strong>
                  </div>
                </div>
              ) : (
                <div className="w-full p-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs">
                  Vui lòng chọn mốc thời hạn chót
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. TARGET AUDIENCE (ĐỐI TƯỢNG BÁO CÁO) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Ấn Định Đối Tượng Phải Thực Hiện Báo Cáo <span className="text-rose-500">*</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Chỉ những người được chỉ định mới có nhiệm vụ nộp
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTargetAudience('homeroom_teachers')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                targetAudience === 'homeroom_teachers'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <GraduationCap className={`w-5 h-5 shrink-0 mt-0.5 ${targetAudience === 'homeroom_teachers' ? 'text-white' : 'text-amber-600'}`} />
              <div>
                <div className="font-bold text-xs">Chỉ Giáo Viên Chủ Nhiệm (53 GVCN)</div>
                <div className={`text-[11px] ${targetAudience === 'homeroom_teachers' ? 'text-amber-100' : 'text-slate-500'}`}>
                  53 lớp (14 THPT + 24 ĐBK + 15 Tân Kiều). Giáo viên bộ môn khác không thấy.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetAudience('all')}
              className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                targetAudience === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <School className={`w-5 h-5 shrink-0 mt-0.5 ${targetAudience === 'all' ? 'text-white' : 'text-emerald-600'}`} />
              <div>
                <div className="font-bold text-xs">Toàn Trường (120 Cán Bộ - GV - NV)</div>
                <div className={`text-[11px] ${targetAudience === 'all' ? 'text-emerald-100' : 'text-slate-500'}`}>
                  Tất cả cán bộ giáo viên và nhân viên thuộc 7 tổ trong trường.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetAudience('dept_heads_only')}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition cursor-pointer ${
                targetAudience === 'dept_heads_only'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 mt-0.5 ${targetAudience === 'dept_heads_only' ? 'text-white' : 'text-blue-600'}`} />
              <div>
                <div className="font-bold text-xs">Chỉ Tổ Trưởng & Tổ Phó Chuyên Môn (19 Thầy/Cô)</div>
                <div className={`text-[11px] ${targetAudience === 'dept_heads_only' ? 'text-blue-100' : 'text-slate-500'}`}>
                  Báo cáo hoạt động tổ, sinh hoạt chuyên môn, kiểm tra hồ sơ giáo án (6 tổ CM).
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetAudience('teachers_only')}
              className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition cursor-pointer ${
                targetAudience === 'teachers_only'
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users className={`w-4 h-4 shrink-0 mt-0.5 ${targetAudience === 'teachers_only' ? 'text-white' : 'text-purple-600'}`} />
              <div>
                <div className="font-bold text-xs">Giáo Viên Giảng Dạy (106 GV)</div>
                <div className={`text-[11px] ${targetAudience === 'teachers_only' ? 'text-purple-100' : 'text-slate-500'}`}>
                  6 tổ chuyên môn (không bao gồm tổ Văn phòng).
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTargetAudience('specific_users')}
              className={`col-span-1 sm:col-span-2 p-3 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                targetAudience === 'specific_users'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-indigo-50/50 text-indigo-950 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              <UserCheck className={`w-5 h-5 shrink-0 mt-0.5 ${targetAudience === 'specific_users' ? 'text-white' : 'text-indigo-600'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>⭐ Chỉ Định Đích Danh Từng Cá Nhân (Chọn một số Thầy / Cô cụ thể)</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    targetAudience === 'specific_users' ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {targetUserIds.length > 0 ? `Đã chọn ${targetUserIds.length} người` : 'Chưa chọn'}
                  </span>
                </div>
                <div className={`text-[11px] mt-0.5 ${targetAudience === 'specific_users' ? 'text-indigo-100' : 'text-slate-600'}`}>
                  Chỉ những Thầy/Cô được tích chọn đích danh mới nhận được yêu cầu và nộp báo cáo (Ban Giám Hiệu giao việc riêng cho từng cá nhân).
                </div>
              </div>
            </button>
          </div>

          {/* Interactive User Picker when targetAudience === 'specific_users' */}
          {targetAudience === 'specific_users' && (
            <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-200/80 space-y-3 animate-in fade-in duration-200">
              {/* Header & stats */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <span>Chọn Danh Sách Thầy / Cô Cần Nộp Báo Cáo</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                        Đã chọn {targetUserIds.length} / {allUsers.length} Thầy Cô
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Tích chọn từng cá nhân bên dưới. Có thể tìm kiếm nhanh theo tên, tổ hoặc lọc theo cơ sở.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={selectAllFilteredUsers}
                    className="px-2.5 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Chọn tất cả ({selectableStaff.length})</span>
                  </button>
                  {targetUserIds.length > 0 && (
                    <button
                      type="button"
                      onClick={deselectAllUsers}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Bỏ chọn hết</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative sm:col-span-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, môn dạy..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-300 focus:outline-indigo-600"
                  />
                  {userSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={userCampusFilter}
                    onChange={(e) => setUserCampusFilter(e.target.value as any)}
                    className="w-full py-1.5 px-2.5 text-xs rounded-xl bg-white border border-slate-300 focus:outline-indigo-600"
                  >
                    <option value="all">Tất cả Điểm trường / Cơ sở</option>
                    <option value="THPT">Điểm THPT Đốc Binh Kiều</option>
                    <option value="THCS_DBK">Điểm THCS Đốc Binh Kiều</option>
                    <option value="THCS_TK">Điểm THCS Tân Kiều</option>
                  </select>
                </div>

                <div>
                  <select
                    value={userDeptFilter}
                    onChange={(e) => setUserDeptFilter(e.target.value)}
                    className="w-full py-1.5 px-2.5 text-xs rounded-xl bg-white border border-slate-300 focus:outline-indigo-600"
                  >
                    <option value="all">Tất cả Tổ Chuyên Môn</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected pills list */}
              {targetUserIds.length > 0 && (
                <div className="p-2 rounded-xl bg-white border border-indigo-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Đang chọn ({targetUserIds.length} Thầy/Cô):</span>
                    <button
                      type="button"
                      onClick={deselectAllUsers}
                      className="text-rose-600 hover:underline text-[10px] font-semibold cursor-pointer"
                    >
                      Xóa toàn bộ lựa chọn
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {targetUserIds.map(id => {
                      const u = allUsers.find(x => x.id === id);
                      if (!u) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 pl-2 pr-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-900 text-[11px] font-semibold"
                        >
                          <span>{u.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleUserSelection(id);
                            }}
                            className="p-0.5 hover:bg-indigo-200 rounded text-indigo-700 cursor-pointer"
                            title="Bỏ chọn"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Staff table / list */}
              <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {selectableStaff.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      Không tìm thấy Thầy/Cô nào phù hợp với bộ lọc hiện tại.
                    </div>
                  ) : (
                    selectableStaff.map((u, idx) => {
                      const isSelected = targetUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => toggleUserSelection(u.id)}
                          className={`p-2.5 flex items-center gap-3 transition cursor-pointer select-none ${
                            isSelected ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="shrink-0 text-indigo-600">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                          </div>

                          <div className="w-7 text-center shrink-0 text-[11px] font-bold text-slate-400">
                            #{u.orderNo || idx + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950 font-black' : 'text-slate-900'}`}>
                                {u.name}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {u.roleTitle}
                              </span>
                              {u.isHomeroomTeacher && u.homeroomClass && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                  GVCN {u.homeroomClass}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{u.departmentName}</span>
                              {u.subject && <span>• Môn: {u.subject}</span>}
                              {u.originalSchool && <span>• {u.originalSchool}</span>}
                            </div>
                          </div>

                          {isSelected && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                              Đã chọn
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Description & Instructions */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mô Tả & Hướng Dẫn Thực Hiện Của Ban Giám Hiệu
            </label>
            <textarea
              rows={2}
              placeholder="Nêu rõ yêu cầu nội dung cần báo cáo, các quy định lưu ý cho Thầy/Cô khi điền..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Optional Starter Outline / Template Content for Teachers */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Khung Sườn / Mẫu Soạn Sẵn Gợi Ý Cho Giáo Viên (Tùy chọn)</span>
              <span className="text-[10px] text-slate-400 font-normal">Sẽ tự động hiển thị trong khung soạn thảo khi giáo viên mở nộp</span>
            </label>
            <textarea
              rows={3}
              placeholder="Ví dụ:&#10;1. Thuận lợi, khó khăn trong tuần/tháng:&#10;2. Danh sách học sinh cần quan tâm:&#10;3. Kiến nghị, đề xuất với Ban Giám Hiệu:"
              value={defaultTemplateContent}
              onChange={(e) => setDefaultTemplateContent(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono text-[11px]"
            />
          </div>
        </div>

        {/* 6. Academic Year & Semester */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Năm học
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Học kỳ
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value as any)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="HK1">Học kỳ I</option>
              <option value="HK2">Học kỳ II</option>
              <option value="Ca_Nam">Cả Năm</option>
            </select>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer active:scale-98 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{editingPeriod ? 'Lưu Cập Nhật Đợt Báo Cáo' : 'Ban Hành Yêu Cầu Báo Cáo Ngay'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
