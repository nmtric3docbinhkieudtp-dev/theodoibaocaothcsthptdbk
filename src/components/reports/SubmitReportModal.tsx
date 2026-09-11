import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useReports } from '../../context/ReportContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Send, 
  Paperclip, 
  Trash2, 
  FileText, 
  UploadCloud, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Save,
  GraduationCap,
  CalendarRange,
  School,
  FileSpreadsheet,
  Image as ImageIcon,
  FileCode,
  Download,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  ReportAttachment, 
  HomeroomMeetingMinutesData, 
  CustomFormField, 
  CustomDynamicTable 
} from '../../types';
import { HomeroomMeetingMinutesForm } from './HomeroomMeetingMinutesForm';
import { CustomReportFormBuilder } from './CustomReportFormBuilder';
import { ImportFormFromDocModal } from '../common/ImportFormFromDocModal';
import { ParsedTemplateResult } from '../../utils/formFileParser';
import { isUserEligibleForPeriod } from '../../utils/reportFilters';

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriodId?: string;
  onOpenCreatePeriod?: () => void;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  onClose,
  defaultPeriodId,
  onOpenCreatePeriod
}) => {
  const { periods, submitReport, submissions } = useReports();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(defaultPeriodId || '');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lateExplanation, setLateExplanation] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);

  // Homeroom minutes specific state
  const [homeroomData, setHomeroomData] = useState<HomeroomMeetingMinutesData | null>(null);

  // Custom form template state
  const [customFields, setCustomFields] = useState<CustomFormField[]>([]);
  const [customTables, setCustomTables] = useState<CustomDynamicTable[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  const [customNotes, setCustomNotes] = useState('');

  // Active periods filtering
  const activePeriods = periods.filter(p => p.status === 'active');
  const eligiblePeriods = periods.filter(p => {
    if (currentUser.role === 'admin' || currentUser.role === 'principal') return true;
    return isUserEligibleForPeriod(currentUser, p);
  }).sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Sync selected period whenever modal opens or defaultPeriodId changes
  useEffect(() => {
    if (isOpen) {
      if (defaultPeriodId && periods.some(p => p.id === defaultPeriodId)) {
        setSelectedPeriodId(defaultPeriodId);
      } else if (eligiblePeriods.length > 0) {
        const unsubmitted = eligiblePeriods.find(p => p.status === 'active' && !submissions.some(s => s.periodId === p.id && s.authorId === currentUser.id && s.status !== 'draft'));
        const firstActive = unsubmitted || eligiblePeriods.find(p => p.status === 'active') || eligiblePeriods[0];
        setSelectedPeriodId(firstActive.id);
      } else if (periods.length > 0) {
        setSelectedPeriodId(periods[0].id);
      } else {
        setSelectedPeriodId('');
      }
    }
  }, [isOpen, defaultPeriodId, eligiblePeriods, periods, submissions, currentUser.id]);

  const currentPeriod = periods.find(p => p.id === selectedPeriodId) || eligiblePeriods[0] || periods[0] || null;

  // Determine mode automatically based on selected period
  // Only the specific historical student gathering minutes uses the 10-table legacy minutes form
  const isSpecificLegacyHomeroomMinutes = Boolean(
    (currentPeriod?.id === 'period-gvcn-1' || currentPeriod?.title?.toLowerCase().trim() === 'biên bản tập trung học sinh đầu năm') &&
    !currentPeriod?.formTemplate?.fields?.length &&
    !currentPeriod?.formTemplate?.tables?.length
  );

  const hasFormTemplate = Boolean(
    (currentPeriod?.formTemplate?.fields && currentPeriod.formTemplate.fields.length > 0) ||
    (currentPeriod?.formTemplate?.tables && currentPeriod.formTemplate.tables.length > 0) ||
    customFields.length > 0 ||
    customTables.length > 0
  );

  // Load period form template or previous user draft/submission if available
  useEffect(() => {
    if (!isOpen || !currentPeriod) return;

    // Tìm xem người dùng hiện tại đã có bản nháp hoặc bài nộp nào cho đợt này chưa
    const userSubs = submissions.filter(s => s.authorId === currentUser.id && s.periodId === currentPeriod.id);
    const existingSub = userSubs.find(s => s.status !== 'draft') || userSubs[0];

    if (existingSub) {
      setContent(existingSub.content || currentPeriod.defaultTemplateContent || '');
      setCustomFields(existingSub.structuredData?.customFields || currentPeriod.formTemplate?.fields || []);
      setCustomTables(existingSub.structuredData?.customTables || currentPeriod.formTemplate?.tables || []);
      setCustomFieldValues(existingSub.structuredData?.customFieldValues || {});
      setCustomNotes(existingSub.structuredData?.customNotes || '');
      setLateExplanation(existingSub.lateExplanation || '');
      setHomeroomData(existingSub.structuredData?.homeroomMinutes || null);
      setAttachments(existingSub.attachments || []);
    } else {
      setContent(currentPeriod.defaultTemplateContent || '');
      setCustomFields(currentPeriod.formTemplate?.fields || []);
      setCustomTables(currentPeriod.formTemplate?.tables || []);
      setCustomFieldValues({});
      setCustomNotes('');
      setLateExplanation('');
      setHomeroomData(null);
      setAttachments([]);
    }
  }, [isOpen, currentPeriod?.id]);

  // Check if current submission is past deadline
  const isPastDeadline = currentPeriod 
    ? new Date(currentPeriod.deadline).getTime() < Date.now() 
    : false;

  const userExistingSub = useMemo(() => {
    if (!currentPeriod) return null;
    const userSubs = submissions.filter(s => s.authorId === currentUser.id && s.periodId === currentPeriod.id);
    return userSubs.find(s => s.status !== 'draft') || userSubs[0] || null;
  }, [submissions, currentUser.id, currentPeriod]);

  const hasAlreadySubmitted = Boolean(userExistingSub && userExistingSub.status !== 'draft');
  const isApprovedByPrincipal = userExistingSub?.status === 'principal_approved';

  // Auto-generate title based on user, role, and period
  const getAutoTitle = () => {
    if (isSpecificLegacyHomeroomMinutes) {
      return `Biên bản tập trung học sinh đầu năm - Lớp ${currentUser.homeroomClass || ''} - ${currentUser.name}`;
    }
    if (currentPeriod) {
      const classSuffix = currentUser.isHomeroomTeacher && currentUser.homeroomClass ? ` - Lớp ${currentUser.homeroomClass}` : '';
      return `${currentPeriod.title}${classSuffix} - ${currentUser.name}`;
    }
    return `Báo cáo công tác - ${currentUser.name} (${currentUser.departmentName})`;
  };

  const handleHomeroomChange = (data: HomeroomMeetingMinutesData, generatedText: string) => {
    setHomeroomData(data);
    setContent(generatedText);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processFiles = async (files: File[]) => {
    const filePromises = files.map(file => {
      return new Promise<ReportAttachment>((resolve) => {
        const reader = new FileReader();
        if (file.size <= 2.5 * 1024 * 1024) {
          reader.onload = () => {
            resolve({
              id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              name: file.name,
              size: file.size,
              type: file.type || file.name.split('.').pop() || 'unknown',
              url: typeof reader.result === 'string' ? reader.result : '',
              uploadedAt: new Date().toISOString()
            });
          };
          reader.readAsDataURL(file);
        } else {
          resolve({
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            size: file.size,
            type: file.type || file.name.split('.').pop() || 'unknown',
            url: '',
            uploadedAt: new Date().toISOString()
          });
        }
      });
    });

    const newAttachments = await Promise.all(filePromises);
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (['docx', 'doc', 'pdf', 'txt'].includes(ext || '')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      return <ImageIcon className="w-5 h-5 text-amber-600" />;
    }
    return <FileCode className="w-5 h-5 text-purple-600" />;
  };

  const handleSubmit = async (isDraft = false) => {
    const autoTitle = getAutoTitle();

    // Build synthesized content if text content is blank but custom fields/tables are filled
    let finalContent = content;
    if (hasFormTemplate) {
      const fieldSummaries = customFields.map(f => {
        const val = customFieldValues[f.id];
        return `- ${f.label}: ${val === undefined || val === '' ? '(Chưa nhập)' : val}`;
      }).join('\n');

      const tableSummaries = customTables.map(t => {
        return `\n${t.title.toUpperCase()}:\n` + t.rows.map((r, i) => {
          return `Hàng ${i + 1}: ` + t.headers.map(h => `${h}: ${r[h] || '-'}`).join(' | ');
        }).join('\n');
      }).join('\n');

      finalContent = `BÁO CÁO THEO BIỂU MẪU ĐIỆN TỬ:\n${fieldSummaries}\n${tableSummaries}\n\nĐÁNH GIÁ & KIẾN NGHỊ:\n${customNotes || '(Không có)'}`;
    }

    if (!finalContent.trim() && attachments.length === 0 && !homeroomData) {
      alert('Vui lòng nhập thông tin vào biểu mẫu, soạn thảo nội dung hoặc đính kèm ít nhất 1 tệp tin minh chứng!');
      return;
    }

    if (isPastDeadline && !isDraft && !lateExplanation.trim()) {
      alert('⚠️ Đợt báo cáo này đã quá hạn nộp ấn định của Ban Giám Hiệu. Thầy/Cô bắt buộc phải nhập lý do giải trình nộp trễ hạn để Ban Giám Hiệu xem xét kiểm duyệt.');
      return;
    }

    const structuredDataPayload: any = {};
    if (isSpecificLegacyHomeroomMinutes && homeroomData) {
      structuredDataPayload.homeroomMinutes = homeroomData;
    }
    if (customFields.length > 0) {
      structuredDataPayload.customFields = customFields;
      structuredDataPayload.customFieldValues = customFieldValues;
    }
    if (customTables.length > 0) {
      structuredDataPayload.customTables = customTables;
    }
    if (customNotes) {
      structuredDataPayload.customNotes = customNotes;
    }

    setIsSubmitting(true);
    try {
      if (!currentPeriod) {
        alert('Không tìm thấy thông tin đợt báo cáo hợp lệ.');
        return;
      }

      await submitReport({
        periodId: currentPeriod.id,
        title: autoTitle,
        content: finalContent,
        structuredData: Object.keys(structuredDataPayload).length > 0 ? structuredDataPayload : undefined,
        attachments,
        isDraft,
        lateExplanation: isPastDeadline ? lateExplanation : undefined
      });

      if (!isDraft) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }

      onClose();
      // Reset
      setContent('');
      setAttachments([]);
      setLateExplanation('');
      setCustomFields([]);
      setCustomTables([]);
      setCustomFieldValues({});
      setCustomNotes('');
    } catch (e: any) {
      alert('Lỗi nộp báo cáo: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentPeriod) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Nộp Báo Cáo"
        subtitle={`Người nộp: ${currentUser.name} (${currentUser.roleTitle} - ${currentUser.departmentName})`}
        maxWidth="md"
      >
        <div className="text-center py-8 px-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <CalendarRange className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Chưa có đợt báo cáo nào</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
            Hiện tại Ban Giám Hiệu chưa ban hành đợt báo cáo mới hoặc Thầy/Cô chưa thuộc đối tượng nộp trong các đợt đã đóng.
          </p>
          <div className="pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nộp Báo Cáo: ${currentPeriod.title}`}
      subtitle={`Người nộp: ${currentUser.name} (${currentUser.roleTitle} - ${currentUser.departmentName}${currentUser.isHomeroomTeacher ? ` - Lớp ${currentUser.homeroomClass}` : ''})`}
      maxWidth={isSpecificLegacyHomeroomMinutes || hasFormTemplate ? '5xl' : '4xl'}
    >
      <div className="space-y-4">
        
        {/* FIXED REQUIRED REPORT PERIOD BANNER (NO DROPDOWN - PREVENTS SELECTING WRONG PERIOD OR AD-HOC) */}
        <div className="bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50 p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                  <BookOpen className="w-3 h-3" />
                  <span>Đợt Báo Cáo Yêu Cầu</span>
                </span>

                {currentPeriod.targetAudience === 'homeroom_teachers' && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                    Dành Cho 53 GVCN
                  </span>
                )}
                {currentPeriod.targetAudience === 'dept_heads_only' && (
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    19 Tổ trưởng & Tổ phó CM
                  </span>
                )}
                {currentPeriod.targetUserIds && currentPeriod.targetUserIds.length > 0 && (
                  <span className="text-[10px] font-bold text-purple-800 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    Chỉ định đích danh ({currentPeriod.targetUserIds.length} Thầy/Cô)
                  </span>
                )}
                {currentPeriod.isRequired && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                    Bắt buộc
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {currentPeriod.title}
              </h2>

              {currentPeriod.description && (
                <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                  {currentPeriod.description}
                </p>
              )}
            </div>

            {/* Hạn chót & Trạng thái */}
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 shrink-0 self-start sm:self-center shadow-2xs ${
              isPastDeadline 
                ? 'bg-rose-50 border-rose-200 text-rose-800' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {isPastDeadline ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <div className="font-bold text-xs sm:text-sm">
                  Hạn chót: {new Date(currentPeriod.deadline).toLocaleString('vi-VN')}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {isPastDeadline 
                    ? '⚠️ Đã quá hạn quy định (Ghi nhận nộp trễ)' 
                    : 'Đang trong thời hạn nộp hợp lệ'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* THÔNG BÁO TÌNH TRẠNG BẢN GHI ĐÃ LƯU / ĐÃ NỘP */}
        {userExistingSub && (
          <div className={`p-3.5 rounded-xl border text-xs shadow-2xs ${
            userExistingSub.status === 'draft'
              ? 'bg-amber-50/90 border-amber-300 text-amber-900'
              : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
          }`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <span className="text-lg mt-0.5">{userExistingSub.status === 'draft' ? '📝' : '✅'}</span>
                <div>
                  <div className="font-bold text-sm">
                    {userExistingSub.status === 'draft' ? 'Đang mở Bản Nháp đã lưu' : 'Thầy/Cô đã nộp báo cáo cho đợt này thành công!'}
                  </div>
                  <div className="mt-1 text-xs leading-relaxed">
                    {userExistingSub.status === 'draft' 
                      ? 'Nội dung và số liệu Thầy/Cô từng lưu nháp đã được tự động nạp vào biểu mẫu bên dưới. Nhấn "Gửi Báo Cáo" để nộp chính thức lên Ban Giám Hiệu.'
                      : `Hệ thống đã ghi nhận bài nộp chính thức vào lúc ${new Date(userExistingSub.submittedAt || userExistingSub.updatedAt).toLocaleString('vi-VN')}. Mỗi Thầy/Cô chỉ nộp 1 lần duy nhất cho đợt báo cáo này.`
                    }
                  </div>
                  {hasAlreadySubmitted && (
                    <div className="mt-1 text-[11px] font-semibold text-emerald-800">
                      Trạng thái: {isApprovedByPrincipal ? '🏆 Ban Giám Hiệu đã phê duyệt chính thức' : userExistingSub.status === 'dept_approved' ? 'Tổ trưởng đã duyệt' : 'Đã nộp thành công (Chờ BGH duyệt)'}
                    </div>
                  )}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                userExistingSub.status === 'draft'
                  ? 'bg-amber-200 text-amber-800'
                  : 'bg-emerald-200 text-emerald-800'
              }`}>
                {userExistingSub.status === 'draft' ? 'Bản nháp' : 'Đã nộp'}
              </span>
            </div>
          </div>
        )}

        {/* PRIMARY REPORT INPUT INTERFACE (AUTOMATICALLY SELECTED BASED ON PERIOD) */}
        {isSpecificLegacyHomeroomMinutes ? (
          /* HOMEROOM MINUTES FORM (HISTORICAL MEETING MINUTES) */
          <div className="border border-slate-200 rounded-2xl p-1 bg-white shadow-2xs">
            <HomeroomMeetingMinutesForm
              currentUser={currentUser}
              initialData={homeroomData || undefined}
              onChange={handleHomeroomChange}
            />
          </div>
        ) : hasFormTemplate ? (
          /* MULTI-SECTION DYNAMIC FORM & TABLE BUILDER (4 SECTIONS: I. INFO, II. TABLES, III. NOTES, IV. PREVIEW/WORD) */
          <div className="border border-slate-200 rounded-2xl p-3 bg-white shadow-2xs">
            <CustomReportFormBuilder
              fields={customFields}
              tables={customTables}
              onFieldsChange={setCustomFields}
              onTablesChange={setCustomTables}
              fieldValues={customFieldValues}
              onFieldValueChange={(fId, val) => setCustomFieldValues(prev => ({ ...prev, [fId]: val }))}
              readOnlyStructure={true}
              formTitle={currentPeriod?.title || 'Báo Cáo Biểu Mẫu Trực Tuyến'}
              authorName={currentUser.name}
              authorRole={currentUser.roleTitle}
              departmentOrClass={currentUser.departmentName}
              academicYear={currentPeriod?.academicYear || '2026 – 2027'}
              notes={customNotes}
              onNotesChange={setCustomNotes}
            />
          </div>
        ) : (
          /* STANDARD / SIMPLE REPORT FORM CREATED BY BGH */
          <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            {/* INSTRUCTIONS / REQUIREMENTS FROM BGH (PROMINENT CALLOUT) */}
            {currentPeriod?.description ? (
              <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 text-emerald-950 space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-emerald-900">
                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Yêu Cầu & Hướng Dẫn Thực Hiện Từ Ban Giám Hiệu</span>
                </div>
                <div className="text-xs sm:text-sm text-emerald-950/90 whitespace-pre-line leading-relaxed pl-3 border-l-2 border-emerald-500 font-normal">
                  {currentPeriod.description}
                </div>
              </div>
            ) : null}

            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Nội Dung Báo Cáo</span>
              </span>
              <span className="text-[11px] text-slate-400">
                {content.length} ký tự • {content.trim().split(/\s+/).filter(Boolean).length} từ
              </span>
            </div>

            <div>
              <textarea
                id="textarea-report-content"
                rows={12}
                placeholder={currentPeriod?.description ? "Nhập nội dung báo cáo chi tiết theo yêu cầu của Ban Giám Hiệu bên trên..." : "Nhập toàn bộ nội dung báo cáo, tiến độ công việc, số liệu thực hiện, thuận lợi, khó khăn và kiến nghị với BGH..."}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-normal leading-relaxed text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>
        )}

        {/* FILE ATTACHMENTS (COLLAPSIBLE / CONVENIENT ACCESS) */}
        <div className="border border-slate-200 rounded-2xl bg-white p-3.5 shadow-2xs space-y-3">
          <div 
            onClick={() => setIsAttachmentsOpen(!isAttachmentsOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                Đính kèm tệp minh chứng (PDF, Word, Excel, Hình ảnh...)
              </span>
              {attachments.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {attachments.length} tệp đã đính kèm
                </span>
              )}
            </div>
            <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
              {isAttachmentsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Upload Area (shown when toggled open or if files already attached) */}
          {(isAttachmentsOpen || attachments.length > 0) && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                  isDragOver 
                    ? 'border-emerald-500 bg-emerald-50/50' 
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-semibold text-slate-800">
                  Kéo thả tệp vào đây hoặc <span className="text-emerald-700 underline">bấm để chọn tệp</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Hỗ trợ tệp Word (.docx, .doc), Excel (.xlsx, .xls), PDF, PowerPoint, Ảnh minh chứng
                </p>
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-200 bg-slate-50 shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(att.name)}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate max-w-[200px]" title={att.name}>
                            {att.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {formatFileSize(att.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeAttachment(att.id); }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa tệp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* LATE EXPLANATION IF PAST DEADLINE */}
        {isPastDeadline && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 shadow-2xs">
            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Giải trình lý do nộp trễ hạn <span className="text-rose-500">*</span>:</span>
            </label>
            <input
              id="input-late-explanation"
              type="text"
              placeholder="Ví dụ: Sự cố đường truyền mạng, hoàn tất hồ sơ phối hợp phụ huynh đột xuất..."
              value={lateExplanation}
              onChange={(e) => setLateExplanation(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
            />
          </div>
        )}

        {/* FOOTER ACTION BUTTONS */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            {hasAlreadySubmitted ? 'Đóng' : 'Hủy bỏ'}
          </button>

          <div className="flex items-center gap-2">
            {isApprovedByPrincipal ? (
              <div className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-3 py-2 rounded-xl border border-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Báo cáo đã được Ban Giám Hiệu phê duyệt chính thức</span>
              </div>
            ) : hasAlreadySubmitted ? (
              <button
                type="button"
                id="btn-submit-report-modal"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                title="Cập nhật trực tiếp số liệu vào bản nộp hiện tại, không tạo thêm bản nộp mới"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang cập nhật...' : 'Cập Nhật Bổ Sung Bản Đã Nộp'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(true)}
                  className="px-4 py-2 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Bản Nháp</span>
                </button>

                <button
                  type="button"
                  id="btn-submit-report-modal"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit(false)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Báo Cáo'}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </Modal>
  );
};
