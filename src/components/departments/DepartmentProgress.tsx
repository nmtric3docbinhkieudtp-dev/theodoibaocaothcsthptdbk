import React, { useState } from 'react';
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
  GraduationCap
} from 'lucide-react';
import { Department, ReportSubmission, User } from '../../types';

interface DepartmentProgressProps {
  onOpenDetail?: (sub: ReportSubmission) => void;
  onOpenReportDetail?: (sub: ReportSubmission) => void;
}

export const DepartmentProgress: React.FC<DepartmentProgressProps> = ({
  onOpenDetail,
  onOpenReportDetail
}) => {
  const handleDetail = (sub: ReportSubmission) => {
    if (onOpenDetail) onOpenDetail(sub);
    if (onOpenReportDetail) onOpenReportDetail(sub);
  };

  const { allUsers = [] } = useAuth();
  const { departments = [], submissions = [], periods = [], sendDeadlineReminderToUser } = useReports();

  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'departments' | 'late_history'>('departments');
  const [searchTerm, setSearchTerm] = useState('');

  // Late submissions list
  const lateSubmissions = submissions.filter((s: ReportSubmission) => s.isLate);

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
            Giám sát tiến độ hoàn thành theo từng tổ bộ môn và lưu trữ hồ sơ nộp trễ hạn
          </p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs">
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'departments' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Tiến độ 7 Tổ ({departments.filter(d => d.id !== 'bgh').length})
          </button>
          <button
            onClick={() => setActiveTab('late_history')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'late_history' ? 'bg-white text-rose-800 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sổ theo dõi nộp trễ ({lateSubmissions.length})
          </button>
        </div>
      </div>

      {activeTab === 'departments' ? (
        
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

      ) : (

        /* LATE SUBMISSIONS HISTORY */
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
