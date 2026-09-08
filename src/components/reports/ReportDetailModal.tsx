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
  ArrowRight,
  School,
  Trophy,
  UserCheck,
  UserX,
  MapPin,
  Sparkles,
  Trash2,
  Table as TableIcon,
  Layers,
  CheckSquare
} from 'lucide-react';
import { ReportSubmission, SubmissionStatus, CustomFormField, CustomDynamicTable } from '../../types';
import { exportHomeroomReportToWord, exportAbsentStudentsToExcel } from '../../utils/homeroomReportExporter';

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
  const { reviewReport, deleteReport, waiveLateStatus } = useReports();

  const [reviewComment, setReviewComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isWaiving, setIsWaiving] = useState(false);
  const [waivedSuccess, setWaivedSuccess] = useState(false);

  const handleWaiveLate = async () => {
    if (!submission) return;
    setIsWaiving(true);
    const res = await waiveLateStatus(submission.id);
    setIsWaiving(false);
    if (res.success) {
      setWaivedSuccess(true);
    }
  };

  if (!submission) return null;

  const isAuthorOrAdmin = submission.authorId === currentUser.id || isAdmin || isPrincipal;

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

  const confirmDeleteThisReport = async () => {
    setIsProcessing(true);
    try {
      await deleteReport(submission.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (e: any) {
      alert('Lỗi xóa báo cáo: ' + e.message);
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

  const customFields: CustomFormField[] = submission.structuredData?.customFields || [];
  const customFieldValues: Record<string, any> = submission.structuredData?.customFieldValues || {};
  const customTables: CustomDynamicTable[] = submission.structuredData?.customTables || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi Tiết Báo Cáo & Hồ Sơ Duyệt"
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
            {submission.isLate && !waivedSuccess ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>
                    Nộp trễ {submission.lateDurationMinutes ? `${Math.floor(submission.lateDurationMinutes / 60)}h ${submission.lateDurationMinutes % 60}m` : ''}
                  </span>
                </span>
                {(isAdmin || isPrincipal) && (
                  <button
                    type="button"
                    onClick={handleWaiveLate}
                    disabled={isWaiving}
                    className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1 shadow-2xs cursor-pointer"
                    title="Xóa trạng thái nộp trễ do sự cố hệ thống và chuyển thành đúng hạn"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isWaiving ? 'Đang cập nhật...' : 'Miễn trừ trễ hạn (Chuyển sang Đúng hạn)'}</span>
                  </button>
                )}
              </div>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{submission.lateWaived || waivedSuccess ? 'Đúng hạn (Được BGH miễn trừ)' : 'Đúng hạn'}</span>
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

        {/* Custom Dynamic Form Fields View (if present) */}
        {customFields.length > 0 && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Các Chỉ Tiêu & Tiêu Trí Nhập Liệu Điện Tử</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {customFields.map((field) => (
                <div key={field.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">{field.label}</div>
                  <div className="text-xs font-semibold text-slate-900 mt-1">
                    {field.type === 'checkbox' ? (
                      <span className="flex items-center gap-1 text-emerald-700">
                        <CheckSquare className="w-4 h-4" />
                        <span>{customFieldValues[field.id] ? 'Đã hoàn thành / Đạt chuẩn' : 'Chưa hoàn thành'}</span>
                      </span>
                    ) : (
                      customFieldValues[field.id] !== undefined && customFieldValues[field.id] !== '' 
                        ? String(customFieldValues[field.id]) 
                        : <span className="italic text-slate-400">Không có dữ liệu</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Dynamic Tables View (if present) */}
        {customTables.length > 0 && (
          <div className="space-y-4">
            {customTables.map((tbl) => (
              <div key={tbl.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <TableIcon className="w-4 h-4 text-blue-600" />
                  <span>{tbl.title}</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        {tbl.headers.map((h, i) => (
                          <th key={i} className="p-2 border-r border-slate-200 last:border-r-0">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tbl.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                          {tbl.headers.map((h, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-slate-100 last:border-r-0">
                              {row[h] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Box or Structured Homeroom Form View */}
        {submission.structuredData?.homeroomMinutes ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <School className="w-4 h-4 text-emerald-600" />
                <span>Biên Bản Tập Trung Đầu Năm Học {submission.structuredData.homeroomMinutes.academicYear}</span>
              </div>

              <div className="flex items-center gap-2">
                {submission.structuredData.homeroomMinutes.absentStudents && submission.structuredData.homeroomMinutes.absentStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => exportAbsentStudentsToExcel(
                      submission.structuredData!.homeroomMinutes!.absentStudents,
                      submission.structuredData!.homeroomMinutes!.className,
                      submission.structuredData!.homeroomMinutes!.teacherName,
                      submission.structuredData!.homeroomMinutes!.academicYear
                    )}
                    className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Xuất Excel DS Vắng</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => exportHomeroomReportToWord(submission.structuredData!.homeroomMinutes!)}
                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải File Word (.doc)</span>
                </button>
              </div>
            </div>

            {/* Structured Administrative Card */}
            <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-2xs font-serif text-slate-900">
              <div className="grid grid-cols-2 text-center text-xs leading-relaxed border-b border-slate-200 pb-4">
                <div>
                  <div className="font-sans">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
                  <div className="font-sans font-bold">TRƯỜNG THCS-THPT ĐỐC BINH KIỀU</div>
                  <div className="text-[10px]">***</div>
                </div>
                <div>
                  <div className="font-sans font-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="font-sans font-bold underline">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="font-sans italic text-[11px] mt-1">
                    Đốc Binh Kiều, ngày {submission.structuredData.homeroomMinutes.meetingDate} tháng {submission.structuredData.homeroomMinutes.meetingMonth} năm {submission.structuredData.homeroomMinutes.meetingYear}
                  </div>
                </div>
              </div>

              <div className="text-center my-2">
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-wider font-sans">
                  BIÊN BẢN
                </h3>
                <p className="text-sm font-bold font-sans text-slate-800">
                  TẬP TRUNG HỌC SINH ĐẦU NĂM HỌC {submission.structuredData.homeroomMinutes.academicYear}
                </p>
              </div>

              <div className="space-y-1.5 text-xs sm:text-sm font-sans leading-relaxed text-slate-800 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                <p>
                  Vào lúc <strong>{submission.structuredData.homeroomMinutes.timeHour}</strong> giờ <strong>{submission.structuredData.homeroomMinutes.timeMinute}</strong> phút, Ngày <strong>{submission.structuredData.homeroomMinutes.meetingDate}</strong> tháng <strong>{submission.structuredData.homeroomMinutes.meetingMonth}</strong> năm <strong>{submission.structuredData.homeroomMinutes.meetingYear}</strong>.
                </p>
                <p>
                  Địa điểm: <strong>{submission.structuredData.homeroomMinutes.roomNumber}</strong> trường THCS-THPT Đốc Binh Kiều.
                </p>
                <p>- Họ tên GVCN: <strong>{submission.structuredData.homeroomMinutes.teacherName}</strong></p>
                <p>- Lớp: <strong className="text-emerald-800">{submission.structuredData.homeroomMinutes.className}</strong></p>
                <p>
                  - Số lượng học sinh của lớp: <strong>{submission.structuredData.homeroomMinutes.totalStudents}</strong>, trong đó nam: <strong>{submission.structuredData.homeroomMinutes.maleStudents}</strong>; nữ: <strong>{submission.structuredData.homeroomMinutes.femaleStudents}</strong>
                </p>
                <p>
                  + Số học sinh vắng: <strong className="text-rose-700 font-bold">{submission.structuredData.homeroomMinutes.absentStudents?.length || 0} em</strong> (có mẫu riêng kèm theo).
                </p>
              </div>

              {/* Talents Table */}
              <div className="space-y-2 font-sans">
                <div className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>1. Tìm hiểu về năng khiếu, thành tích của học sinh:</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border border-slate-300 p-2 w-10 text-center">TT</th>
                        <th className="border border-slate-300 p-2">Cuộc thi / Phong trào</th>
                        <th className="border border-slate-300 p-2 w-1/4 text-center">Đạt giải</th>
                        <th className="border border-slate-300 p-2 w-1/3">Họ tên học sinh đạt giải</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submission.structuredData.homeroomMinutes.talents?.map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 font-medium">{t.competition}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{t.prize || '-'}</td>
                          <td className="border border-slate-300 p-1.5 font-semibold text-slate-800">{t.studentName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cadres Table */}
              <div className="space-y-2 font-sans">
                <div className="font-bold text-xs uppercase text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>2. Phân công các chức danh trong lớp (Ban cán sự lớp):</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="border border-slate-300 p-2 w-10 text-center">TT</th>
                        <th className="border border-slate-300 p-2">Chức danh</th>
                        <th className="border border-slate-300 p-2">Họ và tên</th>
                        <th className="border border-slate-300 p-2 w-20 text-center">Học lực</th>
                        <th className="border border-slate-300 p-2 w-20 text-center">Hạnh kiểm</th>
                        <th className="border border-slate-300 p-2 w-28 text-center">Số điện thoại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submission.structuredData.homeroomMinutes.cadres?.map((c, idx) => (
                        <tr key={c.id || idx} className="hover:bg-slate-50">
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="border border-slate-300 p-1.5 font-bold text-slate-800">{c.role}</td>
                          <td className="border border-slate-300 p-1.5 font-semibold text-blue-900">{c.studentName || '-'}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{c.academicPerf || '-'}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{c.conductPerf || '-'}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono">{c.phone || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Absent Students Table */}
              <div className="space-y-2 font-sans">
                <div className="font-bold text-xs uppercase text-rose-900 flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-rose-600" />
                  <span>3. Danh sách học sinh vắng đầu năm học {submission.structuredData.homeroomMinutes.academicYear} của lớp: {submission.structuredData.homeroomMinutes.className}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border border-slate-300 border-collapse">
                    <thead>
                      <tr className="bg-rose-50 text-rose-950 font-bold">
                        <th className="border border-slate-300 p-2 w-8 text-center">TT</th>
                        <th className="border border-slate-300 p-2">Họ và tên học sinh</th>
                        <th className="border border-slate-300 p-2 w-20 text-center">Lớp cũ</th>
                        <th className="border border-slate-300 p-2 w-1/3">Nơi ở hiện nay</th>
                        <th className="border border-slate-300 p-2 w-24 text-center">SĐT HS</th>
                        <th className="border border-slate-300 p-2 w-24 text-center">SĐT PH</th>
                        <th className="border border-slate-300 p-2">Lý do chưa ra lớp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submission.structuredData.homeroomMinutes.absentStudents && submission.structuredData.homeroomMinutes.absentStudents.length > 0 ? (
                        submission.structuredData.homeroomMinutes.absentStudents.map((s, idx) => (
                          <tr key={s.id || idx} className="hover:bg-rose-50/40">
                            <td className="border border-slate-300 p-1.5 text-center font-bold text-rose-600">{idx + 1}</td>
                            <td className="border border-slate-300 p-1.5 font-bold text-slate-900">{s.studentName}</td>
                            <td className="border border-slate-300 p-1.5 text-center">{s.previousClass || '-'}</td>
                            <td className="border border-slate-300 p-1.5">{s.currentAddress || '-'}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono">{s.studentPhone || '-'}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-mono font-bold text-slate-800">{s.parentPhone || '-'}</td>
                            <td className="border border-slate-300 p-1.5 text-rose-900">{s.reason || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="border border-slate-300 p-3 text-center italic font-semibold text-emerald-700 bg-emerald-50/50">
                            Lớp tập trung đầy đủ 100% (Không có học sinh vắng)
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-xs font-sans mt-6 pt-4 border-t border-slate-200">
                <div></div>
                <div>
                  <div className="font-bold">GIÁO VIÊN CHỦ NHIỆM</div>
                  <div className="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</div>
                  <div className="h-10"></div>
                  <div className="font-bold text-slate-900">{submission.structuredData.homeroomMinutes.teacherName}</div>
                </div>
              </div>
            </div>
          </div>
        ) : submission.content ? (
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Nội dung văn bản báo cáo
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs font-sans text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
              {submission.content}
            </div>
          </div>
        ) : null}

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

        {/* Modal Footer Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {isAuthorOrAdmin ? (
            showDeleteConfirm ? (
              <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-xl border border-rose-200 animate-in fade-in">
                <span className="text-xs font-bold text-rose-800">Xác nhận xóa báo cáo này?</span>
                <button
                  type="button"
                  onClick={confirmDeleteThisReport}
                  disabled={isProcessing}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  {isProcessing ? 'Đang xóa...' : 'Đúng, Xóa'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isProcessing}
                  className="px-2.5 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isProcessing}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Xóa Báo Cáo Này</span>
              </button>
            )
          ) : <div></div>}

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>

      </div>
    </Modal>
  );
};
