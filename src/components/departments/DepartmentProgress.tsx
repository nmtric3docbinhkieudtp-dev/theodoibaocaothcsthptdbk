import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { 
  BarChart3, 
  Building, 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  Search, 
  TrendingUp,
  UserCheck,
  Calendar,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  Copy,
  Check,
  Download,
  Send,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { Department, ReportPeriod, ReportSubmission, User } from '../../types';
import { getRequiredUsersForPeriod } from '../../utils/reportFilters';
import { ExportService } from '../../services/exportService';

interface DepartmentProgressProps {
  onOpenDetail?: (sub: ReportSubmission) => void;
  onOpenReportDetail?: (sub: ReportSubmission) => void;
  onOpenUnsubmittedUsers?: (periodId?: string) => void;
}

export const DepartmentProgress: React.FC<DepartmentProgressProps> = ({
  onOpenDetail,
  onOpenReportDetail,
  onOpenUnsubmittedUsers
}) => {
  const handleDetail = (sub: ReportSubmission) => {
    if (onOpenDetail) onOpenDetail(sub);
    if (onOpenReportDetail) onOpenReportDetail(sub);
  };

  const { allUsers = [], isAdmin, isPrincipal } = useAuth();
  const { 
    departments = [], 
    submissions = [], 
    periods = [], 
    schoolInfo, 
    sendDeadlineReminderToUser, 
    sendBulkReminders,
    confirmSubmissionForTeacher 
  } = useReports();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'departments' | 'unsubmitted' | 'late_history'>('departments');
  const [searchTerm, setSearchTerm] = useState('');
  const [unsubmittedPeriodId, setUnsubmittedPeriodId] = useState<string>('all');
  const [unsubmittedFilter, setUnsubmittedFilter] = useState<'all' | 'in_deadline' | 'overdue'>('all');
  const [copiedZalo, setCopiedZalo] = useState(false);
  const [remindedUserIds, setRemindedUserIds] = useState<Record<string, boolean>>({});
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Late submissions list
  const lateSubmissions = submissions.filter((s: ReportSubmission) => s.isLate);

  // Active periods list
  const activePeriods = periods.filter((p: ReportPeriod) => p.status === 'active');
  const selectedPeriod = periods.find(p => p.id === unsubmittedPeriodId);

  // Compute unsubmitted records
  const unsubmittedList = useMemo(() => {
    const list: Array<{
      user: User;
      period: ReportPeriod;
      status: 'pending_in_deadline' | 'pending_overdue';
      remainingHours: number;
    }> = [];

    const targetPeriods = unsubmittedPeriodId === 'all'
      ? (activePeriods.length > 0 ? activePeriods : periods.slice(0, 3))
      : (selectedPeriod ? [selectedPeriod] : []);

    const now = Date.now();

    for (const period of targetPeriods) {
      const requiredUsers = getRequiredUsersForPeriod(period, allUsers);
      const submittedUserIds = new Set(
        submissions
          .filter(s => s.periodId === period.id && s.status !== 'draft')
          .map(s => s.authorId)
      );

      const deadlineTime = new Date(period.deadline).getTime();
      const isOverdue = now > deadlineTime;
      const remainingHours = Math.round((deadlineTime - now) / (1000 * 60 * 60));

      for (const u of requiredUsers) {
        if (!submittedUserIds.has(u.id)) {
          list.push({
            user: u,
            period,
            status: isOverdue ? 'pending_overdue' : 'pending_in_deadline',
            remainingHours
          });
        }
      }
    }

    return list;
  }, [unsubmittedPeriodId, activePeriods, periods, selectedPeriod, allUsers, submissions]);

  // Filter unsubmitted list
  const filteredUnsubmitted = useMemo(() => {
    return unsubmittedList.filter(item => {
      if (unsubmittedFilter === 'in_deadline' && item.status !== 'pending_in_deadline') return false;
      if (unsubmittedFilter === 'overdue' && item.status !== 'pending_overdue') return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        item.user.name.toLowerCase().includes(term) ||
        item.user.email.toLowerCase().includes(term) ||
        (item.user.departmentName && item.user.departmentName.toLowerCase().includes(term)) ||
        (item.user.subject && item.user.subject.toLowerCase().includes(term)) ||
        (item.user.homeroomClass && item.user.homeroomClass.toLowerCase().includes(term)) ||
        item.period.title.toLowerCase().includes(term)
      );
    });
  }, [unsubmittedList, unsubmittedFilter, searchTerm]);

  // Handle single user reminder
  const handleRemindSingle = (user: User, period: ReportPeriod) => {
    sendDeadlineReminderToUser(user, period);
    setRemindedUserIds(prev => ({ ...prev, [`${period.id}_${user.id}`]: true }));
    alert(`Đã gửi email nhắc hạn đợt "${period.title}" tới Thầy/Cô ${user.name} (${user.email})!`);
  };

  // Handle bulk email reminders
  const handleSendBulkEmail = () => {
    if (filteredUnsubmitted.length === 0) return;
    const confirm = window.confirm(`Thầy có muốn gửi email nhắc nhở cho toàn bộ ${filteredUnsubmitted.length} lượt cán bộ/giáo viên chưa nộp trong danh sách này?`);
    if (!confirm) return;

    setIsSendingBulk(true);
    try {
      filteredUnsubmitted.forEach(item => {
        sendDeadlineReminderToUser(item.user, item.period);
        setRemindedUserIds(prev => ({ ...prev, [`${item.period.id}_${item.user.id}`]: true }));
      });
      alert(`Đã gửi thành công email nhắc nhở tới ${filteredUnsubmitted.length} cán bộ/giáo viên!`);
    } finally {
      setIsSendingBulk(false);
    }
  };

  // Handle copy Zalo message
  const handleCopyZalo = () => {
    const periodTitle = selectedPeriod ? selectedPeriod.title : 'Các đợt báo cáo đang mở';
    const deadlineText = selectedPeriod ? new Date(selectedPeriod.deadline).toLocaleString('vi-VN') : 'Theo thông báo của từng đợt';
    
    let text = `📢 [THÔNG BÁO NHẮC NỘP BÁO CÁO TRƯỚC HẠN]\n`;
    text += `Trường THCS & THPT Đốc Binh Kiều\n`;
    text += `Đợt báo cáo: ${periodTitle}\n`;
    text += `Hạn chót nộp: ${deadlineText}\n\n`;
    text += `Kính gửi quý Thầy/Cô, hiện tại hệ thống ghi nhận các Thầy/Cô sau đây chưa hoàn tất nộp báo cáo:\n`;

    filteredUnsubmitted.forEach((item, index) => {
      const classOrSub = item.user.homeroomClass ? ` (Lớp ${item.user.homeroomClass})` : (item.user.subject ? ` (${item.user.subject})` : '');
      const dept = item.user.departmentName ? ` - ${item.user.departmentName}` : '';
      text += `${index + 1}. ${item.user.name}${classOrSub}${dept}\n`;
    });

    text += `\n👉 Kính đề nghị quý Thầy/Cô vui lòng đăng nhập vào Cổng thông tin báo cáo của trường để nộp kịp thời trước hạn chót nhằm tránh bị hệ thống tự động ghi nhận nộp trễ hạn.\n`;
    text += `Xin trân trọng cảm ơn quý Thầy/Cô!`;

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 2500);
  };

  // Handle export Excel of unsubmitted users
  const handleExportExcel = () => {
    if (!selectedPeriod && unsubmittedPeriodId !== 'all') {
      alert('Vui lòng chọn một đợt báo cáo cụ thể hoặc chọn Tất cả');
      return;
    }
    const targetPeriod = selectedPeriod || (activePeriods[0] || periods[0]);
    if (!targetPeriod) {
      alert('Không có đợt báo cáo nào để xuất!');
      return;
    }

    const usersToExport = filteredUnsubmitted.map(f => ({
      ...f.user,
      submissionStatus: 'pending',
      submittedAt: null
    }));

    ExportService.exportUnsubmittedUsersToExcel(
      targetPeriod,
      usersToExport,
      schoolInfo,
      `Danh_Sach_Chua_Nop_${targetPeriod.id}`
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>Theo Dõi Tiến Độ & Kỷ Luật Nộp Báo Cáo</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Giám sát tiến độ 7 tổ, theo dõi giáo viên chưa nộp để đôn đốc trước hạn và lưu trữ hồ sơ nộp trễ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenUnsubmittedUsers && (
            <button
              onClick={() => onOpenUnsubmittedUsers(unsubmittedPeriodId !== 'all' ? unsubmittedPeriodId : undefined)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
              title="Mở bảng đôn đốc chưa nộp dạng cửa sổ nổi"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Cửa Sổ Đôn Đốc</span>
            </button>
          )}

          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'departments' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Tiến độ 7 Tổ ({departments.filter(d => d.id !== 'bgh').length})
            </button>

            <button
              id="tab-unsubmitted-tracker"
              onClick={() => setActiveTab('unsubmitted')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'unsubmitted' ? 'bg-amber-500 text-slate-950 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>DS Chưa Nộp (Cần Nhắc)</span>
              {unsubmittedList.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-950 font-black">
                  {unsubmittedList.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('late_history')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'late_history' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sổ nộp trễ ({lateSubmissions.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'departments' && (
        
        /* DEPARTMENTS OVERVIEW */
        <div className="space-y-6">
          
          {/* Department Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.filter((d: Department) => d.id !== 'bgh').map((dept: Department) => {
              const deptUsers = allUsers.filter((u: User) => u.departmentId === dept.id);
              const deptSubs = submissions.filter((s: ReportSubmission) => s.departmentId === dept.id && s.status !== 'draft');
              const lateCount = deptSubs.filter((s: ReportSubmission) => s.isLate).length;
              const totalTarget = dept.memberCount || Math.max(deptUsers.length, 1);
              const percent = Math.min(100, Math.round((deptSubs.length / totalTarget) * 100));

              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDeptId(selectedDeptId === dept.id ? 'all' : dept.id)}
                  className={`bg-white rounded-2xl p-5 border transition cursor-pointer shadow-2xs ${
                    selectedDeptId === dept.id 
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' 
                      : 'border-slate-200/90 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                      {dept.code}
                    </span>
                    <span className="text-xs font-black text-slate-900">{percent}%</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 truncate" title={dept.name}>
                    {dept.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    <span>Tổ trưởng: <strong>{dept.headUserName}</strong></span>
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 80 ? 'bg-emerald-500' : percent >= 40 ? 'bg-teal-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Đã nộp: <strong>{deptSubs.length}</strong> / {totalTarget}</span>
                    {lateCount > 0 ? (
                      <span className="text-rose-600 font-bold">{lateCount} trễ</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">0 trễ</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Teacher Roster & Status Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Chi Tiết Tiến Độ Từng Cán Bộ / Giáo Viên {selectedDeptId !== 'all' ? `(${departments.find((d: Department) => d.id === selectedDeptId)?.name})` : ''}
                </h3>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm giáo viên theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 w-56"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                    <th className="p-3">Họ và Tên</th>
                    <th className="p-3">Chức Vụ</th>
                    <th className="p-3">Tổ Chuyên Môn</th>
                    <th className="p-3">Số Báo Cáo Đã Nộp</th>
                    <th className="p-3">Tình Trạng Hạn Nộp</th>
                    <th className="p-3 text-right">Đôn Đốc / Nhắc Hạn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers
                    .filter((u: User) => selectedDeptId === 'all' || u.departmentId === selectedDeptId)
                    .filter((u: User) => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((user: User) => {
                      const userSubs = submissions.filter((s: ReportSubmission) => s.authorId === user.id && s.status !== 'draft');
                      const hasLate = userSubs.some((s: ReportSubmission) => s.isLate);

                      return (
                        <tr key={user.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  {user.isHomeroomTeacher && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-0.5">
                                      <GraduationCap className="w-2.5 h-2.5 text-amber-700" />
                                      GVCN {user.homeroomClass}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal">
                                  {user.subject || user.roleTitle}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">{user.roleTitle}</td>
                          <td className="p-3 text-slate-600">{user.departmentName}</td>
                          <td className="p-3 font-semibold text-slate-800">
                            {userSubs.length} báo cáo
                          </td>
                          <td className="p-3">
                            {userSubs.length === 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                Chưa nộp bài nào
                              </span>
                            ) : hasLate ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                ⚠️ Có bài nộp trễ
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Hoàn thành đúng hạn
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {periods.length > 0 && (
                              <button
                                onClick={() => {
                                  sendDeadlineReminderToUser(user, periods[0]);
                                  alert(`Đã gửi email nhắc nhở báo cáo tới ${user.name} (${user.email})!`);
                                }}
                                className="px-2.5 py-1 rounded-lg text-emerald-700 hover:bg-emerald-50 font-semibold text-[11px] inline-flex items-center gap-1 border border-emerald-200 cursor-pointer"
                              >
                                <Mail className="w-3 h-3" />
                                <span>Gửi email nhắc</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: UNREPORTED / UN-SUBMITTED USERS TRACKER */}
      {activeTab === 'unsubmitted' && (
        <div className="space-y-4">
          {/* Controls & Period Selector Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Chọn đợt báo cáo:</span>
                </label>
                <select
                  value={unsubmittedPeriodId}
                  onChange={(e) => setUnsubmittedPeriodId(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-800 shadow-2xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="all">Tất cả các đợt đang mở ({activePeriods.length} đợt)</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} {p.status === 'active' ? '(Đang mở)' : '(Đã đóng)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyZalo}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Sao chép danh sách giáo viên chưa nộp vào Zalo nhóm trường"
                >
                  {copiedZalo ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{copiedZalo ? 'Đã chép vào bộ nhớ tạm!' : 'Chép tin nhắn Zalo'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer"
                  title="Tải danh sách những người chưa nộp ra file Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendBulkEmail}
                  disabled={isSendingBulk || filteredUnsubmitted.length === 0}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-98 cursor-pointer disabled:opacity-50"
                  title="Gửi email nhắc nhở cho tất cả giáo viên chưa nộp trong danh sách"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-950" />
                  <span>{isSendingBulk ? 'Đang gửi...' : `Gửi Email (${filteredUnsubmitted.length})`}</span>
                </button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
                <button
                  onClick={() => setUnsubmittedFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    unsubmittedFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({unsubmittedList.length})
                </button>
                <button
                  onClick={() => setUnsubmittedFilter('in_deadline')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    unsubmittedFilter === 'in_deadline'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>Còn trong hạn ({unsubmittedList.filter(i => i.status === 'pending_in_deadline').length})</span>
                </button>
                <button
                  onClick={() => setUnsubmittedFilter('overdue')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    unsubmittedFilter === 'overdue'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  <span>Đã quá hạn ({unsubmittedList.filter(i => i.status === 'pending_overdue').length})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm giáo viên, tổ, môn, lớp..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            {filteredUnsubmitted.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-base">Không có cán bộ giáo viên nào chưa nộp!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {searchTerm
                    ? 'Không tìm thấy giáo viên nào phù hợp với từ khóa tìm kiếm.'
                    : 'Tuyệt vời! Tất cả cán bộ/giáo viên được yêu cầu đều đã hoàn thành nộp báo cáo đúng quy định.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[65vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-3 w-12 text-center">STT</th>
                      <th className="p-3 min-w-[200px]">Họ và Tên Giáo Viên</th>
                      <th className="p-3 w-40">Tổ / Bộ Phận</th>
                      <th className="p-3 w-36">Chức Vụ</th>
                      <th className="p-3 w-40">Lớp CN / Môn</th>
                      <th className="p-3 min-w-[180px]">Đợt Báo Cáo</th>
                      <th className="p-3 w-36 text-center">Hạn Chót</th>
                      <th className="p-3 w-36 text-center">Tình Trạng Hạn</th>
                      <th className="p-3 w-36 text-right">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUnsubmitted.map((item, idx) => {
                      const isReminded = Boolean(remindedUserIds[`${item.period.id}_${item.user.id}`]);

                      return (
                        <tr key={`${item.period.id}_${item.user.id}`} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{item.user.name}</div>
                            <div className="text-[11px] text-slate-400">{item.user.email}</div>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">
                            {item.user.departmentName || '-'}
                          </td>
                          <td className="p-3 text-slate-600">
                            {item.user.roleTitle || '-'}
                          </td>
                          <td className="p-3">
                            {item.user.isHomeroomTeacher && item.user.homeroomClass ? (
                              <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md text-[11px] border border-amber-200">
                                <GraduationCap className="w-3 h-3 text-amber-700" />
                                <span>Lớp {item.user.homeroomClass}</span>
                              </span>
                            ) : (
                              <span className="text-slate-600">{item.user.subject || '-'}</span>
                            )}
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            {item.period.title}
                          </td>
                          <td className="p-3 text-center text-slate-600 text-[11px]">
                            {new Date(item.period.deadline).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-3 text-center">
                            {item.status === 'pending_in_deadline' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>
                                  {item.remainingHours > 24
                                    ? `Còn ${Math.floor(item.remainingHours / 24)} ngày`
                                    : (item.remainingHours > 0 ? `Còn ${item.remainingHours} giờ` : 'Sắp hết hạn')}
                                </span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>Quá hạn {Math.abs(item.remainingHours) > 24 ? `${Math.floor(Math.abs(item.remainingHours) / 24)} ngày` : `${Math.abs(item.remainingHours)} giờ`}</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {(isAdmin || isPrincipal) && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`Xác nhận Thầy/Cô ${item.user.name} đã hoàn thành và nộp báo cáo cho đợt "${item.period.title}"?\n\nHệ thống sẽ cập nhật trạng thái "Đã nộp" trên toàn trường.`)) {
                                      await confirmSubmissionForTeacher(item.user, item.period);
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition cursor-pointer"
                                  title={`Xác nhận đã nộp cho ${item.user.name}`}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Xác nhận nộp</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemindSingle(item.user, item.period)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1 border transition cursor-pointer ${
                                  isReminded
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                                }`}
                                title={`Gửi email nhắc nhở nộp báo cáo tới ${item.user.email}`}
                              >
                                {isReminded ? <Check className="w-3 h-3 text-emerald-600" /> : <Mail className="w-3 h-3 text-slate-500" />}
                                <span>{isReminded ? 'Đã nhắc' : 'Nhắc email'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LATE SUBMISSIONS HISTORY */}
      {activeTab === 'late_history' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-rose-950 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Sổ Lưu Trữ Lịch Sử Nộp Báo Cáo Trễ Hạn</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu ghi nhận chính xác thời gian và giải trình của từng cá nhân nộp sau hạn chót để phục vụ xét thi đua.
              </p>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200">
              Tổng số ca trễ: {lateSubmissions.length}
            </span>
          </div>

          {lateSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <div className="font-bold text-slate-800 text-sm">Tuyệt vời! Không có ai nộp trễ hạn.</div>
              <div className="text-xs text-slate-400 mt-0.5">Kỷ luật nộp báo cáo của trường đạt 100%.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-rose-50/50 text-rose-900 font-bold uppercase tracking-wider text-[11px] border-b border-rose-200">
                    <th className="p-3">Giáo Viên</th>
                    <th className="p-3">Tổ Chuyên Môn</th>
                    <th className="p-3">Tên Báo Cáo & Đợt</th>
                    <th className="p-3">Thời Điểm Nộp</th>
                    <th className="p-3">Thời Gian Trễ</th>
                    <th className="p-3">Lý Do / Giải Trình</th>
                    <th className="p-3">Nhận Xét Duyệt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lateSubmissions.map((sub: ReportSubmission) => {
                    const mins = sub.lateDurationMinutes || 0;
                    const formattedLate = mins > 1440 
                      ? `${(mins / 1440).toFixed(1)} ngày` 
                      : `${Math.floor(mins / 60)} giờ ${mins % 60} phút`;

                    return (
                      <tr 
                        key={sub.id} 
                        onClick={() => handleDetail(sub)}
                        className="hover:bg-slate-50 transition cursor-pointer"
                      >
                        <td className="p-3 font-bold text-slate-900">{sub.authorName}</td>
                        <td className="p-3 text-slate-600">{sub.departmentName}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{sub.title}</div>
                          <div className="text-[10px] text-slate-400">{sub.periodTitle}</div>
                        </td>
                        <td className="p-3 text-slate-600">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : ''}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded font-bold text-rose-700 bg-rose-50 border border-rose-200">
                            Trễ {formattedLate}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 italic max-w-xs">
                          {sub.lateExplanation ? `"${sub.lateExplanation}"` : 'Không giải trình'}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px]">
                          {sub.deptHeadReview?.comment || sub.principalReview?.comment || 'Đang xử lý'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      )}

    </div>
  );
};
