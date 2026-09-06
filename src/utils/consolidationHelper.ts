import { 
  ReportPeriod, 
  ReportSubmission, 
  User, 
  HomeroomMeetingMinutesData, 
  AbsentStudentItem, 
  TalentAchievementItem, 
  ClassCadreItem,
  CustomFormField,
  CustomDynamicTable
} from '../types';
import { HOMEROOM_ROSTER_53, SPECIALIZED_DEPT_HEADS_19 } from '../data/staffRoster';

export interface ConsolidatedDeptHeadStat {
  stt: number;
  orderNo: number;
  userId: string;
  teacherName: string;
  roleTitle: string;
  departmentId: string;
  departmentName: string;
  originalSchool: string;
  subject: string;
  hasSubmitted: boolean;
  submittedAt: string | null;
  submissionId: string | null;
  reportTitle?: string;
  summaryNote?: string;
}

export interface ConsolidatedStudent {
  stt: number;
  className: string;
  grade: number | string;
  campus: string;
  teacherName: string;
  studentName: string;
  previousClass: string;
  currentAddress: string;
  studentPhone: string;
  parentPhone: string;
  reason: string;
  submissionId: string;
  submittedAt: string;
}

export interface ConsolidatedClassStat {
  stt: number;
  className: string;
  campus: string;
  grade: number;
  teacherName: string;
  totalStudents: number;
  maleStudents: number;
  femaleStudents: number;
  presentStudents: number;
  absentStudentsCount: number;
  attendanceRate: number;
  notes: string;
  hasSubmitted: boolean;
  submittedAt: string | null;
  status: string;
  submissionId: string | null;
}

export interface ConsolidatedTalent {
  stt: number;
  className: string;
  teacherName: string;
  studentName: string;
  competition: string;
  prize: string;
  note: string;
}

export interface ConsolidatedCadre {
  stt: number;
  className: string;
  teacherName: string;
  role: string;
  studentName: string;
  academicPerf: string;
  conductPerf: string;
  phone: string;
}

export interface ConsolidatedFeedback {
  stt: number;
  authorName: string;
  className: string;
  departmentName: string;
  submittedAt: string;
  title: string;
  content: string;
  notes: string;
}

export interface ConsolidatedDynamicTableRow {
  stt: number;
  className: string;
  campus: string;
  grade: number;
  authorName: string;
  departmentName: string;
  submittedAt: string;
  submissionId: string;
  data: Record<string, string>;
}

export interface ConsolidatedDynamicTable {
  id: string;
  title: string;
  headers: string[];
  rows: ConsolidatedDynamicTableRow[];
  totalRows: number;
  classesCount: number;
}

export interface ConsolidatedFieldColumn {
  id: string;
  label: string;
  type: string;
}

export interface ConsolidatedFieldRow {
  stt: number;
  className: string;
  campus: string;
  grade: number;
  authorName: string;
  departmentName: string;
  submittedAt: string | null;
  values: Record<string, any>;
  hasSubmitted: boolean;
}

export interface ConsolidatedFieldMatrix {
  columns: ConsolidatedFieldColumn[];
  rows: ConsolidatedFieldRow[];
  numericTotals: Record<string, number>;
}

export interface PeriodConsolidationResult {
  period: ReportPeriod | null;
  periodTitle: string;
  targetAudienceLabel: string;
  totalHomeroomClasses: number;
  submittedCount: number;
  pendingCount: number;
  completionRate: number;

  // Primary dynamic table & all dynamic tables
  primaryTable: ConsolidatedDynamicTable | null;
  dynamicTables: ConsolidatedDynamicTable[];
  totalDynamicRows: number;

  // Dynamic field matrix
  fieldMatrix: ConsolidatedFieldMatrix;

  // Aggregate totals
  totalEnrolledStudents: number;
  totalMaleStudents: number;
  totalFemaleStudents: number;
  totalPresentStudents: number;
  totalAbsentStudents: number;
  overallAttendanceRate: number;

  // Homeroom & meeting specifics
  classStats: ConsolidatedClassStat[];
  absentStudents: ConsolidatedStudent[];
  talents: ConsolidatedTalent[];
  cadres: ConsolidatedCadre[];
  feedbacks: ConsolidatedFeedback[];

  // Specialized department heads (19 Thầy/Cô)
  isDeptHeadAudience: boolean;
  totalDeptHeads: number;
  deptHeadStats: ConsolidatedDeptHeadStat[];

  // Specific users targeted (Chỉ định đích danh từng cá nhân)
  isSpecificUsersAudience: boolean;
  totalSpecificUsers: number;
  specificUserStats: ConsolidatedDeptHeadStat[];
}

/**
 * Trích xuất bảng Markdown từ văn bản tự do nếu GVCN gõ dạng Markdown table
 */
