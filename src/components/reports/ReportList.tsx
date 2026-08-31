import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Paperclip, 
  Eye, 
  FileText, 
  Building, 
  ChevronRight, 
  FileSpreadsheet, 
  Calendar,
  LayoutGrid,
  List,
  Sparkles,
  Trash2
} from 'lucide-react';
import { ReportSubmission, SubmissionStatus } from '../../types';

interface ReportListProps {
  onOpenReportDetail?: (submission: ReportSubmission) => void;
  onOpenDetail?: (submission: ReportSubmission) => void;
  onOpenSubmit: (periodId?: string) => void;
}

export const ReportList: React.FC<ReportListProps> = ({
  onOpenReportDetail,
  onOpenDetail,
  onOpenSubmit
}) => {
  const handleDetail = (sub: ReportSubmission) => {
    if (onOpenDetail) onOpenDetail(sub);
    if (onOpenReportDetail) onOpenReportDetail(sub);
  };

  const { currentUser, isPrincipal, isDeptHead, isAdmin } = useAuth();
  const { submissions = [], periods = [], departments = [], deleteReport } = useReports();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLateFilter, setSelectedLateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Search
      const matchesSearch = 
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.content && sub.content.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Period filter
      if (selectedPeriod !== 'all' && sub.periodId !== selectedPeriod) return false;

      // Department filter
      if (selectedDepartment !== 'all' && sub.departmentId !== selectedDepartment) return false;

      // Status filter
      if (selectedStatus !== 'all' && sub.status !== selectedStatus) return false;

      // Late filter
      if (selectedLateFilter === 'late' && !sub.isLate) return false;
      if (selectedLateFilter === 'on_time' && sub.isLate) return false;

      return true;
    });
  }, [submissions, searchTerm, selectedPeriod, selectedDepartment, selectedStatus, selectedLateFilter]);

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case 'draft':
        return { label: 'Bản nháp', color: 'bg-slate-100 text-slate-700 border-slate-300' };
      case 'submitted':
        return { label: 'Chờ Tổ duyệt', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'dept_approved':
        return { label: 'Tổ đã duyệt • Chờ BGH', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'dept_rejected':
        return { label: 'Tổ trả lại sửa', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'principal_approved':
        return { label: 'BGH đã phê duyệt', color: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold' };
      case 'principal_rejected':
        return { label: 'BGH yêu cầu sửa', color: 'bg-amber-50 text-amber-800 border-amber-300' };
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Danh Sách Báo Cáo Định Kỳ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số: {filteredSubmissions.length} báo cáo ghi nhận trong cơ sở dữ liệu
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Dạng bảng chi tiết"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Dạng lưới thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onOpenSubmit()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Nộp Báo Cáo Mới</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, giáo viên, tổ bộ môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Period selector */}
          <div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
            >
              <option value="all">Tất cả đợt báo cáo</option>
              {periods.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Department selector */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
            >
              <option value="all">Tất cả tổ / phòng ban</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
            >
              <option value="all">Tất cả trạng thái duyệt</option>
              <option value="submitted">Chờ Tổ trưởng duyệt</option>
              <option value="dept_approved">Tổ đã duyệt (Chờ BGH)</option>
              <option value="principal_approved">Ban Giám Hiệu đã duyệt</option>
              <option value="dept_rejected">Tổ yêu cầu sửa</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>

        </div>

        {/* Quick Tags / Late filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">Lọc nhanh kỷ luật:</span>
          <button
            onClick={() => setSelectedLateFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedLateFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({submissions.length})
          </button>
          <button
            onClick={() => setSelectedLateFilter('on_time')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedLateFilter === 'on_time' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Đúng hạn ({submissions.filter(s => !s.isLate).length})
          </button>
          <button
            onClick={() => setSelectedLateFilter('late')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedLateFilter === 'late' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            ⚠️ Nộp trễ ({submissions.filter(s => s.isLate).length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy báo cáo nào phù hợp</h3>
          <p className="text-xs text-slate-400 mt-1">
            Thử thay đổi bộ lọc tìm kiếm hoặc nộp báo cáo mới.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Tên Báo Cáo & Đợt</th>
                  <th className="py-3.5 px-4">Người Nộp & Tổ</th>
                  <th className="py-3.5 px-4">Thời Gian Nộp</th>
                  <th className="py-3.5 px-4">Hạn Nộp</th>
                  <th className="py-3.5 px-4">Trạng Thái Duyệt</th>
                  <th className="py-3.5 px-4">Tệp</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const badge = getStatusBadge(sub.status);
                  const isAuthorOrAdmin = sub.authorId === currentUser.id || isAdmin;

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => handleDetail(sub)}
                      className="hover:bg-slate-50/70 transition cursor-pointer group"
                    >
                      {/* Title & Period */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition">
                          {sub.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {sub.periodTitle}
                        </div>
                      </td>

                      {/* Author & Dept */}
                      <td className="py-3 px-4 min-w-[170px]">
                        <div className="font-semibold text-slate-800">
                          {sub.authorName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {sub.departmentName}
                        </div>
                      </td>

                      {/* Submitted At */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {sub.submittedAt ? (
                          <>
                            <div>{new Date(sub.submittedAt).toLocaleDateString('vi-VN')}</div>
                            <div className="text-[10px] text-slate-400">
                              {new Date(sub.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </>
                        ) : (
                          <span className="italic text-slate-400">Bản nháp</span>
                        )}
                      </td>

                      {/* Late Flag */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sub.isLate ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={sub.lateExplanation || 'Nộp sau hạn chót'}>
                            <AlertTriangle className="w-3 h-3" />
                            <span>Trễ hạn</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đúng hạn</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Files */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {sub.attachments.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            <Paperclip className="w-3 h-3 text-slate-500" />
                            <span>{sub.attachments.length}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDetail(sub);
                            }}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isAuthorOrAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Bạn có chắc chắn muốn xóa báo cáo này?')) {
                                  deleteReport(sub.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Xóa báo cáo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubmissions.map((sub) => {
            const badge = getStatusBadge(sub.status);

            return (
              <div
                key={sub.id}
                onClick={() => handleDetail(sub)}
                className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color}`}>
                      {badge.label}
                    </span>
                    {sub.isLate && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Trễ hạn</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition line-clamp-2">
                    {sub.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {sub.periodTitle}
                  </div>

                  {sub.content && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {sub.content}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <div className="font-bold text-slate-800">{sub.authorName}</div>
                    <div className="text-[10px] text-slate-400">{sub.departmentName}</div>
                  </div>

                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                    <span>Xem chi tiết</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      )}

    </div>
  );
};
