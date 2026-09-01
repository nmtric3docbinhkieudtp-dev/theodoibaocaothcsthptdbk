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
  Users
} from 'lucide-react';
import { ReportPeriod, ReportAttachment } from '../../types';
import { isUserEligibleForPeriod, getAudienceLabel } from '../../utils/reportFilters';
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
  // If a period has targetAudience: 'homeroom_teachers', only homeroom teachers (or admin/principal previewing) see it.
  const eligiblePeriods = periods.filter(p => {
    // Principal and Admin have oversight to test/submit any period
    if (isPrincipal || isAdmin) return true;
    return isUserEligibleForPeriod(currentUser, p);
  });

  const activePeriods = eligiblePeriods.filter(p => p.status === 'active');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
  const [lateExplanation, setLateExplanation] = useState('');
  const [activeTab, setActiveTab] = useState<'text' | 'file' | 'hybrid'>('hybrid');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Set initial period
  useEffect(() => {
    if (defaultPeriodId && eligiblePeriods.some(p => p.id === defaultPeriodId)) {
      setSelectedPeriodId(defaultPeriodId);
    } else if (activePeriods.length > 0) {
      // Pick first active eligible period
      if (!selectedPeriodId || !eligiblePeriods.some(p => p.id === selectedPeriodId)) {
        setSelectedPeriodId(activePeriods[0].id);
      }
    } else if (eligiblePeriods.length > 0) {
      if (!selectedPeriodId || !eligiblePeriods.some(p => p.id === selectedPeriodId)) {
        setSelectedPeriodId(eligiblePeriods[0].id);
      }
    }
  }, [defaultPeriodId, eligiblePeriods, activePeriods, selectedPeriodId]);

  const currentPeriod = periods.find(p => p.id === selectedPeriodId);
  const isHomeroomPeriod = currentPeriod?.targetAudience === 'homeroom_teachers';

  // Check if current submission is past deadline
  const isPastDeadline = currentPeriod 
    ? new Date(currentPeriod.deadline).getTime() < Date.now() 
    : false;

  // Auto-fill template when period changes if empty
  useEffect(() => {
    if (isHomeroomPeriod && currentUser.isHomeroomTeacher && !title) {
      setTitle(`Báo cáo công tác chủ nhiệm Lớp ${currentUser.homeroomClass || ''} - ${currentUser.name}`);
    }
  }, [selectedPeriodId, isHomeroomPeriod, currentUser, title]);

  const handleTemplateInsert = () => {
    if (isHomeroomPeriod && currentUser.isHomeroomTeacher) {
      const gvcnTemplate = `BÁO CÁO CÔNG TÁC CHỦ NHIỆM LỚP ${currentUser.homeroomClass || '...'}
Họ và tên GVCN: ${currentUser.name}
Phân hiệu: ${currentUser.homeroomCampus || 'THCS & THPT Đốc Binh Kiều'}
Sĩ số lớp: ${currentUser.homeroomStudentCount || 0} học sinh

1. TÌNH HÌNH SĨ SỐ & DUY TRÌ NỀ NẾP CHUYÊN CẦN:
- Sĩ số đầu năm / hiện diện: ${currentUser.homeroomStudentCount || 0} HS (Nữ: ... HS).
- Tình hình chuyên cần: Học sinh đi học đúng giờ, thực hiện tốt đồng phục và tác phong.
- Số lượt vắng có phép: ... | Vắng không phép: 0.

2. CƠ CẤU TỔ CHỨC & BAN CÁN SỰ LỚP:
- Đã kiện toàn Ban Cán sự lớp (Lớp trưởng, 2 Lớp phó, 4 Tổ trưởng).
- Ban Chấp hành Chi đoàn / Ban Chỉ huy Chi đội hoạt động nghiêm túc.

3. HỌC SINH CÓ HOÀN CẢNH KHÓ KHĂN / ĐẶC BIỆT CẦN HỖ TRỢ:
- Học sinh thuộc diện hộ nghèo / cận nghèo: ... em.
- Học sinh có nguy cơ bỏ học / cần động viên: Không có.
- Đề xuất hỗ trợ BHYT, học bổng hoặc sách vở: ...

4. KẾT QUẢ PHỐI HỢP BAN ĐẠI DIỆN CHA MẸ HỌC SINH:
- Đã thiết lập kênh liên lạc qua Zalo nhóm lớp và sổ liên lạc điện tử.
- 100% phụ huynh đồng thuận với kế hoạch giáo dục của nhà trường.

5. ĐỀ XUẤT, KIẾN NGHỊ VỚI BAN GIÁM HIỆU:
- Kính đề nghị Ban Giám Hiệu xem xét: Tiếp tục hỗ trợ quản lý trật tự đầu giờ và các phong trào ngoại khóa.`;
      setContent(gvcnTemplate);
      return;
    }

    const template = `Kính gửi Ban Giám Hiệu và Tổ chuyên môn ${currentUser.departmentName},

1. ĐÁNH GIÁ CHUNG VỀ TÌNH HÌNH THỰC HIỆN:
- Cán bộ/giáo viên thực hiện đầy đủ, nghiêm túc chương trình, quy chế chuyên môn và kế hoạch giáo dục của nhà trường.
- Tinh thần trách nhiệm cao, tích cực đổi mới phương pháp giảng dạy và ứng dụng CNTT.

2. SỐ LIỆU VÀ KẾT QUẢ CỤ THỂ:
- Tổng số học sinh / công việc phụ trách: ...
- Tỷ lệ đạt yêu cầu / chỉ tiêu: ...%
- Các thành tích / điểm nổi bật: ...

3. NHỮNG KHÓ KHĂN, TỒN TẠI:
- Một số học sinh còn chưa tự giác trong việc tự học ở nhà.
- Cơ sở vật chất / thiết bị dạy học cần bổ sung thêm.

4. ĐỀ XUẤT, KIẾN NGHỊ:
- Kính đề nghị Ban Giám Hiệu xem xét hỗ trợ: ...`;
    setContent(template);
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

  const processFiles = (files: File[]) => {
    const newAttachments: ReportAttachment[] = files.map(file => {
      // Create local object URL for preview / download
      const fakeUrl = URL.createObjectURL(file);
      return {
        id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: file.name,
        size: file.size,
        type: file.type || file.name.split('.').pop() || 'file',
        url: fakeUrl,
        uploadedAt: new Date().toISOString()
      };
    });
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
    if (!selectedPeriodId) {
      alert('Vui lòng chọn đợt báo cáo!');
      return;
    }
    if (!title.trim()) {
      alert('Vui lòng nhập tên/tiêu đề báo cáo!');
      return;
    }
    if (!content.trim() && attachments.length === 0) {
      alert('Vui lòng nhập nội dung báo cáo hoặc đính kèm ít nhất 1 tệp tin!');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({
        periodId: selectedPeriodId,
        title,
        content,
        attachments,
        isDraft,
        lateExplanation: isPastDeadline ? lateExplanation : undefined
      });

      if (!isDraft) {
        // Trigger celebratory confetti
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
      title="Nộp Báo Cáo Định Kỳ"
      subtitle={`Cán bộ/Giáo viên: ${currentUser.name} (${currentUser.roleTitle} - ${currentUser.departmentName})`}
      maxWidth="4xl"
    >
      <div className="space-y-5">
        
        {/* Period Selector & Deadline Alert */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Chọn Đợt Báo Cáo <span className="text-rose-500">*</span></span>
              {isHomeroomPeriod && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Đợt báo cáo GVCN
                </span>
              )}
            </label>
            {eligiblePeriods.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                Hiện không có đợt báo cáo nào phân công cho vai trò của bạn.
              </div>
            ) : (
              <select
                id="select-period"
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-emerald-600 font-medium"
              >
                {eligiblePeriods.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.targetAudience === 'homeroom_teachers' ? '[GVCN] ' : ''}{p.title} ({p.status === 'active' ? 'Đang mở' : 'Đã đóng'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center">
            {currentPeriod && (
              <div className={`w-full p-2.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                isPastDeadline 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {isPastDeadline ? <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" /> : <Clock className="w-5 h-5 text-emerald-600 shrink-0" />}
                <div>
                  <div className="font-bold">
                    Hạn chót: {new Date(currentPeriod.deadline).toLocaleString('vi-VN')}
                  </div>
                  <div className="text-[11px] opacity-90">
                    {isPastDeadline 
                      ? '⚠️ Đợt báo cáo đã qua hạn quy định. Hệ thống sẽ đánh dấu Nộp trễ.' 
                      : 'Đang trong thời hạn nộp hợp lệ.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Tiêu Đề Báo Cáo <span className="text-rose-500">*</span>
          </label>
          <input
            id="input-report-title"
            type="text"
            placeholder="Ví dụ: Báo cáo kết quả kiểm tra định kỳ môn Toán khối 10 & Lớp 10A1..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
          />
        </div>

        {/* Mode switcher tabs */}
        <div className="flex border-b border-slate-200 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('hybrid')}
            className={`pb-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'hybrid'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Nội dung & Tệp đính kèm (Khuyên dùng)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`pb-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'text'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Chỉ nhập văn bản (Text)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`pb-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'file'
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Paperclip className="w-4 h-4" />
            <span>Chỉ đính kèm Tệp (File)</span>
          </button>
        </div>

        {/* Content Section (for text & hybrid) */}
        {(activeTab === 'text' || activeTab === 'hybrid') && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nội dung báo cáo chi tiết</span>
              </label>
              <button
                type="button"
                onClick={handleTemplateInsert}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 cursor-pointer"
              >
                + Chèn khung mẫu trường học
              </button>
            </div>
            <textarea
              id="textarea-report-content"
              rows={6}
              placeholder="Nhập nội dung báo cáo, số liệu học sinh, nhận xét chuyên môn, kiến nghị..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-normal leading-relaxed"
            />
            <div className="text-[11px] text-slate-400 text-right mt-1">
              Số ký tự: {content.length} • {content.trim().split(/\s+/).filter(Boolean).length} từ
            </div>
          </div>
        )}

        {/* File Attachments Section (for file & hybrid) */}
        {(activeTab === 'file' || activeTab === 'hybrid') && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Tệp đính kèm (PDF, Word .docx, Excel .xlsx, PowerPoint .pptx, ZIP, Hình ảnh)
            </label>

            {/* Drag and drop box */}
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
                Hỗ trợ tệp tối đa 50MB (Word, Excel, PowerPoint, PDF, Ảnh minh chứng, File nén)
              </p>
            </div>

            {/* Attachments List */}
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
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
            <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>Giải trình lý do nộp trễ hạn:</span>
            </label>
            <input
              id="input-late-explanation"
              type="text"
              placeholder="Ví dụ: Gặp sự cố kết nối mạng, lý do công tác đột xuất..."
              value={lateExplanation}
              onChange={(e) => setLateExplanation(e.target.value)}
              className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl bg-white border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
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
              <span>{isSubmitting ? 'Đang gửi...' : 'Nộp Báo Cáo Chính Thức'}</span>
            </button>
          </div>
        </div>

      </div>
    </Modal>
  );
};
