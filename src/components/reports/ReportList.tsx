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
  Trash2,
  GraduationCap,
  CheckSquare,
  Square,
  Eraser,
  RefreshCw,
  Plus
} from 'lucide-react';
import { ReportSubmission, SubmissionStatus } from '../../types';

interface ReportListProps {
  onOpenReportDetail?: (submission: ReportSubmission) => void;
  onOpenDetail?: (submission: ReportSubmission) => void;
  onOpenSubmit: (periodId?: string) => void;
  onOpenConsolidation?: () => void;
}

export const ReportList: React.FC<ReportListProps> = ({
  onOpenReportDetail,
  onOpenDetail,
  onOpenSubmit,
  onOpenConsolidation
}) => {
  const handleDetail = (sub: ReportSubmission) => {
    if (onOpenDetail) onOpenDetail(sub);
    if (onOpenReportDetail) onOpenReportDetail(sub);
  };

  const { currentUser, isPrincipal, isDeptHead, isAdmin } = useAuth();
  const { 
    submissions = [], 
    periods = [], 
    departments = [], 
    deleteReport, 
    bulkDeleteReports, 
    clearTestReports,
    clearAllReports
  } = useReports();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'on_time' | 'late'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Selection states for bulk actions
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // In-app Modal Confirmation States (Bypasses iframe window.confirm restriction)
  const [reportToDelete, setReportToDelete] = useState<ReportSubmission | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

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

      // Category / Late filter
      if (selectedCategory === 'late' && !sub.isLate) return false;
      if (selectedCategory === 'on_time' && sub.isLate) return false;

      return true;
    });
  }, [submissions, searchTerm, selectedPeriod, selectedDepartment, selectedStatus, selectedCategory]);

  const toggleSelectAll = () => {
    if (selectedReportIds.length === filteredSubmissions.length) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(filteredSubmissions.map(s => s.id));
    }
  };

  const toggleSelectReport = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedReportIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const confirmDeleteSingle = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      const title = reportToDelete.title;
      await deleteReport(reportToDelete.id);
      setSelectedReportIds(prev => prev.filter(id => id !== reportToDelete.id));
      setReportToDelete(null);
      showToast(`Đã xóa báo cáo "${title}" thành công!`);
    } catch (e: any) {
      showToast('Lỗi xóa báo cáo: ' + (e.message || 'Không thể xóa'));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedReportIds.length === 0) return;
    setIsDeleting(true);
    try {
      const count = selectedReportIds.length;
      await bulkDeleteReports(selectedReportIds);
      setSelectedReportIds([]);
      setShowBulkDeleteConfirm(false);
      showToast(`Đã xóa thành công ${count} báo cáo đã chọn!`);
    } catch (e: any) {
      showToast('Lỗi xóa báo cáo: ' + (e.message || 'Không thể xóa'));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmClearAllReports = async () => {
    setIsDeleting(true);
    try {
      const res = await clearAllReports();
      setSelectedReportIds([]);
      setShowClearAllConfirm(false);
      showToast(`Đã xóa sạch toàn bộ ${res.count} báo cáo trong hệ thống và Firebase!`);
    } catch (e: any) {
      showToast('Lỗi xóa: ' + (e.message || 'Không thể xóa'));
    } finally {
      setIsDeleting(false);
    }
  };

  const showToast = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => {
      setActionMessage(null);
    }, 4500);
  };

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
      
      {/* Toast notification message */}
      {actionMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between text-xs font-bold animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-200 hover:text-white">✕</button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Danh Sách Báo Cáo Định Kỳ & Biểu Mẫu
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng số: {filteredSubmissions.length} báo cáo ghi nhận trong cơ sở dữ liệu Firebase
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Clean test reports button */}
          {(isAdmin || isPrincipal) && (
            <>
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(true)}
                disabled={isDeleting}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Xóa tất cả các bài nộp báo cáo hiện có trong hệ thống và Firebase"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa Hết Toàn Bộ Báo Cáo</span>
              </button>
            </>
          )}

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

          {onOpenConsolidation && (
            <button
              type="button"
              onClick={onOpenConsolidation}
              className="px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              title="Tổng hợp chi tiết kết quả báo cáo của 53 lớp / toàn trường"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-700" />
              <span>Tổng Hợp Số Liệu 53 Lớp</span>
            </button>
          )}

          <button
            onClick={() => onOpenSubmit()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo Báo Cáo Mới</span>
          </button>
        </div>
      </div>

      {/* Bulk Action Bar if items selected */}
      {selectedReportIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Đã chọn {selectedReportIds.length} / {filteredSubmissions.length} báo cáo</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedReportIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={isDeleting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa {selectedReportIds.length} Báo Cáo Đã Chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề, giáo viên, tổ bộ môn, nội dung..."
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

        {/* Quick Tags / Category filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px]">Phân loại nhanh:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({submissions.length})
          </button>
          <button
            onClick={() => setSelectedCategory('on_time')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === 'on_time' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Đúng hạn ({submissions.filter(s => !s.isLate).length})
          </button>
          <button
            onClick={() => setSelectedCategory('late')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedCategory === 'late' ? 'bg-rose-700 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
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
            Thử thay đổi bộ lọc tìm kiếm hoặc bấm nút "Tạo Báo Cáo Mới".
          </p>
        </div>
      ) : viewMode === 'table' ? (
        
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={filteredSubmissions.length > 0 && selectedReportIds.length === filteredSubmissions.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      title="Chọn tất cả"
                    />
                  </th>
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
                  const isAuthorOrAdmin = sub.authorId === currentUser.id || isAdmin || isPrincipal;
                  const isSelected = selectedReportIds.includes(sub.id);

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => handleDetail(sub)}
                      className={`hover:bg-slate-50/70 transition cursor-pointer group ${
                        isSelected ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => toggleSelectReport(sub.id, e as any)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Title & Period */}
                      <td className="py-3.5 px-4 min-w-[280px]">
                        <div className="flex items-start gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                            {sub.periodId === 'period-gvcn-1' || sub.structuredData?.homeroomMinutes ? (
                              <GraduationCap className="w-4 h-4 text-amber-600" />
                            ) : (
                              <FileText className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                              {sub.title}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span className="font-semibold text-slate-900">Đợt:</span>
                                <span className="truncate max-w-[200px]">{sub.periodTitle}</span>
                              </span>
                              {(sub.periodId === 'period-gvcn-1' || sub.structuredData?.homeroomMinutes) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                                  <span>Lớp {sub.structuredData?.homeroomMinutes?.className || ''}</span>
                                </span>
                              )}
                            </div>
                          </div>
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
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDetail(sub)}
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {isAuthorOrAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportToDelete(sub);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Xóa báo cáo này"
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
            const isAuthorOrAdmin = sub.authorId === currentUser.id || isAdmin || isPrincipal;
            const isSelected = selectedReportIds.includes(sub.id);

            return (
              <div
                key={sub.id}
                onClick={() => handleDetail(sub)}
                className={`bg-white rounded-2xl p-5 border shadow-2xs hover:border-emerald-300 hover:shadow-xs transition cursor-pointer flex flex-col justify-between relative ${
                  isSelected ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => toggleSelectReport(sub.id, e as any)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {sub.isLate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Trễ hạn</span>
                        </span>
                      )}
                      {isAuthorOrAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReportToDelete(sub);
                          }}
                          className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Xóa báo cáo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition line-clamp-2">
                      {sub.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span className="font-semibold text-slate-900">Đợt:</span>
                      <span className="truncate max-w-[160px]">{sub.periodTitle}</span>
                    </span>
                    {(sub.periodId === 'period-gvcn-1' || sub.structuredData?.homeroomMinutes) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                        <GraduationCap className="w-3 h-3 text-amber-700" />
                        <span>Lớp {sub.structuredData?.homeroomMinutes?.className || ''}</span>
                      </span>
                    )}
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

      {/* MODAL 1: Single Report Delete Confirmation */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Xác nhận xóa báo cáo?
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn có chắc chắn muốn xóa vĩnh viễn báo cáo:
              <br />
              <strong className="text-slate-900 text-sm block mt-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                "{reportToDelete.title}"
              </strong>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Người nộp: {reportToDelete.authorName} ({reportToDelete.departmentName})
              </span>
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Dữ liệu sẽ được xóa khỏi hệ thống và đồng bộ tức thì lên máy chủ Firebase.</span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteSingle}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác Nhận Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Bulk Delete Confirmation */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Xóa {selectedReportIds.length} báo cáo đã chọn?
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Bạn có chắc chắn muốn xóa vĩnh viễn <strong>{selectedReportIds.length} báo cáo</strong> đang được chọn khỏi hệ thống và Firebase?
            </p>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-800 mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>Hành động này không thể hoàn tác sau khi thực hiện.</span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmBulkDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa {selectedReportIds.length} mục...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xác Nhận Xóa {selectedReportIds.length} Báo Cáo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Clear All Reports Confirmation */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Xóa sạch toàn bộ báo cáo?
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Hành động này sẽ xóa toàn bộ <strong>{submissions.length} báo cáo</strong> hiện có trên hệ thống và Firebase để thầy/cô có thể tạo và quản lý lại từ đầu.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>Danh mục đợt báo cáo và danh sách giáo viên vẫn được giữ nguyên.</span>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmClearAllReports}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xóa toàn bộ...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa Sạch Tất Cả Báo Cáo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
