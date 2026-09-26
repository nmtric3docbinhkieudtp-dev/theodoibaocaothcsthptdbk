import { 
  ReportPeriod, 
  ReportSubmission, 
  User, 
  HomeroomMeetingMinutesData, 
  DepartmentMeetingMinutesData,
  AbsentStudentItem, 
  TalentAchievementItem, 
  ClassCadreItem,
  CustomFormField,
  CustomDynamicTable
} from '../types';
import { HOMEROOM_ROSTER_53, SPECIALIZED_DEPT_HEADS_19, OFFICIAL_DEPARTMENTS } from '../data/staffRoster';

export { OFFICIAL_DEPARTMENTS };

export interface ConsolidatedDeptMeeting {
  stt: number;
  departmentId: string;
  departmentName: string;
  teacherName: string;
  roleTitle?: string;
  hasSubmitted: boolean;
  submittedAt: string | null;
  submissionId: string | null;
  minutes: DepartmentMeetingMinutesData | null;
  reportContent?: string;
  submission?: ReportSubmission | null;
}

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

export interface FormQuestionRespondent {
  authorName: string;
  unit: string;
  submittedAt?: string;
  value?: any;
}

export interface FormQuestionOptionStat {
  option: string;
  count: number;
  percentage: number;
  respondents: FormQuestionRespondent[];
}

export interface FormQuestionScaleStats {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  average: number;
  levels: Array<{ level: number; count: number; percentage: number; respondents: FormQuestionRespondent[] }>;
}

export interface FormQuestionNumberStats {
  sum: number;
  average: number;
  max: number;
  min: number;
  entries: Array<{ authorName: string; unit: string; value: number }>;
}

export interface FormQuestionTextEntry {
  authorName: string;
  unit: string;
  value: string;
  submittedAt?: string;
}

export interface FormQuestionBreakdown {
  field: CustomFormField;
  questionNumber: number; // 1-based (ignoring sections)
  totalAnswered: number;
  totalExpected: number;
  responseRate: number;
  optionStats?: FormQuestionOptionStat[];
  singleCheckboxStat?: {
    checkedCount: number;
    percentage: number;
    respondents: FormQuestionRespondent[];
  };
  scaleStats?: FormQuestionScaleStats;
  numberStats?: FormQuestionNumberStats;
  textEntries?: FormQuestionTextEntry[];
  generalEntries?: FormQuestionRespondent[];
}

export interface PeriodConsolidationResult {
  period: ReportPeriod | null;
  periodTitle: string;
  targetAudienceLabel: string;
  totalHomeroomClasses: number;
  totalTargetCount: number;
  submittedCount: number;
  pendingCount: number;
  completionRate: number;

  // Primary dynamic table & all dynamic tables
  primaryTable: ConsolidatedDynamicTable | null;
  dynamicTables: ConsolidatedDynamicTable[];
  totalDynamicRows: number;

  // Dynamic field matrix
  fieldMatrix: ConsolidatedFieldMatrix;

  // Question-by-question breakdown structured by form fields/sections
  questionsBreakdown: FormQuestionBreakdown[];

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

