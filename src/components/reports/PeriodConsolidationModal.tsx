import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { ExportService } from '../../services/exportService';
import { 
  aggregatePeriodReportData, 
  generateSample53Submissions, 
  generateSampleDeptMeetingSubmissions,
  generateConsolidatedExecutiveSummary,
  PeriodConsolidationResult,
  ConsolidatedStudent,
  OFFICIAL_DEPARTMENTS,
  DEFAULT_DEPARTMENT_MEETING_DOCUMENTS
} from '../../utils/consolidationHelper';
import { splitSmartLines } from '../../utils/homeroomReportExporter';
import { formatReportTitleHeader } from '../../services/consolidatedExportGenerators';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Users, 
  GraduationCap, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Copy, 
  Check, 
  Layers, 
  School,
  ChevronDown,
  RefreshCw,
  Info,
  Calendar,
  Phone,
  MapPin,
  FileCheck,
  UserCheck
} from 'lucide-react';
import { ReportPeriod } from '../../types';
import { isPeriodFullySubmitted } from '../../utils/reportFilters';

interface PeriodConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriodId?: string;
}

export const PeriodConsolidationModal: React.FC<PeriodConsolidationModalProps> = ({
  isOpen,
  onClose,
  defaultPeriodId
}) => {
  const { currentUser, allUsers, isAdmin, isPrincipal } = useAuth();
  const { submissions, periods, schoolInfo, submitReport, clearTestReports } = useReports();

  // Selected period state
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    if (defaultPeriodId) return defaultPeriodId;
    // Prefer period with 'gvcn' or 'tập trung' or first active
    const homeroomPeriod = periods.find(p => p.id.includes('gvcn') || p.title.toLowerCase().includes('chủ nhiệm') || p.title.toLowerCase().includes('tập trung'));
    return homeroomPeriod?.id || periods[0]?.id || 'all';
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<'dept_meetings' | 'dynamic' | 'matrix' | 'absent' | 'classes' | 'talents' | 'feedbacks' | 'ai'>('dynamic');

  // Filter states
  const [searchAbsent, setSearchAbsent] = useState('');
  const [searchDynamic, setSearchDynamic] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [campusFilter, setCampusFilter] = useState<string>('all');
  const [searchFeedback, setSearchFeedback] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  // Loading & Action states
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [copiedAI, setCopiedAI] = useState(false);
  const [copiedMeetingDoc, setCopiedMeetingDoc] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);

  // Active period object
  const activePeriod = useMemo(() => {
    if (selectedPeriodId === 'all') return null;
    return periods.find(p => p.id === selectedPeriodId) || null;
  }, [periods, selectedPeriodId]);

  // Aggregate consolidated data
  const consolidatedData: PeriodConsolidationResult = useMemo(() => {
    return aggregatePeriodReportData(activePeriod, submissions, allUsers);
  }, [activePeriod, submissions, allUsers]);

  // Check if current period is a Department Meeting Minutes report
  const isMeetingMinutes = useMemo(() => {
    return (
      consolidatedData.isDeptMeetingAudience ||
      (activePeriod?.title || consolidatedData.periodTitle || '').toLowerCase().includes('họp tổ') ||
      (activePeriod?.title || consolidatedData.periodTitle || '').toLowerCase().includes('biên bản') ||
      (consolidatedData.deptMeetingMinutesList && consolidatedData.deptMeetingMinutesList.length > 0 && consolidatedData.deptMeetingMinutesList.some(d => d.hasSubmitted && d.minutes))
    );
  }, [consolidatedData, activePeriod]);

  // Count of department meetings with submitted minutes
  const submittedDeptMeetingCount = useMemo(() => {
    return consolidatedData.deptMeetingMinutesList.filter(d => d.hasSubmitted && (d.minutes || d.reportContent)).length;
  }, [consolidatedData.deptMeetingMinutesList]);

  // Formatted report title info
  const reportTitleInfo = useMemo(() => {
    return formatReportTitleHeader(activePeriod?.title || consolidatedData.periodTitle);
  }, [activePeriod, consolidatedData.periodTitle]);

  // Meeting minutes list for display (only genuine submitted meetings)
  const displayDeptMeetings = useMemo(() => {
    const meetings = consolidatedData.deptMeetingMinutesList.filter(d => d.hasSubmitted && (d.minutes || d.reportContent));
    if (selectedDeptFilter !== 'all') {
      return meetings.filter(m => m.departmentId === selectedDeptFilter);
    }
    return meetings;
  }, [consolidatedData.deptMeetingMinutesList, selectedDeptFilter]);

  // Auto select best tab when period changes
  React.useEffect(() => {
    if (isMeetingMinutes) {
      setActiveTab('dept_meetings');
    } else if (consolidatedData.dynamicTables.length > 0) {
      setActiveTab('dynamic');
    } else if (consolidatedData.fieldMatrix.columns.length > 0) {
      setActiveTab('matrix');
    } else if (consolidatedData.absentStudents.length > 0) {
      setActiveTab('absent');
    } else {
      setActiveTab('classes');
    }
  }, [selectedPeriodId, isMeetingMinutes, consolidatedData.dynamicTables.length, consolidatedData.absentStudents.length, consolidatedData.fieldMatrix.columns.length]);

  // Filter dynamic tables
  const filteredDynamicTables = useMemo(() => {
    return consolidatedData.dynamicTables.map(tbl => {
      const rows = tbl.rows.filter(r => {
        if (gradeFilter !== 'all' && String(r.grade) !== gradeFilter) return false;
        if (campusFilter !== 'all' && r.campus !== campusFilter) return false;
        if (searchDynamic.trim()) {
          const q = searchDynamic.toLowerCase().trim();
          const inClass = r.className.toLowerCase().includes(q);
          const inAuthor = r.authorName.toLowerCase().includes(q);
          const inData = Object.values(r.data).some(val => String(val).toLowerCase().includes(q));
          if (!inClass && !inAuthor && !inData) return false;
        }
        return true;
      });
      return { ...tbl, filteredRows: rows };
    });
  }, [consolidatedData.dynamicTables, gradeFilter, campusFilter, searchDynamic]);

  // Filter matrix rows
  const filteredMatrixRows = useMemo(() => {
    return consolidatedData.fieldMatrix.rows.filter(r => {
      if (gradeFilter !== 'all' && String(r.grade) !== gradeFilter) return false;
      if (campusFilter !== 'all' && r.campus !== campusFilter) return false;
      if (searchDynamic.trim()) {
        const q = searchDynamic.toLowerCase().trim();
        const inClass = r.className.toLowerCase().includes(q);
        const inAuthor = r.authorName.toLowerCase().includes(q);
        const inValues = Object.values(r.values).some(val => String(val).toLowerCase().includes(q));
        if (!inClass && !inAuthor && !inValues) return false;
      }
      return true;
    });
  }, [consolidatedData.fieldMatrix.rows, gradeFilter, campusFilter, searchDynamic]);

  // Filter absent students
  const filteredAbsentStudents = useMemo(() => {
    return consolidatedData.absentStudents.filter(s => {
      if (gradeFilter !== 'all' && String(s.grade) !== gradeFilter) return false;
      if (campusFilter !== 'all' && s.campus !== campusFilter) return false;
      if (searchAbsent.trim()) {
        const q = searchAbsent.toLowerCase().trim();
        const matchesName = s.studentName.toLowerCase().includes(q);
        const matchesClass = s.className.toLowerCase().includes(q);
        const matchesReason = s.reason.toLowerCase().includes(q);
        const matchesTeacher = s.teacherName.toLowerCase().includes(q);
        const matchesAddress = s.currentAddress.toLowerCase().includes(q);
        if (!matchesName && !matchesClass && !matchesReason && !matchesTeacher && !matchesAddress) {
          return false;
        }
      }
      return true;
    });
  }, [consolidatedData.absentStudents, gradeFilter, campusFilter, searchAbsent]);

  // Filter text feedbacks
  const filteredFeedbacks = useMemo(() => {
    if (!searchFeedback.trim()) return consolidatedData.feedbacks;
    const q = searchFeedback.toLowerCase().trim();
    return consolidatedData.feedbacks.filter(f => 
      f.className.toLowerCase().includes(q) ||
      f.authorName.toLowerCase().includes(q) ||
      f.content.toLowerCase().includes(q) ||
      f.notes.toLowerCase().includes(q)
    );
  }, [consolidatedData.feedbacks, searchFeedback]);

  // AI Executive Summary
  const aiSummaryText = useMemo(() => {
    return generateConsolidatedExecutiveSummary(consolidatedData);
  }, [consolidatedData]);

  if (!isOpen) return null;

  // Handle Export Excel
  const handleExportExcel = () => {
    setExportingExcel(true);
    try {
      ExportService.exportConsolidatedPeriodToExcel(
        consolidatedData,
        schoolInfo,
        `Tong_Hop_53_Lop_${activePeriod ? activePeriod.id : 'Toan_Truong'}`
      );
    } catch (err: any) {
      alert('Lỗi xuất Excel: ' + (err?.message || err));
    } finally {
      setExportingExcel(false);
    }
  };

  // Handle Export Word
  const handleExportWord = () => {
    setExportingWord(true);
    try {
      ExportService.exportConsolidatedPeriodToWord(
        consolidatedData,
        schoolInfo,
        currentUser
      );
    } catch (err: any) {
      alert('Lỗi xuất Word: ' + (err?.message || err));
    } finally {
      setExportingWord(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    ExportService.printConsolidatedContentReport(
      consolidatedData,
      schoolInfo,
      currentUser
    );
  };

  // Handle Copy AI Summary
  const handleCopyAISummary = () => {
    navigator.clipboard.writeText(aiSummaryText);
    setCopiedAI(true);
    setTimeout(() => setCopiedAI(false), 2000);
  };

  // Handle generate 53 sample submissions for simulation testing
  const handleGenerateSample53 = async () => {
    if (!activePeriod) {
      alert('Vui lòng chọn một đợt báo cáo cụ thể để nạp dữ liệu mẫu!');
      return;
    }
    const confirm = window.confirm(
      `Thầy có muốn hệ thống tự động sinh dữ liệu báo cáo thử nghiệm cho đầy đủ 53 lớp chủ nhiệm vào đợt "${activePeriod.title}"?\n\nĐiều này giúp Thầy kiểm tra ngay bảng tổng hợp học sinh chưa ra lớp, sĩ số toàn trường, năng khiếu và kiến nghị của 53 GVCN.`
    );
    if (!confirm) return;

    setIsGeneratingSample(true);
    try {
      const sampleSubs = generateSample53Submissions(activePeriod.id, activePeriod.title, allUsers);
      for (const sub of sampleSubs) {
        await submitReport({
          periodId: sub.periodId,
          title: sub.title,
          content: sub.content,
          structuredData: sub.structuredData,
          attachments: [],
          isDraft: false,
          isHomeroomReport: true,
          homeroomClass: sub.homeroomClass,
          homeroomStudentCount: sub.homeroomStudentCount,
          homeroomCampus: sub.homeroomCampus
        });
      }
      alert('Đã sinh dữ liệu thử nghiệm 53 lớp thành công! Thầy có thể xem bảng tổng hợp ngay bây giờ.');
    } catch (e: any) {
      alert('Lỗi khi nạp dữ liệu mẫu: ' + e.message);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  // Handle generate sample submissions for 7 departments (Department Meeting Minutes)
  const handleGenerateSampleDeptMeetings = async () => {
    if (!activePeriod) {
      alert('Vui lòng chọn một đợt báo cáo cụ thể để nạp dữ liệu mẫu!');
      return;
    }
    const confirm = window.confirm(
      `Thầy có muốn hệ thống tự động sinh dữ liệu biên bản họp thử nghiệm cho 7 Tổ chuyên môn vào đợt "${activePeriod.title}"?\n\nĐiều này giúp Thầy kiểm tra ngay văn bản tổng hợp đầy đủ 100% nội dung (Đánh giá hoạt động, Văn bản triển khai, Công việc trọng tâm, Ý kiến thảo luận, Kết luận chủ trì, Đề xuất kiến nghị) chuẩn thể thức Nghị định 30.`
    );
    if (!confirm) return;

    setIsGeneratingSample(true);
    try {
      const sampleSubs = generateSampleDeptMeetingSubmissions(activePeriod.id, activePeriod.title, allUsers);
      for (const sub of sampleSubs) {
        await submitReport({
          periodId: sub.periodId,
          title: sub.title,
          content: sub.content,
          structuredData: sub.structuredData,
          attachments: [],
          isDraft: false,
          departmentId: sub.departmentId,
          departmentName: sub.departmentName
        });
      }
      alert('Đã nạp biên bản họp mẫu cho 7 Tổ chuyên môn thành công! Thầy có thể xem báo cáo tổng hợp ngay bây giờ.');
    } catch (e: any) {
      alert('Lỗi khi nạp dữ liệu mẫu: ' + (e?.message || e));
    } finally {
      setIsGeneratingSample(false);
    }
  };

  // Handle copy synthesized meeting minutes document text
  const handleCopyMeetingDoc = () => {
    const textLines: string[] = [];
    textLines.push('SỞ GDĐT TỈNH ĐỒNG THÁP                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM');
    textLines.push('TRƯỜNG THCS VÀ THPT ĐỐC BINH KIỀU              Độc lập – Tự do – Hạnh phúc');
    textLines.push('');
    textLines.push(reportTitleInfo.mainType);
    textLines.push(reportTitleInfo.subTitle);
    textLines.push('----------------------------------------');
    textLines.push('');
    textLines.push('I. TÌNH HÌNH TỔ CHỨC HỌP CỦA CÁC TỔ CHUYÊN MÔN:');
    textLines.push(`- Tổng số tổ chuyên môn: ${OFFICIAL_DEPARTMENTS.length} tổ.`);
    textLines.push(`- Số tổ đã tiến hành họp và hoàn thành nộp biên bản: ${submittedDeptMeetingCount || OFFICIAL_DEPARTMENTS.length} / ${OFFICIAL_DEPARTMENTS.length} tổ.`);
    textLines.push('- Thời gian, địa điểm và quân số tham dự họp của từng tổ:');
    displayDeptMeetings.forEach(m => {
      const min = m.minutes;
      const timeStr = min ? `vào lúc ${min.timeHour || '08'} giờ ${min.timeMinute || '00'} phút, ngày ${min.meetingDate || '17'}/${min.meetingMonth || '9'}/${min.meetingYear || '2026'}` : 'theo kế hoạch';
      const locStr = min?.location ? `tại ${min.location}` : '';
      const chairStr = min?.chairPerson ? `Chủ trì: ${min.chairPerson}` : `Chủ trì: ${m.teacherName}`;
      const secStr = min?.secretary ? `; Thư ký: ${min.secretary}` : '';
      const memStr = min ? `; Quân số: ${min.presentMembers || min.totalMembers}/${min.totalMembers}, vắng: ${min.absentCount || 0}` : '';
      textLines.push(`  + ${m.departmentName}: Họp ${timeStr} ${locStr}. ${chairStr}${secStr}${memStr}.`);
    });
    textLines.push('');
    textLines.push('NỘI DUNG CUỘC HỌP');
    textLines.push('');
    textLines.push('1. Đánh giá hoạt động của tổ trong thời gian qua:');
    displayDeptMeetings.forEach(m => {
      const min = m.minutes;
      textLines.push(`  • ${m.departmentName}:`);
      textLines.push(`    - Ưu điểm: ${min?.reviewStrengths?.trim() || '(Không ghi)'}`);
      textLines.push(`    - Hạn chế: ${min?.reviewWeaknesses?.trim() || '(Không có)'}`);
      textLines.push(`    - Nguyên nhân: ${min?.reviewCauses?.trim() || '(Không có)'}`);
      textLines.push(`    - Giải pháp: ${min?.reviewSolutions?.trim() || '(Không có)'}`);
    });
    textLines.push('');
    textLines.push('2. Triển khai các văn bản:');
    displayDeptMeetings.forEach(m => {
      textLines.push(`  • ${m.departmentName}:`);
      textLines.push(`    ${m.minutes?.documentsDeployed?.trim() || '(Không ghi nhận)'}`);
    });
    textLines.push('');
    textLines.push('3. Triển khai nội dung công việc trọng tâm của trường/tổ:');
    displayDeptMeetings.forEach(m => {
      textLines.push(`  • ${m.departmentName}:`);
      textLines.push(`    ${m.minutes?.centralTasks?.trim() || '(Không ghi nhận)'}`);
    });
    textLines.push('');
    textLines.push('4. Ý kiến của các thành viên trong cuộc họp:');
    displayDeptMeetings.forEach(m => {
      textLines.push(`  • ${m.departmentName}:`);
      textLines.push(`    ${m.minutes?.memberOpinions?.trim() || '(Không có ý kiến)'}`);
    });
    textLines.push('');
    textLines.push('5. Kết luận của chủ trì:');
    displayDeptMeetings.forEach(m => {
      const chairName = m.minutes?.chairPerson || m.teacherName;
      textLines.push(`  • ${m.departmentName} (${chairName} - Chủ trì):`);
      textLines.push(`    ${m.minutes?.conclusion?.trim() || '(Không ghi nhận kết luận riêng)'}`);
    });
    textLines.push('');
    textLines.push('6. Đề xuất, kiến nghị với nhà trường:');
    displayDeptMeetings.forEach(m => {
      textLines.push(`  • ${m.departmentName}:`);
      textLines.push(`    ${m.minutes?.recommendations?.trim() || '(Không có đề xuất, kiến nghị)'}`);
    });

    navigator.clipboard.writeText(textLines.join('\n'));
    setCopiedMeetingDoc(true);
    setTimeout(() => setCopiedMeetingDoc(false), 2000);
  };

  if (!isOpen || (!isAdmin && !isPrincipal)) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-7xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Tổng Hợp Báo Cáo Toàn Trường & 53 Lớp
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dành cho Ban Giám Hiệu
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Tổng hợp chi tiết danh sách học sinh chưa ra lớp, thống kê sĩ số 53 lớp, năng khiếu và ý kiến kiến nghị
              </p>
            </div>
          </div>

          {/* Period selector in header & Close button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/90 rounded-xl px-3 py-1.5 border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="text-xs bg-transparent text-white font-medium focus:outline-hidden cursor-pointer max-w-[200px] sm:max-w-xs truncate"
              >
                <option value="all" className="bg-slate-800 text-white">-- Toàn bộ các đợt nộp --</option>
                {periods.map(p => {
                  const isDone = isPeriodFullySubmitted(p, submissions, allUsers);
                  return (
                    <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                      {isDone ? `[✅ Đã xong] ${p.title}` : p.title}
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar & Metric Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
          
          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs font-semibold text-slate-700">
              {isMeetingMinutes ? (
                <Users className="w-4 h-4 text-blue-600" />
              ) : consolidatedData.isSpecificUsersAudience ? (
                <UserCheck className="w-4 h-4 text-indigo-600" />
              ) : (
                <Users className="w-4 h-4 text-emerald-600" />
              )}
              <span>Tiến độ nộp:</span>
              <span className="font-bold text-emerald-700">
                {isMeetingMinutes ? (
                  `${submittedDeptMeetingCount} / ${OFFICIAL_DEPARTMENTS.length} tổ (${Math.round((submittedDeptMeetingCount / OFFICIAL_DEPARTMENTS.length) * 100)}%)`
                ) : (
                  `${consolidatedData.submittedCount} / ${
                    consolidatedData.isSpecificUsersAudience 
                      ? `${consolidatedData.totalSpecificUsers} người` 
                      : consolidatedData.isDeptHeadAudience 
                      ? '19 người' 
                      : '53 lớp'
                  } (${consolidatedData.completionRate}%)`
                )}
              </span>
            </div>

            {isMeetingMinutes ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 shadow-2xs font-semibold text-blue-800">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Đối tượng:</span>
                <span className="font-bold text-blue-950">{OFFICIAL_DEPARTMENTS.length} Tổ Chuyên Môn</span>
              </div>
            ) : consolidatedData.isSpecificUsersAudience ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 shadow-2xs font-semibold text-indigo-800">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Chỉ định đích danh:</span>
                <span className="font-bold text-indigo-950">{consolidatedData.totalSpecificUsers} Thầy/Cô</span>
              </div>
            ) : consolidatedData.isDeptHeadAudience ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 shadow-2xs font-semibold text-blue-800">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Đối tượng:</span>
                <span className="font-bold text-blue-950">19 Tổ trưởng & Tổ phó CM</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs font-semibold text-slate-700">
                <School className="w-4 h-4 text-blue-600" />
                <span>Sĩ số toàn trường:</span>
                <span className="font-bold text-slate-900">{consolidatedData.totalEnrolledStudents.toLocaleString('vi-VN')}</span>
              </div>
            )}

            {consolidatedData.totalAbsentStudents > 0 && !isMeetingMinutes && (
              <div 
                onClick={() => setActiveTab('absent')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 shadow-2xs font-semibold text-rose-700 cursor-pointer hover:bg-rose-100 transition"
                title="Nhấp để xem danh sách chi tiết"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 animate-pulse" />
                <span>Chưa ra lớp:</span>
                <span className="font-bold text-rose-700 bg-rose-200/70 px-1.5 py-0.5 rounded-md">{consolidatedData.totalAbsentStudents} học sinh</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs font-semibold text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Chưa nộp:</span>
              <span className={`font-bold ${(isMeetingMinutes ? (OFFICIAL_DEPARTMENTS.length - submittedDeptMeetingCount) : consolidatedData.pendingCount) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {isMeetingMinutes ? `${Math.max(0, OFFICIAL_DEPARTMENTS.length - submittedDeptMeetingCount)} tổ` : `${consolidatedData.pendingCount} ${consolidatedData.isSpecificUsersAudience || consolidatedData.isDeptHeadAudience ? 'người' : 'lớp'}`}
              </span>
            </div>
          </div>

          {/* Master Export Buttons */}
          <div className="flex items-center gap-2">
            {isMeetingMinutes && submittedDeptMeetingCount < OFFICIAL_DEPARTMENTS.length && activePeriod && (
              <button
                type="button"
                onClick={handleGenerateSampleDeptMeetings}
                disabled={isGeneratingSample}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Tạo nhanh biên bản họp mẫu cho 7 Tổ chuyên môn để kiểm tra văn bản tổng hợp"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isGeneratingSample ? 'Đang tạo mẫu...' : 'Nạp mẫu 7 Tổ CM'}</span>
              </button>
            )}

            {!isMeetingMinutes && consolidatedData.submittedCount < 5 && activePeriod && (
              <button
                type="button"
                onClick={handleGenerateSample53}
                disabled={isGeneratingSample}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                title="Tạo nhanh 53 báo cáo mẫu để xem trước kết quả tổng hợp toàn trường"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isGeneratingSample ? 'Đang tạo mẫu...' : 'Nạp mẫu 53 lớp test'}</span>
              </button>
            )}

            <button
              id="btn-consolidated-export-excel"
              onClick={handleExportExcel}
              disabled={exportingExcel}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exportingExcel ? 'Đang xuất...' : (isMeetingMinutes ? 'Xuất Excel (.xlsx)' : 'Xuất Excel 53 Lớp (.xlsx)')}</span>
            </button>

            <button
              id="btn-consolidated-export-word"
              onClick={handleExportWord}
              disabled={exportingWord}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition active:scale-98 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{exportingWord ? 'Đang xuất...' : (isMeetingMinutes ? 'Xuất Word Biên Bản (.doc)' : 'Xuất Word (.doc)')}</span>
            </button>

            <button
              id="btn-consolidated-print"
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>In A4</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto">
          {(isMeetingMinutes || consolidatedData.deptMeetingMinutesList.length > 0) && (
            <button
              onClick={() => setActiveTab('dept_meetings')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dept_meetings'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Tổng Hợp Biên Bản Họp Tổ Chuyên Môn</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                {submittedDeptMeetingCount} / {OFFICIAL_DEPARTMENTS.length} tổ
              </span>
            </button>
          )}
          {consolidatedData.dynamicTables.length > 0 && (
            <button
              onClick={() => setActiveTab('dynamic')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'dynamic'
                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>1. Tổng Hợp Dữ Liệu 53 Lớp</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                {consolidatedData.totalDynamicRows} bản ghi
              </span>
            </button>
          )}

          {consolidatedData.fieldMatrix.columns.length > 0 && (
            <button
              onClick={() => setActiveTab('matrix')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'border-teal-600 text-teal-700 bg-teal-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              <span>Ma Trận Chỉ Số</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                {consolidatedData.fieldMatrix.columns.length} chỉ số
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('classes')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'classes'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {consolidatedData.isSpecificUsersAudience ? (
              <>
                <UserCheck className="w-4 h-4 text-indigo-600" />
                <span>Tiến Độ Người Báo Cáo Được Chỉ Định</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                  {consolidatedData.submittedCount}/{consolidatedData.totalSpecificUsers}
                </span>
              </>
            ) : consolidatedData.isDeptHeadAudience ? (
              <>
                <Users className="w-4 h-4 text-blue-600" />
                <span>Tiến Độ 19 Tổ Trưởng & Tổ Phó</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                  {consolidatedData.submittedCount}/19
                </span>
              </>
            ) : (
              <>
                <School className="w-4 h-4 text-emerald-600" />
                <span>Tiến Độ & Sĩ Số 53 Lớp</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  53
                </span>
              </>
            )}
          </button>

          {consolidatedData.totalAbsentStudents > 0 && (
            <button
              onClick={() => setActiveTab('absent')}
              className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'absent'
                  ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Học Sinh Chưa Ra Lớp</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                {consolidatedData.totalAbsentStudents}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('talents')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'talents'
                ? 'border-amber-600 text-amber-700 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>Năng Khiếu & Ban Cán Sự</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {consolidatedData.talents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('feedbacks')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'feedbacks'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-blue-600" />
            <span>Nội Dung Báo Cáo ({consolidatedData.feedbacks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'ai'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Tóm Tắt & Chỉ Đạo BGH</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60">
          
          {/* TAB: TỔNG HỢP BIÊN BẢN HỌP CÁC TỔ CHUYÊN MÔN (CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP, DẠNG VĂN BẢN HÀNH CHÍNH, KHÔNG KẺ Ô) */}
          {activeTab === 'dept_meetings' && (
            <div className="space-y-4">
              {/* Document Actions Bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">Lọc theo tổ:</span>
                  </div>
                  <select
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="all">-- Hiển thị tất cả {OFFICIAL_DEPARTMENTS.length} tổ chuyên môn --</option>
                    {OFFICIAL_DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.headUserName})</option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-500 italic">
                    (Hiển thị {displayDeptMeetings.length} tổ)
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleCopyMeetingDoc}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedMeetingDoc ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{copiedMeetingDoc ? 'Đã sao chép!' : 'Sao chép văn bản'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportWord}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Tải file Word (.doc)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In A4 / Xuất PDF</span>
                  </button>
                </div>
              </div>

              {/* Administrative Document Paper View */}
              <div className="bg-slate-200/70 p-4 sm:p-8 rounded-2xl overflow-y-auto max-h-[72vh] flex justify-center shadow-inner">
                <div className="bg-white w-full max-w-[850px] shadow-xl border border-slate-300 rounded-sm p-8 sm:p-14 text-slate-900 font-serif leading-relaxed text-[14.5px]">
                  
                  {/* Header: Quốc hiệu, Tiêu ngữ & Đơn vị ban hành */}
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-transparent">
                    <div className="text-center">
                      <div className="text-[12px] uppercase tracking-wide">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
                      <div className="text-[12.5px] font-bold uppercase mt-0.5">TRƯỜNG THCS VÀ THPT</div>
                      <div className="text-[12.5px] font-bold uppercase mt-0.5">ĐỐC BINH KIỀU</div>
                      <div className="flex justify-center mt-1">
                        <div className="w-[85px] h-[1.5px] bg-black"></div>
                      </div>
                      <div className="text-[12px] mt-1.5">Số: &nbsp; &nbsp; /BC-THCS&amp;THPTĐBK</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[12px] font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                      <div className="text-[12.5px] font-bold mt-0.5">Độc lập – Tự do – Hạnh phúc</div>
                      <div className="flex justify-center mt-1">
                        <div className="w-[160px] h-[1.5px] bg-black"></div>
                      </div>
                      <div className="text-[12px] italic mt-1.5">Đồng Tháp, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center my-6">
                    <h2 className="text-[16px] font-bold uppercase tracking-wider text-slate-950">
                      {reportTitleInfo.mainType}
                    </h2>
                    <h3 className="text-[15px] font-bold uppercase text-slate-950 mt-1">
                      {reportTitleInfo.subTitle}
                    </h3>
                    <div className="w-48 h-0.5 bg-black mx-auto mt-2"></div>
                  </div>

                  {/* Phần I: Tình hình tổ chức họp */}
                  <div className="mt-6 text-justify">
                    <h4 className="font-bold text-[14.5px] uppercase">
                      I. TÌNH HÌNH TỔ CHỨC HỌP CỦA CÁC TỔ CHUYÊN MÔN
                    </h4>
                    <p className="indent-6 mt-1">
                      - <strong>Tổng số tổ chuyên môn:</strong> {OFFICIAL_DEPARTMENTS.length} tổ.
                    </p>
                    <p className="indent-6 mt-1">
                      - <strong>Số tổ đã tiến hành họp và hoàn thành nộp biên bản:</strong> <strong>{submittedDeptMeetingCount} / {OFFICIAL_DEPARTMENTS.length}</strong> tổ (Tỷ lệ: <strong>{OFFICIAL_DEPARTMENTS.length > 0 ? Math.round((submittedDeptMeetingCount / OFFICIAL_DEPARTMENTS.length) * 100) : 0}%</strong>).
                    </p>
                    <p className="indent-6 mt-1">
                      - <strong>Thời gian, địa điểm và quân số tham dự họp của từng tổ:</strong>
                    </p>
                    <div className="pl-6 mt-1 space-y-1">
                      {OFFICIAL_DEPARTMENTS.map(dept => {
                        const m = consolidatedData.deptMeetingMinutesList.find(d => d.departmentId === dept.id || d.departmentName?.toLowerCase().includes(dept.code.toLowerCase()));
                        if (!m || !m.hasSubmitted) {
                          return (
                            <p key={dept.id} className="text-justify">
                              + <strong>{dept.name}:</strong> <em>(Chưa nộp biên bản/báo cáo)</em>.
                            </p>
                          );
                        }
                        const min = m.minutes;
                        if (min) {
                          const timeParts: string[] = [];
                          if (min.timeHour) timeParts.push(`vào lúc ${min.timeHour} giờ ${min.timeMinute || '00'} phút`);
                          if (min.meetingDate) timeParts.push(`ngày ${min.meetingDate} tháng ${min.meetingMonth || '9'} năm ${min.meetingYear || '2026'}`);
                          const timeStr = timeParts.length > 0 ? timeParts.join(', ') : 'theo kế hoạch sinh hoạt tổ';
                          const locStr = min?.location ? `tại ${min.location}` : '';
                          const chairStr = min?.chairPerson ? `Chủ trì: ${min.chairPerson} (${min.chairTitle || 'Tổ trưởng chuyên môn'})` : `Chủ trì: ${m.teacherName}`;
                          const secStr = min?.secretary ? `; Thư ký: ${min.secretary}` : '';
                          const memParts: string[] = [];
                          if (min.totalMembers) memParts.push(`Tổng số thành viên: ${min.totalMembers}`);
                          if (min.presentMembers !== undefined && min.presentMembers !== null) memParts.push(`có mặt: ${min.presentMembers}`);
                          if (min.absentCount !== undefined && min.absentCount !== null) {
                            memParts.push(`vắng: ${min.absentCount}${min.absentReason ? ` (Lý do: ${min.absentReason})` : ''}`);
                          }
                          const memberStr = memParts.length > 0 ? `; ${memParts.join(', ')}` : '';
                          return (
                            <p key={dept.id} className="text-justify">
                              + <strong>{m.departmentName}:</strong> Họp ${timeStr} ${locStr}. ${chairStr}${secStr}${memberStr}.
                            </p>
                          );
                        }
                        return (
                          <p key={dept.id} className="text-justify">
                            + <strong>{m.departmentName}:</strong> Đã nộp báo cáo chuyên môn (Người nộp: {m.teacherName}).
                          </p>
                        );
                      })}
                    </div>
                  </div>

                  {/* NỘI DUNG CUỘC HỌP (CANH GIỮA TRANG GIẤY) */}
                  <div className="text-center my-6">
                    <h3 className="text-[15.5px] font-bold uppercase tracking-wider text-black">
                      NỘI DUNG CUỘC HỌP
                    </h3>
                  </div>

                  {displayDeptMeetings.length === 0 ? (
                    <div className="my-6 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center italic text-slate-600">
                      (Hiện tại chưa ghi nhận biên bản hoặc nội dung báo cáo nộp lên từ các tổ chuyên môn)
                    </div>
                  ) : (
                    <>
                      {/* Mục 1: Đánh giá hoạt động */}
                      <div className="mt-4 text-justify">
                        <h4 className="font-bold text-[14.5px]">
                          1. Đánh giá hoạt động của tổ trong thời gian qua:
                        </h4>
                        {displayDeptMeetings.map(m => {
                          const min = m.minutes;
                          const strengths = min?.reviewStrengths?.trim() || '(Không ghi)';
                          const weaknesses = min?.reviewWeaknesses?.trim() || '(Không có)';
                          const causes = min?.reviewCauses?.trim() || '(Không có)';
                          const solutions = min?.reviewSolutions?.trim() || '(Không có)';
                          return (
                            <div key={m.departmentId} className="my-2.5 pl-4">
                              <p className="font-bold">• {m.departmentName}:</p>
                              <div className="pl-4 space-y-0.5 mt-0.5">
                                <p>- <em>Ưu điểm:</em> {strengths}</p>
                                <p>- <em>Hạn chế:</em> {weaknesses}</p>
                                <p>- <em>Nguyên nhân của hạn chế:</em> {causes}</p>
                                <p>- <em>Giải pháp khắc phục:</em> {solutions}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mục 2: Triển khai các văn bản */}
                      <div className="mt-5 text-justify">
                        <h4 className="font-bold text-[14.5px]">
                          2. Triển khai các văn bản:
                        </h4>
                        {displayDeptMeetings.map(m => {
                          const docs = m.minutes?.documentsDeployed?.trim() || '';
                          const docLines = splitSmartLines(docs);
                          return (
                            <div key={m.departmentId} className="my-2.5 pl-4">
                              <p className="font-bold">• {m.departmentName}:</p>
                              <div className="pl-4 space-y-0.5 mt-0.5">
                                {docLines.length > 0 ? (
                                  docLines.map((line, lIdx) => (
                                    <p key={lIdx} className="text-justify">{line}</p>
                                  ))
                                ) : (
                                  <p className="italic text-slate-500">(Không ghi nhận)</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mục 3: Triển khai nội dung công việc trọng tâm */}
                      <div className="mt-5 text-justify">
                        <h4 className="font-bold text-[14.5px]">
                          3. Triển khai nội dung công việc trọng tâm của trường/tổ:
                        </h4>
                        {displayDeptMeetings.map(m => {
                          const tasks = m.minutes?.centralTasks?.trim() || '';
                          const taskLines = splitSmartLines(tasks);
                          return (
                            <div key={m.departmentId} className="my-2.5 pl-4">
                              <p className="font-bold">• {m.departmentName}:</p>
                              <div className="pl-4 space-y-0.5 mt-0.5">
                                {taskLines.length > 0 ? (
                                  taskLines.map((line, lIdx) => (
                                    <p key={lIdx} className="text-justify">{line}</p>
                                  ))
                                ) : (
                                  <p className="italic text-slate-500">(Không ghi nhận)</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mục 4: Ý kiến các thành viên */}
                      <div className="mt-5 text-justify">
                        <h4 className="font-bold text-[14.5px]">
                          4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân:
                        </h4>
                        {displayDeptMeetings.map(m => {
                          const opinions = m.minutes?.memberOpinions?.trim() || '';
                          const opLines = splitSmartLines(opinions);
                          return (
                            <div key={m.departmentId} className="my-2.5 pl-4">
                              <p className="font-bold">• {m.departmentName}:</p>
                              <div className="pl-4 space-y-0.5 mt-0.5">
                                {opLines.length > 0 ? (
                                  opLines.map((line, lIdx) => (
                                    <p key={lIdx} className="text-justify">{line}</p>
                                  ))
                                ) : (
                                  <p className="italic text-slate-500">(Không có ý kiến)</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mục 5: Kết luận của chủ trì */}
                      <div className="mt-5 text-justify">
                        <h4 className="font-bold text-[14.5px]">
                          5. Kết luận của chủ trì:
                        </h4>
                        {displayDeptMeetings.map(m => {
                          const conclusion = m.minutes?.conclusion?.trim() || '';
                          const chairName = m.minutes?.chairPerson || m.teacherName;
                          const concLines = splitSmartLines(conclusion);
                          return (
                            <div key={m.departmentId} className="my-2.5 pl-4">
                              <p className="font-bold">• {m.departmentName} ({chairName} - Chủ trì):</p>
                              <div className="pl-4 space-y-0.5 mt-0.5">
                                {concLines.length > 0 ? (
                                  concLines.map((line, lIdx) => (
                                    <p key={lIdx} className="text-justify">{line}</p>
                                  ))
                                ) : (
                                  <p className="italic text-slate-500">(Không ghi nhận kết luận riêng)</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mục 6: Đề xuất, kiến nghị với nhà trường */}
                      <div className="mt-5 text-justify">
                        <h4 className="font-bold text-[14.5px]">
                          6. Đề xuất, kiến nghị với nhà trường:
                        </h4>
                        {displayDeptMeetings.map(m => {
                          const recs = m.minutes?.recommendations?.trim() || '';
                          const recLines = splitSmartLines(recs);
                          return (
                            <div key={m.departmentId} className="my-2.5 pl-4">
                              <p className="font-bold">• {m.departmentName}:</p>
                              <div className="pl-4 space-y-0.5 mt-0.5">
                                {recLines.length > 0 ? (
                                  recLines.map((line, lIdx) => (
                                    <p key={lIdx} className="text-justify">{line}</p>
                                  ))
                                ) : (
                                  <p className="italic text-slate-500">(Không có đề xuất, kiến nghị)</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mục 7: Nội dung báo cáo văn bản bổ sung (nếu có) */}
                      {(() => {
                        const extraDepts = displayDeptMeetings.filter(m => m.reportContent && m.reportContent.trim());
                        if (extraDepts.length === 0) return null;
                        return (
                          <div className="mt-5 text-justify">
                            <h4 className="font-bold text-[14.5px]">
                              7. Nội dung báo cáo văn bản &amp; ý kiến bổ sung từ các tổ:
                            </h4>
                            {extraDepts.map(m => (
                              <div key={m.departmentId} className="my-2.5 pl-4">
                                <p className="font-bold">• {m.departmentName} (Người gửi: {m.teacherName}):</p>
                                <div className="pl-4 space-y-0.5 mt-0.5">
                                  {splitSmartLines(m.reportContent || '').map((line, lIdx) => (
                                    <p key={lIdx} className="text-justify">{line}</p>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Mục 8: Giờ kết thúc và thông qua biên bản */}
                      <div className="mt-5 text-justify">
                        {displayDeptMeetings.filter(m => m.minutes?.endHour).map(m => (
                          <p key={m.departmentId} className="indent-6 italic text-[14px] text-slate-700">
                            - Cuộc họp của <strong>{m.departmentName}</strong> kết thúc vào lúc {m.minutes!.endHour} giờ {m.minutes!.endMinute || '00'} phút cùng ngày; biên bản đã được thông qua toàn thể cuộc họp và thống nhất ký tên lưu hồ sơ./.
                          </p>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Chữ ký 2 bên */}
                  <div className="grid grid-cols-2 gap-4 mt-12 pt-6 text-center">
                    <div>
                      <div className="font-bold uppercase text-[13px]">NGƯỜI LẬP BIỂU</div>
                      <div className="text-[12px] italic">(Ký và ghi rõ họ tên)</div>
                      <div className="h-16"></div>
                      <div className="font-bold text-[13.5px]">{currentUser?.name}</div>
                      <div className="text-[12px] text-slate-600">{currentUser?.roleTitle}</div>
                    </div>
                    <div>
                      <div className="font-bold uppercase text-[13px]">HIỆU TRƯỞNG</div>
                      <div className="text-[12px] italic">(Ký tên, đóng dấu)</div>
                      <div className="h-16"></div>
                      <div className="font-bold text-[13.5px]">{schoolInfo.principalName}</div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* TAB 1: HỌC SINH CHƯA RA LỚP TOÀN TRƯỜNG */}
          {activeTab === 'absent' && (
            <div className="space-y-4">
              
              {/* Filter controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm tên học sinh, lý do vắng, lớp, nơi ở, số điện thoại..."
                      value={searchAbsent}
                      onChange={(e) => setSearchAbsent(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
                  >
                    <option value="all">Tất cả các khối (6-12)</option>
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>

                  <select
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
                  >
                    <option value="all">Tất cả điểm trường</option>
                    <option value="THPT">Điểm THPT</option>
                    <option value="DBK">Điểm THCS Đốc Binh Kiều</option>
                    <option value="TK">Điểm THCS Tân Kiều</option>
                  </select>
                </div>

                <div className="text-xs font-semibold text-slate-500">
                  Hiển thị <span className="font-bold text-rose-600">{filteredAbsentStudents.length}</span> / {consolidatedData.totalAbsentStudents} học sinh chưa ra lớp
                </div>
              </div>

              {/* Master Table */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80 bg-rose-50/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider">
                      Danh Sách Tổng Hợp Học Sinh Chưa Ra Lớp Toàn Trường (Gộp từ 53 Lớp)
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 italic">
                    Dữ liệu cập nhật trực tiếp theo các biểu mẫu nộp của 53 GVCN
                  </span>
                </div>

                {filteredAbsentStudents.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-slate-800">
                      {consolidatedData.absentStudents.length === 0 
                        ? 'Tuyệt vời! Không có học sinh nào vắng (100% ra lớp)' 
                        : 'Không tìm thấy học sinh phù hợp với bộ lọc'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {consolidatedData.absentStudents.length === 0 
                        ? 'Các lớp đã báo cáo đều ghi nhận học sinh ra lớp đầy đủ.' 
                        : 'Thầy vui lòng thử tìm kiếm với từ khóa khác hoặc bỏ chọn bộ lọc.'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[58vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10 shadow-2xs">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-20 text-center">Lớp</th>
                          <th className="p-3 w-24">Khối / Điểm</th>
                          <th className="p-3 w-40">GVCN</th>
                          <th className="p-3 w-48">Họ và tên học sinh</th>
                          <th className="p-3 w-24">Lớp cũ</th>
                          <th className="p-3 min-w-[200px]">Nơi ở hiện nay</th>
                          <th className="p-3 w-32">Số ĐT Phụ huynh</th>
                          <th className="p-3 min-w-[220px]">Lý do chưa ra lớp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAbsentStudents.map((s, idx) => (
                          <tr key={`${s.className}-${s.studentName}-${idx}`} className="hover:bg-rose-50/30 transition">
                            <td className="p-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                            <td className="p-3 text-center font-bold text-emerald-700 bg-slate-50/60">{s.className}</td>
                            <td className="p-3 text-slate-600">
                              <span className="font-semibold">Khối {s.grade}</span>
                              <span className="text-[10px] text-slate-400 block">
                                {s.campus === 'THPT' ? 'Điểm THPT' : (s.campus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều')}
                              </span>
                            </td>
                            <td className="p-3 text-slate-800 font-medium">{s.teacherName}</td>
                            <td className="p-3 font-bold text-slate-900">{s.studentName}</td>
                            <td className="p-3 text-slate-600">{s.previousClass}</td>
                            <td className="p-3 text-slate-700 text-[11px]">{s.currentAddress}</td>
                            <td className="p-3 text-slate-800 font-medium">
                              {s.parentPhone !== '-' ? (
                                <a href={`tel:${s.parentPhone}`} className="text-blue-600 hover:underline flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-blue-500" />
                                  <span>{s.parentPhone}</span>
                                </a>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3 text-rose-700 font-medium bg-rose-50/20">{s.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BẢNG SĨ SỐ 53 LỚP / TIẾN ĐỘ NGƯỜI BÁO CÁO */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              {consolidatedData.isSpecificUsersAudience ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Bảng Theo Dõi Tiến Độ Báo Cáo - {consolidatedData.totalSpecificUsers} Cán Bộ / Giáo Viên Được Chỉ Định Đích Danh
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2.5 py-1 rounded-lg">
                      Đã nộp: {consolidatedData.submittedCount} / {consolidatedData.totalSpecificUsers} người ({consolidatedData.completionRate}%)
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[64vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-48">Họ và Tên Thầy/Cô</th>
                          <th className="p-3 w-40">Chức Vụ</th>
                          <th className="p-3 w-40">Tổ / Bộ Phận</th>
                          <th className="p-3 w-32">Môn / Nhiệm vụ</th>
                          <th className="p-3 w-32">Cơ sở / Đơn vị</th>
                          <th className="p-3 w-32 text-center">Trạng thái nộp</th>
                          <th className="p-3 w-36 text-center">Thời gian nộp</th>
                          <th className="p-3 min-w-[220px]">Tiêu đề báo cáo / Trích yếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.specificUserStats.map((u) => (
                          <tr key={u.userId} className={`hover:bg-slate-50 transition ${!u.hasSubmitted ? 'bg-amber-50/30' : ''}`}>
                            <td className="p-3 text-center text-slate-500 font-medium">{u.stt}</td>
                            <td className="p-3 font-bold text-slate-900">{u.teacherName}</td>
                            <td className="p-3 text-slate-700 font-medium">{u.roleTitle}</td>
                            <td className="p-3 text-slate-600">{u.departmentName || '-'}</td>
                            <td className="p-3 text-slate-600">{u.subject || '-'}</td>
                            <td className="p-3 text-slate-600">{u.originalSchool || '-'}</td>
                            <td className="p-3 text-center">
                              {u.hasSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã nộp</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <span>Chờ nộp</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center text-slate-600">
                              {u.submittedAt ? new Date(u.submittedAt).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td className="p-3 text-slate-700">
                              {u.reportTitle && <p className="font-semibold text-slate-900">{u.reportTitle}</p>}
                              {u.summaryNote && <p className="text-[11px] text-slate-500 italic mt-0.5">{u.summaryNote}</p>}
                              {!u.reportTitle && !u.summaryNote && <span className="text-slate-400 italic">Chưa có nội dung</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : consolidatedData.isDeptHeadAudience ? (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Bảng Theo Dõi Tiến Độ Báo Cáo 19 Tổ Trưởng & Tổ Phó Chuyên Môn
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                      Đã nộp: {consolidatedData.submittedCount} / 19 người ({consolidatedData.completionRate}%)
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[64vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-48">Họ và Tên Thầy/Cô</th>
                          <th className="p-3 w-40">Chức Vụ</th>
                          <th className="p-3 w-40">Tổ Chuyên Môn</th>
                          <th className="p-3 w-32">Môn Giảng Dạy</th>
                          <th className="p-3 w-32">Đơn Vị Cũ</th>
                          <th className="p-3 w-32 text-center">Trạng thái nộp</th>
                          <th className="p-3 w-36 text-center">Thời gian nộp</th>
                          <th className="p-3 min-w-[220px]">Tiêu đề báo cáo / Trích yếu</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.deptHeadStats.map((dh) => (
                          <tr key={dh.userId} className={`hover:bg-slate-50 transition ${!dh.hasSubmitted ? 'bg-amber-50/30' : ''}`}>
                            <td className="p-3 text-center text-slate-500 font-medium">{dh.stt}</td>
                            <td className="p-3 font-bold text-slate-900">{dh.teacherName}</td>
                            <td className="p-3 text-slate-700 font-medium">{dh.roleTitle}</td>
                            <td className="p-3 text-slate-600">{dh.departmentName}</td>
                            <td className="p-3 text-slate-600">{dh.subject || '-'}</td>
                            <td className="p-3 text-slate-600">{dh.originalSchool || '-'}</td>
                            <td className="p-3 text-center">
                              {dh.hasSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã nộp</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <span>Chờ nộp</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center text-slate-600">
                              {dh.submittedAt ? new Date(dh.submittedAt).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td className="p-3 text-slate-700">
                              {dh.reportTitle && <p className="font-semibold text-slate-900">{dh.reportTitle}</p>}
                              {dh.summaryNote && <p className="text-[11px] text-slate-500 italic mt-0.5">{dh.summaryNote}</p>}
                              {!dh.reportTitle && !dh.summaryNote && <span className="text-slate-400 italic">Chưa có nội dung</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Bảng Thống Kê Sĩ Số & Tỷ Lệ Ra Lớp 53 Lớp Chủ Nhiệm (Năm Học 2026 - 2027)
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                      Tổng cộng: {consolidatedData.totalEnrolledStudents} học sinh
                    </span>
                  </div>

                  <div className="overflow-x-auto max-h-[64vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-slate-700 font-bold border-b border-slate-200 z-10">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3 w-20 text-center">Lớp</th>
                          <th className="p-3 w-28">Điểm trường</th>
                          <th className="p-3 w-40">GVCN</th>
                          <th className="p-3 w-20 text-center">Sĩ số</th>
                          <th className="p-3 w-20 text-center">Hiện diện</th>
                          <th className="p-3 w-20 text-center">Vắng</th>
                          <th className="p-3 w-24 text-center">Tỷ lệ (%)</th>
                          <th className="p-3 w-28 text-center">Trạng thái</th>
                          <th className="p-3 min-w-[200px]">Phản ánh / Ghi chú của GVCN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.classStats.map((c) => (
                          <tr key={c.className} className={`hover:bg-slate-50 transition ${!c.hasSubmitted ? 'bg-amber-50/30' : ''}`}>
                            <td className="p-3 text-center text-slate-500 font-medium">{c.stt}</td>
                            <td className="p-3 text-center font-bold text-slate-900 bg-slate-50/60">{c.className}</td>
                            <td className="p-3 text-slate-600">
                              {c.campus === 'THPT' ? 'Điểm THPT' : (c.campus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều')}
                            </td>
                            <td className="p-3 text-slate-800 font-medium">{c.teacherName}</td>
                            <td className="p-3 text-center font-bold text-slate-900">{c.totalStudents}</td>
                            <td className="p-3 text-center font-bold text-emerald-700">{c.presentStudents}</td>
                            <td className={`p-3 text-center font-bold ${c.absentStudentsCount > 0 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-400'}`}>
                              {c.absentStudentsCount}
                            </td>
                            <td className="p-3 text-center font-bold">
                              {c.hasSubmitted ? (
                                <span className={`px-2 py-0.5 rounded-md ${c.attendanceRate >= 95 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {c.attendanceRate}%
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {c.hasSubmitted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Đã nộp</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  <span>Chờ nộp</span>
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-slate-600 text-[11px] italic truncate max-w-xs" title={c.notes}>
                              {c.notes || '-'}
                            </td>
                          </tr>
                        ))}

                        {/* Dòng Tổng cộng toàn trường */}
                        <tr className="bg-slate-900 text-white font-bold sticky bottom-0 z-10 shadow-lg">
                          <td colSpan={4} className="p-3 text-center uppercase tracking-wider text-emerald-300">
                            TỔNG CỘNG TOÀN TRƯỜNG (53 LỚP)
                          </td>
                          <td className="p-3 text-center text-white">{consolidatedData.totalEnrolledStudents}</td>
                          <td className="p-3 text-center text-emerald-400">{consolidatedData.totalPresentStudents}</td>
                          <td className="p-3 text-center text-rose-400">{consolidatedData.totalAbsentStudents}</td>
                          <td className="p-3 text-center text-emerald-300">{consolidatedData.overallAttendanceRate}%</td>
                          <td className="p-3 text-center text-slate-300">{consolidatedData.submittedCount}/53 lớp</td>
                          <td className="p-3 text-slate-400 font-normal text-[11px]">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HỌC SINH NĂNG KHIẾU & BAN CÁN SỰ */}
          {activeTab === 'talents' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Năng khiếu & giải thưởng */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80 bg-amber-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Học Sinh Năng Khiếu & Giải Thưởng ({consolidatedData.talents.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Phục vụ bồi dưỡng HSG & Hội khỏe Phù Đổng</span>
                </div>

                {consolidatedData.talents.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Chưa có lớp nào gửi danh sách học sinh năng khiếu.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[55vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-10 text-center">STT</th>
                          <th className="p-2.5 w-16 text-center">Lớp</th>
                          <th className="p-2.5 w-36">Họ tên học sinh</th>
                          <th className="p-2.5">Cuộc thi / Năng khiếu</th>
                          <th className="p-2.5 w-24 text-center">Giải thưởng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.talents.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700">{t.className}</td>
                            <td className="p-2.5 font-bold text-slate-900">{t.studentName}</td>
                            <td className="p-2.5 text-slate-700">{t.competition}</td>
                            <td className="p-2.5 text-center font-semibold text-amber-700 bg-amber-50/50">{t.prize}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Ban cán sự lớp */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-200/80 bg-blue-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                      Danh Bạ Ban Cán Sự Lớp ({consolidatedData.cadres.length})
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Dành cho BGH & Đoàn - Đội liên hệ</span>
                </div>

                {consolidatedData.cadres.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Chưa có lớp nào cập nhật ban cán sự.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[55vh]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5 w-10 text-center">STT</th>
                          <th className="p-2.5 w-16 text-center">Lớp</th>
                          <th className="p-2.5 w-32">Chức vụ</th>
                          <th className="p-2.5">Họ và tên</th>
                          <th className="p-2.5 w-28">Số điện thoại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consolidatedData.cadres.map((c, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700">{c.className}</td>
                            <td className="p-2.5 font-semibold text-blue-700">{c.role}</td>
                            <td className="p-2.5 font-bold text-slate-900">{c.studentName}</td>
                            <td className="p-2.5 text-slate-600 font-medium">
                              {c.phone !== '-' ? (
                                <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline">
                                  {c.phone}
                                </a>
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: NỘI DUNG CHI TIẾT & Ý KIẾN CỦA 53 NGƯỜI */}
          {activeTab === 'feedbacks' && (
            <div className="space-y-4">
              
              {/* Search bar */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên giáo viên, lớp, nội dung đề xuất hoặc từ khóa kiến nghị..."
                    value={searchFeedback}
                    onChange={(e) => setSearchFeedback(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <span className="text-xs font-semibold text-slate-500 shrink-0">
                  {filteredFeedbacks.length} báo cáo có nội dung
                </span>
              </div>

              {/* Feedback cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFeedbacks.map((f, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 hover:border-slate-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                          {f.className !== '-' ? `Lớp ${f.className}` : f.departmentName}
                        </span>
                        <span className="font-bold text-slate-800 text-xs">{f.authorName}</span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {f.submittedAt ? new Date(f.submittedAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>

                    {f.notes && (
                      <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 text-xs text-amber-950">
                        <span className="font-bold text-amber-900 block mb-0.5">📌 Đề xuất / Ý kiến gửi BGH:</span>
                        <p className="italic">{f.notes}</p>
                      </div>
                    )}

                    {f.content && (
                      <div className="text-xs text-slate-600 line-clamp-4 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {f.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: DYNAMIC TABLES (TỔNG HỢP DỮ LIỆU TỪ 53 LỚP / TOÀN TRƯỜNG) */}
          {activeTab === 'dynamic' && (
            <div className="space-y-6">
              {/* Filter controls for dynamic table */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm trong bảng dữ liệu: tên học sinh, lớp, người nộp, ghi chú..."
                      value={searchDynamic}
                      onChange={(e) => setSearchDynamic(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-indigo-600"
                  >
                    <option value="all">Tất cả các khối</option>
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>

                  <select
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-indigo-600"
                  >
                    <option value="all">Tất cả điểm trường</option>
                    <option value="THPT">Điểm THPT</option>
                    <option value="DBK">Điểm THCS Đốc Binh Kiều</option>
                    <option value="TK">Điểm THCS Tân Kiều</option>
                  </select>
                </div>

                <div className="text-xs text-slate-600 font-medium">
                  Tổng hợp: <strong className="text-indigo-700">{consolidatedData.totalDynamicRows} bản ghi</strong> từ các lớp đã nộp
                </div>
              </div>

              {filteredDynamicTables.map((tbl) => (
                <div key={tbl.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                  <div className="p-4 bg-gradient-to-r from-indigo-50/80 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                          {tbl.title}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Bảng dữ liệu gom từ tất cả các lớp của đợt báo cáo
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {tbl.filteredRows.length} / {tbl.rows.length} dòng hiển thị
                    </span>
                  </div>

                  {tbl.filteredRows.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Không tìm thấy bản ghi nào phù hợp với bộ lọc hiện tại.
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-[55vh]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 shadow-2xs">
                          <tr>
                            <th className="p-2.5 w-10 text-center">STT</th>
                            <th className="p-2.5 w-20 text-center">Lớp</th>
                            <th className="p-2.5 w-28 text-center">Cơ sở</th>
                            <th className="p-2.5 w-36">Người nộp / GVCN</th>
                            {tbl.headers.map((h, hIdx) => (
                              <th key={hIdx} className="p-2.5 min-w-[120px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {tbl.filteredRows.map((r, rIdx) => (
                            <tr key={rIdx} className="hover:bg-indigo-50/40 transition">
                              <td className="p-2.5 text-center text-slate-400 font-mono">{rIdx + 1}</td>
                              <td className="p-2.5 text-center font-bold text-indigo-700">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100">
                                  {r.className}
                                </span>
                              </td>
                              <td className="p-2.5 text-center text-slate-600 text-[11px]">
                                {r.campus === 'THPT' ? 'Điểm THPT' : (r.campus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều')}
                              </td>
                              <td className="p-2.5 font-medium text-slate-800">{r.authorName}</td>
                              {tbl.headers.map((h, hIdx) => (
                                <td key={hIdx} className="p-2.5 text-slate-700">
                                  {r.data[h] !== undefined && r.data[h] !== '' ? String(r.data[h]) : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB: MATRIX (MA TRẬN CHỈ SỐ BIỂU MẪU) */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo lớp, người nộp hoặc giá trị..."
                      value={searchDynamic}
                      onChange={(e) => setSearchDynamic(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-teal-600"
                  >
                    <option value="all">Tất cả các khối</option>
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>

                  <select
                    value={campusFilter}
                    onChange={(e) => setCampusFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-teal-600"
                  >
                    <option value="all">Tất cả điểm trường</option>
                    <option value="THPT">Điểm THPT</option>
                    <option value="DBK">Điểm THCS Đốc Binh Kiều</option>
                    <option value="TK">Điểm THCS Tân Kiều</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200 shadow-2xs">
                      <tr>
                        <th className="p-2.5 w-10 text-center">STT</th>
                        <th className="p-2.5 w-20 text-center">Lớp</th>
                        <th className="p-2.5 w-24 text-center">Cơ sở</th>
                        <th className="p-2.5 w-36">Người báo cáo</th>
                        <th className="p-2.5 w-24 text-center">Trạng thái</th>
                        {consolidatedData.fieldMatrix.columns.map((col) => (
                          <th key={col.id} className="p-2.5 text-center min-w-[120px]">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMatrixRows.map((r) => (
                        <tr key={r.className} className={`hover:bg-teal-50/40 transition ${!r.hasSubmitted ? 'bg-slate-50/60 opacity-70' : ''}`}>
                          <td className="p-2.5 text-center text-slate-400 font-mono">{r.stt}</td>
                          <td className="p-2.5 text-center font-bold text-teal-700">{r.className}</td>
                          <td className="p-2.5 text-center text-slate-500 text-[11px]">{r.campus}</td>
                          <td className="p-2.5 text-slate-800 font-medium">{r.authorName}</td>
                          <td className="p-2.5 text-center">
                            {r.hasSubmitted ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Đã nộp</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">Chưa nộp</span>
                            )}
                          </td>
                          {consolidatedData.fieldMatrix.columns.map((col) => (
                            <td key={col.id} className={`p-2.5 ${col.type === 'number' ? 'text-center font-semibold text-slate-900' : 'text-slate-700'}`}>
                              {r.values[col.id] !== undefined && r.values[col.id] !== '' ? String(r.values[col.id]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    {Object.keys(consolidatedData.fieldMatrix.numericTotals).length > 0 && (
                      <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={5} className="p-2.5 text-center uppercase tracking-wider text-slate-800">
                            TỔNG CỘNG TOÀN TRƯỜNG ({consolidatedData.submittedCount}/53 lớp)
                          </td>
                          {consolidatedData.fieldMatrix.columns.map((col) => (
                            <td key={col.id} className="p-2.5 text-center text-teal-900 font-bold text-sm">
                              {col.type === 'number' ? consolidatedData.fieldMatrix.numericTotals[col.id] || 0 : '-'}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TRỢ LÝ AI TỔNG HỢP CHO BAN GIÁM HIỆU */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-purple-900 to-indigo-950 rounded-2xl p-5 text-white shadow-md flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Báo Cáo Tóm Tắt & Phân Tích Điều Hành Cho Ban Giám Hiệu
                    </h3>
                    <p className="text-xs text-purple-200 mt-0.5">
                      Hệ thống tự động đọc và tổng hợp toàn bộ số liệu học sinh chưa ra lớp, sĩ số và phản ánh từ 53 GVCN
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyAISummary}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedAI ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAI ? 'Đã sao chép!' : 'Sao chép nội dung'}</span>
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                {aiSummaryText}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Info className="w-4 h-4 text-emerald-600" />
            <span>
              Trường THCS & THPT Đốc Binh Kiều • Tổng số 53 lớp chủ nhiệm (18 THPT, 20 THCS ĐBK, 15 THCS TK)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