function extractMarkdownTablesFromText(text: string): Array<{ title: string; headers: string[]; rows: Record<string, string>[] }> {
  if (!text || !text.includes('|')) return [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: Array<{ title: string; headers: string[]; rows: Record<string, string>[] }> = [];

  let currentTitle = 'Bảng dữ liệu trích xuất từ nội dung';
  let tableLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('#') || (line.endsWith(':') && !line.includes('|'))) {
      currentTitle = line.replace(/^[#\s*]+/, '').replace(/:$/, '').trim();
      continue;
    }
    if (line.includes('|')) {
      tableLines.push(line);
    } else if (tableLines.length >= 2) {
      // Process tableLines
      const parsed = parseMarkdownTable(tableLines, currentTitle);
      if (parsed) result.push(parsed);
      tableLines = [];
    }
  }

  if (tableLines.length >= 2) {
    const parsed = parseMarkdownTable(tableLines, currentTitle);
    if (parsed) result.push(parsed);
  }

  return result;
}

function parseMarkdownTable(lines: string[], title: string): { title: string; headers: string[]; rows: Record<string, string>[] } | null {
  if (lines.length < 2) return null;
  const headerLine = lines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter(Boolean);
  if (headers.length === 0) return null;

  // Skip separator line if present (e.g. |---|---|)
  const dataLines = lines.slice(1).filter(l => !l.replace(/[|\s-:]/g, '').length ? false : true);
  const rows: Record<string, string>[] = [];

  for (const dl of dataLines) {
    const cells = dl.split('|').map(c => c.trim()).filter((_, idx, arr) => !(idx === 0 && dl.startsWith('|') && _ === '') && !(idx === arr.length - 1 && dl.endsWith('|') && _ === ''));
    if (cells.length > 0) {
      const rowObj: Record<string, string> = {};
      headers.forEach((h, hIdx) => {
        rowObj[h] = cells[hIdx] || '';
      });
      rows.push(rowObj);
    }
  }

  if (rows.length === 0) return null;
  return { title, headers, rows };
}

/**
 * Phân tích và tổng hợp toàn diện dữ liệu từ tất cả các báo cáo đã nộp
 */
export function aggregatePeriodReportData(
  period: ReportPeriod | null,
  submissions: ReportSubmission[],
  allUsers: User[]
): PeriodConsolidationResult {
  // Lọc các bài nộp theo đợt (nếu có đợt cụ thể)
  const periodSubs = period 
    ? submissions.filter(s => s.periodId === period.id) 
    : submissions;

  const periodTitle = period?.title || 'Báo Cáo Tổng Hợp Toàn Trường';
  const targetAudienceLabel = period?.targetAudience === 'homeroom_teachers' 
    ? '53 Giáo viên chủ nhiệm' 
    : period?.targetAudience === 'dept_heads_only'
    ? 'Tổ trưởng chuyên môn'
    : 'Cán bộ, Giáo viên, Nhân viên';

  // Map submissions theo lớp hoặc theo tác giả
  const subByClassMap = new Map<string, ReportSubmission>();
  const subByUserMap = new Map<string, ReportSubmission>();

  periodSubs.forEach(sub => {
    if (sub.homeroomClass) {
      subByClassMap.set(sub.homeroomClass.trim().toUpperCase(), sub);
    }
    const minutesClass = sub.structuredData?.homeroomMinutes?.className;
    if (minutesClass) {
      subByClassMap.set(minutesClass.trim().toUpperCase(), sub);
    }
    subByUserMap.set(sub.authorId, sub);
  });

  const absentStudents: ConsolidatedStudent[] = [];
  const talents: ConsolidatedTalent[] = [];
  const cadres: ConsolidatedCadre[] = [];
  const feedbacks: ConsolidatedFeedback[] = [];

  // 1. Thống kê 53 lớp chủ nhiệm
  const classStats: ConsolidatedClassStat[] = HOMEROOM_ROSTER_53.map((hr, idx) => {
    const classKey = hr.className.trim().toUpperCase();
    const sub = subByClassMap.get(classKey);
    const minutes: HomeroomMeetingMinutesData | undefined = sub?.structuredData?.homeroomMinutes;

    const hasSubmitted = !!sub && sub.status !== 'draft';
    const total = minutes?.totalStudents || sub?.homeroomStudentCount || hr.studentCount || 0;
    const male = minutes?.maleStudents || Math.round(total * 0.48);
    const female = minutes?.femaleStudents || (total - male);
    const absentCount = minutes?.absentStudents?.length ?? (minutes?.absentCount || 0);
    const present = hasSubmitted ? Math.max(0, total - absentCount) : 0;
    const rate = total > 0 && hasSubmitted ? Math.round((present / total) * 100) : 0;

    // Thu thập học sinh vắng nếu có
    if (minutes?.absentStudents && minutes.absentStudents.length > 0) {
      minutes.absentStudents.forEach(item => {
        if (item.studentName?.trim()) {
          absentStudents.push({
            stt: absentStudents.length + 1,
            className: hr.className,
            grade: hr.grade,
            campus: hr.campus,
            teacherName: minutes?.teacherName || hr.teacherName,
            studentName: item.studentName.trim(),
            previousClass: item.previousClass || '-',
            currentAddress: item.currentAddress || '-',
            studentPhone: item.studentPhone || '-',
            parentPhone: item.parentPhone || '-',
            reason: item.reason || 'Chưa rõ lý do',
            submissionId: sub?.id || '',
            submittedAt: sub?.submittedAt || ''
          });
        }
      });
    }

    // Thu thập học sinh năng khiếu
    if (minutes?.talents && minutes.talents.length > 0) {
      minutes.talents.forEach(t => {
        if (t.studentName?.trim() || t.competition?.trim()) {
          talents.push({
            stt: talents.length + 1,
            className: hr.className,
            teacherName: hr.teacherName,
            studentName: t.studentName?.trim() || 'Chưa có tên',
            competition: t.competition || '-',
            prize: t.prize || 'Tham gia',
            note: t.note || ''
          });
        }
      });
    }

    // Thu thập ban cán sự lớp
    if (minutes?.cadres && minutes.cadres.length > 0) {
      minutes.cadres.forEach(c => {
        if (c.studentName?.trim()) {
          cadres.push({
            stt: cadres.length + 1,
            className: hr.className,
            teacherName: hr.teacherName,
            role: c.role || '-',
            studentName: c.studentName.trim(),
            academicPerf: c.academicPerf || '-',
            conductPerf: c.conductPerf || '-',
            phone: c.phone || '-'
          });
        }
      });
    }

    return {
      stt: idx + 1,
      className: hr.className,
      campus: hr.campus,
      grade: hr.grade,
      teacherName: hr.teacherName,
      totalStudents: total,
      maleStudents: male,
      femaleStudents: female,
      presentStudents: present,
      absentStudentsCount: absentCount,
      attendanceRate: rate,
      notes: minutes?.additionalNotes || sub?.title || '',
      hasSubmitted,
      submittedAt: sub?.submittedAt || null,
      status: sub?.status || 'unsubmitted',
      submissionId: sub?.id || null
    };
  });

  // 2. Thu thập nội dung báo cáo văn bản
  periodSubs.forEach((sub, idx) => {
    if (sub.status !== 'draft') {
      const minutesNotes = sub.structuredData?.homeroomMinutes?.additionalNotes || sub.structuredData?.customNotes || '';
      const textContent = sub.content || '';
      
      feedbacks.push({
        stt: idx + 1,
        authorName: sub.authorName,
        className: sub.homeroomClass || sub.structuredData?.homeroomMinutes?.className || sub.departmentName || '-',
        departmentName: sub.departmentName,
        submittedAt: sub.submittedAt || '',
        title: sub.title,
        content: textContent,
        notes: minutesNotes
      });
    }
  });

  // 3. TỔNG HỢP TOÀN BỘ CÁC BẢNG SỐ LIỆU ĐỘNG (Dynamic Tables)
  // Bóc tách từ formTemplate của đợt, từ customTables trong submissions, và từ markdown tables
  const dynamicTablesMap = new Map<string, {
    id: string;
    title: string;
    headers: string[];
    rows: ConsolidatedDynamicTableRow[];
  }>();

  // Đăng ký bảng từ mẫu đợt nếu có
  if (period?.formTemplate?.tables) {
    period.formTemplate.tables.forEach(tbl => {
      const titleKey = (tbl.title || 'Bảng số liệu tổng hợp').trim();
      if (!dynamicTablesMap.has(titleKey)) {
        dynamicTablesMap.set(titleKey, {
          id: tbl.id || titleKey,
          title: titleKey,
          headers: [...(tbl.headers || [])],
          rows: []
        });
      }
    });
  }

  // Quét qua các bài nộp để lấy dòng dữ liệu
  periodSubs.forEach(sub => {
    if (sub.status === 'draft') return;

    // A. Lấy từ structuredData.customTables
    const customTables: CustomDynamicTable[] = sub.structuredData?.customTables || [];
    customTables.forEach((tbl) => {
      const titleKey = (tbl.title || 'Bảng số liệu báo cáo').trim();
      if (!dynamicTablesMap.has(titleKey)) {
        dynamicTablesMap.set(titleKey, {
          id: tbl.id || titleKey,
          title: titleKey,
          headers: [...(tbl.headers || [])],
          rows: []
        });
      }
      const group = dynamicTablesMap.get(titleKey)!;
      // Thêm header nếu thiếu
      (tbl.headers || []).forEach(h => {
        if (!group.headers.includes(h)) group.headers.push(h);
      });

      // Tìm thông tin lớp
      const hrRosterItem = HOMEROOM_ROSTER_53.find(h => h.className === sub.homeroomClass);

      (tbl.rows || []).forEach(row => {
        const hasValue = Object.values(row).some(v => v !== undefined && String(v).trim() !== '');
        if (hasValue) {
          group.rows.push({
            stt: group.rows.length + 1,
            className: sub.homeroomClass || '-',
            campus: hrRosterItem?.campus || 'Chưa phân cơ sở',
            grade: hrRosterItem?.grade || 0,
            authorName: sub.authorName,
            departmentName: sub.departmentName,
            submittedAt: sub.submittedAt || '',
            submissionId: sub.id,
            data: row
          });
        }
      });
    });

    // B. Lấy từ Markdown Tables trong nội dung (nếu giáo viên gõ bảng vào text)
    if (sub.content && sub.content.includes('|')) {
      const mdTables = extractMarkdownTablesFromText(sub.content);
      mdTables.forEach(mdTbl => {
        const titleKey = mdTbl.title || 'Bảng dữ liệu trích xuất';
        if (!dynamicTablesMap.has(titleKey)) {
          dynamicTablesMap.set(titleKey, {
            id: 'md-' + titleKey,
            title: titleKey,
            headers: [...mdTbl.headers],
            rows: []
          });
        }
        const group = dynamicTablesMap.get(titleKey)!;
        mdTbl.headers.forEach(h => {
          if (!group.headers.includes(h)) group.headers.push(h);
        });

        const hrRosterItem = HOMEROOM_ROSTER_53.find(h => h.className === sub.homeroomClass);

        mdTbl.rows.forEach(row => {
          group.rows.push({
            stt: group.rows.length + 1,
            className: sub.homeroomClass || '-',
            campus: hrRosterItem?.campus || 'Chưa phân cơ sở',
            grade: hrRosterItem?.grade || 0,
            authorName: sub.authorName,
            departmentName: sub.departmentName,
            submittedAt: sub.submittedAt || '',
            submissionId: sub.id,
            data: row
          });
        });
      });
    }
  });

  // Nếu là đợt có dữ liệu học sinh vắng (biên bản sinh hoạt đầu năm), tự động gộp thành 1 bảng động chuẩn
  if (absentStudents.length > 0 && !dynamicTablesMap.has('Danh sách học sinh chưa ra lớp')) {
    const absentTableRows: ConsolidatedDynamicTableRow[] = absentStudents.map((s, idx) => ({
      stt: idx + 1,
      className: s.className,
      campus: s.campus,
      grade: typeof s.grade === 'number' ? s.grade : parseInt(String(s.grade)) || 0,
      authorName: s.teacherName,
      departmentName: 'Chủ nhiệm',
      submittedAt: s.submittedAt,
      submissionId: s.submissionId,
      data: {
        'Họ và tên học sinh': s.studentName,
        'Lớp năm học trước': s.previousClass,
        'Nơi ở hiện nay': s.currentAddress,
        'Số ĐT học sinh': s.studentPhone,
        'Số ĐT phụ huynh': s.parentPhone,
        'Lý do chưa ra lớp': s.reason
      }
    }));

    dynamicTablesMap.set('Danh sách học sinh chưa ra lớp', {
      id: 'table-absent-students',
      title: 'Danh sách học sinh chưa ra lớp (Tổng hợp toàn trường)',
      headers: ['Họ và tên học sinh', 'Lớp năm học trước', 'Nơi ở hiện nay', 'Số ĐT học sinh', 'Số ĐT phụ huynh', 'Lý do chưa ra lớp'],
      rows: absentTableRows
    });
  }

  // Định hình danh sách bảng động hoàn chỉnh
  const dynamicTables: ConsolidatedDynamicTable[] = Array.from(dynamicTablesMap.values()).map(t => {
    // Sắp xếp các hàng theo Khối và Lớp (6A1 -> 12A8)
    const sortedRows = [...t.rows].sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      return a.className.localeCompare(b.className);
    }).map((r, i) => ({ ...r, stt: i + 1 }));

    const uniqueClasses = new Set(sortedRows.map(r => r.className).filter(c => c !== '-'));

    return {
      id: t.id,
      title: t.title,
      headers: t.headers,
      rows: sortedRows,
      totalRows: sortedRows.length,
      classesCount: uniqueClasses.size
    };
  });

  const primaryTable = dynamicTables.length > 0 ? dynamicTables[0] : null;

  // 4. TỔNG HỢP MA TRẬN CÁC TRƯỜNG DỮ LIỆU ĐIỆN TỬ (Field Matrix)
  const fieldColumns: ConsolidatedFieldColumn[] = [];
  const fieldColumnMap = new Map<string, ConsolidatedFieldColumn>();

  // Thu thập các cột trường nhập từ mẫu đợt
  if (period?.formTemplate?.fields) {
    period.formTemplate.fields.forEach(f => {
      if (f.type !== 'table') {
        fieldColumnMap.set(f.id, { id: f.id, label: f.label, type: f.type });
      }
    });
  }

  // Thu thập các cột trường nhập từ bài nộp của GV
  periodSubs.forEach(s => {
    const fields: CustomFormField[] = s.structuredData?.customFields || [];
    fields.forEach(f => {
      if (f.type !== 'table' && !fieldColumnMap.has(f.id)) {
        fieldColumnMap.set(f.id, { id: f.id, label: f.label, type: f.type });
      }
    });
  });

  fieldColumnMap.forEach(col => fieldColumns.push(col));

  const numericTotals: Record<string, number> = {};
  fieldColumns.forEach(c => {
    if (c.type === 'number') numericTotals[c.id] = 0;
  });

  // Xây dựng ma trận 53 lớp
  const fieldRows: ConsolidatedFieldRow[] = HOMEROOM_ROSTER_53.map((hr, idx) => {
    const classKey = hr.className.trim().toUpperCase();
    const sub = subByClassMap.get(classKey);
    const hasSubmitted = !!sub && sub.status !== 'draft';
    const values: Record<string, any> = {};

    fieldColumns.forEach(c => {
      const val = sub?.structuredData?.customFieldValues?.[c.id];
      values[c.id] = val !== undefined && val !== null ? val : '';
      if (c.type === 'number' && typeof val === 'number') {
        numericTotals[c.id] = (numericTotals[c.id] || 0) + val;
      }
    });

    return {
      stt: idx + 1,
      className: hr.className,
      campus: hr.campus,
      grade: hr.grade,
      authorName: sub?.authorName || hr.teacherName,
      departmentName: 'Chủ nhiệm',
      submittedAt: sub?.submittedAt || null,
      values,
      hasSubmitted
    };
  });

  const fieldMatrix: ConsolidatedFieldMatrix = {
    columns: fieldColumns,
    rows: fieldRows,
    numericTotals
  };

  // 5. Tính toán tỷ lệ & số liệu tổng quan
  const isDeptHeadAudience = period?.targetAudience === 'dept_heads_only';
  const isSpecificUsersAudience = period?.targetAudience === 'specific_users';
  const targetUserIds = period?.targetUserIds || [];

  // Thống kê 19 Tổ trưởng & Tổ phó thuộc 6 tổ chuyên môn
  const deptHeadStats: ConsolidatedDeptHeadStat[] = SPECIALIZED_DEPT_HEADS_19.map((dh, idx) => {
    const sub = periodSubs.find(s => 
      s.authorId === dh.id || 
      (s.authorName && s.authorName.trim().toLowerCase() === dh.name.trim().toLowerCase())
    );
    const hasSubmitted = !!sub && sub.status !== 'draft';
    return {
      stt: idx + 1,
      orderNo: dh.orderNo || idx + 1,
      userId: dh.id,
      teacherName: dh.name,
      roleTitle: dh.roleTitle,
      departmentId: dh.departmentId,
      departmentName: dh.departmentName,
      originalSchool: dh.originalSchool || '',
      subject: dh.subject || '',
      hasSubmitted,
      submittedAt: sub?.submittedAt || null,
      submissionId: sub?.id || null,
      reportTitle: sub?.title || '',
      summaryNote: sub?.content ? (sub.content.length > 90 ? sub.content.slice(0, 90) + '...' : sub.content) : ''
    };
  });

  // Thống kê các Thầy/Cô được chỉ định đích danh (nếu đợt chỉ định riêng từng cá nhân)
  const specificUserStats: ConsolidatedDeptHeadStat[] = targetUserIds.map((userId, idx) => {
    const u = allUsers.find(x => x.id === userId);
    const sub = periodSubs.find(s => 
      s.authorId === userId || 
      (u && s.authorName && s.authorName.trim().toLowerCase() === u.name.trim().toLowerCase())
    );
    const hasSubmitted = !!sub && sub.status !== 'draft';
    return {
      stt: idx + 1,
      orderNo: u?.orderNo || idx + 1,
      userId: userId,
      teacherName: u?.name || 'Thầy/Cô ' + userId,
      roleTitle: u?.roleTitle || 'Giáo viên',
      departmentId: u?.departmentId || '',
      departmentName: u?.departmentName || '',
      originalSchool: u?.originalSchool || '',
      subject: u?.subject || '',
      hasSubmitted,
      submittedAt: sub?.submittedAt || null,
      submissionId: sub?.id || null,
      reportTitle: sub?.title || '',
      summaryNote: sub?.content ? (sub.content.length > 90 ? sub.content.slice(0, 90) + '...' : sub.content) : ''
    };
  });

  const submittedClasses = classStats.filter(c => c.hasSubmitted);
  const submittedDeptHeads = deptHeadStats.filter(d => d.hasSubmitted);
  const submittedSpecificUsers = specificUserStats.filter(s => s.hasSubmitted);

  const totalTargetCount = isSpecificUsersAudience 
    ? (targetUserIds.length || 1)
    : isDeptHeadAudience 
    ? 19 
    : 53;

  const submittedCount = isSpecificUsersAudience
    ? submittedSpecificUsers.length
    : isDeptHeadAudience 
    ? submittedDeptHeads.length 
    : submittedClasses.length;

  const pendingCount = Math.max(0, totalTargetCount - submittedCount);
  const completionRate = totalTargetCount > 0 ? Math.round((submittedCount / totalTargetCount) * 100) : 0;

  const totalEnrolled = submittedClasses.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalMale = submittedClasses.reduce((sum, c) => sum + c.maleStudents, 0);
  const totalFemale = submittedClasses.reduce((sum, c) => sum + c.femaleStudents, 0);
  const totalPresent = submittedClasses.reduce((sum, c) => sum + c.presentStudents, 0);
  const totalAbsent = absentStudents.length;
  const overallAttendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  const totalDynamicRows = dynamicTables.reduce((sum, t) => sum + t.rows.length, 0);

  return {
    period,
    periodTitle,
    targetAudienceLabel: isSpecificUsersAudience
      ? `Chỉ định đích danh (${targetUserIds.length} Thầy/Cô)`
      : isDeptHeadAudience 
      ? '19 Tổ trưởng & Tổ phó chuyên môn' 
      : targetAudienceLabel,
    totalHomeroomClasses: 53,
    submittedCount,
    pendingCount,
    completionRate,
    primaryTable,
    dynamicTables,
    totalDynamicRows,
    fieldMatrix,
    totalEnrolledStudents: totalEnrolled,
    totalMaleStudents: totalMale,
    totalFemaleStudents: totalFemale,
    totalPresentStudents: totalPresent,
    totalAbsentStudents: totalAbsent,
    overallAttendanceRate,
    classStats,
    absentStudents,
    talents,
    cadres,
    feedbacks,
    isDeptHeadAudience,
    totalDeptHeads: 19,
    deptHeadStats,
    isSpecificUsersAudience,
    totalSpecificUsers: targetUserIds.length,
    specificUserStats
  };
}

