import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Send, 
  Calendar, 
  Sparkles, 
  FileCheck, 
  Mail, 
  ChevronRight,
  TrendingUp,
  Building,
  Check
} from 'lucide-react';
import { ReportPeriod, ReportSubmission } from '../../types';

interface DashboardProps {
  onOpenSubmit: (periodId?: string) => void;
  onOpenReportDetail: (submission: ReportSubmission) => void;
  onNavigate?: (tab: any) => void;
  onNavigateTab?: (tab: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenSubmit,
  onOpenReportDetail,
  onNavigate,
  onNavigateTab
}) => {
  const handleNav = (tab: any) => {
    if (onNavigate) onNavigate(tab);
    if (onNavigateTab) onNavigateTab(tab);
  };

  const { currentUser, allUsers = [], isPrincipal, isDeptHead, isAdmin } = useAuth();
  const { submissions = [], periods = [], departments = [], sendBulkReminders } = useReports();

  // Filter user's own submissions
  const mySubmissions = submissions.filter((s: ReportSubmission) => s.authorId === currentUser.id);
  const mySubmittedCount = mySubmissions.filter((s: ReportSubmission) => s.status !== 'draft').length;
  const myApprovedCount = mySubmissions.filter((s: ReportSubmission) => s.status === 'principal_approved').length;

  // Pending reviews for current user
  const pendingApprovals = submissions.filter((s: ReportSubmission) => {
    if (isDeptHead && currentUser.role === 'dept_head') {
      return s.departmentId === currentUser.departmentId && s.status === 'submitted';
    }
    if (isPrincipal) {
      return s.status === 'dept_approved';
    }
    return false;
  });

  // Active periods
  const activePeriods = periods.filter((p: ReportPeriod) => p.status === 'active');
  const totalSubmissionsCount = submissions.length;
  const totalLateCount = submissions.filter((s: ReportSubmission) => s.isLate).length;
  const onTimeRate = totalSubmissionsCount > 0 
    ? Math.round(((totalSubmissionsCount - totalLateCount) / totalSubmissionsCount) * 100) 
    : 100;

  // Helper to format remaining time
  const getRemainingTimeBadge = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff < 0) {
      const pastHours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
      return {
        text: `Đã quá hạn ${pastHours > 24 ? Math.floor(pastHours / 24) + ' ngày' : pastHours + ' giờ'}`,
        color: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days === 0) {
      return {
        text: `Hạn chót hôm nay (${hours} giờ nữa)`,
        color: 'bg-amber-50 text-amber-800 border-amber-300 font-bold animate-pulse'
      };
    }
    return {
      text: `Còn ${days} ngày ${hours} giờ`,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-200 text-xs font-semibold mb-3 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trường THCS & THPT Đốc Binh Kiều • Học kỳ I</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
              Xin chào, {currentUser.name}!
            </h1>
            <p className="text-sm text-emerald-100/90 mt-1 leading-relaxed">
              Bạn đang ở giao diện <strong>{currentUser.roleTitle}</strong> ({currentUser.departmentName}). 
              Hệ thống đã sẵn sàng tiếp nhận, kiểm duyệt báo cáo và đồng bộ dữ liệu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-dash-submit-report"
              onClick={() => onOpenSubmit()}
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Nộp Báo Cáo Mới</span>
            </button>
            <button
              onClick={() => handleNav('periods')}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/20 flex items-center gap-2 transition cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Xem Hạn Nộp</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {currentUser.role === 'teacher' ? 'Báo cáo của tôi' : 'Tổng số báo cáo'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {currentUser.role === 'teacher' ? mySubmittedCount : totalSubmissionsCount}
            </span>
            <span className="text-xs text-slate-500">bản ghi</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{myApprovedCount}</span> đã hoàn tất duyệt
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cần kiểm duyệt
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${pendingApprovals.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {pendingApprovals.length}
            </span>
            <span className="text-xs text-slate-500">hồ sơ</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {pendingApprovals.length > 0 ? (
              <button 
                onClick={() => handleNav('approvals')}
                className="text-amber-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Xử lý duyệt ngay</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-emerald-600 font-medium">Đã xử lý sạch hàng đợi</span>
            )}
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tỷ lệ đúng hạn
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {onTimeRate}%
            </span>
            <span className="text-xs text-slate-500">chỉ số toàn trường</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Đánh giá kỷ luật nộp báo cáo
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ghi nhận nộp trễ
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${totalLateCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {totalLateCount}
            </span>
            <span className="text-xs text-slate-500">trường hợp</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {totalLateCount > 0 ? (
              <button
                onClick={() => handleNav('departments')}
                className="text-rose-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Xem danh sách trễ</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-emerald-600 font-medium">100% nộp đúng hạn</span>
            )}
          </div>
        </div>

      </div>

      {/* Two Column Section: Active Deadlines & Pending Review Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Periods & Deadlines (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">
                Các đợt nộp báo cáo đang mở ({activePeriods.length})
              </h2>
            </div>
            <button
              onClick={() => handleNav('periods')}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activePeriods.map((period: ReportPeriod) => {
              const badge = getRemainingTimeBadge(period.deadline);
              const hasSubmitted = mySubmissions.some((s: ReportSubmission) => s.periodId === period.id && s.status !== 'draft');

              return (
                <div
                  key={period.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}>
                          {badge.text}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                          {period.reportType === 'text_only' ? 'Văn bản nhập liệu' : 'Kèm tệp đính kèm'}
                        </span>
                        {period.isRequired && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                            Bắt buộc
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {period.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {period.description}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-3">
                        <span>Hạn chót: <strong>{new Date(period.deadline).toLocaleString('vi-VN')}</strong></span>
                        <span>•</span>
                        <span>Người ban hành: {period.createdBy}</span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {hasSubmitted ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <Check className="w-4 h-4" />
                          <span>Bạn đã nộp</span>
                        </div>
                      ) : (
                        <button
                          id={`btn-submit-period-${period.id}`}
                          onClick={() => onOpenSubmit(period.id)}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Nộp ngay</span>
                        </button>
                      )}

                      {(isDeptHead || isPrincipal) && (
                        <button
                          onClick={() => {
                            sendBulkReminders(period, allUsers);
                            alert(`Đã gửi email nhắc hạn đợt "${period.title}" tới tất cả cán bộ giáo viên!`);
                          }}
                          title="Gửi email nhắc nhở cho tất cả giáo viên"
                          className="text-[11px] text-slate-500 hover:text-emerald-700 font-medium flex items-center gap-1 py-1 cursor-pointer"
                        >
                          <Mail className="w-3 h-3" />
                          <span>Gửi email nhắc hạn</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals Queue (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">
                Hồ sơ chờ bạn duyệt ({pendingApprovals.length})
              </h2>
            </div>
            <button
              onClick={() => handleNav('approvals')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-xs font-semibold text-slate-700">
                  Không có hồ sơ nào cần bạn phê duyệt
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tất cả báo cáo gửi tới tổ/trường đã được xử lý đầy đủ.
                </p>
              </div>
            ) : (
              pendingApprovals.slice(0, 4).map((sub: ReportSubmission) => (
                <div
                  key={sub.id}
                  onClick={() => onOpenReportDetail(sub)}
                  className="p-3 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50/30 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900 truncate">
                      {sub.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-700 line-clamp-1">
                    {sub.title}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">{sub.departmentName}</span>
                    <span className="text-amber-700 font-bold inline-flex items-center gap-1">
                      <span>Kiểm duyệt</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Department Progress Summary Widget */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Building className="w-4 h-4 text-emerald-600" />
                <span>Tiến độ 8 tổ công tác & chuyên môn</span>
              </div>
              <button
                onClick={() => handleNav('departments')}
                className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
              {departments.map((dept: any) => {
                const deptUsers = allUsers.filter((u: any) => u.departmentId === dept.id);
                const deptSubs = submissions.filter((s: ReportSubmission) => s.departmentId === dept.id && s.status !== 'draft');
                const targetCount = dept.memberCount || Math.max(deptUsers.length, 1);
                const percent = Math.min(100, Math.round((deptSubs.length / targetCount) * 100));

                return (
                  <div key={dept.id} className="text-xs bg-slate-50/70 p-2 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center font-medium text-slate-700 mb-1">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">{dept.name}</div>
                        <div className="text-[10px] text-slate-500 truncate">
                          Tổ trưởng: {dept.headUserName || 'Ban Giám Hiệu'} • {targetCount} CB-GV
                        </div>
                      </div>
                      <span className="font-black text-slate-900 text-xs shrink-0">{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          percent >= 80 ? 'bg-emerald-500' : percent >= 40 ? 'bg-teal-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
