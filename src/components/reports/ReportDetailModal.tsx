import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { Modal } from '../common/Modal';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Building, 
  Paperclip, 
  Download, 
  MessageSquare, 
  CornerDownRight, 
  ShieldCheck, 
  Send,
  Calendar,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { ReportSubmission, SubmissionStatus } from '../../types';

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ReportSubmission | null;
  onEdit?: (submission: ReportSubmission) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  isOpen,
  onClose,
  submission,
  onEdit
}) => {
  const { currentUser, isPrincipal, isDeptHead, isAdmin } = useAuth();
  const { reviewReport } = useReports();

  const [reviewComment, setReviewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!submission) return null;

  // Determine review permissions
  const canDeptHeadReview = 
    (isDeptHead && (currentUser.departmentId === submission.departmentId || isAdmin)) &&
    submission.status === 'submitted';

  const canPrincipalReview = 
    (isPrincipal || isAdmin) && 
    (submission.status === 'dept_approved' || (submission.departmentId === 'bgh' && submission.status === 'submitted'));

  const handleReviewAction = async (action: 'approved' | 'rejected' | 'requested_edit') => {
    if (action !== 'approved' && !reviewComment.trim()) {
      alert('Vui lòng nhập lý do / góp ý khi từ chối hoặc yêu cầu chỉnh sửa báo cáo!');
      return;
    }

    setIsProcessing(true);
    try {
      await reviewReport(submission.id, action, reviewComment.trim());
      setReviewComment('');
      onClose();
    } catch (e: any) {
      alert('Lỗi phê duyệt: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'draft':
        return { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'submitted':
        return { label: 'Chờ Tổ trưởng duyệt', color: 'bg-blue-50 text-blue-700 border-blue-300' };
      case 'dept_approved':
        return { label: 'Tổ trưởng đã duyệt • Chờ BGH', color: 'bg-purple-50 text-purple-700 border-purple-300' };
      case 'dept_rejected':
        return { label: 'Tổ trưởng yêu cầu chỉnh sửa', color: 'bg-rose-50 text-rose-700 border-rose-300' };
      case 'principal_approved':
        return { label: 'Ban Giám Hiệu đã phê duyệt', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' };
      case 'principal_rejected':
        return { label: 'BGH yêu cầu bổ sung', color: 'bg-amber-50 text-amber-800 border-amber-300' };
    }
  };

  const statusBadge = getStatusBadge(submission.status);

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi Tiết Báo Cáo & Quy Trình Duyệt"
      subtitle={`Mã hồ sơ: ${submission.id} • ${submission.periodTitle}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        
        {/* Top Info Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {submission.authorName.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{submission.authorName}</span>
                <span className="text-xs text-slate-500 font-normal">({submission.authorRoleTitle})</span>
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <Building className="w-3.5 h-3.5" />
                <span>{submission.departmentName}</span>
                <span>•</span>
                <span>{submission.authorEmail}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pill */}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusBadge.color}`}>
              {statusBadge.label}
            </span>

            {/* Late Badge */}
            {submission.isLate ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>
                  Nộp trễ {submission.lateDurationMinutes ? `${Math.floor(submission.lateDurationMinutes / 60)}h ${submission.lateDurationMinutes % 60}m` : ''}
                </span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Đúng hạn</span>
              </span>
            )}
          </div>
        </div>

        {/* Report Title & Late Explanation */}
        <div>
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">
            Tiêu đề báo cáo
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {submission.title}
          </h2>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Nộp lúc: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('vi-VN') : 'Bản nháp'}</span>
            </span>
            <span>•</span>
            <span>Đợt: {submission.periodTitle}</span>
          </div>

          {submission.lateExplanation && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <strong>Lý do giải trình nộp trễ:</strong> "{submission.lateExplanation}"
            </div>
          )}
        </div>

        {/* Content Box */}
        {submission.content && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Nội dung báo cáo
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs font-sans text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {submission.content}
            </div>
          </div>
        )}

        {/* Attachments Section */}
        {submission.attachments && submission.attachments.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tệp đính kèm ({submission.attachments.length} tệp)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {submission.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 transition shadow-2xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getFileIcon(att.name)}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]" title={att.name}>
                        {att.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatFileSize(att.size)} • Tải lên {new Date(att.uploadedAt).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>

                  <a
                    href={att.url || '#'}
                    download={att.name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    title="Tải tệp về máy"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Tải về</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Multi-stage Approval Workflow Timeline */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tiến trình thẩm định & Phê duyệt</span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            
            {/* Step 1: Nộp */}
            <div className="relative">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                1
              </div>
              <div className="text-xs font-bold text-slate-900">
                Giáo viên gửi nộp báo cáo
              </div>
              <div className="text-[11px] text-slate-500">
                {submission.authorName} ({submission.authorRoleTitle}) • {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('vi-VN') : 'Bản nháp'}
              </div>
            </div>

            {/* Step 2: Tổ trưởng */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                submission.deptHeadReview 
                  ? (submission.deptHeadReview.action === 'approved' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')
                  : 'bg-slate-300 text-slate-700'
              }`}>
                2
              </div>
              <div className="text-xs font-bold text-slate-900">
                Tổ trưởng chuyên môn kiểm duyệt
              </div>
              {submission.deptHeadReview ? (
                <div className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{submission.deptHeadReview.reviewerName}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({submission.deptHeadReview.reviewerRoleTitle})</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      submission.deptHeadReview.action === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {submission.deptHeadReview.action === 'approved' ? 'Đã duyệt' : 'Yêu cầu sửa'}
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1 italic">
                    "{submission.deptHeadReview.comment}"
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(submission.deptHeadReview.timestamp).toLocaleString('vi-VN')}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Chờ Tổ trưởng chuyên môn thẩm định...
                </div>
              )}
            </div>

            {/* Step 3: Ban Giám Hiệu */}
            <div className="relative">
              <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                submission.principalReview 
                  ? (submission.principalReview.action === 'approved' ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white')
                  : 'bg-slate-300 text-slate-700'
              }`}>
                3
              </div>
              <div className="text-xs font-bold text-slate-900">
                Ban Giám Hiệu phê duyệt kết quả
              </div>
              {submission.principalReview ? (
                <div className="mt-1 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span>{submission.principalReview.reviewerName}</span>
                    <span className="text-[10px] text-emerald-700 font-normal">({submission.principalReview.reviewerRoleTitle})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-emerald-200 text-emerald-900">
                      Phê duyệt hoàn tất
                    </span>
                  </div>
                  <div className="text-emerald-800 mt-1 italic">
                    "{submission.principalReview.comment}"
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-1">
                    {new Date(submission.principalReview.timestamp).toLocaleString('vi-VN')}
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 italic">
                  Chờ Ban Giám Hiệu phê duyệt bước cuối...
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Review Action Box (If current user has permission to review) */}
        {(canDeptHeadReview || canPrincipalReview) && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>
                Thực hiện phê duyệt ({canDeptHeadReview ? 'Dành cho Tổ trưởng' : 'Dành cho Ban Giám Hiệu'})
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1">
                Nhận xét & Ý kiến chỉ đạo <span className="text-slate-500 font-normal">(bắt buộc khi yêu cầu sửa)</span>:
              </label>
              <textarea
                rows={2}
                placeholder="Nhập nhận xét đánh giá, hoặc hướng dẫn bổ sung cho giáo viên..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-amber-300 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleReviewAction('rejected')}
                className="px-3.5 py-1.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Từ chối / Trả lại sửa</span>
              </button>

              <button
                type="button"
                id="btn-approve-report"
                disabled={isProcessing}
                onClick={() => handleReviewAction('approved')}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{canDeptHeadReview ? 'Duyệt & Chuyển BGH' : 'Phê Duyệt Hoàn Tất'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