/**
 * Sinh bộ dữ liệu báo cáo mẫu cho đầy đủ 53 lớp chủ nhiệm
 * THÔNG MINH: Tự động phát hiện chủ đề của đợt (Hộ nghèo, Bỏ học, BHYT, hoặc mẫu tùy biến)
 * để sinh ra đúng danh sách học sinh và số liệu thực tế cho 53 lớp!
 */
export function generateSample53Submissions(
  periodId: string, 
  periodTitle: string,
  allUsers: User[],
  targetPeriod?: ReportPeriod | null
): ReportSubmission[] {
  const pTitle = (targetPeriod?.title || periodTitle || '').toLowerCase();

  const isPoorStudentTopic = pTitle.includes('nghèo') || pTitle.includes('khó khăn') || pTitle.includes('chính sách');
  const isDropoutTopic = pTitle.includes('nghỉ') || pTitle.includes('bỏ học') || pTitle.includes('nguy cơ');
  const isInsuranceTopic = pTitle.includes('bhyt') || pTitle.includes('bảo hiểm');

  const sampleAddresses = [
    'Ấp 1, Xã Đốc Binh Kiều, Tháp Mười',
    'Ấp 2, Xã Đốc Binh Kiều, Tháp Mười',
    'Ấp 3, Xã Đốc Binh Kiều, Tháp Mười',
    'Ấp 4, Xã Đốc Binh Kiều, Tháp Mười',
    'Ấp 1, Xã Tân Kiều, Tháp Mười',
    'Ấp 2, Xã Tân Kiều, Tháp Mười',
    'Ấp 3, Xã Tân Kiều, Tháp Mười',
    'Ấp Mỹ Thạnh, Xã Đốc Binh Kiều',
    'Ấp An Thái, Xã Tân Kiều, Tháp Mười',
    'Khóm 2, Thị trấn Mỹ An, Tháp Mười'
  ];

  const studentFirstNames = ['Nguyễn Văn', 'Trần Thị', 'Lê Hoàng', 'Phạm Quốc', 'Đặng Mỹ', 'Võ Hoài', 'Bùi Thanh', 'Huỳnh Ngọc', 'Mai Anh', 'Đỗ Gia'];
  const studentLastNames = ['An', 'Bình', 'Châu', 'Dũng', 'Em', 'Giang', 'Hậu', 'Khoa', 'Linh', 'Nghĩa', 'Phúc', 'Tâm', 'Vinh', 'Xuân', 'Tài', 'Thịnh'];

  const submissions: ReportSubmission[] = [];
  const baseTime = new Date('2026-09-01T08:00:00Z');

  HOMEROOM_ROSTER_53.forEach((hr, index) => {
    const user = allUsers.find(u => u.name.trim().toLowerCase() === hr.teacherName.trim().toLowerCase()) 
      || allUsers.find(u => u.homeroomClass === hr.className);

    const submitTime = new Date(baseTime.getTime() + (index * 12 * 60 * 1000)).toISOString();
    const totalStudents = hr.studentCount || 40;
    const maleStudents = Math.round(totalStudents * (0.46 + (index % 5) * 0.02));
    const femaleStudents = totalStudents - maleStudents;

    let customTables: CustomDynamicTable[] = [];
    let customFields: CustomFormField[] = [];
    let customFieldValues: Record<string, any> = {};
    let homeroomMinutes: HomeroomMeetingMinutesData | undefined = undefined;
    let reportContent = '';

    if (isPoorStudentTopic) {
      // 1. MẪU BÁO CÁO HỌC SINH NGHÈO / CẬN NGHÈO
      const poorCount = (index % 5 === 0) ? 2 : ((index % 3 === 0) ? 3 : 4);
      const poorStudentRows: Record<string, string>[] = [];

      for (let p = 0; p < poorCount; p++) {
        const sIdx = (index * 3 + p + 1);
        const sName = `${studentFirstNames[sIdx % studentFirstNames.length]} ${studentLastNames[(sIdx * 2) % studentLastNames.length]}`;
        const isPoor = (p % 2 === 0);
        poorStudentRows.push({
          'STT': String(p + 1),
          'Họ và tên học sinh': sName,
          'Ngày sinh': `${10 + (sIdx % 18)}/0${(sIdx % 9) + 1}/20${hr.grade > 9 ? '09' : '12'}`,
          'Giới tính': p % 2 === 0 ? 'Nam' : 'Nữ',
          'Diện đối tượng': isPoor ? 'Hộ nghèo' : 'Hộ cận nghèo',
          'Mã số sổ / CCCD': `HN-${hr.className}-${100 + sIdx}`,
          'Địa chỉ cư trú': sampleAddresses[(index + p) % sampleAddresses.length],
          'Đề xuất hỗ trợ': isPoor ? 'Học bổng vượt khó + Miễn BHYT' : 'Hỗ trợ tập vở và gạo đầu năm'
        });
      }

      customTables = [{
        id: 'table-poor-students',
        title: 'Danh sách học sinh thuộc hộ nghèo, cận nghèo',
        headers: ['Họ và tên học sinh', 'Ngày sinh', 'Giới tính', 'Diện đối tượng', 'Mã số sổ / CCCD', 'Địa chỉ cư trú', 'Đề xuất hỗ trợ'],
        rows: poorStudentRows
      }];

      customFields = [
        { id: 'f_tong_ngheo', label: 'Tổng số học sinh nghèo', type: 'number' },
        { id: 'f_tong_can_ngheo', label: 'Tổng số học sinh cận nghèo', type: 'number' },
        { id: 'f_hoan_canh_dac_biet', label: 'Học sinh mồ côi / đặc biệt khó khăn', type: 'number' }
      ];

      customFieldValues = {
        'f_tong_ngheo': Math.ceil(poorCount / 2),
        'f_tong_can_ngheo': Math.floor(poorCount / 2),
        'f_hoan_canh_dac_biet': index % 4 === 0 ? 1 : 0
      };

      reportContent = `Kính gửi Ban Giám Hiệu,\n\nLớp ${hr.className} đã tiến hành rà soát hoàn cảnh kinh tế gia đình học sinh đầu năm học. Lớp có tổng cộng ${poorCount} học sinh thuộc diện hộ nghèo và cận nghèo.\nĐề xuất nhà trường và Hội Khuyến học quan tâm hỗ trợ các em để các em an tâm đến trường.`;

    } else if (isDropoutTopic) {
      // 2. MẪU BÁO CÁO HỌC SINH NGHỈ / BỎ HỌC
      const dropoutCount = (index % 4 === 0) ? 0 : ((index % 3 === 0) ? 2 : 1);
      const dropoutRows: Record<string, string>[] = [];

      const reasons = [
        'Theo cha mẹ đi làm ăn xa tại TP.HCM/Bình Dương',
        'Gia đình khó khăn, phụ giúp kinh tế gia đình',
        'Học lực yếu, chán học, ham chơi điện tử',
        'Bệnh nặng đang điều trị dài ngày tại bệnh viện',
        'Có ý định chuyển về quê ngoại sinh sống'
      ];

      for (let d = 0; d < dropoutCount; d++) {
        const sIdx = (index * 2 + d + 1);
        const sName = `${studentFirstNames[sIdx % studentFirstNames.length]} ${studentLastNames[(sIdx * 3) % studentLastNames.length]}`;
        dropoutRows.push({
          'STT': String(d + 1),
          'Họ và tên học sinh': sName,
          'Ngày sinh': `15/0${(d % 8) + 1}/20${hr.grade > 9 ? '09' : '12'}`,
          'Ngày bắt đầu nghỉ': `0${d + 2}/09/2026`,
          'Lý do nghỉ / bỏ học': reasons[(index + d) % reasons.length],
          'Số lần GVCN đến nhà vận động': `${d + 1} lần`,
          'Kết quả vận động': d === 0 ? 'Phụ huynh hứa tuần sau đưa em trở lại lớp' : 'Gia đình chưa đồng ý, đang nhờ Trưởng ấp phối hợp',
          'Đề xuất phối hợp': 'Nhờ Đoàn Thanh niên & Ban đại diện CMHS cùng đến vận động'
        });
      }

      customTables = [{
        id: 'table-dropout-students',
        title: 'Danh sách học sinh nghỉ học, có nguy cơ bỏ học',
        headers: ['Họ và tên học sinh', 'Ngày sinh', 'Ngày bắt đầu nghỉ', 'Lý do nghỉ / bỏ học', 'Số lần GVCN đến nhà vận động', 'Kết quả vận động', 'Đề xuất phối hợp'],
        rows: dropoutRows
      }];

      customFields = [
        { id: 'f_so_hs_nghi', label: 'Số học sinh đang nghỉ học', type: 'number' },
        { id: 'f_so_hs_da_van_dong', label: 'Số em đã vận động thành công', type: 'number' }
      ];

      customFieldValues = {
        'f_so_hs_nghi': dropoutCount,
        'f_so_hs_da_van_dong': dropoutCount > 0 ? 1 : 0
      };

      reportContent = `Kính gửi Ban Giám Hiệu,\n\nBáo cáo tình hình học sinh nghỉ, có nguy cơ bỏ học lớp ${hr.className}. Hiện tại lớp có ${dropoutCount} trường hợp cần lưu ý theo dõi. GVCN đang tích cực phối hợp với gia đình và địa phương để duy trì sĩ số.`;

    } else if (isInsuranceTopic) {
      // 3. MẪU BÁO CÁO BẢO HIỂM Y TẾ (BHYT)
      const insuredCount = totalStudents - (index % 4);
      const sampleRows: Record<string, string>[] = [
        {
          'Họ và tên học sinh': `Nguyễn Văn Học Sinh 1 (${hr.className})`,
          'Mã định danh cá nhân': `08720${hr.grade}001234`,
          'Thời hạn tham gia': '12 tháng',
          'Số tiền đóng': '972,000 VNĐ',
          'Tình trạng thẻ': 'Đã cấp thẻ mới'
        },
        {
          'Họ và tên học sinh': `Trần Thị Học Sinh 2 (${hr.className})`,
          'Mã định danh cá nhân': `08720${hr.grade}005678`,
          'Thời hạn tham gia': '12 tháng',
          'Số tiền đóng': '972,000 VNĐ',
          'Tình trạng thẻ': 'Gia hạn thẻ cũ'
        }
      ];

      customTables = [{
        id: 'table-insurance',
        title: 'Danh sách học sinh tham gia BHYT',
        headers: ['Họ và tên học sinh', 'Mã định danh cá nhân', 'Thời hạn tham gia', 'Số tiền đóng', 'Tình trạng thẻ'],
        rows: sampleRows
      }];

      customFields = [
        { id: 'f_bhyt_da_mua', label: 'Số học sinh đã mua BHYT', type: 'number' },
        { id: 'f_bhyt_chua_mua', label: 'Số học sinh chưa mua BHYT', type: 'number' }
      ];

      customFieldValues = {
        'f_bhyt_da_mua': insuredCount,
        'f_bhyt_chua_mua': totalStudents - insuredCount
      };

      reportContent = `Báo cáo tiến độ thu nộp BHYT học sinh lớp ${hr.className}. Tỷ lệ tham gia đạt ${(insuredCount / totalStudents * 100).toFixed(1)}%.`;

    } else if (targetPeriod?.formTemplate?.tables && targetPeriod.formTemplate.tables.length > 0) {
      // 4. MẪU TÙY BIẾN THEO ĐÚNG TEMPLATE BGH TẠO RA
      customTables = targetPeriod.formTemplate.tables.map(tbl => {
        const rows: Record<string, string>[] = [];
        const rowCount = 2 + (index % 3);
        for (let r = 0; r < rowCount; r++) {
          const rowObj: Record<string, string> = {};
          tbl.headers.forEach((h, hIdx) => {
            if (h.toLowerCase().includes('họ') || h.toLowerCase().includes('tên')) {
              rowObj[h] = `${studentFirstNames[(index + r) % studentFirstNames.length]} ${studentLastNames[(index * 2 + r) % studentLastNames.length]}`;
            } else if (h.toLowerCase().includes('ngày') || h.toLowerCase().includes('sinh')) {
              rowObj[h] = `1${r + 2}/0${(r % 8) + 1}/20${hr.grade > 9 ? '09' : '12'}`;
            } else if (h.toLowerCase().includes('địa chỉ') || h.toLowerCase().includes('nơi ở')) {
              rowObj[h] = sampleAddresses[(index + r) % sampleAddresses.length];
            } else if (h.toLowerCase().includes('ghi chú') || h.toLowerCase().includes('đề xuất')) {
              rowObj[h] = 'Đề xuất nhà trường xem xét phê duyệt';
            } else {
              rowObj[h] = `Dữ liệu ${hr.className} - Mục ${hIdx + 1}`;
            }
          });
          rows.push(rowObj);
        }
        return {
          id: tbl.id,
          title: tbl.title,
          headers: tbl.headers,
          rows
        };
      });

      if (targetPeriod.formTemplate.fields) {
        customFields = targetPeriod.formTemplate.fields;
        targetPeriod.formTemplate.fields.forEach(f => {
          if (f.type === 'number') {
            customFieldValues[f.id] = 10 + (index % 20);
          } else {
            customFieldValues[f.id] = `Nội dung lớp ${hr.className}`;
          }
        });
      }

      reportContent = `Kính gửi BGH,\nLớp ${hr.className} báo cáo số liệu theo biểu mẫu đợt: ${targetPeriod.title}.`;

    } else {
      // 5. MẪU BIÊN BẢN TẬP TRUNG HỌC SINH ĐẦU NĂM (MẶC ĐỊNH)
      const absentCount = (index % 4 === 0) ? 0 : ((index % 3 === 0) ? 2 : 1);
      const absentStudentsList: AbsentStudentItem[] = [];

      for (let a = 0; a < absentCount; a++) {
        const studentIdx = (index * 2 + a + 1);
        const sName = `${studentFirstNames[(studentIdx) % studentFirstNames.length]} ${studentLastNames[(studentIdx * 3) % studentLastNames.length]}`;

        absentStudentsList.push({
          id: `absent-${hr.className}-${a + 1}`,
          studentName: sName,
          previousClass: `${hr.grade > 6 ? hr.grade - 1 : 5}${hr.className.replace(/[0-9]/g, '') || 'A1'}`,
          currentAddress: sampleAddresses[(index + a) % sampleAddresses.length],
          studentPhone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
          parentPhone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
          reason: 'Gia đình đi làm ăn xa chưa về kịp'
        });
      }

      homeroomMinutes = {
        academicYear: '2026 – 2027',
        timeHour: '07',
        timeMinute: '30',
        meetingDate: '28',
        meetingMonth: '8',
        meetingYear: '2026',
        roomNumber: `Phòng ${index + 1}`,
        teacherName: hr.teacherName,
        className: hr.className,
        totalStudents,
        maleStudents,
        femaleStudents,
        absentCount: absentStudentsList.length,
        absentStudents: absentStudentsList,
        talents: [],
        cadres: [
          {
            id: `cadre-${hr.className}-1`,
            role: 'Lớp trưởng',
            studentName: `Nguyễn Lớp Trưởng ${hr.className}`,
            academicPerf: 'Tốt',
            conductPerf: 'Tốt',
            phone: '0988776655'
          }
        ],
        additionalNotes: 'Lớp ổn định nề nếp tốt, học sinh chấp hành nghiêm chỉnh nội quy.'
      };

      reportContent = `Biên bản tập trung học sinh lớp ${hr.className}. Tổng sĩ số: ${totalStudents}, hiện diện: ${totalStudents - absentCount}.`;
    }

    submissions.push({
      id: `sim-sub-53-${periodId}-${index + 1}`,
      periodId: periodId,
      periodTitle: targetPeriod?.title || periodTitle,
      authorId: user?.id || `staff-hr-${index + 1}`,
      authorName: hr.teacherName,
      authorEmail: user?.email || `gvcn.${hr.className.toLowerCase()}@docbinhkieu.edu.vn`,
      authorRole: 'teacher',
      authorRoleTitle: `GVCN Lớp ${hr.className}`,
      departmentId: user?.departmentId || 'toan',
      departmentName: user?.departmentName || 'Tổ Giáo viên Chủ nhiệm',
      isHomeroomReport: true,
      homeroomClass: hr.className,
      homeroomStudentCount: totalStudents,
      homeroomCampus: hr.campus,
      title: `${targetPeriod?.title || periodTitle} - Lớp ${hr.className} - ${hr.teacherName}`,
      content: reportContent,
      structuredData: {
        homeroomMinutes,
        customTables: customTables.length > 0 ? customTables : undefined,
        customFields: customFields.length > 0 ? customFields : undefined,
        customFieldValues: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined
      },
      attachments: [],
      status: 'principal_approved',
      submittedAt: submitTime,
      updatedAt: submitTime,
      isLate: false,
      reviewHistory: [],
      version: 1
    });
  });

  return submissions;
}

