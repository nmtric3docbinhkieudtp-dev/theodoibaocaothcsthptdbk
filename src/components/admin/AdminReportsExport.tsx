import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { ExportService } from '../../services/exportService';
import { aggregatePeriodReportData } from '../../utils/consolidationHelper';
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
  Sparkles,
  School,
  AlertCircle,
  Users,
  Layers,
  ChevronRight,
  Phone
} from 'lucide-react';
import { ReportSubmission } from '../../types';

interface AdminReportsExportProps {
  onOpenConsolidation?: (periodId?: string) => void;
}

export const AdminReportsExport: React.FC<AdminReportsExportProps> = ({
  onOpenConsolidation
}) => {
  const { currentUser, isPrincipal, isAdmin, allUsers } = useAuth();
  const { submissions = [], periods = [], departments = [], schoolInfo } = useReports();

  const [activeExportMode, setActiveExportMode] = useState<'content' | 'tracking'>('content');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    // Prefer homeroom period
    const homeroomPeriod = periods.find(p => p.id.includes('gvcn') || p.title.toLowerCase().includes('chủ nhiệm') || p.title.toLowerCase().includes('tập trung'));
    return homeroomPeriod?.id || periods[0]?.id || 'all';
  });
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [exporting, setExporting] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);

  const activePeriod = useMemo(() => {
    if (selectedPeriodId === 'all') return null;
    return periods.find((p: any) => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Aggregated data for content consolidation
  const consolidatedData = useMemo(() => {
    return aggregatePeriodReportData(activePeriod, submissions, allUsers);
  }, [activePeriod, submissions, allUsers]);

  // Filtered submissions for tracking mode
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub: ReportSubmission) => {
      if (selectedPeriodId !== 'all' && sub.periodId !== selectedPeriodId) return false;
      if (selectedDeptId !== 'all' && sub.departmentId !== selectedDeptId) return false;
      if (selectedStatus !== 'all' && sub.status !== selectedStatus) return false;
      return true;
    });
  }, [submissions, selectedPeriodId, selectedDeptId, selectedStatus]);

  // Export Tracking Excel
  const handleExportTrackingExcel = () => {
    setExporting(true);
    try {
      ExportService.exportSubmissionsToExcel(
        filteredSubmissions,
        periods,
        departments,
        schoolInfo,
        `Tien_Do_Bao_Cao_${selectedPeriodId !== 'all' ? selectedPeriodId : 'Toan_Truong'}`
      );
    } catch (e: any) {
      alert('Lỗi xuất Excel: ' + (e.message || 'Không thể xuất file'));
    } finally {
      setExporting(false);
    }
  };

  // Export Consolidated Content Excel (multi-sheet)
  const handleExportConsolidatedExcel = () => {
    setExporting(true);
    try {
      ExportService.exportConsolidatedPeriodToExcel(
        consolidatedData,
        schoolInfo,
        `Tong_Hop_53_Lop_${selectedPeriodId !== 'all' ? selectedPeriodId : 'Toan_Truong'}`
      );
    } catch (e: any) {
      alert('Lỗi xuất Excel tổng hợp: ' + (e.message || 'Không thể xuất file'));
    } finally {
      setExporting(false);
    }
  };

  // Export Consolidated Word
  const handleExportConsolidatedWord = () => {
    setExportingWord(true);
    try {
      ExportService.exportConsolidatedPeriodToWord(
        consolidatedData,
        schoolInfo,
        currentUser
      );
    } catch (e: any) {
      alert('Lỗi xuất Word tổng hợp: ' + (e.message || 'Không thể xuất file'));
    } finally {
      setExportingWord(false);
    }
  };

  // Print Consolidated Content
  const handlePrintConsolidated = () => {
    ExportService.printConsolidatedContentReport(
      consolidatedData,
      schoolInfo,
      currentUser
    );
  };

  // Print Tracking Report
  const handlePrintTracking = () => {
    if (!currentUser) return;
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

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Trung Tâm Xuất & Tổng Hợp Dữ Liệu Báo Cáo</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp nội dung chi tiết (53 lớp, học sinh chưa ra lớp, sĩ số) hoặc xuất theo dõi tiến độ nộp
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenConsolidation && (
            <button
              type="button"
              onClick={() => onOpenConsolidation(selectedPeriodId)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Mở Toàn Màn Hình 53 Lớp</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2">
        <button
          onClick={() => setActiveExportMode('content')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeExportMode === 'content'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <School className="w-4 h-4" />
          <span>1. Tổng Hợp Nội Dung Chi Tiết (53 Lớp / Học Sinh Chưa Ra Lớp / Sĩ Số)</span>
        </button>

        <button
          onClick={() => setActiveExportMode('tracking')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            activeExportMode === 'tracking'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>2. Theo Dõi Tiến Độ Nộp & Kỷ Luật Thời Gian (Ai Đã Nộp / Trễ Hạn)</span>
        </button>
      </div>

      {/* Filter Selection Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Lựa chọn đợt báo cáo cần tổng hợp</span>
          </div>
          <span className="text-[11px] text-slate-500 font-normal">
            Toàn trường: 53 lớp chủ nhiệm (18 THPT, 20 THCS Đốc Binh Kiều, 15 THCS Tân Kiều)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Đợt báo cáo:
            </label>
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600 font-semibold text-slate-800"
            >
              <option value="all">-- Toàn bộ các đợt nộp trong năm học --</option>
              {periods.map((p: any) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {activeExportMode === 'tracking' ? (
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
          ) : (
            <div className="flex items-end">
              <div className="w-full p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 font-medium">
                ✅ Hệ thống tự động gộp dữ liệu từ form 53 GVCN thành danh sách thống nhất.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODE 1: TỔNG HỢP NỘI DUNG 53 LỚP */}
      {activeExportMode === 'content' && (
        <div className="space-y-6">

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Tiến độ nộp 53 lớp</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">
                {consolidatedData.submittedCount} / 53 <span className="text-xs font-semibold text-slate-400">({consolidatedData.completionRate}%)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Sĩ số ghi nhận</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {consolidatedData.totalEnrolledStudents.toLocaleString('vi-VN')}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-2xs">
              <div className="text-[11px] font-bold text-rose-500 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Học sinh chưa ra lớp</span>
              </div>
              <div className="text-xl font-extrabold text-rose-700 mt-1">
                {consolidatedData.totalAbsentStudents} <span className="text-xs font-semibold text-rose-500">học sinh</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Tỷ lệ ra lớp</div>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">
                {consolidatedData.overallAttendanceRate}%
              </div>
            </div>
          </div>

          {/* Action Export Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Xuất Báo Cáo Tổng Hợp Toàn Trường</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Chuẩn BGH
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Xuất file Excel đầy đủ 5 sheet hoặc xuất văn bản Word chuẩn mẫu hành chính gửi Sở/Phòng GD&ĐT
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                id="btn-export-consolidated-excel"
                disabled={exporting}
                onClick={handleExportConsolidatedExcel}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{exporting ? 'Đang xuất...' : 'Xuất Excel 53 Lớp (.xlsx)'}</span>
              </button>

              <button
                id="btn-export-consolidated-word"
                disabled={exportingWord}
                onClick={handleExportConsolidatedWord}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{exportingWord ? 'Đang xuất...' : 'Xuất Word (.doc)'}</span>
              </button>

              <button
                id="btn-print-consolidated"
                onClick={handlePrintConsolidated}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span>In A4</span>
              </button>
            </div>
          </div>

          {/* Section: Học Sinh Chưa Ra Lớp Toàn Trường Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-rose-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                  Danh Sách Tổng Hợp Học Sinh Chưa Ra Lớp ({consolidatedData.absentStudents.length} em)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 italic">
                Tổng hợp tự động từ 53 lớp chủ nhiệm
              </span>
            </div>

            {consolidatedData.absentStudents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <div className="font-bold text-slate-700">100% học sinh ra lớp đầy đủ</div>
                <p className="text-[11px] text-slate-400 mt-0.5">Không có học sinh nào vắng mặt trong các lớp đã báo cáo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[40vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-3 w-12 text-center">STT</th>
                      <th className="p-3 w-20 text-center">Lớp</th>
                      <th className="p-3 w-36">GVCN</th>
                      <th className="p-3 w-44">Họ và tên học sinh</th>
                      <th className="p-3">Nơi ở hiện nay</th>
                      <th className="p-3 w-32">SĐT Phụ huynh</th>
                      <th className="p-3">Lý do chưa ra lớp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consolidatedData.absentStudents.slice(0, 20).map((s, idx) => (
                      <tr key={idx} className="hover:bg-rose-50/30 transition">
                        <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-3 text-center font-bold text-emerald-700 bg-slate-50">{s.className}</td>
                        <td className="p-3 text-slate-800 font-medium">{s.teacherName}</td>
                        <td className="p-3 font-bold text-slate-900">{s.studentName}</td>
                        <td className="p-3 text-slate-600 text-[11px]">{s.currentAddress}</td>
                        <td className="p-3 text-slate-700 font-medium">
                          {s.parentPhone !== '-' ? (
                            <a href={`tel:${s.parentPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{s.parentPhone}</span>
                            </a>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-rose-700 font-medium">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {consolidatedData.absentStudents.length > 20 && (
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-600">
                <span>Đang hiển thị 20 / {consolidatedData.absentStudents.length} học sinh. </span>
                <button
                  type="button"
                  onClick={() => onOpenConsolidation?.(selectedPeriodId)}
                  className="font-bold text-emerald-700 hover:underline ml-1 cursor-pointer"
                >
                  Nhấp vào đây để xem toàn bộ danh sách đầy đủ
                </button>
              </div>
            )}
          </div>

          {/* Section: Bảng Sĩ Số 53 Lớp Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bảng Sĩ Số 53 Lớp Chủ Nhiệm
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700">
                Sĩ số: {consolidatedData.totalEnrolledStudents} HS (Hiện diện: {consolidatedData.totalPresentStudents} • Vắng: {consolidatedData.totalAbsentStudents})
              </span>
            </div>

            <div className="overflow-x-auto max-h-[40vh]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 w-12 text-center">STT</th>
                    <th className="p-3 w-20 text-center">Lớp</th>
                    <th className="p-3 w-24">Điểm</th>
                    <th className="p-3 w-40">GVCN</th>
                    <th className="p-3 w-16 text-center">Sĩ số</th>
                    <th className="p-3 w-16 text-center">Nam</th>
                    <th className="p-3 w-16 text-center">Nữ</th>
                    <th className="p-3 w-20 text-center">Hiện diện</th>
                    <th className="p-3 w-20 text-center">Vắng</th>
                    <th className="p-3 w-20 text-center">Tỷ lệ</th>
                    <th className="p-3 w-24 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {consolidatedData.classStats.map((c) => (
                    <tr key={c.className} className={`hover:bg-slate-50 ${!c.hasSubmitted ? 'bg-amber-50/20' : ''}`}>
                      <td className="p-2.5 text-center text-slate-400">{c.stt}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900 bg-slate-50">{c.className}</td>
                      <td className="p-2.5 text-slate-500">{c.campus}</td>
                      <td className="p-2.5 text-slate-800 font-medium">{c.teacherName}</td>
                      <td className="p-2.5 text-center font-bold">{c.totalStudents}</td>
                      <td className="p-2.5 text-center text-slate-500">{c.maleStudents}</td>
                      <td className="p-2.5 text-center text-slate-500">{c.femaleStudents}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700">{c.presentStudents}</td>
                      <td className={`p-2.5 text-center font-bold ${c.absentStudentsCount > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400'}`}>
                        {c.absentStudentsCount}
                      </td>
                      <td className="p-2.5 text-center font-semibold">
                        {c.hasSubmitted ? `${c.attendanceRate}%` : '-'}
                      </td>
                      <td className="p-2.5 text-center">
                        {c.hasSubmitted ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Đã nộp
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                            Chờ nộp
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODE 2: THEO DÕI TIẾN ĐỘ NỘP (SUBMISSION TRACKING) */}
      {activeExportMode === 'tracking' && (
        <div className="space-y-6">
          
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

          <div className="flex items-center justify-end gap-2">
            <button
              id="btn-print-official-report"
              onClick={handlePrintTracking}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>In Danh Sách Theo Dõi A4</span>
            </button>

            <button
              id="btn-export-excel-file"
              disabled={exporting}
              onClick={handleExportTrackingExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{exporting ? 'Đang xuất...' : 'Xuất File Excel (.xlsx)'}</span>
            </button>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="text-xs font-bold text-slate-800">
                Bảng theo dõi tiến độ nộp ({filteredSubmissions.length} dòng)
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                Ghi nhận chi tiết ai đã nộp, thời gian nộp và trạng thái đúng hạn/trễ hạn
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <th className="p-3">STT</th>
                    <th className="p-3">Người Nộp</th>
                    <th className="p-3">Tổ Chuyên Môn / Lớp</th>
                    <th className="p-3">Tên Báo Cáo</th>
                    <th className="p-3">Ngày Nộp</th>
                    <th className="p-3">Kỷ Luật</th>
                    <th className="p-3">Trạng Thái</th>
                    <th className="p-3">Ý Kiến Tổ / BGH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubmissions.map((sub: ReportSubmission, idx: number) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="p-3 text-slate-400 text-center">{idx + 1}</td>
                      <td className="p-3 font-bold text-slate-900">{sub.authorName}</td>
                      <td className="p-3 text-slate-600">
                        {sub.homeroomClass ? `Lớp ${sub.homeroomClass}` : sub.departmentName}
                      </td>
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
      )}

    </div>
  );
};
