import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { ExportService } from '../../services/exportService';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Filter, 
  Calendar, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { ReportSubmission } from '../../types';

export const AdminReportsExport: React.FC = () => {
  const { currentUser, isPrincipal, isAdmin } = useAuth();
  const { submissions = [], periods = [], departments = [], schoolInfo } = useReports();

  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [exporting, setExporting] = useState(false);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub: ReportSubmission) => {
      if (selectedPeriodId !== 'all' && sub.periodId !== selectedPeriodId) return false;
      if (selectedDeptId !== 'all' && sub.departmentId !== selectedDeptId) return false;
      if (selectedStatus !== 'all' && sub.status !== selectedStatus) return false;
      return true;
    });
  }, [submissions, selectedPeriodId, selectedDeptId, selectedStatus]);

  const activePeriod = periods.find((p: any) => p.id === selectedPeriodId) || null;

  const handleExportExcel = () => {
    setExporting(true);
    try {
      ExportService.exportSubmissionsToExcel(
        filteredSubmissions,
        periods,
        departments,
        schoolInfo,
        `Bao_Cao_Doc_Binh_Kieu_${selectedPeriodId !== 'all' ? selectedPeriodId : 'Toan_Truong'}`
      );
    } catch (e: any) {
      alert('Lỗi xuất Excel: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  const handlePrintReport = () => {
    ExportService.printOfficialSummaryReport(
      filteredSubmissions,
      activePeriod,
      departments,
      schoolInfo,
      currentUser
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Xuất Báo Cáo Tổng Hợp & In Ấn</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dành cho Quản trị viên và Ban Giám Hiệu tổng hợp số liệu nộp báo cáo toàn trường
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-print-official-report"
            onClick={handlePrintReport}
            className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In Biểu Mẫu Chuẩn / PDF</span>
          </button>

          <button
            id="btn-export-excel-file"
            disabled={exporting}
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Đang xuất...' : 'Xuất File Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Filter Selection Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span>Thiết lập bộ lọc xuất dữ liệu</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Đợt báo cáo:
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
            >
              <option value="all">-- Tất cả các đợt nộp --</option>
              {periods.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tổ / Bộ môn:
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
            >
              <option value="all">-- Toàn bộ các tổ --</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Trạng thái phê duyệt:
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
            >
              <option value="all">-- Tất cả trạng thái --</option>
              <option value="principal_approved">Đã phê duyệt hoàn tất (BGH)</option>
              <option value="dept_approved">Tổ trưởng đã duyệt</option>
              <option value="submitted">Chờ tổ trưởng duyệt</option>
              <option value="dept_rejected">Tổ trưởng trả lại</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Hồ sơ trích xuất</div>
          <div className="text-xl font-extrabold text-slate-900 mt-1">{filteredSubmissions.length}</div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Nộp đúng hạn</div>
          <div className="text-xl font-extrabold text-emerald-600 mt-1">
            {filteredSubmissions.filter((s: ReportSubmission) => !s.isLate).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Ghi nhận nộp trễ</div>
          <div className="text-xl font-extrabold text-rose-600 mt-1">
            {filteredSubmissions.filter((s: ReportSubmission) => s.isLate).length}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Đã duyệt BGH</div>
          <div className="text-xl font-extrabold text-teal-600 mt-1">
            {filteredSubmissions.filter((s: ReportSubmission) => s.status === 'principal_approved').length}
          </div>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs font-bold text-slate-800">
            Xem trước bảng dữ liệu trích xuất ({filteredSubmissions.length} dòng)
          </div>
          <div className="text-[11px] text-slate-400 italic">
            File Excel sẽ bao gồm 3 Sheet: Báo cáo tổng hợp, Tiến độ theo tổ, Danh sách trễ hạn
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="p-3">STT</th>
                <th className="p-3">Người Nộp</th>
                <th className="p-3">Tổ Chuyên Môn</th>
                <th className="p-3">Tên Báo Cáo</th>
                <th className="p-3">Ngày Nộp</th>
                <th className="p-3">Hạn Nộp</th>
                <th className="p-3">Trạng Thái</th>
                <th className="p-3">Ý Kiến Tổ / BGH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.map((sub: ReportSubmission, idx: number) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-400 text-center">{idx + 1}</td>
                  <td className="p-3 font-bold text-slate-900">{sub.authorName}</td>
                  <td className="p-3 text-slate-600">{sub.departmentName}</td>
                  <td className="p-3 font-semibold text-slate-800">{sub.title}</td>
                  <td className="p-3 text-slate-600">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="p-3">
                    {sub.isLate ? (
                      <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                        Trễ hạn
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                        Đúng hạn
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-700">
                      {sub.status === 'principal_approved' ? 'BGH đã duyệt' : sub.status === 'dept_approved' ? 'Tổ đã duyệt' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 max-w-xs truncate italic">
                    {sub.principalReview?.comment || sub.deptHeadReview?.comment || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
