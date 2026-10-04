import React, { useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { isUserEligibleForPeriod, submissionBelongsToUser } from '../../utils/reportFilters';
import { ReportPeriod, ReportSubmission } from '../../types';
import { 
  CalendarRange, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  FileText, 
  ArrowRight, 
  Eye, 
  Edit3, 
  Sparkles, 
  GraduationCap, 
  School,
  KeyRound,
  LogOut,
  ShieldCheck,
  Send,
  HelpCircle,
  PlusCircle,
  History,
  FileCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface TeacherSimplifiedViewProps {
  onOpenSubmit: (periodId: string) => void;
  onOpenDetail: (submission: ReportSubmission) => void;
  onOpenChangePassword?: () => void;
}

export const TeacherSimplifiedView: React.FC<TeacherSimplifiedViewProps> = ({
  onOpenSubmit,
  onOpenDetail,
  onOpenChangePassword
}) => {
  const { currentUser, logout } = useAuth();
  const { periods = [], submissions = [], schoolInfo } = useReports();

  // Filter periods strictly eligible for current teacher
  const eligiblePeriods = useMemo(() => {
    return periods
      .filter((p: ReportPeriod) => isUserEligibleForPeriod(currentUser, p))
      .sort((a, b) => {
        // Active periods first, then newest
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [periods, currentUser]);

  // Map each period with user's submission state
  const periodsWithState = useMemo(() => {
    return eligiblePeriods.map(p => {
      const isMultiple = Boolean(
        p.allowMultipleSubmissions || 
        p.title?.toLowerCase().includes('nghỉ phép') || 
        p.title?.toLowerCase().includes('xin phép')
      );
      const userSubs = submissions.filter(s => 
        s.periodId === p.id && 
        s.status !== 'draft' && 
        submissionBelongsToUser(s, currentUser)
      ).sort((a, b) => new Date(b.submittedAt || b.updatedAt || 0).getTime() - new Date(a.submittedAt || a.updatedAt || 0).getTime());

      const latestSub = userSubs[0] || null;
      const isPastDeadline = new Date().getTime() > new Date(p.deadline).getTime();
      return {
        period: p,
        submission: latestSub,
        userSubmissions: userSubs,
        isMultiple,
        hasSubmitted: userSubs.length > 0,
        isPastDeadline
      };
    });
  }, [eligiblePeriods, submissions, currentUser]);

  // Đơn xin nghỉ phép là loại đơn nộp theo nhu cầu phát sinh, không tính là "nợ báo cáo chưa nộp" nếu giáo viên không có nhu cầu nghỉ
  const pendingCount = periodsWithState.filter(item => !item.hasSubmitted && !item.isMultiple).length;
  const completedCount = periodsWithState.filter(item => item.hasSubmitted).length;

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} - ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      
      {/* Friendly Welcome & Identity Banner */}
      <div className="bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-emerald-200 backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Cổng Báo Cáo Giáo Viên & Nhân Viên</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Kính chào Thầy/Cô: <span className="text-emerald-300">{currentUser.name}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-200">
              <span className="font-semibold">{currentUser.roleTitle}</span>
              <span>•</span>
              <span>{currentUser.departmentName}</span>
              {currentUser.isHomeroomTeacher && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-xs flex items-center gap-1 shadow-xs">
                  <GraduationCap className="w-3.5 h-3.5" />
                  GVCN Lớp {currentUser.homeroomClass} {currentUser.homeroomCampus ? `(${currentUser.homeroomCampus})` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Quick User Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
            {onOpenChangePassword && (
              <button
                type="button"
                onClick={onOpenChangePassword}
                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                title="Đổi mật khẩu tài khoản"
              >
                <KeyRound className="w-4 h-4 text-emerald-300" />
                <span className="hidden sm:inline">Đổi mật khẩu</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Status Counter Bar */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pendingCount > 0 ? 'bg-amber-400 text-amber-950' : 'bg-emerald-500 text-white'}`}>
              {pendingCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
                Cần thực hiện
              </div>
              <div className="text-xl font-black text-white">
                {pendingCount > 0 ? `${pendingCount} đợt báo cáo` : 'Đã hoàn thành tất cả'}
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-2xl p-3.5 border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-300 font-bold">
                Đã nộp thành công
              </div>
              <div className="text-xl font-black text-white">
                {completedCount} đợt báo cáo
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Section Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-700" />
            <span>DANH SÁCH BÁO CÁO CỦA THẦY / CÔ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Thầy/Cô chỉ cần chọn đợt báo cáo bên dưới và bấm nút <strong className="text-emerald-700">"BÁO CÁO NGAY"</strong> để hoàn thành nhiệm vụ.
          </p>
        </div>
      </div>

      {/* Report Periods List */}
      {periodsWithState.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Hiện tại Thầy/Cô không có đợt báo cáo nào cần thực hiện!
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Hệ thống sẽ tự động cập nhật ngay khi Ban Giám Hiệu ban hành đợt báo cáo mới. Chúc Thầy/Cô một ngày làm việc tràn đầy năng lượng và hiệu quả!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {periodsWithState.map(({ period, submission, userSubmissions, isMultiple, hasSubmitted, isPastDeadline }, idx) => (
            <div 
              key={period.id}
              className={`bg-white rounded-3xl p-6 sm:p-7 border-2 transition-all shadow-md hover:shadow-lg ${
                isMultiple
                  ? 'border-teal-300/80 bg-gradient-to-b from-white to-teal-50/20'
                  : hasSubmitted 
                    ? 'border-emerald-200 bg-gradient-to-b from-white to-emerald-50/20' 
                    : isPastDeadline 
                      ? 'border-amber-300 ring-2 ring-amber-400/20' 
                      : 'border-emerald-500/80 ring-2 ring-emerald-500/20'
              }`}
            >
              {/* Card Top Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900 text-white flex items-center gap-1.5">
                    <span>Đợt {idx + 1}</span>
                  </span>

                  {isMultiple && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                      <span>Cho phép nộp nhiều lần (Đơn phát sinh)</span>
                    </span>
                  )}

                  {period.targetAudience === 'homeroom_teachers' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                      <span>Dành cho 53 GVCN</span>
                    </span>
                  )}
                  {period.targetAudience === 'gvcn_diem_chinh' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                      <span>GVCN Điểm chính (14 lớp)</span>
                    </span>
                  )}
                  {period.targetAudience === 'gvcn_doc_binh_kieu' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-sky-700" />
                      <span>GVCN Điểm ĐBK (24 lớp)</span>
                    </span>
                  )}
                  {period.targetAudience === 'gvcn_tan_kieu' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-teal-700" />
                      <span>GVCN Điểm Tân Kiều (15 lớp)</span>
                    </span>
                  )}
                  {period.isRequired && !isMultiple && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Bắt buộc
                    </span>
                  )}
                </div>

                {/* Submission State Badge */}
                <div>
                  {isMultiple ? (
                    hasSubmitted ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-teal-100 text-teal-800 border border-teal-300 shadow-2xs">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>ĐÃ GỬI {userSubmissions.length} ĐƠN NGHỈ PHÉP</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
                        <FileCheck className="w-4 h-4 text-emerald-600" />
                        <span>SẴN SÀNG GỬI ĐƠN (KHI CÓ NHU CẦU)</span>
                      </span>
                    )
                  ) : hasSubmitted ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ĐÃ NỘP BÁO CÁO THÀNH CÔNG</span>
                    </span>
                  ) : isPastDeadline ? (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shadow-2xs">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      <span>CHƯA NỘP (ĐÃ QUÁ HẠN CHÓT)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 animate-pulse shadow-2xs">
                      <Clock className="w-4 h-4 text-rose-600" />
                      <span>CHƯA NỘP BÁO CÁO</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Period Title */}
              <div className="py-4 space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                  {period.title}
                </h3>

                {period.description && (
                  <p className="text-xs sm:text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 leading-relaxed">
                    💬 <strong className="text-slate-800">Hướng dẫn của BGH:</strong> {period.description}
                  </p>
                )}

                {/* Deadline Info Banner */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>
                      {isMultiple 
                        ? 'Thời gian nhận đơn: Mở liên tục suốt năm học' 
                        : `Hạn chót nộp: ${formatDate(period.deadline)}`}
                    </span>
                  </div>

                  {!isMultiple && hasSubmitted && submission?.submittedAt && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Thời gian Thầy/Cô đã nộp: {formatDate(submission.submittedAt)}</span>
                    </div>
                  )}

                  {!isMultiple && !hasSubmitted && isPastDeadline && (
                    <span className="text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 text-xs">
                      ⚠️ Đã quá hạn, nhưng Thầy/Cô vẫn được phép nộp bổ sung để BGH ghi nhận.
                    </span>
                  )}
                </div>
              </div>

              {/* Leave Requests History List if isMultiple */}
              {isMultiple && userSubmissions.length > 0 && (
                <div className="my-4 p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3">
                  <div className="text-xs font-bold text-teal-950 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <History className="w-4 h-4 text-teal-700" />
                      <span>Lịch Sử Các Đơn Thầy/Cô Đã Gửi ({userSubmissions.length} đơn):</span>
                    </span>
                    <span className="text-[11px] text-teal-800 font-normal">
                      Ban Giám Hiệu phê duyệt riêng từng lần nghỉ
                    </span>
                  </div>

                  <div className="divide-y divide-teal-100 border border-teal-200/80 rounded-xl bg-white overflow-hidden">
                    {userSubmissions.map((sub, sIdx) => {
                      const seq = sub.submissionSequence || (userSubmissions.length - sIdx);
                      const isApproved = sub.status === 'principal_approved';
                      const isRejected = sub.status === 'principal_rejected' || sub.status === 'dept_rejected';

                      return (
                        <div key={sub.id} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-teal-700 text-white text-[11px] font-bold">
                                Lần {seq}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {sub.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span>Ngày gửi: {formatDate(sub.submittedAt || sub.updatedAt)}</span>
                              {sub.attachments && sub.attachments.length > 0 && (
                                <span>• 📎 {sub.attachments.length} tệp đính kèm</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            {isApproved ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>BGH Đã Duyệt</span>
                              </span>
                            ) : isRejected ? (
                              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>BGH Không Duyệt</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Đang Chờ BGH Duyệt</span>
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => onOpenDetail(sub)}
                              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 flex items-center gap-1 cursor-pointer"
                              title="Xem chi tiết đơn này"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prominent Action Button Section */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {isMultiple ? (
                    <span className="text-teal-800 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      Thầy/Cô có thể gửi đơn xin nghỉ phép lần 2, lần 3... bất cứ khi nào phát sinh nhu cầu.
                    </span>
                  ) : hasSubmitted ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Báo cáo đã gửi về Ban Giám Hiệu an toàn và đầy đủ.
                    </span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      Vui lòng bấm nút bên phải để điền thông tin và nộp báo cáo.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {isMultiple ? (
                    <button
                      type="button"
                      onClick={() => onOpenSubmit(period.id)}
                      className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>
                        {userSubmissions.length === 0 
                          ? 'SOẠN & GỬI ĐƠN NGHỈ PHÉP' 
                          : `GỬI ĐƠN NGHỈ PHÉP MỚI (LẦN ${userSubmissions.length + 1})`}
                      </span>
                    </button>
                  ) : !hasSubmitted ? (
                    <button
                      type="button"
                      onClick={() => onOpenSubmit(period.id)}
                      className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm sm:text-base shadow-lg hover:shadow-xl transition active:scale-98 cursor-pointer flex items-center justify-center gap-2.5"
                    >
                      <Send className="w-5 h-5" />
                      <span>BẤM VÀO ĐÂY ĐỂ BÁO CÁO NGAY</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <>
                      {submission && (
                        <button
                          type="button"
                          onClick={() => onOpenDetail(submission)}
                          className="flex-1 sm:flex-none px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                          <span>Xem lại báo cáo đã nộp</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenSubmit(period.id)}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                        title="Sửa hoặc cập nhật lại số liệu báo cáo"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Cập nhật / Sửa lại nội dung</span>
                      </button>
                    </>
                  )}
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

      {/* Helpful Note for Teachers */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border border-slate-200/80 text-slate-600 text-xs flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-800">Lưu ý dành cho Thầy/Cô:</strong> Hệ thống tự động lưu trữ tức thì và đồng bộ báo cáo của Thầy/Cô về máy chủ và Ban Giám Hiệu ngay khi Thầy/Cô bấm "Gửi Báo Cáo". Thầy/Cô có thể vào xem lại hoặc chỉnh sửa nội dung bất cứ lúc nào.
        </div>
      </div>

    </div>
  );
};
