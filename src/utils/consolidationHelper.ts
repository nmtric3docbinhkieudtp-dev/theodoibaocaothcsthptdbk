import { 
  ReportPeriod, 
  ReportSubmission, 
  User, 
  HomeroomMeetingMinutesData, 
  AbsentStudentItem, 
  TalentAchievementItem, 
  ClassCadreItem 
} from '../types';
import { HOMEROOM_ROSTER_53 } from '../data/staffRoster';

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

export interface ConsolidatedDynamicTable {
  id: string;
  title: string;
  headers: string[];
  rows: Array<{
    stt: number;
    authorName: string;
    className: string;
    departmentName: string;
    data: Record<string, string>;
  }>;
}

export interface PeriodConsolidationResult {
  period: ReportPeriod | null;
  totalHomeroomClasses: number;
  submittedCount: number;
  pendingCount: number;
  completionRate: number;

  // Aggregate totals
  totalEnrolledStudents: number;
  totalMaleStudents: number;
  totalFemaleStudents: number;
  totalPresentStudents: number;
  totalAbsentStudents: number;
  overallAttendanceRate: number;

  // Data sets
  classStats: ConsolidatedClassStat[];
  absentStudents: ConsolidatedStudent[];
  talents: ConsolidatedTalent[];
  cadres: ConsolidatedCadre[];
  feedbacks: ConsolidatedFeedback[];
  dynamicTables: ConsolidatedDynamicTable[];
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

