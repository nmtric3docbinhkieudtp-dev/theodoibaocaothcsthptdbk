import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  FileCheck, 
  CheckSquare, 
  MessageSquare, 
  Building, 
  Paperclip,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { ReportSubmission } from '../../types';

interface ApprovalQueueProps {
  onOpenReportDetail?: (submission: ReportSubmission) => void;
  onOpenDetail?: (submission: ReportSubmission) => void;
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  onOpenReportDetail,
  onOpenDetail
}) => {
  const handleDetail = (sub: ReportSubmission) => {
    if (onOpenDetail) onOpenDetail(sub);
    if (onOpenReportDetail) onOpenReportDetail(sub);
  };

  const { currentUser, isPrincipal, isDeptHead, isAdmin } = useAuth();
  const { submissions = [], reviewReport } = useReports();

  const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
  const [selectedSubForQuickReview, setSelectedSubForQuickReview] = useState<ReportSubmission | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter submissions based on role
  const pendingApprovals = submissions.filter((sub) => {
    if (isDeptHead && currentUser.role === 'dept_head') {
      return sub.departmentId === currentUser.departmentId && sub.status === 'submitted';
    }
    if (isPrincipal) {
      return sub.status === 'dept_approved' || (sub.departmentId === 'bgh' && sub.status === 'submitted');
    }
    if (isAdmin) {
      return sub.status === 'submitted' || sub.status === 'dept_approved';
    }
    return false;
  });

  const reviewedApprovals = submissions.filter((sub) => {
    if (isDeptHead && currentUser.role === 'dept_head') {
      return sub.departmentId === currentUser.departmentId && sub.status !== 'submitted' && sub.status !== 'draft';
    }
    if (isPrincipal) {
      return sub.status === 'principal_approved' || sub.status === 'principal_rejected';
    }
    return false;
  });

  const handleQuickApprove = async (sub: ReportSubmission) => {
    setIsProcessing(true);
    try {
      await reviewReport(
        sub.id,
        'approved',
        isDeptHead 
          ? 'Tổ trưởng đã kiểm tra nội dung và thống nhất chuyển Ban Giám Hiệu.' 
          : 'Ban Giám Hiệu đã xem xét và đồng ý phê duyệt lưu hồ sơ.'
      );
      setSelectedSubForQuickReview(null);
    } catch (e: any) {
      alert('Lỗi phê duyệt: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomReview = async (action: 'approved' | 'rejected') => {
    if (!selectedSubForQuickReview) return;
    if (action === 'rejected' && !reviewComment.trim()) {
      alert('Vui lòng nhập lý do cần chỉnh sửa / bổ sung!');
      return;
    }

    setIsProcessing(true);
    try {
      await reviewReport(
        selectedSubForQuickReview.id,
        action,
        reviewComment.trim() || (action === 'approved' ? 'Đã duyệt' : 'Cần bổ sung')
      );
      setSelectedSubForQuickReview(null);
      setReviewComment('');
    } catch (e: any) {
      alert('Lỗi phê duyệt: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <span>Khu Vực Kiểm Duyệt Báo Cáo</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quyền hạn hiện tại: <strong>{currentUser.roleTitle}</strong> ({currentUser.departmentName})
          </p>
        </div>

        {/* Tab switcher */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Chờ bạn duyệt ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setActiveTab('reviewed')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'reviewed'
                ? 'bg-white text-slate-800 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Lịch sử đã duyệt ({reviewedApprovals.length})
          </button>
        </div>
      </div>

      {/* Workflow Explanation Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 text-xs flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-emerald-950">
            Quy trình phê duyệt 2 cấp chuẩn Trường THCS & THPT Đốc Binh Kiều:
          </div>
          <div className="text-slate-700 leading-relaxed">
            • <strong>Cấp 1 (Tổ trưởng):</strong> Xem báo cáo của tổ viên trong tổ, kiểm tra số liệu, có quyền <em>Duyệt & Đẩy lên BGH</em> hoặc <em>Từ chối & Trả lại</em> giáo viên kèm nhận xét.<br />
            • <strong>Cấp 2 (Ban Giám Hiệu):</strong> Phê duyệt báo cáo đã qua tổ duyệt để lưu vào kho dữ liệu và đánh giá thi đua.
          </div>
        </div>
      </div>

      {/* Main List */}
      {activeTab === 'pending' ? (
        pendingApprovals.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              Không có hồ sơ nào đang chờ duyệt!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Tất cả các báo cáo của giáo viên gửi tới cấp của bạn đã được thẩm định và phê duyệt hoàn tất.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingApprovals.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-emerald-300 transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        {sub.status === 'submitted' ? 'Cần Tổ trưởng duyệt' : 'Cần Ban Giám Hiệu duyệt'}
                      </span>
                      {sub.isLate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          ⚠️ Nộp trễ hạn
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {sub.title}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-3">
                      <span>Người nộp: <strong>{sub.authorName}</strong> ({sub.authorRoleTitle})</span>
                      <span>•</span>
                      <span>Tổ: {sub.departmentName}</span>
                      <span>•</span>
                      <span>Nộp lúc: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDetail(sub)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem toàn bộ hồ sơ</span>
                    </button>
                    <button
                      onClick={() => handleQuickApprove(sub)}
                      disabled={isProcessing}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Duyệt nhanh</span>
                    </button>
                  </div>
                </div>

                {/* Content snippet */}
                {sub.content && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed whitespace-pre-line">
                    {sub.content}
                  </div>
                )}

                {/* Attachments preview */}
                {sub.attachments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Tệp đính kèm ({sub.attachments.length}):</span>
                    {sub.attachments.map(a => (
                      <span key={a.id} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        <span>{a.name}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Interactive comment & return box button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Đợt: {sub.periodTitle}</span>
                  
                  <button
                    onClick={() => handleDetail(sub)}
                    className="text-amber-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Nhập nhận xét / Yêu cầu sửa đổi</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Reviewed tab */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3.5">Báo Cáo</th>
                <th className="p-3.5">Giáo Viên</th>
                <th className="p-3.5">Tổ Bộ Môn</th>
                <th className="p-3.5">Trạng Thái</th>
                <th className="p-3.5">Ý Kiến Thẩm Định</th>
                <th className="p-3.5 text-right">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviewedApprovals.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="p-3.5 font-bold text-slate-900">{sub.title}</td>
                  <td className="p-3.5">{sub.authorName}</td>
                  <td className="p-3.5">{sub.departmentName}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {sub.status === 'principal_approved' ? 'Đã hoàn tất duyệt' : 'Đã qua tổ duyệt'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500 italic max-w-xs truncate">
                    {sub.principalReview?.comment || sub.deptHeadReview?.comment || '-'}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDetail(sub)}
                      className="p-1 text-emerald-700 hover:text-emerald-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