/**
 * Sinh bộ dữ liệu báo cáo mẫu cho 19 Thầy/Cô Tổ trưởng & Tổ phó chuyên môn
 * Phục vụ kiểm tra, thẩm định bảng tổng hợp và thử nghiệm luồng báo cáo chuyên môn
 */
export function generateSample19DeptHeadSubmissions(
  periodId: string,
  periodTitle: string,
  allUsers: User[]
): ReportSubmission[] {
  const submissions: ReportSubmission[] = [];
  const baseTime = new Date('2026-09-02T08:30:00Z');

  SPECIALIZED_DEPT_HEADS_19.forEach((dh, index) => {
    const user = allUsers.find(u => u.name.trim().toLowerCase() === dh.name.trim().toLowerCase()) 
      || allUsers.find(u => u.id === dh.id);

    const submitTime = new Date(baseTime.getTime() + (index * 25 * 60 * 1000)).toISOString();
    const isPho = dh.roleTitle.toLowerCase().includes('tổ phó');
    const roleName = isPho ? 'Tổ phó' : 'Tổ trưởng';

    // Tạo tiêu đề báo cáo thực tế
    const reportTitle = `${roleName} báo cáo: ${periodTitle || 'Hoạt động chuyên môn và nền nếp giảng dạy'} - ${dh.departmentName}`;

    // Bảng dữ liệu thao giảng / dự giờ mẫu
    const demoTable: CustomDynamicTable = {
      id: `table-thao-giang-${dh.orderNo}`,
      title: `Thống kê thao giảng và sinh hoạt chuyên môn - ${dh.departmentName}`,
      headers: ['STT', 'Giáo viên thực hiện', 'Môn / Phân môn', 'Nội dung bài dạy / Chuyên đề', 'Cơ sở / Điểm trường', 'Xếp loại'],
      rows: [
        {
          'STT': '1',
          'Giáo viên thực hiện': dh.name,
          'Môn / Phân môn': dh.subject || 'Chuyên môn',
          'Nội dung bài dạy / Chuyên đề': `Đổi mới PPDH và ứng dụng CNTT môn ${dh.subject || 'chuyên môn'}`,
          'Cơ sở / Điểm trường': dh.originalSchool || 'Điểm trường chính',
          'Xếp loại': 'Tốt'
        },
        {
          'STT': '2',
          'Giáo viên thực hiện': `Giáo viên ${dh.subject || 'bộ môn'}`,
          'Môn / Phân môn': dh.subject || 'Chuyên môn',
          'Nội dung bài dạy / Chuyên đề': 'Dạy học theo định hướng phát triển phẩm chất, năng lực HS',
          'Cơ sở / Điểm trường': dh.originalSchool === 'THCSTK' ? 'Điểm THCS Tân Kiều' : 'Điểm THCS Đốc Binh Kiều',
          'Xếp loại': 'Tốt'
        }
      ]
    };

    // Trường chỉ số mẫu
    const demoFields: CustomFormField[] = [
      { id: 'so_tiet_thao_giang', label: 'Số tiết thao giảng / dự giờ đã tổ chức', type: 'number', required: false },
      { id: 'so_gv_kiem_tra_giao_an', label: 'Số giáo viên được kiểm tra hồ sơ giáo án', type: 'number', required: false },
      { id: 'ty_le_ho_so_tot', label: 'Tỷ lệ hồ sơ giáo án xếp loại Tốt (%)', type: 'number', required: false },
      { id: 'kien_nghi_chuyen_mon', label: 'Đề xuất & kiến nghị của Tổ với Ban Giám Hiệu', type: 'textarea', required: false }
    ];

    const demoFieldValues: Record<string, any> = {
      'so_tiet_thao_giang': (index % 3) + 2,
      'so_gv_kiem_tra_giao_an': Math.floor((dh.orderNo % 5) + 3),
      'ty_le_ho_so_tot': 90 + (index % 10),
      'kien_nghi_chuyen_mon': `Đề nghị BGH tiếp tục trang bị thêm máy chiếu, tivi thông minh tại các phòng học bộ môn của ${dh.originalSchool}; cung cấp thêm thiết bị thực hành thí nghiệm.`
    };

    const content = `
Kính gửi: Ban Giám Hiệu Trường THCS & THPT Đốc Binh Kiều

Tổ chuyên môn: ${dh.departmentName}
Người báo cáo: ${dh.name} - Chức vụ: ${dh.roleTitle} (Đơn vị trước sáp nhập: ${dh.originalSchool})

1. TÌNH HÌNH THỰC HIỆN KẾ HOẠCH DẠY HỌC:
- Toàn bộ giáo viên trong tổ bộ môn đã thực hiện nghiêm túc tiến độ phân phối chương trình môn học theo quy định GDPT 2018.
- 100% giáo viên đã hoàn thành soạn giảng kế hoạch bài dạy (giáo án) trên hệ thống điện tử và nộp kiểm tra đúng quy định.
- Tinh thần đoàn kết, hỗ trợ chuyên môn liên cấp giữa các cơ sở (THPT Đốc Binh Kiều, THCS Đốc Binh Kiều và THCS Tân Kiều) được duy trì rất tốt.

2. CÔNG TÁC THAO GIẢNG, DỰ GIỜ VÀ SINH HOẠT CHUYÊN MÔN THEO NGHIÊN CỨU BÀI HỌC:
- Trong đợt đã tổ chức được ${(index % 3) + 2} tiết thao giảng cấp tổ tại các cơ sở, tập trung đổi mới phương pháp dạy học, tăng cường tương tác và hoạt động nhóm của học sinh.
- Các buổi sinh hoạt chuyên môn tập trung tháo gỡ khó khăn về nội dung bài khó, xây dựng ngân hàng câu hỏi ma trận đề kiểm tra đánh giá định kỳ.

3. KIỂM TRA HỒ SƠ CHUYÊN MÔN VÀ NỀN NẾP:
- Đã tiến hành kiểm tra hồ sơ giáo án của ${Math.floor((dh.orderNo % 5) + 3)} đồng chí giáo viên trong tổ; kết quả ${90 + (index % 10)}% đạt loại Tốt, không có hồ sơ xếp loại Trung bình.
- Các tổ viên thực hiện nghiêm túc việc ghi chép sổ điểm, nhật ký giảng dạy và theo dõi học sinh yếu kém.

4. KIẾN NGHỊ VÀ ĐỀ XUẤT VỚI BAN GIÁM HIỆU:
- Đề nghị BGH tiếp tục hỗ trợ thiết bị dạy học số và bảo trì đường truyền mạng Internet tại điểm trường ${dh.originalSchool}.
- Tạo điều kiện cho giáo viên trẻ của tổ tham gia các lớp tập huấn bồi dưỡng chuyên sâu do Sở GD&ĐT tổ chức.
`.trim();

    submissions.push({
      id: `sub-depthead-${dh.orderNo}-${periodId}`,
      periodId,
      periodTitle,
      authorId: user?.id || dh.id,
      authorName: dh.name,
      authorEmail: user?.email || `${dh.id}@thpt-thpt-tk-dbk.edu.vn`,
      authorRole: (user?.role || 'dept_head'),
      authorRoleTitle: dh.roleTitle,
      departmentId: dh.departmentId,
      departmentName: dh.departmentName,
      title: reportTitle,
      content,
      submittedAt: submitTime,
      updatedAt: submitTime,
      status: 'submitted',
      isLate: false,
      reviewHistory: [],
      version: 1,
      attachments: [],
      structuredData: {
        customTables: [demoTable],
        customFields: demoFields,
        customFieldValues: demoFieldValues,
        customNotes: `Báo cáo chính thức của ${dh.roleTitle} ${dh.name} (${dh.departmentName})`
      }
    });
  });

  return submissions;
}

