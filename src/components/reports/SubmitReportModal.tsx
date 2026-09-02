import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { Modal } from '../common/Modal';
import { 
  FileText, 
  UploadCloud, 
  File, 
  Trash2, 
  Paperclip, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  Save, 
  FileSpreadsheet, 
  FileCode,
  Image as ImageIcon,
  HelpCircle,
  Clock,
  Sparkles,
  GraduationCap,
  School,
  Users,
  ClipboardList,
  Layers,
  BookOpen,
  PlusCircle,
  Table as TableIcon
} from 'lucide-react';
import { ReportPeriod, ReportAttachment, HomeroomMeetingMinutesData, CustomFormField, CustomDynamicTable } from '../../types';
import { isUserEligibleForPeriod, getAudienceLabel } from '../../utils/reportFilters';
import { HomeroomMeetingMinutesForm } from './HomeroomMeetingMinutesForm';
import { CustomReportFormBuilder } from './CustomReportFormBuilder';
import { OFFICIAL_REPORT_TEMPLATES, ReportTemplateOption } from '../../utils/reportTemplates';
import confetti from 'canvas-confetti';

interface SubmitReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriodId?: string;
}

export const SubmitReportModal: React.FC<SubmitReportModalProps> = ({
  isOpen,
  onClose,
  defaultPeriodId
}) => {
  const { currentUser, isPrincipal, isAdmin } = useAuth();
  const { periods, submitReport } = useReports();

  // STRICT FILTERING: Only show periods the current user is eligible for!
  const eligiblePeriods = periods.filter(p => {
    if (isPrincipal || isAdmin) return true;
    return isUserEligibleForPeriod(currentUser, p);
  });

  const activePeriods = eligiblePeriods.filter(p => p.status === 'active');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
  const [lateExplanation, setLateExplanation] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'custom_form' | 'homeroom' | 'file'>('text');
  
  // Structured Data states
  const [homeroomData, setHomeroomData] = useState<HomeroomMeetingMinutesData | null>(null);
  const [customFields, setCustomFields] = useState<CustomFormField[]>([]);
  const [customTables, setCustomTables] = useState<CustomDynamicTable[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Set initial period
  useEffect(() => {
    if (defaultPeriodId) {
      setSelectedPeriodId(defaultPeriodId);
    } else if (activePeriods.length > 0) {
      if (!selectedPeriodId || (!eligiblePeriods.some(p => p.id === selectedPeriodId) && selectedPeriodId !== 'adhoc')) {
        setSelectedPeriodId(activePeriods[0].id);
      }
    } else if (eligiblePeriods.length > 0) {
      if (!selectedPeriodId || (!eligiblePeriods.some(p => p.id === selectedPeriodId) && selectedPeriodId !== 'adhoc')) {
        setSelectedPeriodId(eligiblePeriods[0].id);
      }
    } else {
      setSelectedPeriodId('adhoc');
    }
  }, [defaultPeriodId, eligiblePeriods, activePeriods]);

  const currentPeriod = selectedPeriodId === 'adhoc' ? null : periods.find(p => p.id === selectedPeriodId);
  const isHomeroomPeriod = currentPeriod?.targetAudience === 'homeroom_teachers' || currentPeriod?.id === 'period-gvcn-1';

  // If period has formTemplate or defaultTemplateContent, load them
  useEffect(() => {
    if (currentPeriod) {
      if (currentPeriod.defaultTemplateContent && !content) {
        setContent(currentPeriod.defaultTemplateContent);
      }
      if (currentPeriod.formTemplate?.fields && customFields.length === 0) {
        setCustomFields(currentPeriod.formTemplate.fields);
      }
      if (currentPeriod.formTemplate?.tables && customTables.length === 0) {
        setCustomTables(currentPeriod.formTemplate.tables);
      }
    }
  }, [currentPeriod]);

  // Adjust default tab and title based on period
  useEffect(() => {
    if (isHomeroomPeriod) {
      setActiveTab('homeroom');
      if (!title || title.includes('Báo cáo') || title.includes('Biên bản')) {
        setTitle(`Biên bản tập trung học sinh đầu năm học 2026 – 2027 - Lớp ${currentUser.homeroomClass || ''} - ${currentUser.name}`);
      }
    } else {
      if (activeTab === 'homeroom') {
        setActiveTab('text');
      }
      if (!title) {
        if (selectedPeriodId === 'adhoc') {
          setTitle(`Báo cáo công tác - ${currentUser.name} (${currentUser.departmentName})`);
        } else if (currentPeriod) {
          setTitle(`${currentPeriod.title} - ${currentUser.name}`);
        }
      }
    }
  }, [selectedPeriodId, isHomeroomPeriod]);

  // Check if current submission is past deadline
  const isPastDeadline = currentPeriod 
    ? new Date(currentPeriod.deadline).getTime() < Date.now() 
    : false;

  const handleHomeroomChange = (data: HomeroomMeetingMinutesData, generatedText: string) => {
    setHomeroomData(data);
    setContent(generatedText);
    if (!title || title.startsWith('Biên bản tập trung')) {
      setTitle(`Biên bản tập trung học sinh đầu năm học 2026 – 2027 - Lớp ${data.className || currentUser.homeroomClass || ''} - ${data.teacherName || currentUser.name}`);
    }
  };

  const handleApplyTemplate = (tpl: ReportTemplateOption) => {
    if (content && !confirm('Việc áp dụng mẫu mới sẽ thay thế nội dung soạn thảo hiện tại. Bạn có chắc chắn muốn áp dụng?')) {
      return;
    }
    setTitle(tpl.defaultTitle);
    setContent(tpl.content);
  };

  const handleInsertSection = (sectionText: string) => {
    setContent(prev => (prev ? prev + '\n\n' + sectionText : sectionText));
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
              type: file.type || file.name.split('.').pop() || 'file',
              url: (reader.result as string) || URL.createObjectURL(file),
              uploadedAt: new Date().toISOString()
            });
          };
          reader.onerror = () => {
            resolve({
              id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
              name: file.name,
              size: file.size,
              type: file.type || file.name.split('.').pop() || 'file',
              url: URL.createObjectURL(file),
              uploadedAt: new Date().toISOString()
            });
          };
          reader.readAsDataURL(file);
        } else {
          resolve({
            id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            size: file.size,
            type: file.type || file.name.split('.').pop() || 'file',
            url: URL.createObjectURL(file),
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
    if (!title.trim()) {
      alert('Vui lòng nhập tên/tiêu đề báo cáo!');
      return;
    }

    // Build synthesized content if text content is blank but custom fields/tables are filled
    let finalContent = content;
    if (!finalContent.trim() && (customFields.length > 0 || customTables.length > 0)) {
      const fieldSummaries = customFields.map(f => {
        const val = customFieldValues[f.id];
        return `- ${f.label}: ${val === undefined || val === '' ? '(Chưa nhập)' : val}`;
      }).join('\n');

      const tableSummaries = customTables.map(t => {
        return `\n${t.title.toUpperCase()}:\n` + t.rows.map((r, i) => {
          return `Hàng ${i + 1}: ` + t.headers.map(h => `${h}: ${r[h] || '-'}`).join(' | ');
        }).join('\n');
      }).join('\n');

      finalContent = `BÁO CÁO THEO BIỂU MẪU ĐIỆN TỬ:\n${fieldSummaries}\n${tableSummaries}`;
    }

    if (!finalContent.trim() && attachments.length === 0 && !homeroomData) {
      alert('Vui lòng nhập nội dung báo cáo, điền biểu mẫu hoặc đính kèm ít nhất 1 tệp tin!');
      return;
    }

    const structuredDataPayload: any = {};
    if (isHomeroomPeriod && homeroomData) {
      structuredDataPayload.homeroomMinutes = homeroomData;
    }
    if (customFields.length > 0) {
      structuredDataPayload.customFields = customFields;
      structuredDataPayload.customFieldValues = customFieldValues;
    }
    if (customTables.length > 0) {
      structuredDataPayload.customTables = customTables;
    }

    setIsSubmitting(true);
    try {
      await submitReport({
        periodId: selectedPeriodId === 'adhoc' ? 'adhoc-' + Date.now() : selectedPeriodId,
        title,
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
      // Reset form
      setTitle('');
      setContent('');
      setAttachments([]);
      setLateExplanation('');
      setCustomFields([]);
      setCustomTables([]);
      setCustomFieldValues({});
    } catch (e: any) {
      alert('Lỗi nộp báo cáo: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Soạn Thảo & Tạo Báo Cáo Mới"
      subtitle={`Người tạo: ${currentUser.name} (${currentUser.roleTitle} - ${currentUser.departmentName})`}
      maxWidth={activeTab === 'homeroom' || activeTab === 'custom_form' ? '5xl' : '4xl'}
    >
      <div className="space-y-4">
        
        {/* Period Selector & Ad-hoc Option */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Đợt Báo Cáo / Phạm Vi Nộp <span className="text-rose-500">*</span></span>
              {isHomeroomPeriod && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Mẫu Báo Cáo GVCN
                </span>
              )}
            </label>
            <select
              id="select-period"
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-emerald-600 font-medium"
            >
              <optgroup label="Danh sách đợt nộp trong trường">
                {eligiblePeriods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.targetAudience === 'homeroom_teachers' ? '[GVCN] ' : ''}{p.title} ({p.status === 'active' ? 'Đang mở' : 'Đã đóng'})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Tùy chọn tạo báo cáo độc lập">
                <option value="adhoc">🌟 Báo cáo Đột xuất / Tự do (Tạo theo yêu cầu riêng)</option>
              </optgroup>
            </select>
          </div>

          <div className="flex items-center">
            {selectedPeriodId === 'adhoc' ? (
              <div className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="font-bold">Báo cáo Đột xuất / Tự do</div>
                  <div className="text-[11px] opacity-80">Báo cáo không ràng buộc thời hạn, gửi trực tiếp tới BGH và lưu trữ hồ sơ.</div>
                </div>
              </div>
            ) : currentPeriod ? (
              <div className={`w-full p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                isPastDeadline 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {isPastDeadline ? <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> : <Clock className="w-4 h-4 text-emerald-600 shrink-0" />}
                <div>
                  <div className="font-bold">
                    Hạn chót: {new Date(currentPeriod.deadline).toLocaleString('vi-VN')}
                  </div>
                  <div className="text-[11px] opacity-90">
                    {isPastDeadline 
                      ? '⚠️ Đợt báo cáo đã qua hạn quy định. Hệ thống sẽ ghi nhận Nộp trễ.' 
                      : 'Đang trong thời hạn nộp hợp lệ.'}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tên / Tiêu Đề Báo Cáo <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-report-title"
            type="text"
            placeholder="Ví dụ: Báo cáo công tác chuyên môn tháng 9 / Biên bản tập trung học sinh đầu năm..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
          />
        </div>

        {/* 4 MODE TABS */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`pb-2.5 px-3 font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'text'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>1. Soạn Thảo Văn Bản Báo Cáo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom_form')}
            className={`pb-2.5 px-3 font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'custom_form'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>2. Bộ Biểu Mẫu & Bảng Số Liệu Tùy Biến</span>
            {(customFields.length > 0 || customTables.length > 0) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                {customFields.length + customTables.length}
              </span>
            )}
          </button>

          {isHomeroomPeriod && (
            <button
              type="button"
              onClick={() => setActiveTab('homeroom')}
              className={`pb-2.5 px-3 font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'homeroom'
                  ? 'border-b-2 border-emerald-600 text-emerald-700'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <span>3. Biên Bản Tập Trung Học Sinh (GVCN)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 px-3 font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'file'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>4. Đính Kèm Tệp ({attachments.length})</span>
          </button>
        </div>

        {/* 1. TEXT EDITOR TAB */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            
            {/* Template Selector & Quick Section Buttons */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Áp dụng mẫu báo cáo chuẩn trường học:</span>
                </span>

                <div className="flex flex-wrap items-center gap-1.5">
                  {OFFICIAL_REPORT_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="text-[11px] font-semibold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 transition cursor-pointer shadow-2xs"
                      title={tpl.description}
                    >
                      {tpl.title.split('(')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Section Inserts */}
              <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Chèn nhanh đề mục:</span>
                <button
                  type="button"
                  onClick={() => handleInsertSection('1. TÌNH HÌNH & MỤC TIÊU THỰC HIỆN:\n- ...')}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                >
                  + 1. Tình hình
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSection('2. KẾT QUẢ ĐẠT ĐƯỢC & SỐ LIỆU THỐNG KÊ:\n- Tổng số: ...\n- Tỷ lệ hoàn thành: ...%')}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                >
                  + 2. Kết quả số liệu
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSection('3. THUẬN LỢI & KHÓ KHĂN:\n- Thuận lợi: ...\n- Khó khăn: ...')}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                >
                  + 3. Thuận lợi / Khó khăn
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSection('4. PHƯƠNG HƯỚNG & KẾ HOẠCH TIẾP THEO:\n- ...')}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                >
                  + 4. Phương hướng
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertSection('5. ĐỀ XUẤT, KIẾN NGHỊ VỚI BAN GIÁM HIỆU:\n- Kính đề nghị BGH xem xét: ...')}
                  className="text-[10px] font-medium bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 cursor-pointer"
                >
                  + 5. Kiến nghị BGH
                </button>
              </div>
            </div>

            <div>
              <textarea
                id="textarea-report-content"
                rows={9}
                placeholder="Nhập toàn bộ nội dung báo cáo, nhận xét, chỉ tiêu và số liệu chi tiết tại đây..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-normal leading-relaxed font-mono"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                <span>Bạn có thể kết hợp vừa soạn văn bản vừa thêm biểu mẫu số liệu ở tab 2.</span>
                <span>{content.length} ký tự • {content.trim().split(/\s+/).filter(Boolean).length} từ</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. CUSTOM FORM & DYNAMIC TABLE BUILDER TAB */}
        {activeTab === 'custom_form' && (
          <CustomReportFormBuilder
            fields={customFields}
            tables={customTables}
            onFieldsChange={setCustomFields}
            onTablesChange={setCustomTables}
            fieldValues={customFieldValues}
            onFieldValueChange={(fId, val) => setCustomFieldValues(prev => ({ ...prev, [fId]: val }))}
          />
        )}

        {/* 3. HOMEROOM MINUTES TAB */}
        {isHomeroomPeriod && activeTab === 'homeroom' && (
          <HomeroomMeetingMinutesForm
            currentUser={currentUser}
            initialData={homeroomData || undefined}
            onChange={handleHomeroomChange}
          />
        )}

        {/* 4. FILE ATTACHMENTS TAB */}
        {activeTab === 'file' && (
          <div className="space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
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
              <UploadCloud className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                Kéo thả tệp vào đây hoặc <span className="text-emerald-700 underline">bấm để chọn tệp</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ tệp Word (.docx, .doc), Excel (.xlsx, .xls), PowerPoint, PDF, File nén (.zip, .rar), Ảnh minh chứng
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-600">
                  Danh sách tệp đã chọn ({attachments.length} tệp):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(att.name)}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate max-w-[170px]" title={att.name}>
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa tệp"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Late explanation box if past deadline */}
        {isPastDeadline && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Giải trình lý do nộp trễ hạn:</span>
            </label>
            <input
              id="input-late-explanation"
              type="text"
              placeholder="Ví dụ: Sự cố đường truyền, bận công tác kiểm tra đột xuất..."
              value={lateExplanation}
              onChange={(e) => setLateExplanation(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Báo Cáo Lên Ban Giám Hiệu'}</span>
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