  // Tổng hợp thống kê 53 lớp chủ nhiệm
  const classStats: ConsolidatedClassStat[] = HOMEROOM_ROSTER_53.map((hr, idx) => {
    const classKey = hr.className.trim().toUpperCase();
    const sub = subByClassMap.get(classKey);
    const minutes: HomeroomMeetingMinutesData | undefined = sub?.structuredData?.homeroomMinutes;

    const hasSubmitted = !!sub && sub.status !== 'draft';
    const total = minutes?.totalStudents || hr.studentCount || 0;
    const male = minutes?.maleStudents || Math.round(total * 0.48);
    const female = minutes?.femaleStudents || (total - male);
    const absentCount = minutes?.absentStudents?.length ?? (minutes?.absentCount || 0);
    const present = hasSubmitted ? Math.max(0, total - absentCount) : 0;
    const rate = total > 0 && hasSubmitted ? Math.round((present / total) * 100) : 0;

    // Thu thập học sinh vắng nếu lớp này đã nộp
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

  // Thu thập nội dung báo cáo / phản ánh văn bản từ tất cả các bài nộp
  periodSubs.forEach((sub, idx) => {
    if (sub.status !== 'draft') {
      const minutesNotes = sub.structuredData?.homeroomMinutes?.additionalNotes || '';
      const textContent = sub.content || '';
      
      feedbacks.push({
        stt: idx + 1,
        authorName: sub.authorName,
        className: sub.homeroomClass || sub.structuredData?.homeroomMinutes?.className || '-',
        departmentName: sub.departmentName,
        submittedAt: sub.submittedAt || '',
        title: sub.title,
        content: textContent,
        notes: minutesNotes
      });
    }
  });

  // Thu thập các bảng số liệu tùy biến (Dynamic Tables)
  const dynamicTablesMap = new Map<string, ConsolidatedDynamicTable>();

  periodSubs.forEach(sub => {
    const customTables = sub.structuredData?.customTables || [];
    customTables.forEach((tbl: any) => {
      const titleKey = (tbl.title || 'Bảng số liệu tổng hợp').trim();
      if (!dynamicTablesMap.has(titleKey)) {
        dynamicTablesMap.set(titleKey, {
          id: tbl.id || titleKey,
          title: titleKey,
          headers: [...(tbl.headers || [])],
          rows: []
        });
      }
      const tableGroup = dynamicTablesMap.get(titleKey)!;
      // Thêm header nếu thiếu
      (tbl.headers || []).forEach((h: string) => {
        if (!tableGroup.headers.includes(h)) {
          tableGroup.headers.push(h);
        }
      });

      (tbl.rows || []).forEach((row: Record<string, string>) => {
        const hasData = Object.values(row).some(v => v !== undefined && v !== '');
        if (hasData) {
          tableGroup.rows.push({
            stt: tableGroup.rows.length + 1,
            authorName: sub.authorName,
            className: sub.homeroomClass || '-',
            departmentName: sub.departmentName,
            data: row
          });
        }
      });
    });
  });

  // Tính tổng số liệu
  const submittedClasses = classStats.filter(c => c.hasSubmitted);
  const submittedCount = submittedClasses.length;
  const pendingCount = 53 - submittedCount;
  const completionRate = Math.round((submittedCount / 53) * 100);

  const totalEnrolled = submittedClasses.reduce((sum, c) => sum + c.totalStudents, 0);
  const totalMale = submittedClasses.reduce((sum, c) => sum + c.maleStudents, 0);
  const totalFemale = submittedClasses.reduce((sum, c) => sum + c.femaleStudents, 0);
  const totalPresent = submittedClasses.reduce((sum, c) => sum + c.presentStudents, 0);
  const totalAbsent = absentStudents.length;
  const overallAttendanceRate = totalEnrolled > 0 ? Math.round((totalPresent / totalEnrolled) * 100) : 0;

  return {
    period,
    totalHomeroomClasses: 53,
    submittedCount,
    pendingCount,
    completionRate,
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
    dynamicTables: Array.from(dynamicTablesMap.values())
  };
}

/**
 * Sinh bộ dữ liệu báo cáo mẫu cho đầy đủ 53 lớp chủ nhiệm
 * Giúp Ban Giám Hiệu kiểm thử xem trước kết quả tổng hợp toàn trường
 */
export function generateSample53Submissions(
  periodId: string, 
  periodTitle: string,
  allUsers: User[]
): ReportSubmission[] {
  const sampleAddresses = [
    'Ấp 1, Xã Đốc Binh Kiều, Huyện Tháp Mười',
    'Ấp 2, Xã Đốc Binh Kiều, Huyện Tháp Mười',
    'Ấp 3, Xã Đốc Binh Kiều, Huyện Tháp Mười',
    'Ấp 4, Xã Đốc Binh Kiều, Huyện Tháp Mười',
    'Ấp 5, Xã Đốc Binh Kiều, Huyện Tháp Mười',
    'Ấp 1, Xã Tân Kiều, Huyện Tháp Mười',
    'Ấp 2, Xã Tân Kiều, Huyện Tháp Mười',
    'Ấp 3, Xã Tân Kiều, Huyện Tháp Mười',
    'Ấp Mỹ Thạnh, Xã Đốc Binh Kiều',
    'Ấp An Thái, Xã Tân Kiều, Tháp Mười',
    'Khóm 2, Thị trấn Mỹ An, Tháp Mười'
  ];

  const sampleAbsentReasons = [
    'Gia đình đi làm ăn xa tại Bình Dương, chưa về kịp',
    'Theo cha mẹ đi làm thời vụ tại TP.HCM, dự kiến thứ 2 tuần sau ra lớp',
    'Bị sốt xuất huyết đang điều trị tại Trung tâm Y tế Huyện Tháp Mười',
    'Gia đình có việc tang, xin phép vắng có đơn',
    'Chưa chuẩn bị kịp sách giáo khoa và phương tiện đi lại',
    'Gia đình khó khăn, có nguy cơ bỏ học đi làm thuê (GVCN đang phối hợp vận động)',
    'Học sinh có ý định chuyển trường về Tiền Giang gần nhà bà ngoại',
    'Bị tai nạn giao thông nhẹ, đang bó bột ở chân xin nghỉ 1 tuần',
    'Điểm giao thông xa, phụ huynh đi làm sớm chưa đưa rước được'
  ];

  const sampleTalentsPool = [
    { competition: 'Thi Học sinh Giỏi Toán cấp Tỉnh', prize: 'Nhì', studentName: 'Nguyễn Văn Hào' },
    { competition: 'Hội khỏe Phù Đổng (Điền kinh 100m)', prize: 'Nhất', studentName: 'Lê Thị Thu Thảo' },
    { competition: 'Viết thư Quốc tế UPU', prize: 'Ba', studentName: 'Trần Hoàng Nam' },
    { competition: 'Hùng biện Tiếng Anh cấp Huyện', prize: 'Nhất', studentName: 'Phạm Minh Khang' },
    { competition: 'Vẽ tranh Cổ động An toàn Giao thông', prize: 'Khuyến khích', studentName: 'Đặng Ngọc Ánh' },
    { competition: 'Tin học trẻ Tháp Mười', prize: 'Nhì', studentName: 'Võ Quốc Huy' },
    { competition: 'Bóng đá nam Hội khỏe Phù Đổng', prize: 'Huy chương Vàng', studentName: 'Nguyễn Tấn Đạt' }
  ];

  const sampleTeacherRequests = [
    'Phòng học bị thấm dột nhẹ ở dãy lầu 2, kính mong Ban Giám Hiệu chỉ đạo sửa chữa sớm trước mùa mưa.',
    'Quạt trần phòng học số 3 chạy hơi yếu, cần bảo dưỡng hoặc thay mới để học sinh mát mẻ.',
    'Lớp có 2 em hoàn cảnh đặc biệt khó khăn mồ côi cha mẹ, đề xuất Đoàn trường hỗ trợ học bổng và tập vở.',
    'Học sinh ra lớp ngày đầu rất nghiêm túc, tác phong đúng quy định, đồng phục sạch đẹp.',
    'Kiến nghị nhà trường trang bị thêm rèm che nắng hướng tây phòng học để tránh chói mắt buổi chiều.',
    'Đã liên hệ với phụ huynh các em vắng, cam kết thứ 2 sẽ có mặt đầy đủ tại trường.',
    'Cần hỗ trợ máy chiếu di động cho phòng học do máy chiếu cũ mờ đèn hình.'
  ];

  const submissions: ReportSubmission[] = [];
  const baseTime = new Date('2026-08-28T09:30:00Z');

  HOMEROOM_ROSTER_53.forEach((hr, index) => {
    const user = allUsers.find(u => u.name.trim().toLowerCase() === hr.teacherName.trim().toLowerCase()) 
      || allUsers.find(u => u.homeroomClass === hr.className);

    const totalStudents = hr.studentCount || 40;
    const maleStudents = Math.round(totalStudents * (0.45 + (index % 5) * 0.02));
    const femaleStudents = totalStudents - maleStudents;

    // Một số lớp có 1 - 3 học sinh vắng, một số lớp 0 học sinh vắng
    const absentCount = (index % 4 === 0) ? 0 : ((index % 3 === 0) ? 2 : 1);
    const absentStudentsList: AbsentStudentItem[] = [];

    for (let a = 0; a < absentCount; a++) {
      const studentIdx = (index * 2 + a + 1);
      const studentFirstNames = ['Trần Văn', 'Nguyễn Thị', 'Lê Hoàng', 'Phạm Quốc', 'Đặng Mỹ', 'Võ Hoài', 'Bùi Thanh', 'Huỳnh Ngọc'];
      const studentLastNames = ['An', 'Bình', 'Châu', 'Dũng', 'Em', 'Giang', 'Hậu', 'Khoa', 'Linh', 'Nghĩa', 'Phúc', 'Tâm', 'Vinh', 'Xuân'];
      const sName = `${studentFirstNames[(studentIdx) % studentFirstNames.length]} ${studentLastNames[(studentIdx * 3) % studentLastNames.length]}`;

      absentStudentsList.push({
        id: `absent-${hr.className}-${a + 1}`,
        studentName: sName,
        previousClass: `${hr.grade > 6 ? hr.grade - 1 : 5}${hr.className.replace(/[0-9]/g, '') || 'A1'}`,
        currentAddress: sampleAddresses[(index + a) % sampleAddresses.length],
        studentPhone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
        parentPhone: `09${Math.floor(10000000 + Math.random() * 89999999)}`,
        reason: sampleAbsentReasons[(index + a) % sampleAbsentReasons.length]
      });
    }

    // Năng khiếu
    const talentsList: TalentAchievementItem[] = [];
    if (index % 2 === 0) {
      const tItem = sampleTalentsPool[index % sampleTalentsPool.length];
      talentsList.push({
        id: `talent-${hr.className}-${index}`,
        competition: tItem.competition,
        prize: tItem.prize,
        studentName: `${tItem.studentName} (${hr.className})`,
        note: 'Tiếp tục bồi dưỡng tham gia kỳ thi năm nay'
      });
    }

    // Ban cán sự
    const cadresList: ClassCadreItem[] = [
      {
        id: `cadre-${hr.className}-1`,
        role: 'Lớp trưởng',
        studentName: `Nguyễn Hoàng Lớp Trưởng ${hr.className}`,
        academicPerf: 'Tốt',
        conductPerf: 'Tốt',
        phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`
      },
      {
        id: `cadre-${hr.className}-2`,
        role: 'Lớp phó Học tập',
        studentName: `Trần Thị Học Tập ${hr.className}`,
        academicPerf: 'Tốt',
        conductPerf: 'Tốt',
        phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`
      },
      {
        id: `cadre-${hr.className}-3`,
        role: 'Bí thư Chi đoàn / Chi đội',
        studentName: `Lê Văn Bí Thư ${hr.className}`,
        academicPerf: 'Khá',
        conductPerf: 'Tốt',
        phone: `09${Math.floor(10000000 + Math.random() * 89999999)}`
      }
    ];

    const meetingData: HomeroomMeetingMinutesData = {
      academicYear: '2026 – 2027',
      className: hr.className,
      teacherName: hr.teacherName,
      meetingDate: '28',
      meetingMonth: '8',
      meetingYear: '2026',
      timeHour: '07',
      timeMinute: '30',
      roomNumber: `P.${index + 1}`,
      totalStudents,
      maleStudents,
      femaleStudents,
      absentCount: absentStudentsList.length,
      absentStudents: absentStudentsList,
      talents: talentsList,
      cadres: cadresList,
      additionalNotes: sampleTeacherRequests[index % sampleTeacherRequests.length]
    };

    const submitTime = new Date(baseTime.getTime() + (index * 15 * 60 * 1000)).toISOString();

    submissions.push({
      id: `sample-sub-53-${index + 1}`,
      periodId: periodId,
      periodTitle: periodTitle,
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
      title: `Biên bản tập trung học sinh đầu năm học 2026-2027 - Lớp ${hr.className}`,
      content: `Kính gửi Ban Giám Hiệu,\n\nLớp ${hr.className} đã tổ chức buổi tập trung đầu năm học 2026-2027 vào sáng ngày 28/08/2026.\nSĩ số: ${totalStudents} em (Nam: ${maleStudents}, Nữ: ${femaleStudents}).\nSố học sinh vắng: ${absentStudentsList.length} em.\n\nNhận xét chung:\n- Không khí buổi tập trung vui tươi, các em chấp hành tốt nội quy trường lớp.\n- Ban cán sự lớp đã được kiện toàn.\n- GVCN đã liên hệ gia đình các em chưa ra lớp để động viên các em đến trường đúng ngày khai giảng.\n\nÝ kiến đề xuất: ${meetingData.additionalNotes}`,
      structuredData: {
        homeroomMinutes: meetingData
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
 * Tạo báo cáo tóm tắt điều hành bằng AI / Engine tổng hợp
 */
export function generateConsolidatedExecutiveSummary(data: PeriodConsolidationResult): string {
  const {
    period,
    totalHomeroomClasses,
    submittedCount,
    completionRate,
    totalEnrolledStudents,
    totalPresentStudents,
    totalAbsentStudents,
    overallAttendanceRate,
    absentStudents,
    talents,
    classStats
  } = data;

  // Nhóm lý do vắng
  const reasonMap: Record<string, number> = {};
  absentStudents.forEach(s => {
    const r = s.reason || 'Khác';
    reasonMap[r] = (reasonMap[r] || 0) + 1;
  });

  const topReasons = Object.entries(reasonMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  // Lớp vắng nhiều nhất
  const classesWithMostAbsents = [...classStats]
    .filter(c => c.absentStudentsCount > 0)
    .sort((a, b) => b.absentStudentsCount - a.absentStudentsCount)
    .slice(0, 5);

  return `
BÁO CÁO TỔNG HỢP VÀ ĐÁNH GIÁ ĐIỀU HÀNH DÀNH CHO BAN GIÁM HIỆU
Đợt báo cáo: ${period?.title || 'Tập trung học sinh đầu năm học'}
Trường THCS & THPT Đốc Binh Kiều - Năm học 2026 - 2027
--------------------------------------------------------------------------------

1. TIẾN ĐỘ THỰC HIỆN VÀ TỔNG QUAN SĨ SỐ TOÀN TRƯỜNG:
- Số lớp đã nộp báo cáo: ${submittedCount} / ${totalHomeroomClasses} lớp (Đạt tỷ lệ ${completionRate}%).
- Tổng sĩ số học sinh ghi nhận: ${totalEnrolledStudents.toLocaleString('vi-VN')} học sinh.
- Tổng số học sinh đã ra lớp hiện diện: ${totalPresentStudents.toLocaleString('vi-VN')} học sinh.
- Tỷ lệ học sinh ra lớp toàn trường: ${overallAttendanceRate}% (Đạt chỉ tiêu kế hoạch đầu năm).
- Tổng số học sinh chưa ra lớp cần theo dõi, vận động: ${totalAbsentStudents} học sinh.

2. PHÂN TÍCH NGUYÊN NHÂN HỌC SINH CHƯA RA LỚP:
Qua rà soát số liệu tổng hợp từ 53 lớp, các nguyên nhân chính gồm:
${topReasons.map((r, i) => `  ${i + 1}. ${r[0]}: ${r[1]} học sinh`).join('\n')}

3. CÁC LỚP CÓ SỐ LƯỢNG HỌC SINH CHƯA RA LỚP CẦN QUAN TÂM:
${classesWithMostAbsents.length > 0 ? classesWithMostAbsents.map(c => `  - Lớp ${c.className} (GVCN: ${c.teacherName}): Vắng ${c.absentStudentsCount} học sinh`).join('\n') : '  - Toàn bộ các lớp đều đạt 100% sĩ số.'}

4. NĂNG KHIẾU VÀ THÀNH TÍCH TIÊU BIỂU:
Ghi nhận tổng cộng ${talents.length} học sinh có năng khiếu, giải thưởng trong các cuộc thi học sinh giỏi, Hội khỏe Phù Đổng và nghiên cứu sáng tạo. Đoàn trường và các tổ chuyên môn đã có danh sách để lập đội tuyển bồi dưỡng.

5. TỔNG HỢP KIẾN NGHỊ VÀ ĐỀ XUẤT HÀNH ĐỘNG CỦA BGH:
- Về công tác duy trì sĩ số: Chỉ đạo Đoàn Thanh niên, Đội TNTP và GVCN phối hợp chặt chẽ với Trưởng Ban nhân dân các ấp để đến tận nhà vận động các em có nguy cơ bỏ học.
- Về cơ sở vật chất: Đề nghị Tổ Hành chính - Văn phòng kiểm tra, sửa chữa kịp thời quạt trần, đèn chiếu sáng và rèm che nắng tại các phòng học được GVCN phản ánh trước ngày khai giảng.
- Về hỗ trợ học sinh: Trích quỹ khuyến học trường trao tặng tập vở và bảo hiểm cho các em học sinh có hoàn cảnh khó khăn đột xuất.
`.trim();
}