/**
 * Tạo báo cáo tóm tắt điều hành dành cho Ban Giám Hiệu
 */
export function generateConsolidatedExecutiveSummary(data: PeriodConsolidationResult): string {
  const {
    periodTitle,
    totalHomeroomClasses,
    submittedCount,
    completionRate,
    primaryTable,
    dynamicTables,
    fieldMatrix,
    totalEnrolledStudents,
    totalPresentStudents,
    totalAbsentStudents,
    overallAttendanceRate,
    absentStudents
  } = data;

  let tableSummaries = '';
  if (dynamicTables.length > 0) {
    tableSummaries = dynamicTables.map(t => {
      return `  - ${t.title}: Tổng cộng ${t.totalRows} bản ghi được thu thập từ ${t.classesCount} lớp.`;
    }).join('\n');
  }

  let fieldSummaries = '';
  if (fieldMatrix.columns.length > 0) {
    fieldSummaries = fieldMatrix.columns.map(c => {
      if (c.type === 'number' && fieldMatrix.numericTotals[c.id] !== undefined) {
        return `  - ${c.label}: Tổng toàn trường = ${fieldMatrix.numericTotals[c.id].toLocaleString('vi-VN')}`;
      }
      return `  - ${c.label}: Đã ghi nhận đầy đủ phản hồi của các lớp.`;
    }).join('\n');
  }

  return `
BÁO CÁO TỔNG HỢP VÀ ĐIỀU HÀNH DÀNH CHO BAN GIÁM HIỆU
Nội dung đợt: ${periodTitle}
Trường THCS & THPT Đốc Binh Kiều - Năm học 2026 - 2027
--------------------------------------------------------------------------------

1. TIẾN ĐỘ THỰC HIỆN TOÀN TRƯỜNG:
- Số lớp / giáo viên đã nộp báo cáo: ${submittedCount} / ${totalHomeroomClasses} lớp (Đạt tỷ lệ ${completionRate}%).
- Tình trạng: ${completionRate === 100 ? 'Toàn bộ 53 lớp đã hoàn thành báo cáo đầy đủ, đúng tiến độ.' : `Còn ${totalHomeroomClasses - submittedCount} lớp đang trong quá trình tổng hợp.`}

2. TỔNG HỢP SỐ LIỆU TỪ CÁC BẢNG NỘI DUNG CHI TIẾT:
${tableSummaries || '  - Không có bảng dữ liệu đặc biệt.'}

${fieldSummaries ? `3. TỔNG HỢP CHỈ SỐ THEO BIỂU MẪU:\n${fieldSummaries}\n` : ''}
4. NHẬN XÉT & ĐỀ XUẤT ĐIỀU HÀNH CỦA BAN GIÁM HIỆU:
- Tiếp tục chỉ đạo các bộ phận chuyên môn khai thác số liệu chi tiết đã được tổng hợp để phục vụ công tác quản lý, phân loại học sinh và báo cáo Sở GD&ĐT.
- Đối với các trường hợp cần hỗ trợ khẩn cấp (học sinh nghèo, học sinh có nguy cơ bỏ học), GVCN phối hợp chặt chẽ với Đoàn trường và Ban đại diện CMHS để xử lý dứt điểm.
`.trim();
}