  // Specialized Department Meeting Minutes (Họp tổ chuyên môn)
  isDeptMeetingAudience: boolean;
  deptMeetingMinutesList: ConsolidatedDeptMeeting[];
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
 * Kiểm tra xem một dòng dữ liệu trong bảng báo cáo có thực sự được nhập nội dung hay không.
 * Giúp loại bỏ:
 * - Dòng chỉ có số thứ tự (TT / STT)
 * - Dòng chỉ có tên mục/cuộc thi mặc định của biểu mẫu nhưng các cột kết quả (họ tên học sinh, giải thưởng, v.v.) bị bỏ trống
 * - Dòng rỗng hoàn toàn hoặc chỉ chứa khoảng trắng, dấu gạch ngang '-', dấu chấm lửng '...'
 */
export function isMeaningfulTableRow(row: Record<string, any>, headers: string[]): boolean {
  if (!row || typeof row !== 'object') return false;

  const isNonEmptyText = (val: any): boolean => {
    if (val === null || val === undefined) return false;
    const str = String(val).trim();
    if (str === '' || str === '-' || str === '--' || str === '.' || str === '...' || str === '---') return false;
    return true;
  };

  // Cột chỉ là chỉ số thứ tự
  const indexColumnRegex = /^(tt|stt|số\s*thứ\s*tự|thứ\s*tự)$/i;
  const contentHeaders = headers.filter(h => !indexColumnRegex.test(h.trim()));

  if (contentHeaders.length === 0) {
    return Object.entries(row).some(([k, v]) => !indexColumnRegex.test(k.trim()) && isNonEmptyText(v));
  }

  // Nhận diện cột danh mục/hội thi có sẵn của biểu mẫu (ví dụ: "Cuộc thi", "Phong trào", "Danh mục")
  const categoryHeader = contentHeaders.find(h => 
    /^(cuộc\s*thi|hội\s*thi|phong\s*trào|hạng\s*mục|danh\s*mục|nội\s*dung\s*thi)$/i.test(h.trim())
  );
  const nonCategoryHeaders = categoryHeader 
    ? contentHeaders.filter(h => h !== categoryHeader)
    : contentHeaders;

  // Nếu bảng có cột danh mục mẫu (như "Cuộc thi") và có các cột kết quả (như "Đạt giải", "Họ tên học sinh đạt giải")
  // thì bắt buộc ít nhất 1 cột kết quả phải có dữ liệu thực tế được điền vào!
  if (categoryHeader && nonCategoryHeaders.length > 0) {
    return nonCategoryHeaders.some(h => isNonEmptyText(row[h]));
  }

  // Bảng học sinh chưa ra lớp: bắt buộc phải có tên học sinh
  const nameHeader = contentHeaders.find(h => /(họ\s*v[àa]\s*tên|họ\s*tên|tên\s*học\s*sinh|tên)/i.test(h.trim()));
  if (nameHeader) {
    return isNonEmptyText(row[nameHeader]);
  }

  // Các bảng khác: chỉ cần ít nhất 1 cột nội dung có dữ liệu
  return contentHeaders.some(h => isNonEmptyText(row[h]));
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
  // Ưu tiên bài đã nộp chính thức (non-draft) lên trước và bài có thời gian mới nhất lên trước
  const periodSubs = (period 
    ? submissions.filter(s => s.periodId === period.id) 
    : [...submissions]
  ).sort((a, b) => {
    if (a.status !== 'draft' && b.status === 'draft') return -1;
    if (a.status === 'draft' && b.status !== 'draft') return 1;
    const timeA = new Date(a.submittedAt || a.updatedAt || 0).getTime();
    const timeB = new Date(b.submittedAt || b.updatedAt || 0).getTime();
    return timeB - timeA;
  });

  const periodTitle = period?.title || 'Báo Cáo Tổng Hợp Toàn Trường';
  const targetAudienceLabel = period?.targetAudience === 'homeroom_teachers' 
    ? '53 Giáo viên chủ nhiệm' 
    : period?.targetAudience === 'dept_heads_only'
    ? 'Tổ trưởng chuyên môn'
    : 'Cán bộ, Giáo viên, Nhân viên';

  // Map submissions theo lớp hoặc theo tác giả (bài chính thức được ưu tiên ghi trước, không bị ghi đè bởi bản nháp)
  const subByClassMap = new Map<string, ReportSubmission>();
  const subByUserMap = new Map<string, ReportSubmission>();

  periodSubs.forEach(sub => {
    if (sub.homeroomClass) {
      const cKey = sub.homeroomClass.trim().toUpperCase();
      if (!subByClassMap.has(cKey) || (subByClassMap.get(cKey)?.status === 'draft' && sub.status !== 'draft')) {
        subByClassMap.set(cKey, sub);
      }
    }
    const minutesClass = sub.structuredData?.homeroomMinutes?.className;
    if (minutesClass) {
      const mKey = minutesClass.trim().toUpperCase();
      if (!subByClassMap.has(mKey) || (subByClassMap.get(mKey)?.status === 'draft' && sub.status !== 'draft')) {
        subByClassMap.set(mKey, sub);
      }
    }
    if (!subByUserMap.has(sub.authorId) || (subByUserMap.get(sub.authorId)?.status === 'draft' && sub.status !== 'draft')) {
      subByUserMap.set(sub.authorId, sub);
    }
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
    const male = minutes?.maleStudents || 0;
    const female = minutes?.femaleStudents || 0;
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
        // Chỉ thêm dòng nếu có nội dung thực tế (bỏ qua dòng trắng, dòng chỉ có STT hoặc chỉ có tên mục mẫu)
        if (isMeaningfulTableRow(row, tbl.headers || [])) {
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
          if (isMeaningfulTableRow(row, mdTbl.headers)) {
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

  // 5. Tính toán tỷ lệ & số liệu tổng quan
  const isDeptHeadAudience = period?.targetAudience === 'dept_heads_only' || (!period?.targetAudience && periodTitle.toLowerCase().includes('tổ trưởng'));
  const isSpecificUsersAudience = period?.targetAudience === 'specific_users';
  const isHomeroomAudience = period?.targetAudience === 'homeroom_teachers' || (!period?.targetAudience && (periodTitle.toLowerCase().includes('chủ nhiệm') || periodTitle.toLowerCase().includes('53 lớp') || periodSubs.some(s => s.isHomeroomReport)));
  const targetUserIds = period?.targetUserIds || [];

  // Lấy danh sách Tổ trưởng chuyên môn
  // Ưu tiên 7 Tổ trưởng chính của 7 tổ trong trường (nếu có lọc theo tổ thì lọc theo targetDepartmentIds)
  const targetedDeptIds = period?.targetDepartmentIds && !period.targetDepartmentIds.includes('all')
    ? period.targetDepartmentIds
    : null;

  const relevantDepts = targetedDeptIds 
    ? OFFICIAL_DEPARTMENTS.filter(d => targetedDeptIds.includes(d.id))
    : OFFICIAL_DEPARTMENTS;

  const deptHeadStats: ConsolidatedDeptHeadStat[] = relevantDepts.map((dept, idx) => {
    const headUser = allUsers.find(u => u.id === dept.headUserId || u.name === dept.headUserName);
    const userSubs = periodSubs.filter(s => 
      s.authorId === dept.headUserId || 
      s.departmentId === dept.id ||
      (s.authorName && s.authorName.trim().toLowerCase() === dept.headUserName.trim().toLowerCase())
    );
    const sub = userSubs.find(s => s.status !== 'draft') || userSubs[0];
    const hasSubmitted = !!sub && sub.status !== 'draft';
    return {
      stt: idx + 1,
      orderNo: idx + 1,
      userId: dept.headUserId,
      teacherName: dept.headUserName,
      roleTitle: 'Tổ trưởng chuyên môn',
      departmentId: dept.id,
      departmentName: dept.name,
      originalSchool: headUser?.originalSchool || '',
      subject: headUser?.subject || dept.name,
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
    const userSubs = periodSubs.filter(s => 
      s.authorId === userId || 
      (u && s.authorName && s.authorName.trim().toLowerCase() === u.name.trim().toLowerCase())
    );
    const sub = userSubs.find(s => s.status !== 'draft') || userSubs[0];
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

  // Xây dựng ma trận các trường dữ liệu tùy theo đối tượng của đợt
  let fieldRows: ConsolidatedFieldRow[] = [];

  if (isDeptHeadAudience) {
    // Đợt dành cho Tổ trưởng (ví dụ: 7 tổ trưởng khảo sát an toàn giao thông)
    fieldRows = deptHeadStats.map((dh, idx) => {
      const userSubs = periodSubs.filter(s => 
        s.authorId === dh.userId || 
        s.departmentId === dh.departmentId ||
        (s.authorName && s.authorName.trim().toLowerCase() === dh.teacherName.trim().toLowerCase())
      );
      const sub = userSubs.find(s => s.status !== 'draft') || userSubs[0];
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
        className: dh.departmentName,
        campus: dh.originalSchool || 'Toàn trường',
        grade: 0,
        authorName: dh.teacherName,
        departmentName: dh.departmentName,
        submittedAt: sub?.submittedAt || null,
        values,
        hasSubmitted
      };
    });
  } else if (isSpecificUsersAudience) {
    // Đợt chỉ định đích danh từng Thầy Cô
    fieldRows = specificUserStats.map((sp, idx) => {
      const userSubs = periodSubs.filter(s => 
        s.authorId === sp.userId || 
        (s.authorName && s.authorName.trim().toLowerCase() === sp.teacherName.trim().toLowerCase())
      );
      const sub = userSubs.find(s => s.status !== 'draft') || userSubs[0];
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
        className: sp.departmentName || 'Cá nhân',
        campus: sp.originalSchool || 'Toàn trường',
        grade: 0,
        authorName: sp.teacherName,
        departmentName: sp.departmentName,
        submittedAt: sub?.submittedAt || null,
        values,
        hasSubmitted
      };
    });
  } else if (isHomeroomAudience) {
    // Đợt 53 Lớp chủ nhiệm
    fieldRows = HOMEROOM_ROSTER_53.map((hr, idx) => {
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
  } else {
    // Đợt chung toàn trường hoặc giáo viên bộ môn
    fieldRows = periodSubs.map((sub, idx) => {
      const values: Record<string, any> = {};
      fieldColumns.forEach(c => {
        const val = sub.structuredData?.customFieldValues?.[c.id];
        values[c.id] = val !== undefined && val !== null ? val : '';
        if (c.type === 'number' && typeof val === 'number') {
          numericTotals[c.id] = (numericTotals[c.id] || 0) + val;
        }
      });

      return {
        stt: idx + 1,
        className: sub.homeroomClass || sub.departmentName,
        campus: sub.homeroomCampus || 'Toàn trường',
        grade: 0,
        authorName: sub.authorName,
        departmentName: sub.departmentName,
        submittedAt: sub.submittedAt || null,
        values,
        hasSubmitted: sub.status !== 'draft'
      };
    });
  }

  const fieldMatrix: ConsolidatedFieldMatrix = {
    columns: fieldColumns,
    rows: fieldRows,
    numericTotals
  };

  const submittedClasses = classStats.filter(c => c.hasSubmitted);
  const submittedDeptHeads = deptHeadStats.filter(d => d.hasSubmitted);
  const submittedSpecificUsers = specificUserStats.filter(s => s.hasSubmitted);

  const totalTargetCount = isSpecificUsersAudience 
    ? (targetUserIds.length || 1)
    : isDeptHeadAudience 
    ? deptHeadStats.length 
    : isHomeroomAudience
    ? 53
    : Math.max(periodSubs.length, 1);

  const submittedCount = isSpecificUsersAudience
    ? submittedSpecificUsers.length
    : isDeptHeadAudience 
    ? submittedDeptHeads.length 
    : isHomeroomAudience
    ? submittedClasses.length
    : periodSubs.filter(s => s.status !== 'draft').length;

  const pendingCount = Math.max(0, totalTargetCount - submittedCount);
  const completionRate = totalTargetCount > 0 ? Math.round((submittedCount / totalTargetCount) * 100) : 0;

  const totalEnrolled = isHomeroomAudience ? submittedClasses.reduce((sum, c) => sum + c.totalStudents, 0) : 0;
  const totalMale = isHomeroomAudience ? submittedClasses.reduce((sum, c) => sum + c.maleStudents, 0) : 0;
  const totalFemale = isHomeroomAudience ? submittedClasses.reduce((sum, c) => sum + c.femaleStudents, 0) : 0;
  const totalPresent = isHomeroomAudience ? submittedClasses.reduce((sum, c) => sum + c.presentStudents, 0) : 0;
  const totalAbsent = isHomeroomAudience ? absentStudents.length : 0;
  const overallAttendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  const totalDynamicRows = dynamicTables.reduce((sum, t) => sum + t.rows.length, 0);

  // 6. XÂY DỰNG TỔNG HỢP CHI TIẾT TỪNG ĐỀ MỤC VÀ CÂU HỎI (Questions Breakdown)
  const allFormFields: CustomFormField[] = [];
  const fieldsMap = new Map<string, CustomFormField>();

  // Thu thập từ template
  if (period?.formTemplate?.fields) {
    period.formTemplate.fields.forEach(f => {
      fieldsMap.set(f.id, f);
      allFormFields.push(f);
    });
  }

  // Thu thập từ submissions nếu có thêm trường tự tạo hoặc template rỗng
  periodSubs.forEach(sub => {
    (sub.structuredData?.customFields || []).forEach((f: CustomFormField) => {
      if (!fieldsMap.has(f.id)) {
        fieldsMap.set(f.id, f);
        allFormFields.push(f);
      }
    });
  });

  const validSubs = periodSubs.filter(s => s.status !== 'draft');
  let qNumber = 0;

  const questionsBreakdown: FormQuestionBreakdown[] = allFormFields.map(field => {
    if (field.type === 'section') {
      return {
        field,
        questionNumber: 0,
        totalAnswered: 0,
        totalExpected: totalTargetCount,
        responseRate: 0
      };
    }

    qNumber++;
    const currentQNo = qNumber;

    // Lọc các câu trả lời cho trường này
    const answeredSubs = validSubs.map(s => ({
      authorName: s.authorName,
      unit: s.homeroomClass ? `Lớp ${s.homeroomClass}` : (s.departmentName || 'Cá nhân'),
      submittedAt: s.submittedAt || '',
      val: s.structuredData?.customFieldValues?.[field.id]
    })).filter(a => a.val !== undefined && a.val !== null && a.val !== '');

    const totalAnswered = answeredSubs.length;
    const responseRate = validSubs.length > 0 ? Math.round((totalAnswered / validSubs.length) * 100) : 0;

    // 1. Radio / Dropdown / Select
    if (field.type === 'radio' || field.type === 'dropdown' || field.type === 'select') {
      const baseOptions = field.options && field.options.length > 0 ? [...field.options] : [];
      // Thêm các đáp án khác nếu có
      answeredSubs.forEach(a => {
        const strVal = String(a.val).trim();
        if (strVal && !baseOptions.some(b => b.trim() === strVal)) {
          baseOptions.push(strVal);
        }
      });
      if (baseOptions.length === 0) {
        baseOptions.push('Có', 'Không');
      }

      const optionStats: FormQuestionOptionStat[] = baseOptions.map(opt => {
        const matching = answeredSubs.filter(a => String(a.val).trim() === opt.trim());
        const count = matching.length;
        const percentage = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
        return {
          option: opt,
          count,
          percentage,
          respondents: matching.map(m => ({ authorName: m.authorName, unit: m.unit, submittedAt: m.submittedAt }))
        };
      });

      return {
        field,
        questionNumber: currentQNo,
        totalAnswered,
        totalExpected: validSubs.length,
        responseRate,
        optionStats
      };
    }

    // 2. Checkbox
    if (field.type === 'checkbox') {
      if (field.options && field.options.length > 0) {
        const optionStats: FormQuestionOptionStat[] = field.options.map(opt => {
          const matching = answeredSubs.filter(a => {
            if (Array.isArray(a.val)) return a.val.map(String).some(x => x.trim() === opt.trim());
            return String(a.val).trim() === opt.trim();
          });
          const count = matching.length;
          const percentage = totalAnswered > 0 ? Math.round((count / totalAnswered) * 100) : 0;
          return {
            option: opt,
            count,
            percentage,
            respondents: matching.map(m => ({ authorName: m.authorName, unit: m.unit, submittedAt: m.submittedAt }))
          };
        });

        return {
          field,
          questionNumber: currentQNo,
          totalAnswered,
          totalExpected: validSubs.length,
          responseRate,
          optionStats
        };
      } else {
        // Single true/false checkbox
        const trueMatching = answeredSubs.filter(a => Boolean(a.val));
        const checkedCount = trueMatching.length;
        const percentage = totalAnswered > 0 ? Math.round((checkedCount / totalAnswered) * 100) : 0;

        return {
          field,
          questionNumber: currentQNo,
          totalAnswered,
          totalExpected: validSubs.length,
          responseRate,
          singleCheckboxStat: {
            checkedCount,
            percentage,
            respondents: trueMatching.map(m => ({ authorName: m.authorName, unit: m.unit, submittedAt: m.submittedAt }))
          }
        };
      }
    }

    // 3. Linear Scale (1-5)
    if (field.type === 'scale') {
      const min = field.scaleMin || 1;
      const max = field.scaleMax || 5;
      const numAnswers = answeredSubs.map(a => Number(a.val)).filter(n => !isNaN(n));
      const avg = numAnswers.length > 0
        ? Number((numAnswers.reduce((sum, v) => sum + v, 0) / numAnswers.length).toFixed(1))
        : 0;

      const levels = Array.from({ length: max - min + 1 }).map((_, idx) => {
        const levelVal = min + idx;
        const matching = answeredSubs.filter(a => Number(a.val) === levelVal);
        const count = matching.length;
        const percentage = numAnswers.length > 0 ? Math.round((count / numAnswers.length) * 100) : 0;
        return {
          level: levelVal,
          count,
          percentage,
          respondents: matching.map(m => ({ authorName: m.authorName, unit: m.unit, submittedAt: m.submittedAt }))
        };
      });

      return {
        field,
        questionNumber: currentQNo,
        totalAnswered,
        totalExpected: validSubs.length,
        responseRate,
        scaleStats: {
          min,
          max,
          minLabel: field.scaleMinLabel,
          maxLabel: field.scaleMaxLabel,
          average: avg,
          levels
        }
      };
    }

    // 4. Number
    if (field.type === 'number') {
      const numVals = answeredSubs.map(a => Number(a.val)).filter(n => !isNaN(n));
      const sum = numVals.reduce((a, b) => a + b, 0);
      const avg = numVals.length > 0 ? Number((sum / numVals.length).toFixed(1)) : 0;
      const max = numVals.length > 0 ? Math.max(...numVals) : 0;
      const min = numVals.length > 0 ? Math.min(...numVals) : 0;
      const entries = answeredSubs
        .filter(a => !isNaN(Number(a.val)))
        .map(a => ({ authorName: a.authorName, unit: a.unit, value: Number(a.val) }));

      return {
        field,
        questionNumber: currentQNo,
        totalAnswered,
        totalExpected: validSubs.length,
        responseRate,
        numberStats: {
          sum,
          average: avg,
          max,
          min,
          entries
        }
      };
    }

    // 5. Text / Textarea
    if (field.type === 'text' || field.type === 'textarea') {
      const textEntries = answeredSubs.map(a => ({
        authorName: a.authorName,
        unit: a.unit,
        value: String(a.val),
        submittedAt: a.submittedAt
      }));

      return {
        field,
        questionNumber: currentQNo,
        totalAnswered,
        totalExpected: validSubs.length,
        responseRate,
        textEntries
      };
    }

    // 6. Date / Time / File / other
    const generalEntries = answeredSubs.map(a => ({
      authorName: a.authorName,
      unit: a.unit,
      value: a.val,
      submittedAt: a.submittedAt
    }));

    return {
      field,
      questionNumber: currentQNo,
      totalAnswered,
      totalExpected: validSubs.length,
      responseRate,
      generalEntries
    };
  });

  // 7. Xử lý biên bản họp tổ chuyên môn nếu có
  const isDeptMeetingAudience = 
    (period?.title || periodTitle).toLowerCase().includes('họp tổ') ||
    (period?.title || periodTitle).toLowerCase().includes('biên bản') ||
    (period?.title || periodTitle).toLowerCase().includes('chuyên môn') ||
    period?.targetAudience === 'dept_heads_only' ||
    periodSubs.some(s => !!s.structuredData?.departmentMeetingMinutes);

  const deptMeetingMinutesList: ConsolidatedDeptMeeting[] = [];
  const processedDeptKeys = new Set<string>();

  // Duyệt qua các tổ chính thức
  OFFICIAL_DEPARTMENTS.forEach((dept, idx) => {
    const userSubs = periodSubs.filter(s => 
      s.departmentId === dept.id ||
      s.authorId === dept.headUserId ||
      (s.departmentName && s.departmentName.trim().toLowerCase() === dept.name.trim().toLowerCase()) ||
      (s.authorName && s.authorName.trim().toLowerCase() === dept.headUserName.trim().toLowerCase())
    );
    const sub = userSubs.find(s => s.status !== 'draft') || userSubs[0];
    const minutes = sub?.structuredData?.departmentMeetingMinutes || null;

    deptMeetingMinutesList.push({
      stt: idx + 1,
      departmentId: dept.id,
      departmentName: dept.name,
      teacherName: dept.headUserName,
      roleTitle: 'Tổ trưởng chuyên môn',
      hasSubmitted: !!sub && sub.status !== 'draft',
      submittedAt: sub?.submittedAt || null,
      submissionId: sub?.id || null,
      minutes,
      reportContent: sub?.content || '',
      submission: sub || null
    });

    processedDeptKeys.add(dept.id);
    processedDeptKeys.add(dept.name.toLowerCase());
  });

  // Bổ sung các submission có minutes từ các tổ khác (nếu có)
  periodSubs.forEach(s => {
    if (s.status !== 'draft') {
      const minutes = s.structuredData?.departmentMeetingMinutes;
      const dName = minutes?.departmentName || s.departmentName || '';
      const dId = s.departmentId || '';
      if (minutes && (!processedDeptKeys.has(dId) && !processedDeptKeys.has(dName.toLowerCase()))) {
        deptMeetingMinutesList.push({
          stt: deptMeetingMinutesList.length + 1,
          departmentId: dId || `dept-other-${deptMeetingMinutesList.length + 1}`,
          departmentName: dName ? (dName.toLowerCase().startsWith('tổ') ? dName : `Tổ ${dName}`) : 'Tổ Chuyên Môn',
          teacherName: minutes.chairPerson || s.authorName,
          roleTitle: s.authorRoleTitle || 'Tổ trưởng chuyên môn',
          hasSubmitted: true,
          submittedAt: s.submittedAt || null,
          submissionId: s.id,
          minutes,
          reportContent: s.content || '',
          submission: s
        });
        if (dId) processedDeptKeys.add(dId);
        if (dName) processedDeptKeys.add(dName.toLowerCase());
      }
    }
  });

  return {
    period,
    periodTitle,
    targetAudienceLabel: isSpecificUsersAudience
      ? `Chỉ định đích danh (${targetUserIds.length} Thầy/Cô)`
      : isDeptHeadAudience 
      ? `${deptHeadStats.length} Tổ trưởng chuyên môn` 
      : isHomeroomAudience
      ? '53 Giáo viên chủ nhiệm'
      : targetAudienceLabel,
    totalHomeroomClasses: 53,
    totalTargetCount,
    submittedCount,
    pendingCount,
    completionRate,
    primaryTable,
    dynamicTables,
    totalDynamicRows,
    fieldMatrix,
    questionsBreakdown,
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
    totalDeptHeads: deptHeadStats.length,
    deptHeadStats,
    isSpecificUsersAudience,
    totalSpecificUsers: targetUserIds.length,
    specificUserStats,
    isDeptMeetingAudience,
    deptMeetingMinutesList
  };
}

/**
 * Sinh dữ liệu mẫu biên bản họp tổ chuyên môn cho 7 tổ chính thức
 */
export function generateSampleDeptMeetingSubmissions(
  periodId: string,
  periodTitle: string,
  allUsers: User[],
  targetPeriod?: ReportPeriod | null
): ReportSubmission[] {
  const submissions: ReportSubmission[] = [];
  const baseTime = new Date('2026-09-17T08:00:00Z');

  const deptMeetingDetails = [
    {
      id: 'toan',
      name: 'Tổ Toán',
      head: 'Nguyễn Văn Tới',
      secretary: 'Phan Thị Mộng Thường',
      members: 15,
      location: 'Phòng họp chuyên môn số 1',
      strengths: 'Tập thể giáo viên tổ Toán chấp hành nghiêm túc quy chế chuyên môn, hoàn thành xây dựng phân phối chương trình và kế hoạch bài dạy đúng hạn; 100% giáo viên tích cực ứng dụng CNTT và phần mềm GeoGebra trong giảng dạy hình học.',
      weaknesses: 'Một số giáo viên mới nhận lớp đầu cấp cần thêm thời gian để nắm bắt năng lực học tập của học sinh sau sáp nhập.',
      causes: 'Quy mô học sinh đông, năng lực đầu vào môn Toán của học sinh lớp 6 và lớp 10 chưa đồng đều giữa các cơ sở.',
      solutions: 'Tổ chức chuyên đề phân loại học sinh ngay từ tuần thứ 3; phân công giáo viên cốt cán kèm cặp, bồi dưỡng phương pháp giảng dạy cho giáo viên trẻ.',
      tasks: '1. Hoàn thiện kế hoạch giáo dục môn Toán năm học 2026-2027 theo Chương trình GDPT 2018.\n2. Triển khai kế hoạch bồi dưỡng học sinh giỏi Toán cấp THCS và THPT.\n3. Tổ chức thao giảng cấp tổ đợt 1 vào tuần 4, chủ đề đổi mới phương pháp dạy học theo định hướng phát triển năng lực.\n4. Rà soát, phụ đạo học sinh có học lực yếu kém môn Toán.',
      opinions: '- Thầy Nguyễn Minh Trí: Đề xuất nhà trường trang bị thêm bảng phụ di động tại các phòng học cơ sở 2 để phục vụ hoạt động thảo luận nhóm.\n- Cô Phan Thị Mộng Thường: Thống nhất cấu trúc ma trận đề kiểm tra định kỳ; đề nghị tổ phân công người biên soạn ngân hàng câu hỏi dùng chung.',
      conclusion: 'Chủ trì cuộc họp kết luận: Toàn tổ biểu quyết 100% thống nhất các nội dung đã triển khai; giao Thầy Trí phụ trách đội tuyển HSG THPT, Cô Thường phụ trách đội tuyển HSG THCS; yêu cầu toàn bộ giáo viên nộp KHBD đúng thứ 6 hàng tuần.',
      recommendations: '- Đề nghị Ban Giám hiệu trang bị thêm bảng phụ và phấn không bụi cho các lớp tại điểm trường Tân Kiều.\n- Hỗ trợ kinh phí mua bản quyền phần mềm hỗ trợ vẽ hình học và soạn đề trắc nghiệm cho giáo viên tổ Toán.'
    },
    {
      id: 'ngu_van',
      name: 'Tổ Ngữ văn - Thư viện - Thiết bị',
      head: 'Tô Thị Lắm',
      secretary: 'Lê Minh Đức',
      members: 16,
      location: 'Phòng họp chuyên môn số 2',
      strengths: '100% giáo viên trong tổ tích cực hưởng ứng phong trào đổi mới phương pháp dạy học và kiểm tra đánh giá theo hướng mở, không sử dụng ngữ liệu trong SGK; duy trì nề nếp sinh hoạt chuyên môn theo nghiên cứu bài học.',
      weaknesses: 'Kỹ năng tạo lập văn bản và vốn từ ngữ của một bộ phận học sinh vùng nông thôn còn hạn chế.',
      causes: 'Học sinh ít có thói quen đọc sách tham khảo tại thư viện; tác động từ mạng xã hội làm giảm thời gian đọc sách.',
      solutions: 'Phối hợp với nhân viên thư viện tổ chức tuần lễ đọc sách và giới thiệu sách hay hàng tháng; tăng cường tiết rèn kỹ năng viết đoạn văn.',
      tasks: '1. Thực hiện nghiêm túc việc kiểm tra đánh giá định kỳ theo đúng hướng dẫn của Bộ GDĐT, triệt để tránh ngữ liệu có sẵn trong SGK.\n2. Phát động phong trào đọc sách tại thư viện trường cho cả 3 cơ sở.\n3. Thành lập đội tuyển bồi dưỡng học sinh giỏi môn Ngữ văn cấp trường.\n4. Tổ chức chuyên đề sinh hoạt cụm chuyên môn môn Ngữ văn theo Công văn 1091/HD-SGDĐT.',
      opinions: '- Thầy Lê Minh Đức: Đề xuất tổ chức câu lạc bộ "Em yêu văn học" vào chiều thứ Năm hàng tuần để tạo sân chơi bổ ích cho học sinh yêu thích môn Văn.\n- Cô Trần Thị Ngọc: Đề nghị thư viện trường cập nhật thêm các đầu sách tham khảo mới phù hợp với chương trình GDPT 2018.',
      conclusion: 'Chủ trì cuộc họp kết luận: Toàn thể giáo viên trong tổ nhất trí cao với kế hoạch nhiệm vụ năm học; yêu cầu giáo viên chấm trả bài đúng thời gian quy định và có nhận xét chi tiết để động viên học sinh.',
      recommendations: '- Kiến nghị BGH bổ sung kinh phí mua sắm thêm tài liệu tham khảo, tác phẩm văn học kinh điển cho thư viện các điểm trường.\n- Nâng cấp hệ thống âm thanh phục vụ dạy học các tiết thuyết trình văn học.'
    },
    {
      id: 'su_dia',
      name: 'Tổ Lịch sử - Địa lý - GDCD - GDKTPL',
      head: 'Lê Hồng Thúy',
      secretary: 'Trần Thị Thu Ba',
      members: 14,
      location: 'Phòng họp chuyên môn số 3',
      strengths: 'Giáo viên trong tổ có tinh thần đoàn kết, trách nhiệm cao; nhiều giáo viên đạt danh hiệu giáo viên dạy giỏi cấp cơ sở; tích cực đổi mới phương pháp sử dụng bản đồ tư duy và tranh ảnh lịch sử.',
      weaknesses: 'Một số học sinh còn xem nhẹ các môn khoa học xã hội, dẫn đến tình trạng học lệch.',
      causes: 'Tâm lý phụ huynh và học sinh chú trọng các môn Toán, Văn, Ngoại ngữ để xét tuyển đại học.',
      solutions: 'Tổ chức các tiết học lịch sử, địa lý địa phương gắn liền với di tích Gò Tháp và khu di tích Đốc Binh Kiều để khơi gợi niềm tự hào và hứng thú học tập.',
      tasks: '1. Triển khai kế hoạch giảng dạy nội dung Giáo dục địa phương tỉnh Đồng Tháp lớp 6, 7, 8, 9, 10, 11, 12.\n2. Phối hợp Đoàn trường tổ chức hoạt động trải nghiệm thực tế về nguồn tại di tích lịch sử địa phương.\n3. Chuẩn bị chuyên đề đổi mới sinh hoạt tổ chuyên môn theo nghiên cứu bài học môn Lịch sử.',
      opinions: '- Cô Trần Thị Thu Ba: Đề xuất lồng ghép kể chuyện lịch sử trong các buổi sinh hoạt dưới cờ.\n- Thầy Phạm Văn Nam: Cần số hóa các tư liệu tranh ảnh, bản đồ để thuận tiện cho việc trình chiếu trên tivi các lớp.',
      conclusion: 'Chủ trì cuộc họp kết luận: Yêu cầu giáo viên bộ môn thực hiện nghiêm túc việc kiểm tra đánh giá thường xuyên; chuẩn bị chu đáo hồ sơ chuyên đề giáo dục địa phương.',
      recommendations: '- Đề nghị nhà trường cho phép tổ chức 01 chuyến học tập trải nghiệm thực tế tại Khu di tích Gò Tháp cho học sinh khối 10 và 11.'
    },
    {
      id: 'khtn',
      name: 'Tổ Vật lý - Hóa học - Sinh học - CN',
      head: 'Bùi Kim Huỳnh',
      secretary: 'Nguyễn Hoàng Nam',
      members: 18,
      location: 'Phòng thực hành KHTN',
      strengths: 'Tổ có đội ngũ giáo viên giàu kinh nghiệm, nhiệt tình; phòng thực hành thí nghiệm được bảo quản sạch sẽ; 100% tiết dạy có thực hành thí nghiệm đều được tổ chức đúng quy chuẩn an toàn.',
      weaknesses: 'Hóa chất thí nghiệm và một số dụng cụ thực hành bị hao hụt, hư hỏng sau thời gian dài sử dụng.',
      causes: 'Đặc thù môn học thí nghiệm nhiều, dụng cụ thủy tinh dễ vỡ trong quá trình học sinh thao tác.',
      solutions: 'Lập danh mục đề xuất thanh lý dụng cụ hư hỏng và mua sắm bổ sung hóa chất, vật tư tiêu hao đầu năm học.',
      tasks: '1. Rà soát toàn bộ trang thiết bị dạy học tối thiểu môn KHTN và các môn Lý, Hóa, Sinh cấp THPT.\n2. Xây dựng kế hoạch phụ đạo học sinh yếu kém và bồi dưỡng học sinh giỏi STEM/KHKT.\n3. Thành lập các nhóm nghiên cứu đề tài Khoa học kỹ thuật cấp trường dự thi cấp Tỉnh.',
      opinions: '- Thầy Nguyễn Hoàng Nam: Cần trang bị tủ hút hóa chất đạt chuẩn tại phòng thí nghiệm Hóa để đảm bảo an toàn cho giáo viên và học sinh.\n- Cô Võ Thị Hoa: Đề nghị hỗ trợ kinh phí vật liệu cho các nhóm học sinh làm mô hình STEM.',
      conclusion: 'Chủ trì cuộc họp kết luận: Giao các nhóm trưởng bộ môn lập danh sách vật tư cần mua sắm ngay trong tuần này; đôn đốc các nhóm hoàn thành đề cương nghiên cứu KHKT trước ngày 30/9.',
      recommendations: '- Đề nghị BGH cấp bổ sung hóa chất và mua thay thế các bộ thí nghiệm cảm biến đã hỏng.\n- Trang bị thêm bình chữa cháy mini và tủ thuốc sơ cứu tại các phòng thực hành.'
    },
    {
      id: 'ngoai_ngu_tin',
      name: 'Tổ Ngoại ngữ - Tin học',
      head: 'Lê Thị Ngọc Tuyền',
      secretary: 'Phạm Quốc Bảo',
      members: 12,
      location: 'Phòng máy vi tính số 1',
      strengths: 'Giáo viên trẻ, năng động, ứng dụng CNTT và AI rất thành thạo vào bài giảng; các tiết học tiếng Anh được tổ chức sinh động, tăng cường kỹ năng nghe - nói.',
      weaknesses: 'Phòng máy vi tính tại cơ sở Tân Kiều một số máy cấu hình cũ, thỉnh thoảng lỗi nguồn.',
      causes: 'Dàn máy vi tính đã đầu tư nhiều năm chưa được bảo dưỡng toàn diện.',
      solutions: 'Giáo viên Tin học chủ động cài đặt, bảo trì phần mềm; tận dụng máy còn tốt để ghép đôi học sinh trong tiết thực hành.',
      tasks: '1. Triển khai chương trình tiếng Anh tăng cường và chuẩn bị thành lập CLB Tiếng Anh (English Club).\n2. Tuyển chọn học sinh vào đội tuyển Tin học trẻ và HSG Tiếng Anh các cấp.\n3. Tổ chức tập huấn cho toàn trường về việc sử dụng phần mềm quản lý điểm và sổ theo dõi điện tử.',
      opinions: '- Thầy Phạm Quốc Bảo: Đề nghị BGH cho phép mở rộng băng thông mạng Internet tại phòng máy để học sinh thực hành thi tiếng Anh trên Internet (IOE).\n- Cô Nguyễn Thị Thảo: Cần trang bị thêm loa bluetooth cầm tay phục vụ bài thi nghe tiếng Anh.',
      conclusion: 'Chủ trì cuộc họp kết luận: Thống nhất các nội dung nhiệm vụ trọng tâm; phân công Thầy Bảo chịu trách nhiệm kỹ thuật phòng máy, Cô Tuyền phụ trách CLB Tiếng Anh.',
      recommendations: '- Đề nghị nhà trường nâng cấp đường truyền Internet cáp quang tại phòng máy tính Tân Kiều.\n- Trang bị 04 loa trợ giảng không dây phục vụ các tiết luyện nghe tiếng Anh.'
    },
    {
      id: 'gdtc_qpan_nghethuat',
      name: 'Tổ GDTC - QPAN - Nghệ thuật',
      head: 'Võ Văn Tuấn',
      secretary: 'Đỗ Văn Sang',
      members: 10,
      location: 'Nhà thi đấu đa năng',
      strengths: 'Đội ngũ giáo viên giàu nhiệt huyết, thể lực tốt; tổ chức hiệu quả các hoạt động rèn luyện thể chất, giáo dục quốc phòng an ninh và các phong trào văn nghệ.',
      weaknesses: 'Sân tập thể dục ngoài trời tại cơ sở 1 thiếu mái che, ảnh hưởng những ngày nắng gắt hoặc mưa.',
      causes: 'Điều kiện thời tiết đầu năm học mưa nắng thất thường.',
      solutions: 'Linh hoạt điều chỉnh giờ học thể dục vào sáng sớm hoặc cuối buổi chiều; tận dụng nhà đa năng cho các lớp học chung khi trời mưa.',
      tasks: '1. Xây dựng kế hoạch tổ chức Hội khỏe Phù Đổng cấp trường năm học 2026-2027.\n2. Thành lập và huấn luyện các đội tuyển thể thao: Điền kinh, Bóng chuyền, Cầu lông, Bóng đá mini.\n3. Chuẩn bị các tiết mục văn nghệ chào mừng Đại hội đại biểu cha mẹ học sinh và ngày Nhà giáo Việt Nam 20/11.',
      opinions: '- Thầy Đỗ Văn Sang: Đề xuất mua bổ sung bóng đá, bóng chuyền, cầu lông và vợt tập luyện cho học sinh.\n- Thầy Huỳnh Văn Hùng: Cần kẻ lại vạch sơn sân bóng chuyền và sân cầu lông trước khi bước vào giải thi đấu.',
      conclusion: 'Chủ trì cuộc họp kết luận: Nhất trí toàn bộ kế hoạch; phân công các huấn luyện viên phụ trách từng môn thể thao sẵn sàng cho Hội khỏe Phù Đổng.',
      recommendations: '- Đề xuất nhà trường mua thêm 20 quả bóng đá số 5, 20 quả bóng chuyền da và lưới mới.\n- Bố trí kinh phí sửa chữa hệ thống thoát nước sân thể dục.'
    },
    {
      id: 'van_phong',
      name: 'Tổ Hành chính - Văn phòng',
      head: 'Trần Văn Út',
      secretary: 'Nguyễn Thị Mai',
      members: 8,
      location: 'Văn phòng trường',
      strengths: 'Thực hiện tốt công tác hành chính văn thư, thủ quỹ, kế toán, y tế và bảo vệ; hoàn thành kịp thời các báo cáo tài chính, thống kê học sinh đầu năm gửi Sở GDĐT.',
      weaknesses: 'Khối lượng hồ sơ giấy tờ và thủ tục thanh quyết toán đầu năm học rất lớn.',
      causes: 'Giai đoạn đầu năm học tiếp nhận học sinh mới, cấp phát thẻ BHYT và thu chi các khoản thỏa thuận.',
      solutions: 'Tăng cường ứng dụng phần mềm dịch vụ công và thu phí không dùng tiền mặt qua tài khoản ngân hàng để giảm tải thủ tục hành chính.',
      tasks: '1. Hoàn tất việc rà soát và nộp dữ liệu BHYT học sinh cho cơ quan Bảo hiểm Xã hội huyện Tháp Mười.\n2. Phối hợp với trạm y tế xã tổ chức khám sức khỏe định kỳ cho học sinh toàn trường.\n3. Đảm bảo an ninh trật tự, an toàn giao thông trước cổng trường các cơ sở trong các giờ cao điểm.',
      opinions: '- Cô Nguyễn Thị Mai: Đề nghị các giáo viên chủ nhiệm nộp danh sách miễn giảm học phí và BHYT đúng thời hạn để bộ phận kế toán kịp tổng hợp.\n- Thầy Lê Văn Lâm (Y tế): Đề xuất trang bị thêm thuốc sơ cứu thiết yếu và bông băng tại phòng y tế cả 2 điểm trường.',
      conclusion: 'Chủ trì cuộc họp kết luận: Toàn tổ cam kết phục vụ chu đáo, chính xác, kịp thời mọi hoạt động dạy và học của nhà trường; đảm bảo công khai minh bạch tài chính.',
      recommendations: '- Đề nghị Ban Giám hiệu trang bị thêm 01 máy scan tốc độ cao để số hóa hồ sơ lưu trữ văn phòng.\n- Cấp bổ sung kinh phí mua thuốc thiết yếu cho phòng y tế học đường.'
    }
  ];

  deptMeetingDetails.forEach((dept, index) => {
    const user = allUsers.find(u => u.name.trim().toLowerCase() === dept.head.trim().toLowerCase()) 
      || allUsers.find(u => u.departmentId === dept.id);

    const submitTime = new Date(baseTime.getTime() + (index * 30 * 60 * 1000)).toISOString();

    const minutes: DepartmentMeetingMinutesData = {
      academicYear: '2026 - 2027',
      meetingNumber: 'lần 2',
      timeHour: '08',
      timeMinute: '00',
      meetingDate: '17',
      meetingMonth: '9',
      meetingYear: '2026',
      location: dept.location,
      departmentName: dept.name,
      totalMembers: dept.members,
      presentMembers: dept.members,
      absentCount: 0,
      absentWithPermission: '0',
      absentReason: '',
      absentWithoutPermission: '0',
      chairPerson: dept.head,
      chairTitle: 'Tổ trưởng chuyên môn',
      secretary: dept.secretary,
      reviewStrengths: dept.strengths,
      reviewWeaknesses: dept.weaknesses,
      reviewCauses: dept.causes,
      reviewSolutions: dept.solutions,
      documentsDeployed: DEFAULT_DEPARTMENT_MEETING_DOCUMENTS,
      centralTasks: dept.tasks,
      includeGradeTable: false,
      memberOpinions: dept.opinions,
      conclusion: dept.conclusion,
      recommendations: dept.recommendations
    };

    const reportContent = `Biên bản họp tổ chuyên môn ${dept.name} lần 2 (17-9-2026). Chủ trì: ${dept.head}. Đã hoàn thành đánh giá hoạt động, triển khai văn bản chỉ đạo và đề xuất kiến nghị lên Ban Giám Hiệu.`;

    submissions.push({
      id: `sim-sub-dept-${dept.id}-${periodId}`,
      periodId: periodId,
      periodTitle: targetPeriod?.title || periodTitle,
      authorId: user?.id || `staff-dept-${dept.id}`,
      authorName: dept.head,
      authorEmail: user?.email || `totruong.${dept.id}@docbinhkieu.edu.vn`,
      authorRole: 'dept_head',
      authorRoleTitle: 'Tổ trưởng chuyên môn',
      departmentId: dept.id,
      departmentName: dept.name,
      title: `Biên bản họp ${dept.name} lần 2 (17-9-2026) - ${dept.head}`,
      content: reportContent,
      structuredData: {
        departmentMeetingMinutes: minutes
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
 * Mẫu văn bản triển khai mặc định cho họp tổ chuyên môn
 */
export const DEFAULT_DEPARTMENT_MEETING_DOCUMENTS = `- Kế hoạch giáo dục nhà trường năm học 2026-2027 (bản dự thảo).
- Công văn số 3284/SGDĐT-GDPT ngày 24 tháng 8 năm 2026 về việc hướng dẫn xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường cấp trung học.
- Công văn số 1061/HD-SGDĐT ngày 28 tháng 8 năm 2026 về hướng dẫn thực hiện nhiệm vụ giáo dục phổ thông năm học 2026 – 2027.
- Công văn số 1091/HD-SGDĐT ngày 08 tháng 9 năm 2026 về việc hướng dẫn tổ chức sinh hoạt chuyên môn tại cơ sở giáo dục phổ thông và sinh hoạt cụm chuyên môn kể từ năm học 2026 – 2027.`;

/**
 * Sinh bộ dữ liệu báo cáo mẫu cho đầy đủ 53 lớp chủ nhiệm
 * THÔNG MINH: Tự động phát hiện chủ đề của đợt (Hộ nghèo, Bỏ học, BHYT, Họp tổ chuyên môn, hoặc mẫu tùy biến)
 * để sinh ra đúng danh sách học sinh và số liệu thực tế cho 53 lớp hoặc 7 tổ chuyên môn!
 */
export function generateSample53Submissions(
  periodId: string, 
  periodTitle: string,
  allUsers: User[],
  targetPeriod?: ReportPeriod | null
): ReportSubmission[] {
  const pTitle = (targetPeriod?.title || periodTitle || '').toLowerCase();

  const isDeptMeetingTopic = pTitle.includes('họp tổ') || pTitle.includes('biên bản') || pTitle.includes('chuyên môn') || targetPeriod?.targetAudience === 'dept_heads_only';
  if (isDeptMeetingTopic) {
    return generateSampleDeptMeetingSubmissions(periodId, periodTitle, allUsers, targetPeriod);
  }

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
    const maleStudents = 0;
    const femaleStudents = 0;

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
