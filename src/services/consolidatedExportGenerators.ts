import * as XLSX from 'xlsx';
import { SchoolInfo, User } from '../types';
import { 
  PeriodConsolidationResult, 
  isMeaningfulTableRow,
  DEFAULT_DEPARTMENT_MEETING_DOCUMENTS,
  generateSampleDeptMeetingSubmissions,
  OFFICIAL_DEPARTMENTS
} from '../utils/consolidationHelper';
import { splitSmartLines } from '../utils/homeroomReportExporter';

/**
 * 1. TẠO CÁC SHEET EXCEL TỔNG HỢP (SẮP XẾP THEO TỪNG ĐỀ MỤC VÀ CÂU HỎI TRONG FORM)
 */
export function buildConsolidatedExcelWorkbook(
  data: PeriodConsolidationResult,
  schoolInfo: SchoolInfo
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const isHomeroom = data.period?.targetAudience === 'homeroom_teachers' ||
    data.period?.targetAudience === 'gvcn_diem_chinh' ||
    data.period?.targetAudience === 'gvcn_doc_binh_kieu' ||
    data.period?.targetAudience === 'gvcn_tan_kieu' ||
    (!data.period?.targetAudience && (data.periodTitle.toLowerCase().includes('chủ nhiệm') || data.periodTitle.toLowerCase().includes('53 lớp')));
  const isDeptHead = data.isDeptHeadAudience;

  // SHEET 1: TỔNG QUAN
  const summaryData: { 'Chỉ Số / Hạng Mục': string; 'Giá Trị': any }[] = [
    { 'Chỉ Số / Hạng Mục': 'Tên đợt báo cáo', 'Giá Trị': data.period?.title || data.periodTitle },
    { 'Chỉ Số / Hạng Mục': 'Năm học', 'Giá Trị': data.period?.academicYear || '2026 - 2027' },
    { 'Chỉ Số / Hạng Mục': 'Đơn vị', 'Giá Trị': schoolInfo.formalName },
    { 'Chỉ Số / Hạng Mục': 'Đối tượng thực hiện', 'Giá Trị': data.targetAudienceLabel },
    { 'Chỉ Số / Hạng Mục': 'Hạn chót nộp', 'Giá Trị': data.period?.deadline || 'Không ấn định' },
    { 'Chỉ Số / Hạng Mục': 'Tổng số đối tượng yêu cầu', 'Giá Trị': data.totalTargetCount },
    { 'Chỉ Số / Hạng Mục': 'Số lượng đã nộp báo cáo', 'Giá Trị': `${data.submittedCount} / ${data.totalTargetCount}` },
    { 'Chỉ Số / Hạng Mục': 'Tỷ lệ hoàn thành (%)', 'Giá Trị': `${data.completionRate}%` },
    { 'Chỉ Số / Hạng Mục': 'Số lượng chưa nộp', 'Giá Trị': data.pendingCount },
    { 'Chỉ Số / Hạng Mục': 'Ngày xuất file', 'Giá Trị': new Date().toLocaleDateString('vi-VN') }
  ];

  if (isHomeroom) {
    summaryData.push(
      { 'Chỉ Số / Hạng Mục': 'Tổng sĩ số học sinh ghi nhận', 'Giá Trị': data.totalEnrolledStudents },
      { 'Chỉ Số / Hạng Mục': 'Số học sinh hiện diện (đã ra lớp)', 'Giá Trị': data.totalPresentStudents },
      { 'Chỉ Số / Hạng Mục': 'Số học sinh chưa ra lớp toàn trường', 'Giá Trị': data.totalAbsentStudents },
      { 'Chỉ Số / Hạng Mục': 'Tỷ lệ ra lớp toàn trường (%)', 'Giá Trị': `${data.overallAttendanceRate}%` }
    );
  }

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tong_Quan');

  // SHEET 2: TỔNG HỢP THEO TỪNG ĐỀ MỤC & CÂU HỎI TRONG FORM (Theo thứ tự Form)
  const breakdownRows: any[][] = [];
  breakdownRows.push(['BÁO CÁO TỔNG HỢP CHI TIẾT THEO TỪNG ĐỀ MỤC & CÂU HỎI TRONG BIỂU MẪU']);
  breakdownRows.push([`Đợt: ${data.period?.title || data.periodTitle} | Đơn vị: ${schoolInfo.formalName}`]);
  breakdownRows.push([`Tiến độ: ${data.submittedCount}/${data.totalTargetCount} (${data.completionRate}%) | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`]);
  breakdownRows.push([]);

  if (data.questionsBreakdown && data.questionsBreakdown.length > 0) {
    data.questionsBreakdown.forEach(item => {
      // 1. Phân đoạn / Section
      if (item.field.type === 'section') {
        breakdownRows.push([`=== ĐỀ MỤC: ${item.field.label.toUpperCase()} ===`]);
        if (item.field.description) {
          breakdownRows.push([`Mô tả: ${item.field.description}`]);
        }
        breakdownRows.push([]);
        return;
      }

      // 2. Trắc nghiệm (Radio / Dropdown / Select)
      if (item.field.type === 'radio' || item.field.type === 'dropdown' || item.field.type === 'select') {
        breakdownRows.push([`Câu ${item.questionNumber}: ${item.field.label}`]);
        if (item.field.description) breakdownRows.push([`(${item.field.description})`]);
        breakdownRows.push(['Phương Án Lựa Chọn', 'Số Lượt Chọn', 'Tỷ Lệ (%)', 'Danh Sách Người / Lớp Chọn']);
        (item.optionStats || []).forEach(opt => {
          breakdownRows.push([
            opt.option,
            opt.count,
            `${opt.percentage}%`,
            opt.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'
          ]);
        });
        breakdownRows.push(['Tổng cộng phản hồi:', `${item.totalAnswered}/${item.totalExpected}`, `Tỷ lệ: ${item.responseRate}%`, '']);
        breakdownRows.push([]);
        return;
      }

      // 3. Hộp kiểm (Checkbox)
      if (item.field.type === 'checkbox') {
        breakdownRows.push([`Câu ${item.questionNumber}: ${item.field.label}`]);
        if (item.field.description) breakdownRows.push([`(${item.field.description})`]);
        if (item.optionStats && item.optionStats.length > 0) {
          breakdownRows.push(['Tiêu Chí / Phương Án', 'Số Lượt Chọn', 'Tỷ Lệ (%)', 'Danh Sách Người / Lớp Chọn']);
          item.optionStats.forEach(opt => {
            breakdownRows.push([
              opt.option,
              opt.count,
              `${opt.percentage}%`,
              opt.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'
            ]);
          });
        } else if (item.singleCheckboxStat) {
          breakdownRows.push(['Tiêu Chí / Trạng Thái', 'Số Lượt Đạt', 'Tỷ Lệ (%)', 'Danh Sách Người / Lớp Đạt']);
          breakdownRows.push([
            'Đạt yêu cầu / Xác nhận',
            item.singleCheckboxStat.checkedCount,
            `${item.singleCheckboxStat.percentage}%`,
            item.singleCheckboxStat.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'
          ]);
        }
        breakdownRows.push(['Tổng cộng phản hồi:', `${item.totalAnswered}/${item.totalExpected}`, `Tỷ lệ: ${item.responseRate}%`, '']);
        breakdownRows.push([]);
        return;
      }

      // 4. Thang điểm đánh giá (Scale)
      if (item.field.type === 'scale') {
        breakdownRows.push([`Câu ${item.questionNumber}: ${item.field.label}`]);
        breakdownRows.push([`Điểm đánh giá trung bình: ${item.scaleStats?.average || 0} / ${item.scaleStats?.max || 5}`]);
        breakdownRows.push(['Mức Đánh Giá', 'Số Lượt Bình Chọn', 'Tỷ Lệ (%)', 'Danh Sách Người Đánh Giá']);
        (item.scaleStats?.levels || []).forEach(lvl => {
          breakdownRows.push([
            `Mức ${lvl.level}`,
            lvl.count,
            `${lvl.percentage}%`,
            lvl.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'
          ]);
        });
        breakdownRows.push([]);
        return;
      }

      // 5. Chỉ tiêu số (Number)
      if (item.field.type === 'number') {
        breakdownRows.push([`Câu ${item.questionNumber}: ${item.field.label}`]);
        breakdownRows.push([
          `Tổng cộng: ${item.numberStats?.sum || 0}`,
          `Trung bình: ${item.numberStats?.average || 0}`,
          `Cao nhất: ${item.numberStats?.max || 0}`,
          `Thấp nhất: ${item.numberStats?.min || 0}`
        ]);
        breakdownRows.push(['STT', 'Họ và Tên Người Nộp', 'Đơn Vị / Lớp', 'Số Lượng Ghi Nhận']);
        (item.numberStats?.entries || []).forEach((e, idx) => {
          breakdownRows.push([idx + 1, e.authorName, e.unit, e.value]);
        });
        breakdownRows.push([]);
        return;
      }

      // 6. Tự luận (Text / Textarea)
      if (item.field.type === 'text' || item.field.type === 'textarea') {
        breakdownRows.push([`Câu ${item.questionNumber}: ${item.field.label} (${item.totalAnswered} ý kiến phản hồi)`]);
        breakdownRows.push(['STT', 'Họ và Tên Người Nộp', 'Đơn Vị / Lớp', 'Thời Gian Nộp', 'Nội Dung Ý Kiến Chi Tiết']);
        (item.textEntries || []).forEach((t, idx) => {
          breakdownRows.push([
            idx + 1,
            t.authorName,
            t.unit,
            t.submittedAt ? new Date(t.submittedAt).toLocaleString('vi-VN') : '',
            t.value
          ]);
        });
        breakdownRows.push([]);
        return;
      }

      // 7. Các kiểu khác (Date, Time, File, ...)
      breakdownRows.push([`Câu ${item.questionNumber}: ${item.field.label}`]);
      breakdownRows.push(['STT', 'Họ và Tên Người Nộp', 'Đơn Vị / Lớp', 'Thời Gian Nộp', 'Giá Trị']);
      (item.generalEntries || []).forEach((g, idx) => {
        breakdownRows.push([
          idx + 1,
          g.authorName,
          g.unit,
          g.submittedAt ? new Date(g.submittedAt).toLocaleString('vi-VN') : '',
          String(g.value ?? '')
        ]);
      });
      breakdownRows.push([]);
    });
  } else if (data.feedbacks && data.feedbacks.length > 0) {
    // Báo cáo văn bản tự do nếu không có form câu hỏi
    breakdownRows.push(['DANH SÁCH BÁO CÁO CHI TIẾT TỪ CÁC ĐƠN VỊ / LỚP']);
    breakdownRows.push(['STT', 'Đơn Vị / Lớp', 'Người Báo Cáo', 'Thời Gian Gửi', 'Tiêu Đề Báo Cáo', 'Nội Dung Chi Tiết', 'Ghi Chú / Đề Xuất']);
    data.feedbacks.forEach((f, idx) => {
      breakdownRows.push([
        idx + 1,
        f.className,
        f.authorName,
        f.submittedAt ? new Date(f.submittedAt).toLocaleString('vi-VN') : '',
        f.title,
        f.content,
        f.notes || ''
      ]);
    });
  }

  const wsBreakdown = XLSX.utils.aoa_to_sheet(breakdownRows);
  // Đặt độ rộng cột cho dễ đọc
  wsBreakdown['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsBreakdown, 'Tong_Hop_Tung_De_Muc');

  // SHEET 3: MA TRẬN KHẢO SÁT TOÀN TRƯỜNG (Dạng hàng ngang cho người thích pivot/lọc)
  if (data.fieldMatrix && data.fieldMatrix.columns.length > 0) {
    const matrixRows = data.fieldMatrix.rows.map(r => {
      const rowData: Record<string, any> = {
        'STT': r.stt,
        'Đơn Vị / Tổ / Lớp': r.className,
        'Cơ Sở': r.campus,
        'Người Báo Cáo': r.authorName,
        'Tổ / Bộ Phận': r.departmentName,
        'Trạng Thái': r.hasSubmitted ? 'Đã nộp' : 'Chưa nộp',
        'Thời Gian Nộp': r.submittedAt ? new Date(r.submittedAt).toLocaleString('vi-VN') : ''
      };
      data.fieldMatrix.columns.forEach(col => {
        rowData[col.label] = r.values[col.id] !== undefined ? r.values[col.id] : '';
      });
      return rowData;
    });

    if (Object.keys(data.fieldMatrix.numericTotals).length > 0) {
      const totalsRow: Record<string, any> = {
        'STT': 0,
        'Đơn Vị / Tổ / Lớp': 'TỔNG CỘNG',
        'Cơ Sở': '-',
        'Người Báo Cáo': '-',
        'Tổ / Bộ Phận': '-',
        'Trạng Thái': `${data.submittedCount} đã nộp`,
        'Thời Gian Nộp': '-'
      };
      data.fieldMatrix.columns.forEach(col => {
        if (col.type === 'number' && data.fieldMatrix.numericTotals[col.id] !== undefined) {
          totalsRow[col.label] = data.fieldMatrix.numericTotals[col.id];
        } else {
          totalsRow[col.label] = '-';
        }
      });
      matrixRows.push(totalsRow);
    }

    const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'Ma_Tran_Khao_Sat');
  }

  // SHEET 4..: CÁC BẢNG SỐ LIỆU ĐỘNG (Dynamic Tables)
  if (data.dynamicTables && data.dynamicTables.length > 0) {
    data.dynamicTables.forEach((table, idx) => {
      const meaningfulRows = table.rows.filter(r => isMeaningfulTableRow(r.data, table.headers));
      if (meaningfulRows.length > 0) {
        const tableSheetData = meaningfulRows.map((r, rIdx) => {
          const rowObj: Record<string, any> = {
            'STT': rIdx + 1,
            'Lớp / Đơn Vị': r.className,
            'Người Báo Cáo': r.authorName
          };
          table.headers.forEach(h => {
            rowObj[h] = (r.data && r.data[h] !== undefined) ? r.data[h] : ((r as any)[h] !== undefined ? (r as any)[h] : '');
          });
          return rowObj;
        });

        const wsTable = XLSX.utils.json_to_sheet(tableSheetData);
        const sheetName = `Bang_${idx + 1}_${table.title.replace(/[^a-zA-Z0-9]/g, '_')}`.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, wsTable, sheetName);
      }
    });
  }

  // SHEET 5 (NẾU ĐỢT GVCN): SĨ SỐ 53 LỚP & HỌC SINH CHƯA RA LỚP
  if (isHomeroom) {
    if (data.classStats && data.classStats.length > 0) {
      const classRows = data.classStats.map(c => ({
        'STT': c.stt,
        'Lớp': c.className,
        'Khối': c.grade,
        'Cơ Sở': c.campus,
        'Giáo Viên Chủ Nhiệm': c.teacherName,
        'Trạng Thái Nộp': c.hasSubmitted ? 'Đã nộp' : 'Chưa nộp',
        'Tổng Sĩ Số': c.totalStudents,
        'Nam': c.maleStudents,
        'Nữ': c.femaleStudents,
        'Hiện Diện (Ra Lớp)': c.presentStudents,
        'Vắng (Chưa Ra Lớp)': c.absentStudentsCount,
        'Tỷ Lệ Ra Lớp (%)': `${c.attendanceRate}%`
      }));
      const wsClasses = XLSX.utils.json_to_sheet(classRows);
      XLSX.utils.book_append_sheet(wb, wsClasses, 'Si_So_53_Lop');
    }

    if (data.absentStudents && data.absentStudents.length > 0) {
      const absentRows = data.absentStudents.map(s => ({
        'STT': s.stt,
        'Lớp': s.className,
        'Khối': s.grade,
        'Cơ Sở': s.campus,
        'GVCN': s.teacherName,
        'Họ và Tên Học Sinh': s.studentName,
        'Lớp Cũ Năm Trước': s.previousClass || '-',
        'Địa Chỉ Hiện Tại': s.currentAddress || '-',
        'SĐT Học Sinh': s.studentPhone || '-',
        'SĐT Phụ Huynh': s.parentPhone || '-',
        'Lý Do Chưa Ra Lớp / Tình Trạng': s.reason || 'Chưa rõ'
      }));
      const wsAbsent = XLSX.utils.json_to_sheet(absentRows);
      XLSX.utils.book_append_sheet(wb, wsAbsent, 'DS_HS_Chua_Ra_Lop');
    }
  }

  // SHEET 6 (NẾU TỔ TRƯỞNG HOẶC CHỈ ĐỊNH): TIẾN ĐỘ THỰC HIỆN
  if (isDeptHead && data.deptHeadStats && data.deptHeadStats.length > 0) {
    const deptRows = data.deptHeadStats.map(d => ({
      'STT': d.stt,
      'Tổ Chuyên Môn': d.departmentName,
      'Họ và Tên Tổ Trưởng': d.teacherName,
      'Chức Vụ': d.roleTitle,
      'Trạng Thái Nộp': d.hasSubmitted ? 'Đã nộp' : 'Chưa nộp',
      'Thời Gian Nộp': d.submittedAt ? new Date(d.submittedAt).toLocaleString('vi-VN') : '-',
      'Tiêu Đề Báo Cáo': d.reportTitle || '-',
      'Ghi Chú': d.summaryNote || '-'
    }));
    const wsDept = XLSX.utils.json_to_sheet(deptRows);
    XLSX.utils.book_append_sheet(wb, wsDept, 'Tien_Do_To_Truong');
  }

  // SHEET 7: Ý KIẾN GÓP Ý & KIẾN NGHỊ VỚI BGH
  if (data.feedbacks && data.feedbacks.length > 0) {
    const feedbackRows = data.feedbacks
      .filter(f => f.notes || f.content)
      .map((f, idx) => ({
        'STT': idx + 1,
        'Đơn Vị / Lớp': f.className,
        'Họ và Tên Người Báo Cáo': f.authorName,
        'Thời Gian Nộp': f.submittedAt ? new Date(f.submittedAt).toLocaleString('vi-VN') : '',
        'Tiêu Đề Báo Cáo': f.title,
        'Nội Dung / Đề Xuất': f.content,
        'Ý Kiến / Kiến Nghị Với BGH': f.notes || ''
      }));
    if (feedbackRows.length > 0) {
      const wsFeedbacks = XLSX.utils.json_to_sheet(feedbackRows);
      XLSX.utils.book_append_sheet(wb, wsFeedbacks, 'Gop_Y_Kien_Nghi');
    }
  }

  // SHEET 8 (NẾU HỌP TỔ CHUYÊN MÔN): TỔNG HỢP CHI TIẾT BIÊN BẢN HỌP CỦA CÁC TỔ
  const isMeetingMinutesWorkbook = 
    data.isDeptMeetingAudience ||
    (data.period?.title || data.periodTitle || '').toLowerCase().includes('họp tổ') ||
    (data.period?.title || data.periodTitle || '').toLowerCase().includes('biên bản') ||
    (data.deptMeetingMinutesList && data.deptMeetingMinutesList.length > 0 && data.deptMeetingMinutesList.some(d => d.hasSubmitted && d.minutes));

  if (isMeetingMinutesWorkbook && data.deptMeetingMinutesList && data.deptMeetingMinutesList.length > 0) {
    const meetingRows = data.deptMeetingMinutesList.map((m, idx) => {
      const min = m.minutes;
      return {
        'STT': idx + 1,
        'Tổ Chuyên Môn': m.departmentName,
        'Tổ Trưởng / Chủ Trì': min?.chairPerson || m.teacherName,
        'Thư Ký': min?.secretary || '-',
        'Trạng Thái Nộp': m.hasSubmitted ? 'Đã nộp biên bản' : 'Chưa nộp',
        'Thời Gian Họp': min ? `${min.timeHour || '08'}:${min.timeMinute || '00'}, ngày ${min.meetingDate || '17'}/${min.meetingMonth || '09'}/${min.meetingYear || '2026'}` : 'Theo kế hoạch',
        'Địa Điểm': min?.location || 'Trường THCS & THPT Đốc Binh Kiều',
        'Tổng Số Thành Viên': min?.totalMembers || '-',
        'Có Mặt': min?.presentMembers || '-',
        'Vắng': min?.absentCount ?? 0,
        'Lý Do Vắng': min?.absentReason || '-',
        '1. Đánh Giá - Ưu Điểm': min?.reviewStrengths || '-',
        '1. Đánh Giá - Hạn Chế': min?.reviewWeaknesses || '-',
        '1. Đánh Giá - Nguyên Nhân': min?.reviewCauses || '-',
        '1. Đánh Giá - Giải Pháp': min?.reviewSolutions || '-',
        '2. Văn Bản Triển Khai': min?.documentsDeployed || DEFAULT_DEPARTMENT_MEETING_DOCUMENTS,
        '3. Công Việc Trọng Tâm': min?.centralTasks || '-',
        '4. Ý Kiến Các Thành Viên': min?.memberOpinions || '-',
        '5. Kết Luận Của Chủ Trì': min?.conclusion || '-',
        '6. Đề Xuất Kiến Nghị Với BGH': min?.recommendations || '-'
      };
    });
    const wsMeetings = XLSX.utils.json_to_sheet(meetingRows);
    XLSX.utils.book_append_sheet(wb, wsMeetings, 'Bien_Ban_Hop_To');
  }

  return wb;
}

/**
 * Chuẩn hóa tiêu đề văn bản hành chính theo đúng chuẩn Nghị định 30/2020/NĐ-CP
 * Dòng 1: BÁO CÁO
 * Dòng 2: TỔNG HỢP + TÊN ĐỢT BÁO CÁO (được gạch chân cân đối)
 */
export function formatReportTitleHeader(periodTitle: string): { mainType: string; subTitle: string } {
  let title = (periodTitle || '').trim();

  // Xóa tiền tố "Báo cáo tổng hợp:" hoặc "Báo cáo:" nếu có trong tên đợt
  if (title.toLowerCase().startsWith('báo cáo tổng hợp:')) {
    title = title.substring('báo cáo tổng hợp:'.length).trim();
  } else if (title.toLowerCase().startsWith('báo cáo tổng hợp')) {
    title = title.substring('báo cáo tổng hợp'.length).trim();
  } else if (title.toLowerCase().startsWith('báo cáo:')) {
    title = title.substring('báo cáo:'.length).trim();
  } else if (title.toLowerCase().startsWith('báo cáo')) {
    title = title.substring('báo cáo'.length).trim();
  }

  // Chuẩn hóa tiền tố "TỔNG HỢP"
  if (title.toLowerCase().startsWith('tổng hợp:')) {
    title = title.substring('tổng hợp:'.length).trim();
  } else if (title.toLowerCase().startsWith('tổng hợp')) {
    title = title.substring('tổng hợp'.length).trim();
  }

  let subTitle = '';
  if (!title) {
    subTitle = 'TỔNG HỢP NỘI DUNG BÁO CÁO';
  } else {
    // Nếu là đợt họp tổ chuyên môn nhưng chưa có từ "biên bản", chuẩn hóa thêm cho đúng văn phong hành chính
    if (title.toLowerCase().includes('họp tổ') && !title.toLowerCase().includes('biên bản')) {
      title = title.replace(/họp tổ/i, 'biên bản họp tổ');
    }
    subTitle = `TỔNG HỢP ${title.toUpperCase()}`;
  }

  return {
    mainType: 'BÁO CÁO',
    subTitle
  };
}

/**
 * Trình bày văn bản tự luận theo đoạn, ngắt dòng thông minh theo gạch đầu dòng, chuẩn thể thức hành chính,
 * KHÔNG kẻ ô.
 */
export function renderSmartTextParagraphs(text: string, isIndented = true): string {
  if (!text || !text.trim()) {
    return `<p style="margin: 2px 0; font-style: italic; color: #555;">(Không có)</p>`;
  }
  const lines = splitSmartLines(text);
  if (lines.length === 0) {
    return `<p style="margin: 3px 0; text-align: justify; ${isIndented ? 'text-indent: 15px;' : ''}">${text}</p>`;
  }
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('+') || trimmed.startsWith('*') || /^\d+[\.\)]/.test(trimmed);
    const indentStyle = isBullet 
      ? 'margin: 3px 0; text-align: justify; padding-left: 14px;' 
      : (isIndented ? 'margin: 3px 0; text-align: justify; text-indent: 15px;' : 'margin: 3px 0; text-align: justify;');
    return `<p style="${indentStyle}">${trimmed}</p>`;
  }).filter(Boolean).join('');
}

/**
 * Tạo nội dung BÁO CÁO TỔNG HỢP BIÊN BẢN HỌP TỔ CHUYÊN MÔN
 * Đáp ứng đầy đủ 3 yêu cầu của người dùng:
 * 1/ Thiết kế chuẩn A4 đứng, thể thức văn bản hành chính (Nghị định 30/2020/NĐ-CP).
 * 2/ Thể hiện dạng văn bản bình thường, KHÔNG kẻ ô, canh giữa "NỘI DUNG CUỘC HỌP".
 * 3/ Liệt kê đầy đủ 100% tất cả các nội dung từ các tổ gửi lên (Đánh giá hoạt động, Văn bản triển khai, Công việc trọng tâm, Ý kiến thành viên, Kết luận chủ trì, Đề xuất kiến nghị).
 */
export function renderConsolidatedDepartmentMeetingContent(
  data: PeriodConsolidationResult,
  currentUser: User,
  schoolInfo: SchoolInfo,
  year: string = '2026'
): string {
  // Lấy danh sách các cuộc họp tổ thực tế từ dữ liệu
  const allDepts = (data.deptMeetingMinutesList && data.deptMeetingMinutesList.length > 0)
    ? data.deptMeetingMinutesList
    : OFFICIAL_DEPARTMENTS.map((dept, idx) => ({
        stt: idx + 1,
        departmentId: dept.id,
        departmentName: dept.name,
        teacherName: dept.headUserName,
        roleTitle: 'Tổ trưởng chuyên môn',
        hasSubmitted: false,
        submittedAt: null,
        submissionId: null,
        minutes: null,
        reportContent: '',
        submission: null
      }));

  const submittedMeetings = allDepts.filter(d => d.hasSubmitted && (d.minutes || d.reportContent || d.submission));
  const totalDepts = allDepts.length;
  const submittedCount = submittedMeetings.length;

  return `
    <!-- PHẦN I: TÌNH HÌNH TỔ CHỨC HỌP CỦA CÁC TỔ CHUYÊN MÔN -->
    <div style="margin-top: 14px; text-align: justify; font-size: 13pt; line-height: 1.55;">
      <p style="font-weight: bold; margin: 4px 0; text-transform: uppercase;">
        I. TÌNH HÌNH TỔ CHỨC HỌP CỦA CÁC TỔ CHUYÊN MÔN
      </p>
      <p style="margin: 3px 0; text-indent: 15px;">
        - <b>Tổng số tổ chuyên môn:</b> ${totalDepts} tổ.
      </p>
      <p style="margin: 3px 0; text-indent: 15px;">
        - <b>Số tổ đã tiến hành họp và hoàn thành nộp biên bản:</b> <b>${submittedCount} / ${totalDepts}</b> tổ (Tỷ lệ: <b>${totalDepts > 0 ? Math.round((submittedCount / totalDepts) * 100) : 0}%</b>).
      </p>
      <p style="margin: 3px 0; text-indent: 15px;">
        - <b>Thời gian, địa điểm và quân số tham dự họp của từng tổ:</b>
      </p>
      <div style="padding-left: 15px; margin-top: 4px;">
        ${allDepts.map(d => {
          if (!d.hasSubmitted) {
            return `
              <p style="margin: 3px 0; text-align: justify;">
                + <b>${d.departmentName}:</b> <i>(Chưa nộp biên bản/báo cáo)</i>.
              </p>
            `;
          }
          const min = d.minutes;
          if (min) {
            const timeParts: string[] = [];
            if (min.timeHour) timeParts.push(`vào lúc ${min.timeHour} giờ ${min.timeMinute || '00'} phút`);
            if (min.meetingDate) timeParts.push(`ngày ${min.meetingDate} tháng ${min.meetingMonth || '9'} năm ${min.meetingYear || year}`);
            const timeStr = timeParts.length > 0 ? timeParts.join(', ') : 'theo kế hoạch sinh hoạt tổ';
            const locStr = min.location ? `tại ${min.location}` : '';
            const chairStr = min.chairPerson ? `Chủ trì: ${min.chairPerson}${min.chairTitle ? ` (${min.chairTitle})` : ''}` : `Chủ trì: ${d.teacherName}`;
            const secStr = min.secretary ? `; Thư ký: ${min.secretary}` : '';
            const memParts: string[] = [];
            if (min.totalMembers) memParts.push(`Tổng số thành viên: ${min.totalMembers}`);
            if (min.presentMembers !== undefined && min.presentMembers !== null) memParts.push(`có mặt: ${min.presentMembers}`);
            if (min.absentCount !== undefined && min.absentCount !== null) {
              memParts.push(`vắng: ${min.absentCount}${min.absentReason ? ` (Lý do: ${min.absentReason})` : ''}`);
            }
            const memberStr = memParts.length > 0 ? `; ${memParts.join(', ')}` : '';
            return `
              <p style="margin: 3px 0; text-align: justify;">
                + <b>${d.departmentName}:</b> Họp ${timeStr} ${locStr}. ${chairStr}${secStr}${memberStr}.
              </p>
            `;
          } else {
            return `
              <p style="margin: 3px 0; text-align: justify;">
                + <b>${d.departmentName}:</b> Đã nộp báo cáo chuyên môn (Người nộp: ${d.teacherName}${d.submittedAt ? `, thời gian: ${new Date(d.submittedAt).toLocaleString('vi-VN')}` : ''}).
              </p>
            `;
          }
        }).join('')}
      </div>
    </div>

    <!-- TIÊU ĐỀ NỘI DUNG CUỘC HỌP CANH GIỮA TRANG GIẤY -->
    <div style="text-align: center; margin: 24px 0 16px 0;">
      <span style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase;">
        NỘI DUNG CUỘC HỌP
      </span>
    </div>

    ${submittedCount === 0 ? `
      <div style="margin: 20px 0; padding: 14px; background-color: #f8fafc; border: 1px dashed #94a3b8; text-align: center; font-style: italic; color: #475569;">
        (Hiện tại chưa ghi nhận biên bản hoặc nội dung báo cáo nộp lên từ các tổ chuyên môn)
      </div>
    ` : `
      <!-- MỤC 1: ĐÁNH GIÁ HOẠT ĐỘNG CỦA TỔ TRONG THỜI GIAN QUA -->
      <div style="margin-top: 14px; text-align: justify; font-size: 13pt; line-height: 1.55;">
        <p style="font-weight: bold; margin: 4px 0;">
          1. Đánh giá hoạt động của tổ trong thời gian qua:
        </p>
        ${submittedMeetings.map(m => {
          const min = m.minutes;
          const strengths = min?.reviewStrengths?.trim() || '(Không ghi)';
          const weaknesses = min?.reviewWeaknesses?.trim() || '(Không có)';
          const causes = min?.reviewCauses?.trim() || '(Không có)';
          const solutions = min?.reviewSolutions?.trim() || '(Không có)';
          return `
            <div style="margin: 8px 0 10px 15px; text-align: justify;">
              <p style="margin: 2px 0; font-weight: bold;">
                • ${m.departmentName}:
              </p>
              <div style="padding-left: 15px;">
                <p style="margin: 2px 0;">- <i>Ưu điểm:</i> ${strengths}</p>
                <p style="margin: 2px 0;">- <i>Hạn chế:</i> ${weaknesses}</p>
                <p style="margin: 2px 0;">- <i>Nguyên nhân của hạn chế:</i> ${causes}</p>
                <p style="margin: 2px 0;">- <i>Giải pháp khắc phục:</i> ${solutions}</p>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- MỤC 2: TRIỂN KHAI CÁC VĂN BẢN -->
      <div style="margin-top: 16px; text-align: justify; font-size: 13pt; line-height: 1.55;">
        <p style="font-weight: bold; margin: 4px 0;">
          2. Triển khai các văn bản:
        </p>
        ${submittedMeetings.map(m => {
          const docs = m.minutes?.documentsDeployed?.trim() || '';
          return `
            <div style="margin: 8px 0 10px 15px; text-align: justify;">
              <p style="margin: 2px 0; font-weight: bold;">
                • ${m.departmentName}:
              </p>
              <div style="padding-left: 15px;">
                ${docs ? renderSmartTextParagraphs(docs, false) : '<p style="margin: 2px 0; font-style: italic; color: #555;">(Không ghi nhận)</p>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- MỤC 3: TRIỂN KHAI NỘI DUNG CÔNG VIỆC TRỌNG TÂM CỦA TRƯỜNG/TỔ -->
      <div style="margin-top: 16px; text-align: justify; font-size: 13pt; line-height: 1.55;">
        <p style="font-weight: bold; margin: 4px 0;">
          3. Triển khai nội dung công việc trọng tâm của trường/tổ:
        </p>
        ${submittedMeetings.map(m => {
          const tasks = m.minutes?.centralTasks?.trim() || '';
          return `
            <div style="margin: 8px 0 10px 15px; text-align: justify;">
              <p style="margin: 2px 0; font-weight: bold;">
                • ${m.departmentName}:
              </p>
              <div style="padding-left: 15px;">
                ${tasks ? renderSmartTextParagraphs(tasks, false) : '<p style="margin: 2px 0; font-style: italic; color: #555;">(Không ghi nhận)</p>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- MỤC 4: Ý KIẾN CỦA CÁC THÀNH VIÊN TRONG CUỘC HỌP -->
      <div style="margin-top: 16px; text-align: justify; font-size: 13pt; line-height: 1.55;">
        <p style="font-weight: bold; margin: 4px 0;">
          4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân:
        </p>
        ${submittedMeetings.map(m => {
          const opinions = m.minutes?.memberOpinions?.trim() || '';
          return `
            <div style="margin: 8px 0 10px 15px; text-align: justify;">
              <p style="margin: 2px 0; font-weight: bold;">
                • ${m.departmentName}:
              </p>
              <div style="padding-left: 15px;">
                ${opinions ? renderSmartTextParagraphs(opinions, false) : '<p style="margin: 2px 0; font-style: italic; color: #555;">(Không có ý kiến)</p>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- MỤC 5: KẾT LUẬN CỦA CHỦ TRÌ -->
      <div style="margin-top: 16px; text-align: justify; font-size: 13pt; line-height: 1.55;">
        <p style="font-weight: bold; margin: 4px 0;">
          5. Kết luận của chủ trì:
        </p>
        ${submittedMeetings.map(m => {
          const conclusion = m.minutes?.conclusion?.trim() || '';
          const chairName = m.minutes?.chairPerson || m.teacherName;
          return `
            <div style="margin: 8px 0 10px 15px; text-align: justify;">
              <p style="margin: 2px 0; font-weight: bold;">
                • ${m.departmentName} (${chairName} - Chủ trì):
              </p>
              <div style="padding-left: 15px;">
                ${conclusion ? renderSmartTextParagraphs(conclusion, false) : '<p style="margin: 2px 0; font-style: italic; color: #555;">(Không ghi nhận kết luận riêng)</p>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- MỤC 6: ĐỀ XUẤT, KIẾN NGHỊ VỚI NHÀ TRƯỜNG -->
      <div style="margin-top: 16px; text-align: justify; font-size: 13pt; line-height: 1.55;">
        <p style="font-weight: bold; margin: 4px 0;">
          6. Đề xuất, kiến nghị với nhà trường:
        </p>
        ${submittedMeetings.map(m => {
          const recs = m.minutes?.recommendations?.trim() || '';
          return `
            <div style="margin: 8px 0 10px 15px; text-align: justify;">
              <p style="margin: 2px 0; font-weight: bold;">
                • ${m.departmentName}:
              </p>
              <div style="padding-left: 15px;">
                ${recs ? renderSmartTextParagraphs(recs, false) : '<p style="margin: 2px 0; font-style: italic; color: #555;">(Không có đề xuất, kiến nghị)</p>'}
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- MỤC 7: NỘI DUNG VĂN BẢN BÁO CÁO BỔ SUNG CỦA TỔ (NẾU CÓ) -->
      ${(() => {
        const extraTextDepts = submittedMeetings.filter(m => m.reportContent && m.reportContent.trim());
        if (extraTextDepts.length === 0) return '';
        return `
          <div style="margin-top: 16px; text-align: justify; font-size: 13pt; line-height: 1.55;">
            <p style="font-weight: bold; margin: 4px 0;">
              7. Nội dung báo cáo văn bản &amp; ý kiến bổ sung từ các tổ:
            </p>
            ${extraTextDepts.map(m => `
              <div style="margin: 8px 0 10px 15px; text-align: justify;">
                <p style="margin: 2px 0; font-weight: bold;">
                  • ${m.departmentName} (Người gửi: ${m.teacherName}):
                </p>
                <div style="padding-left: 15px;">
                  ${renderSmartTextParagraphs(m.reportContent || '', false)}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      })()}

      <!-- MỤC 8: THỜI GIAN KẾT THÚC & THÔNG QUA BIÊN BẢN -->
      <div style="margin-top: 16px; text-align: justify; font-size: 13pt; line-height: 1.55;">
        ${submittedMeetings.filter(m => m.minutes?.endHour).map(m => `
          <p style="margin: 3px 0; text-indent: 15px; font-style: italic;">
            - Cuộc họp của <b>${m.departmentName}</b> kết thúc vào lúc ${m.minutes!.endHour} giờ ${m.minutes!.endMinute || '00'} phút cùng ngày; biên bản đã được thông qua toàn thể cuộc họp và thống nhất ký tên lưu hồ sơ./.
          </p>
        `).join('')}
      </div>
    `}
  `;
}

/**
 * 2. TẠO TÀI LIỆU WORD TỔNG HỢP CHI TIẾT (SẮP XẾP THEO TỪNG ĐỀ MỤC TRONG BIỂU MẪU)
 */
export function generateConsolidatedWordHtml(
  data: PeriodConsolidationResult,
  schoolInfo: SchoolInfo,
  currentUser: User
): string {
  const reportTitleInfo = formatReportTitleHeader(data.period?.title || data.periodTitle);
  const isMeetingMinutesReport = 
    data.isDeptMeetingAudience ||
    (data.period?.title || data.periodTitle || '').toLowerCase().includes('họp tổ') ||
    (data.period?.title || data.periodTitle || '').toLowerCase().includes('biên bản') ||
    data.period?.targetAudience === 'dept_heads_only' ||
    (data.deptMeetingMinutesList && data.deptMeetingMinutesList.length > 0 && data.deptMeetingMinutesList.some(d => d.hasSubmitted && d.minutes));
  const isHomeroom = data.period?.targetAudience === 'homeroom_teachers' ||
    data.period?.targetAudience === 'gvcn_diem_chinh' ||
    data.period?.targetAudience === 'gvcn_doc_binh_kieu' ||
    data.period?.targetAudience === 'gvcn_tan_kieu' ||
    (!data.period?.targetAudience && (data.periodTitle.toLowerCase().includes('chủ nhiệm') || data.periodTitle.toLowerCase().includes('53 lớp')));
  const isDeptHead = data.isDeptHeadAudience;

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const parts = todayStr.split('/');
  const day = parts[0] || '28';
  const month = parts[1] || '08';
  const year = parts[2] || '2026';

  // Render các đề mục và câu hỏi trong form
  let formBreakdownHtml = '';
  if (data.questionsBreakdown && data.questionsBreakdown.length > 0) {
    formBreakdownHtml = data.questionsBreakdown.map(item => {
      // 1. Phân đoạn / Section
      if (item.field.type === 'section') {
        return `
          <div style="background-color: #ecfdf5; border: 1.5px solid #059669; padding: 8px 12px; margin-top: 20px; margin-bottom: 12px; border-radius: 4px;">
            <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase; color: #065f46;">
              📌 ${item.field.label}
            </div>
            ${item.field.description ? `<div style="font-size: 10pt; color: #047857; margin-top: 3px; font-style: italic;">${item.field.description}</div>` : ''}
          </div>
        `;
      }

      // 2. Trắc nghiệm (Radio / Dropdown / Select)
      if (item.field.type === 'radio' || item.field.type === 'dropdown' || item.field.type === 'select') {
        const optionRows = (item.optionStats || []).map(opt => `
          <tr>
            <td style="border: 1px solid #333; padding: 6px 8px; font-weight: 500;">${opt.option}</td>
            <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${opt.count}</td>
            <td style="border: 1px solid #333; padding: 6px; text-align: center;">${opt.percentage}%</td>
            <td style="border: 1px solid #333; padding: 6px 8px; font-size: 9.5pt; color: #374151;">${opt.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'}</td>
          </tr>
        `).join('');

        return `
          <div style="margin-top: 14px; margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 11pt; color: #111827;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="font-weight: normal; font-size: 9.5pt; color: #4b5563; font-style: italic;">(Đã phản hồi: ${item.totalAnswered}/${item.totalExpected} - Tỷ lệ: ${item.responseRate}%)</span>
            </div>
            ${item.field.description ? `<div style="font-size: 9.5pt; color: #6b7280; font-style: italic; margin-bottom: 5px;">${item.field.description}</div>` : ''}
            <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #333; padding: 6px; width: 35%; text-align: left;">Phương án lựa chọn</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 15%; text-align: center;">Số lượt</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 15%; text-align: center;">Tỷ lệ (%)</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 35%; text-align: left;">Người / Đơn vị đã chọn</th>
                </tr>
              </thead>
              <tbody>
                ${optionRows}
              </tbody>
            </table>
          </div>
        `;
      }

      // 3. Hộp kiểm (Checkbox)
      if (item.field.type === 'checkbox') {
        let rowsHtml = '';
        if (item.optionStats && item.optionStats.length > 0) {
          rowsHtml = item.optionStats.map(opt => `
            <tr>
              <td style="border: 1px solid #333; padding: 6px 8px; font-weight: 500;">${opt.option}</td>
              <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${opt.count}</td>
              <td style="border: 1px solid #333; padding: 6px; text-align: center;">${opt.percentage}%</td>
              <td style="border: 1px solid #333; padding: 6px 8px; font-size: 9.5pt; color: #374151;">${opt.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'}</td>
            </tr>
          `).join('');
        } else if (item.singleCheckboxStat) {
          rowsHtml = `
            <tr>
              <td style="border: 1px solid #333; padding: 6px 8px; font-weight: 500;">Đã hoàn thành / Xác nhận đạt yêu cầu</td>
              <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${item.singleCheckboxStat.checkedCount}</td>
              <td style="border: 1px solid #333; padding: 6px; text-align: center;">${item.singleCheckboxStat.percentage}%</td>
              <td style="border: 1px solid #333; padding: 6px 8px; font-size: 9.5pt; color: #374151;">${item.singleCheckboxStat.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'}</td>
            </tr>
          `;
        }

        return `
          <div style="margin-top: 14px; margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 11pt; color: #111827;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="font-weight: normal; font-size: 9.5pt; color: #4b5563; font-style: italic;">(Đã phản hồi: ${item.totalAnswered}/${item.totalExpected} - Tỷ lệ: ${item.responseRate}%)</span>
            </div>
            ${item.field.description ? `<div style="font-size: 9.5pt; color: #6b7280; font-style: italic; margin-bottom: 5px;">${item.field.description}</div>` : ''}
            <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #333; padding: 6px; width: 35%; text-align: left;">Tiêu chí / Phương án</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 15%; text-align: center;">Số lượt</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 15%; text-align: center;">Tỷ lệ (%)</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 35%; text-align: left;">Người / Đơn vị thực hiện</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      }

      // 4. Thang điểm đánh giá (Scale)
      if (item.field.type === 'scale') {
        const scaleRows = (item.scaleStats?.levels || []).map(lvl => `
          <tr>
            <td style="border: 1px solid #333; padding: 6px 8px; font-weight: 500;">Mức ${lvl.level} ${lvl.level === (item.scaleStats?.min || 1) ? `(${item.scaleStats?.minLabel || 'Thấp nhất'})` : lvl.level === (item.scaleStats?.max || 5) ? `(${item.scaleStats?.maxLabel || 'Cao nhất'})` : ''}</td>
            <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">${lvl.count}</td>
            <td style="border: 1px solid #333; padding: 6px; text-align: center;">${lvl.percentage}%</td>
            <td style="border: 1px solid #333; padding: 6px 8px; font-size: 9.5pt; color: #374151;">${lvl.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'}</td>
          </tr>
        `).join('');

        return `
          <div style="margin-top: 14px; margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 11pt; color: #111827;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="font-weight: bold; color: #b45309; font-size: 10pt;"> • Điểm đánh giá trung bình: ⭐ ${item.scaleStats?.average || 0} / ${item.scaleStats?.max || 5}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt;">
              <thead>
                <tr style="background-color: #fef3c7;">
                  <th style="border: 1px solid #333; padding: 6px; width: 35%; text-align: left;">Thang Điểm Đánh Giá</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 15%; text-align: center;">Số Lượt</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 15%; text-align: center;">Tỷ Lệ (%)</th>
                  <th style="border: 1px solid #333; padding: 6px; width: 35%; text-align: left;">Thành Viên Đánh Giá</th>
                </tr>
              </thead>
              <tbody>
                ${scaleRows}
              </tbody>
            </table>
          </div>
        `;
      }

      // 5. Chỉ tiêu số (Number)
      if (item.field.type === 'number') {
        const numRows = (item.numberStats?.entries || []).map((e, idx) => `
          <tr>
            <td style="border: 1px solid #333; padding: 5px; text-align: center;">${idx + 1}</td>
            <td style="border: 1px solid #333; padding: 5px 8px; font-weight: 500;">${e.authorName}</td>
            <td style="border: 1px solid #333; padding: 5px 8px;">${e.unit}</td>
            <td style="border: 1px solid #333; padding: 5px; text-align: right; font-weight: bold; color: #047857;">${e.value.toLocaleString('vi-VN')}</td>
          </tr>
        `).join('');

        return `
          <div style="margin-top: 14px; margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 11pt; color: #111827;">
              Câu ${item.questionNumber}: ${item.field.label}
            </div>
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 6px 10px; margin-top: 4px; margin-bottom: 6px; font-size: 10pt; display: flex; gap: 15px;">
              <span><b>Tổng cộng:</b> ${item.numberStats?.sum?.toLocaleString('vi-VN') || 0}</span> |
              <span><b>Trung bình:</b> ${item.numberStats?.average || 0}</span> |
              <span><b>Cao nhất:</b> ${item.numberStats?.max || 0}</span> |
              <span><b>Thấp nhất:</b> ${item.numberStats?.min || 0}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10pt;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #333; padding: 5px; width: 40px; text-align: center;">STT</th>
                  <th style="border: 1px solid #333; padding: 5px 8px; text-align: left;">Họ và Tên Người Nộp</th>
                  <th style="border: 1px solid #333; padding: 5px 8px; text-align: left;">Đơn Vị / Lớp</th>
                  <th style="border: 1px solid #333; padding: 5px 8px; text-align: right; width: 110px;">Số Lượng</th>
                </tr>
              </thead>
              <tbody>
                ${numRows}
              </tbody>
            </table>
          </div>
        `;
      }

      // 6. Tự luận (Text / Textarea)
      if (item.field.type === 'text' || item.field.type === 'textarea') {
        const textRows = (item.textEntries || []).map((t, idx) => `
          <tr>
            <td style="border: 1px solid #333; padding: 6px; text-align: center; vertical-align: top;">${idx + 1}</td>
            <td style="border: 1px solid #333; padding: 6px 8px; font-weight: 500; vertical-align: top;">${t.authorName}</td>
            <td style="border: 1px solid #333; padding: 6px 8px; vertical-align: top;">${t.unit}</td>
            <td style="border: 1px solid #333; padding: 6px 8px; vertical-align: top; text-align: justify; line-height: 1.4;">${t.value || '-'}</td>
          </tr>
        `).join('');

        return `
          <div style="margin-top: 14px; margin-bottom: 12px;">
            <div style="font-weight: bold; font-size: 11pt; color: #111827;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="font-weight: normal; font-size: 9.5pt; color: #4b5563; font-style: italic;">(${item.totalAnswered} ý kiến phản hồi)</span>
            </div>
            ${item.field.description ? `<div style="font-size: 9.5pt; color: #6b7280; font-style: italic; margin-bottom: 5px;">${item.field.description}</div>` : ''}
            <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #333; padding: 6px; width: 35px; text-align: center;">STT</th>
                  <th style="border: 1px solid #333; padding: 6px 8px; width: 140px; text-align: left;">Họ và Tên</th>
                  <th style="border: 1px solid #333; padding: 6px 8px; width: 110px; text-align: left;">Đơn Vị / Lớp</th>
                  <th style="border: 1px solid #333; padding: 6px 8px; text-align: left;">Nội Dung Ý Kiến Chi Tiết</th>
                </tr>
              </thead>
              <tbody>
                ${textRows || '<tr><td colspan="4" style="border: 1px solid #333; padding: 8px; text-align: center; color: #6b7280; font-style: italic;">Chưa có phản hồi</td></tr>'}
              </tbody>
            </table>
          </div>
        `;
      }

      // 7. Khác (Date, Time, File, ...)
      const genRows = (item.generalEntries || []).map((g, idx) => `
        <tr>
          <td style="border: 1px solid #333; padding: 6px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #333; padding: 6px 8px; font-weight: 500;">${g.authorName}</td>
          <td style="border: 1px solid #333; padding: 6px 8px;">${g.unit}</td>
          <td style="border: 1px solid #333; padding: 6px 8px;">${String(g.value ?? '-')}</td>
        </tr>
      `).join('');

      return `
        <div style="margin-top: 14px; margin-bottom: 12px;">
          <div style="font-weight: bold; font-size: 11pt; color: #111827;">
            Câu ${item.questionNumber}: ${item.field.label}
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #333; padding: 6px; width: 35px; text-align: center;">STT</th>
                <th style="border: 1px solid #333; padding: 6px 8px; width: 150px; text-align: left;">Họ và Tên</th>
                <th style="border: 1px solid #333; padding: 6px 8px; width: 120px; text-align: left;">Đơn Vị / Lớp</th>
                <th style="border: 1px solid #333; padding: 6px 8px; text-align: left;">Giá Trị Ghi Nhận</th>
              </tr>
            </thead>
            <tbody>
              ${genRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  } else if (data.feedbacks && data.feedbacks.length > 0) {
    // Báo cáo dạng tự do nếu không có form câu hỏi
    const subRows = data.feedbacks.map((f, idx) => `
      <tr>
        <td style="border: 1px solid #333; padding: 6px; text-align: center; vertical-align: top;">${idx + 1}</td>
        <td style="border: 1px solid #333; padding: 6px 8px; font-weight: 500; vertical-align: top;">${f.authorName}</td>
        <td style="border: 1px solid #333; padding: 6px 8px; vertical-align: top;">${f.className}</td>
        <td style="border: 1px solid #333; padding: 6px 8px; vertical-align: top;"><b>${f.title}</b><br/>${f.content}</td>
        <td style="border: 1px solid #333; padding: 6px 8px; vertical-align: top; color: #4b5563;">${f.notes || '-'}</td>
      </tr>
    `).join('');

    formBreakdownHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #333; padding: 6px; width: 35px; text-align: center;">STT</th>
            <th style="border: 1px solid #333; padding: 6px 8px; width: 140px; text-align: left;">Họ và Tên</th>
            <th style="border: 1px solid #333; padding: 6px 8px; width: 110px; text-align: left;">Đơn Vị / Lớp</th>
            <th style="border: 1px solid #333; padding: 6px 8px; text-align: left;">Nội Dung Báo Cáo Chi Tiết</th>
            <th style="border: 1px solid #333; padding: 6px 8px; width: 150px; text-align: left;">Ý Kiến / Ghi Chú</th>
          </tr>
        </thead>
        <tbody>
          ${subRows}
        </tbody>
      </table>
    `;
  }

  // Dynamic tables HTML
  let dynamicTablesHtml = '';
  if (data.dynamicTables && data.dynamicTables.length > 0) {
    dynamicTablesHtml = data.dynamicTables.map((tbl, tIdx) => {
      const meaningfulRows = tbl.rows.filter(r => isMeaningfulTableRow(r.data, tbl.headers));
      if (meaningfulRows.length === 0) return '';
      const ths = tbl.headers.map(h => `<th style="border: 1px solid #333; padding: 6px; text-align: left;">${h}</th>`).join('');
      const trs = meaningfulRows.map((r, rIdx) => {
        const tds = tbl.headers.map(h => `<td style="border: 1px solid #333; padding: 6px;">${(r.data && r.data[h] !== undefined) ? r.data[h] : ((r as any)[h] ?? '')}</td>`).join('');
        return `
          <tr>
            <td style="border: 1px solid #333; padding: 6px; text-align: center;">${rIdx + 1}</td>
            <td style="border: 1px solid #333; padding: 6px; font-weight: 500;">${r.className}</td>
            <td style="border: 1px solid #333; padding: 6px;">${r.authorName}</td>
            ${tds}
          </tr>
        `;
      }).join('');

      return `
        <div style="margin-top: 16px; margin-bottom: 12px;">
          <div style="font-weight: bold; font-size: 11pt; color: #1e3a8a;">Bảng ${tIdx + 1}: ${tbl.title}</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt;">
            <thead>
              <tr style="background-color: #eff6ff;">
                <th style="border: 1px solid #333; padding: 6px; width: 35px; text-align: center;">STT</th>
                <th style="border: 1px solid #333; padding: 6px; width: 100px; text-align: left;">Lớp / Đơn Vị</th>
                <th style="border: 1px solid #333; padding: 6px; width: 130px; text-align: left;">Người Báo Cáo</th>
                ${ths}
              </tr>
            </thead>
            <tbody>
              ${trs}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  }

  // Homeroom specifics: Sĩ số 53 lớp & Học sinh chưa ra lớp
  let homeroomSectionHtml = '';
  if (isHomeroom) {
    const absentTrs = (data.absentStudents || []).map((s, idx) => `
      <tr>
        <td style="border: 1px solid #333; padding: 5px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold;">${s.className}</td>
        <td style="border: 1px solid #333; padding: 5px; font-weight: 500;">${s.studentName}</td>
        <td style="border: 1px solid #333; padding: 5px;">${s.currentAddress || '-'}</td>
        <td style="border: 1px solid #333; padding: 5px;">${s.parentPhone || s.studentPhone || '-'}</td>
        <td style="border: 1px solid #333; padding: 5px; color: #b91c1c;">${s.reason || 'Chưa rõ'}</td>
      </tr>
    `).join('');

    homeroomSectionHtml = `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
          III. TỔNG HỢP SĨ SỐ TOÀN TRƯỜNG & DANH SÁCH HỌC SINH CHƯA RA LỚP
        </h3>
        <p style="font-size: 10.5pt; line-height: 1.6;">
          - <b>Tổng sĩ số học sinh ghi nhận:</b> ${data.totalEnrolledStudents.toLocaleString('vi-VN')} học sinh.<br/>
          - <b>Số học sinh hiện diện (đã ra lớp):</b> ${data.totalPresentStudents.toLocaleString('vi-VN')} học sinh.<br/>
          - <b>Số học sinh chưa ra lớp:</b> <span style="color: #b91c1c; font-weight: bold;">${data.totalAbsentStudents} em</span> (Tỷ lệ ra lớp toàn trường: <b>${data.overallAttendanceRate}%</b>).
        </p>

        <div style="font-weight: bold; font-size: 10.5pt; margin-top: 10px; margin-bottom: 6px;">
          Danh Sách Học Sinh Chưa Ra Lớp (${data.absentStudents?.length || 0} em):
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt;">
          <thead>
            <tr style="background-color: #fee2e2;">
              <th style="border: 1px solid #333; padding: 5px; width: 35px; text-align: center;">STT</th>
              <th style="border: 1px solid #333; padding: 5px; width: 70px; text-align: center;">Lớp</th>
              <th style="border: 1px solid #333; padding: 5px; width: 140px; text-align: left;">Họ và Tên Học Sinh</th>
              <th style="border: 1px solid #333; padding: 5px; text-align: left;">Địa Chỉ Hiện Tại</th>
              <th style="border: 1px solid #333; padding: 5px; width: 100px; text-align: left;">SĐT Phụ Huynh</th>
              <th style="border: 1px solid #333; padding: 5px; width: 160px; text-align: left;">Tình Trạng / Lý Do</th>
            </tr>
          </thead>
          <tbody>
            ${absentTrs || '<tr><td colspan="6" style="border: 1px solid #333; padding: 8px; text-align: center; color: #059669; font-weight: bold;">Toàn bộ 100% học sinh các lớp đã ra lớp đầy đủ!</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } else if (isDeptHead && data.deptHeadStats && data.deptHeadStats.length > 0) {
    const deptTrs = data.deptHeadStats.map((d, idx) => `
      <tr>
        <td style="border: 1px solid #333; padding: 5px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #333; padding: 5px; font-weight: 500;">${d.departmentName}</td>
        <td style="border: 1px solid #333; padding: 5px;">${d.teacherName}</td>
        <td style="border: 1px solid #333; padding: 5px; text-align: center;">${d.hasSubmitted ? '<span style="color: #047857; font-weight: bold;">Đã nộp</span>' : '<span style="color: #b91c1c;">Chưa nộp</span>'}</td>
        <td style="border: 1px solid #333; padding: 5px;">${d.reportTitle || d.summaryNote || '-'}</td>
      </tr>
    `).join('');

    homeroomSectionHtml = `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
          III. TIẾN ĐỘ THỰC HIỆN CỦA TỔ TRƯỞNG CHUYÊN MÔN
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 8px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #333; padding: 5px; width: 35px; text-align: center;">STT</th>
              <th style="border: 1px solid #333; padding: 5px; width: 140px; text-align: left;">Tổ Chuyên Môn</th>
              <th style="border: 1px solid #333; padding: 5px; width: 150px; text-align: left;">Họ và Tên Tổ Trưởng</th>
              <th style="border: 1px solid #333; padding: 5px; width: 90px; text-align: center;">Trạng Thái</th>
              <th style="border: 1px solid #333; padding: 5px; text-align: left;">Nội Dung Ghi Nhận</th>
            </tr>
          </thead>
          <tbody>
            ${deptTrs}
          </tbody>
        </table>
      </div>
    `;
  }

  // Feedback section
  let feedbackSectionHtml = '';
  const feedbacksWithNotes = (data.feedbacks || []).filter(f => f.notes && f.notes.trim() !== '');
  if (feedbacksWithNotes.length > 0) {
    const fbTrs = feedbacksWithNotes.map((f, idx) => `
      <tr>
        <td style="border: 1px solid #333; padding: 5px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #333; padding: 5px; font-weight: 500;">${f.authorName}</td>
        <td style="border: 1px solid #333; padding: 5px;">${f.className}</td>
        <td style="border: 1px solid #333; padding: 5px; text-align: justify;">${f.notes}</td>
      </tr>
    `).join('');

    feedbackSectionHtml = `
      <div style="margin-top: 20px;">
        <h3 style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
          IV. TỔNG HỢP Ý KIẾN VÀ ĐỀ XUẤT KIẾN NGHỊ VỚI BAN GIÁM HIỆU
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin-top: 8px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #333; padding: 5px; width: 35px; text-align: center;">STT</th>
              <th style="border: 1px solid #333; padding: 5px; width: 140px; text-align: left;">Họ và Tên</th>
              <th style="border: 1px solid #333; padding: 5px; width: 100px; text-align: left;">Đơn Vị / Lớp</th>
              <th style="border: 1px solid #333; padding: 5px; text-align: left;">Nội Dung Đề Xuất / Kiến Nghị</th>
            </tr>
          </thead>
          <tbody>
            ${fbTrs}
          </tbody>
        </table>
      </div>
    `;
  }

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Báo Cáo Tổng Hợp: ${data.period?.title || data.periodTitle}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        @page WordSection1 {
          size: 210mm 297mm;
          margin: 20mm 15mm 20mm 15mm;
          mso-header-margin: 35.4pt;
          mso-footer-margin: 35.4pt;
          mso-paper-source: 0;
        }
        div.WordSection1 { page: WordSection1; }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 12pt;
          line-height: 1.35;
          color: #000;
        }
        table { border-collapse: collapse; }
      </style>
    </head>
    <body>
      <div class="WordSection1">
        <!-- HEADER CỘNG HÒA VÀ TRƯỜNG (CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP) -->
        <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 16px;">
          <tr>
            <td style="width: 45%; text-align: center; vertical-align: top; border: none; padding: 0;">
              <div style="font-size: 11pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
              <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">TRƯỜNG THCS VÀ THPT</div>
              <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">ĐỐC BINH KIỀU</div>
              <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 4px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 90px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
              </div>
              <div style="font-size: 11pt; margin-top: 6px;">Số: &nbsp; &nbsp; /BC-THCS&amp;THPTĐBK</div>
            </td>
            <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
              <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-size: 11.5pt; font-weight: bold; margin-top: 2px;">Độc lập – Tự do – Hạnh phúc</div>
              <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 4px; margin-bottom: 4px;">
                <span style="display: inline-block; width: 170px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
              </div>
              <div style="font-size: 11pt; font-style: italic; margin-top: 6px;">Đồng Tháp, ngày &nbsp; &nbsp; &nbsp; &nbsp; tháng &nbsp; &nbsp; &nbsp; &nbsp; năm ${year || '2026'}</div>
            </td>
          </tr>
        </table>

        <!-- TIÊU ĐỀ BÁO CÁO -->
        <div style="text-align: center; margin-top: 16px; margin-bottom: 22px;">
          <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0; color: #000;">
            ${reportTitleInfo.mainType}
          </div>
          <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0; color: #000; line-height: 1.35;">
            ${reportTitleInfo.subTitle}
          </div>
          <table align="center" style="border: none; border-collapse: collapse; margin: 6px auto 16px auto;">
            <tr>
              <td style="width: 220px; border-top: 1.5px solid #000; height: 1px; padding: 0; font-size: 1px; line-height: 1px;">&nbsp;</td>
            </tr>
          </table>
        </div>

        ${isMeetingMinutesReport ? `
          <!-- BÁO CÁO TỔNG HỢP BIÊN BẢN HỌP CỦA CÁC TỔ CHUYÊN MÔN -->
          ${renderConsolidatedDepartmentMeetingContent(data, currentUser, schoolInfo, year)}

          ${formBreakdownHtml ? `
            <div style="margin-top: 24px;">
              <h3 style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
                TỔNG HỢP CHI TIẾT THEO CÁC CÂU HỎI &amp; CHỈ SỐ BIỂU MẪU ĐỢT BÁO CÁO
              </h3>
              ${formBreakdownHtml}
            </div>
          ` : ''}

          ${dynamicTablesHtml ? `
            <div style="margin-top: 24px;">
              <h3 style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
                CÁC BẢNG SỐ LIỆU ĐỘNG TỔNG HỢP
              </h3>
              ${dynamicTablesHtml}
            </div>
          ` : ''}
        ` : `
          <!-- PHẦN I: TỔNG QUAN TIẾN ĐỘ -->
          <div style="margin-top: 14px;">
            <h3 style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
              I. TỔNG QUAN TIẾN ĐỘ THỰC HIỆN
            </h3>
            <p style="font-size: 10.5pt; line-height: 1.6; margin-top: 6px;">
              - <b>Tên đợt báo cáo:</b> ${data.period?.title || data.periodTitle}<br/>
              - <b>Đối tượng yêu cầu nộp:</b> ${data.targetAudienceLabel} (Tổng số: ${data.totalTargetCount})<br/>
              - <b>Số lượng đã nộp:</b> <b>${data.submittedCount} / ${data.totalTargetCount}</b> thành viên (Tỷ lệ hoàn thành: <b style="color: #047857;">${data.completionRate}%</b>)<br/>
              - <b>Số lượng chưa nộp:</b> ${data.pendingCount} thành viên<br/>
              - <b>Hạn chót quy định:</b> ${data.period?.deadline || 'Không ấn định'}
            </p>
          </div>

          <!-- PHẦN II: KẾT QUẢ TỔNG HỢP THEO TỪNG ĐỀ MỤC TRONG BIỂU MẪU -->
          <div style="margin-top: 20px;">
            <h3 style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
              II. KẾT QUẢ TỔNG HỢP CHI TIẾT THEO TỪNG ĐỀ MỤC &amp; CÂU HỎI BIỂU MẪU
            </h3>
            ${formBreakdownHtml}
          </div>

          <!-- PHẦN III: CÁC BẢNG SỐ LIỆU ĐỘNG (NẾU CÓ) -->
          ${dynamicTablesHtml ? `
            <div style="margin-top: 20px;">
              <h3 style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1.5px solid #000; padding-bottom: 4px;">
                CÁC BẢNG SỐ LIỆU ĐỘNG TỔNG HỢP
              </h3>
              ${dynamicTablesHtml}
            </div>
          ` : ''}

          <!-- PHẦN IV: SĨ SỐ 53 LỚP HOẶC TIẾN ĐỘ TỔ TRƯỞNG -->
          ${homeroomSectionHtml}

          <!-- PHẦN V: Ý KIẾN KIẾN NGHỊ -->
          ${feedbackSectionHtml}
        `}

        <!-- CHỮ KÝ PHÊ DUYỆT -->
        <div style="margin-top: 40px; page-break-inside: avoid;">
          <table style="width: 100%; border: none;">
            <tr>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                <div style="font-weight: bold; text-transform: uppercase; font-size: 10.5pt;">NGƯỜI LẬP BIỂU</div>
                <div style="font-size: 9.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: bold; font-size: 11pt;">${currentUser.name}</div>
                <div style="font-size: 9.5pt;">${currentUser.roleTitle}</div>
              </td>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                <div style="font-weight: bold; text-transform: uppercase; font-size: 10.5pt;">HIỆU TRƯỞNG</div>
                <div style="font-size: 9.5pt; font-style: italic;">(Ký tên, đóng dấu)</div>
                <div style="height: 60px;"></div>
                <div style="font-weight: bold; font-size: 11pt;">${schoolInfo.principalName}</div>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 3. TẠO HTML BẢNG IN A4 CHUẨN TRANG IN (SẮP XẾP THEO TỪNG ĐỀ MỤC TRONG FORM)
 */
export function generateConsolidatedPrintHtml(
  data: PeriodConsolidationResult,
  schoolInfo: SchoolInfo,
  currentUser: User
): string {
  const reportTitleInfo = formatReportTitleHeader(data.period?.title || data.periodTitle);
  const isMeetingMinutesReport = 
    data.isDeptMeetingAudience ||
    (data.period?.title || data.periodTitle || '').toLowerCase().includes('họp tổ') ||
    (data.period?.title || data.periodTitle || '').toLowerCase().includes('biên bản') ||
    data.period?.targetAudience === 'dept_heads_only' ||
    (data.deptMeetingMinutesList && data.deptMeetingMinutesList.length > 0 && data.deptMeetingMinutesList.some(d => d.hasSubmitted && d.minutes));
  const isHomeroom = data.period?.targetAudience === 'homeroom_teachers' ||
    data.period?.targetAudience === 'gvcn_diem_chinh' ||
    data.period?.targetAudience === 'gvcn_doc_binh_kieu' ||
    data.period?.targetAudience === 'gvcn_tan_kieu' ||
    (!data.period?.targetAudience && (data.periodTitle.toLowerCase().includes('chủ nhiệm') || data.periodTitle.toLowerCase().includes('53 lớp')));
  const isDeptHead = data.isDeptHeadAudience;

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const parts = todayStr.split('/');
  const day = parts[0] || '28';
  const month = parts[1] || '08';
  const year = parts[2] || '2026';

  // Render các đề mục và câu hỏi cho trang In A4
  let printBreakdownHtml = '';
  if (data.questionsBreakdown && data.questionsBreakdown.length > 0) {
    printBreakdownHtml = data.questionsBreakdown.map(item => {
      // 1. Phân đoạn / Section
      if (item.field.type === 'section') {
        return `
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 6px 10px; margin-top: 16px; margin-bottom: 8px;">
            <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase; color: #166534;">
              📌 ${item.field.label}
            </div>
            ${item.field.description ? `<div style="font-size: 9pt; color: #15803d; font-style: italic;">${item.field.description}</div>` : ''}
          </div>
        `;
      }

      // 2. Trắc nghiệm (Radio / Dropdown / Select)
      if (item.field.type === 'radio' || item.field.type === 'dropdown' || item.field.type === 'select') {
        const rows = (item.optionStats || []).map(opt => `
          <tr>
            <td style="border: 1px solid #333; padding: 5px 8px; font-weight: 500;">${opt.option}</td>
            <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold;">${opt.count}</td>
            <td style="border: 1px solid #333; padding: 5px; text-align: center;">${opt.percentage}%</td>
            <td style="border: 1px solid #333; padding: 5px 8px; font-size: 9pt;">${opt.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'}</td>
          </tr>
        `).join('');

        return `
          <div style="margin-top: 12px; margin-bottom: 10px; page-break-inside: avoid;">
            <div style="font-weight: bold; font-size: 10.5pt;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="font-weight: normal; font-size: 9pt; color: #555; font-style: italic;">(Đã phản hồi: ${item.totalAnswered}/${item.totalExpected} - Tỷ lệ: ${item.responseRate}%)</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9.5pt;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #333; padding: 5px; width: 35%; text-align: left;">Phương án</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 15%; text-align: center;">Số lượt</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 15%; text-align: center;">Tỷ lệ (%)</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 35%; text-align: left;">Người / Đơn vị đã chọn</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }

      // 3. Hộp kiểm (Checkbox)
      if (item.field.type === 'checkbox') {
        let rows = '';
        if (item.optionStats && item.optionStats.length > 0) {
          rows = item.optionStats.map(opt => `
            <tr>
              <td style="border: 1px solid #333; padding: 5px 8px; font-weight: 500;">${opt.option}</td>
              <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold;">${opt.count}</td>
              <td style="border: 1px solid #333; padding: 5px; text-align: center;">${opt.percentage}%</td>
              <td style="border: 1px solid #333; padding: 5px 8px; font-size: 9pt;">${opt.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'}</td>
            </tr>
          `).join('');
        } else if (item.singleCheckboxStat) {
          rows = `
            <tr>
              <td style="border: 1px solid #333; padding: 5px 8px; font-weight: 500;">Xác nhận hoàn thành / Đạt chuẩn</td>
              <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold;">${item.singleCheckboxStat.checkedCount}</td>
              <td style="border: 1px solid #333; padding: 5px; text-align: center;">${item.singleCheckboxStat.percentage}%</td>
              <td style="border: 1px solid #333; padding: 5px 8px; font-size: 9pt;">${item.singleCheckboxStat.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'}</td>
            </tr>
          `;
        }

        return `
          <div style="margin-top: 12px; margin-bottom: 10px; page-break-inside: avoid;">
            <div style="font-weight: bold; font-size: 10.5pt;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="font-weight: normal; font-size: 9pt; color: #555; font-style: italic;">(Đã phản hồi: ${item.totalAnswered}/${item.totalExpected} - ${item.responseRate}%)</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9.5pt;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #333; padding: 5px; width: 35%; text-align: left;">Tiêu chí</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 15%; text-align: center;">Số lượt</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 15%; text-align: center;">Tỷ lệ (%)</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 35%; text-align: left;">Người / Đơn vị thực hiện</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }

      // 4. Thang điểm đánh giá (Scale)
      if (item.field.type === 'scale') {
        const rows = (item.scaleStats?.levels || []).map(lvl => `
          <tr>
            <td style="border: 1px solid #333; padding: 5px 8px; font-weight: 500;">Mức ${lvl.level}</td>
            <td style="border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold;">${lvl.count}</td>
            <td style="border: 1px solid #333; padding: 5px; text-align: center;">${lvl.percentage}%</td>
            <td style="border: 1px solid #333; padding: 5px 8px; font-size: 9pt;">${lvl.respondents.map(r => `${r.authorName} (${r.unit})`).join(', ') || '-'}</td>
          </tr>
        `).join('');

        return `
          <div style="margin-top: 12px; margin-bottom: 10px; page-break-inside: avoid;">
            <div style="font-weight: bold; font-size: 10.5pt;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="color: #b45309; font-weight: bold; font-size: 9.5pt;"> • Điểm TB: ⭐ ${item.scaleStats?.average || 0} / ${item.scaleStats?.max || 5}</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9.5pt;">
              <thead>
                <tr style="background-color: #fef3c7;">
                  <th style="border: 1px solid #333; padding: 5px; width: 35%; text-align: left;">Thang Điểm</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 15%; text-align: center;">Số Lượt</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 15%; text-align: center;">Tỷ Lệ (%)</th>
                  <th style="border: 1px solid #333; padding: 5px; width: 35%; text-align: left;">Thành Viên Đánh Giá</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }

      // 5. Chỉ tiêu số (Number)
      if (item.field.type === 'number') {
        const rows = (item.numberStats?.entries || []).map((e, idx) => `
          <tr>
            <td style="border: 1px solid #333; padding: 4px; text-align: center;">${idx + 1}</td>
            <td style="border: 1px solid #333; padding: 4px 8px; font-weight: 500;">${e.authorName}</td>
            <td style="border: 1px solid #333; padding: 4px 8px;">${e.unit}</td>
            <td style="border: 1px solid #333; padding: 4px 8px; text-align: right; font-weight: bold;">${e.value.toLocaleString('vi-VN')}</td>
          </tr>
        `).join('');

        return `
          <div style="margin-top: 12px; margin-bottom: 10px; page-break-inside: avoid;">
            <div style="font-weight: bold; font-size: 10.5pt;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="font-weight: normal; font-size: 9pt; color: #15803d;">(Tổng: ${item.numberStats?.sum?.toLocaleString('vi-VN') || 0} • TB: ${item.numberStats?.average || 0})</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9pt;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #333; padding: 4px; width: 35px; text-align: center;">STT</th>
                  <th style="border: 1px solid #333; padding: 4px 8px; text-align: left;">Họ và Tên</th>
                  <th style="border: 1px solid #333; padding: 4px 8px; text-align: left;">Đơn Vị / Lớp</th>
                  <th style="border: 1px solid #333; padding: 4px 8px; text-align: right; width: 100px;">Số Lượng</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }

      // 6. Tự luận (Text / Textarea)
      if (item.field.type === 'text' || item.field.type === 'textarea') {
        const rows = (item.textEntries || []).map((t, idx) => `
          <tr>
            <td style="border: 1px solid #333; padding: 5px; text-align: center; vertical-align: top;">${idx + 1}</td>
            <td style="border: 1px solid #333; padding: 5px 8px; font-weight: 500; vertical-align: top;">${t.authorName}</td>
            <td style="border: 1px solid #333; padding: 5px 8px; vertical-align: top;">${t.unit}</td>
            <td style="border: 1px solid #333; padding: 5px 8px; vertical-align: top; text-align: justify;">${t.value || '-'}</td>
          </tr>
        `).join('');

        return `
          <div style="margin-top: 12px; margin-bottom: 10px; page-break-inside: avoid;">
            <div style="font-weight: bold; font-size: 10.5pt;">
              Câu ${item.questionNumber}: ${item.field.label}
              <span style="font-weight: normal; font-size: 9pt; color: #555; font-style: italic;">(${item.totalAnswered} phản hồi)</span>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9pt;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="border: 1px solid #333; padding: 5px; width: 35px; text-align: center;">STT</th>
                  <th style="border: 1px solid #333; padding: 5px 8px; width: 130px; text-align: left;">Họ và Tên</th>
                  <th style="border: 1px solid #333; padding: 5px 8px; width: 100px; text-align: left;">Đơn Vị / Lớp</th>
                  <th style="border: 1px solid #333; padding: 5px 8px; text-align: left;">Nội Dung Ý Kiến</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="4" style="border: 1px solid #333; padding: 6px; text-align: center; color: #666;">Chưa có phản hồi</td></tr>'}
              </tbody>
            </table>
          </div>
        `;
      }

      // Khác
      const rows = (item.generalEntries || []).map((g, idx) => `
        <tr>
          <td style="border: 1px solid #333; padding: 5px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #333; padding: 5px 8px; font-weight: 500;">${g.authorName}</td>
          <td style="border: 1px solid #333; padding: 5px 8px;">${g.unit}</td>
          <td style="border: 1px solid #333; padding: 5px 8px;">${String(g.value ?? '-')}</td>
        </tr>
      `).join('');

      return `
        <div style="margin-top: 12px; margin-bottom: 10px; page-break-inside: avoid;">
          <div style="font-weight: bold; font-size: 10.5pt;">Câu ${item.questionNumber}: ${item.field.label}</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9pt;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #333; padding: 5px; width: 35px; text-align: center;">STT</th>
                <th style="border: 1px solid #333; padding: 5px 8px; width: 140px; text-align: left;">Họ và Tên</th>
                <th style="border: 1px solid #333; padding: 5px 8px; width: 110px; text-align: left;">Đơn Vị / Lớp</th>
                <th style="border: 1px solid #333; padding: 5px 8px; text-align: left;">Giá Trị Ghi Nhận</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  }

  // Absent students table (if homeroom)
  let homeroomPrintHtml = '';
  if (isHomeroom) {
    const absentRows = (data.absentStudents || []).map((s, idx) => `
      <tr>
        <td style="border: 1px solid #333; padding: 4px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #333; padding: 4px; text-align: center; font-weight: bold;">${s.className}</td>
        <td style="border: 1px solid #333; padding: 4px 8px; font-weight: 500;">${s.studentName}</td>
        <td style="border: 1px solid #333; padding: 4px 8px;">${s.currentAddress || '-'}</td>
        <td style="border: 1px solid #333; padding: 4px 8px;">${s.parentPhone || s.studentPhone || '-'}</td>
        <td style="border: 1px solid #333; padding: 4px 8px; color: #b91c1c;">${s.reason || 'Chưa rõ'}</td>
      </tr>
    `).join('');

    homeroomPrintHtml = `
      <div style="margin-top: 16px; page-break-inside: avoid;">
        <h3 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #1e3a8a; border-bottom: 1px solid #1e3a8a; padding-bottom: 3px;">
          III. TỔNG HỢP SĨ SỐ TOÀN TRƯỜNG & HỌC SINH CHƯA RA LỚP
        </h3>
        <p style="font-size: 10pt; line-height: 1.5;">
          - <b>Sĩ số:</b> ${data.totalEnrolledStudents} HS (Hiện diện: ${data.totalPresentStudents} • Chưa ra lớp: <span style="color: #b91c1c; font-weight: bold;">${data.totalAbsentStudents} em</span> • Tỷ lệ: <b>${data.overallAttendanceRate}%</b>)
        </p>
        <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 4px;">
          <thead>
            <tr style="background-color: #fee2e2;">
              <th style="border: 1px solid #333; padding: 4px; width: 35px; text-align: center;">STT</th>
              <th style="border: 1px solid #333; padding: 4px; width: 60px; text-align: center;">Lớp</th>
              <th style="border: 1px solid #333; padding: 4px 8px; width: 130px; text-align: left;">Họ và Tên HS</th>
              <th style="border: 1px solid #333; padding: 4px 8px; text-align: left;">Địa Chỉ</th>
              <th style="border: 1px solid #333; padding: 4px 8px; width: 95px; text-align: left;">SĐT Phụ Huynh</th>
              <th style="border: 1px solid #333; padding: 4px 8px; width: 140px; text-align: left;">Lý Do</th>
            </tr>
          </thead>
          <tbody>
            ${absentRows || '<tr><td colspan="6" style="border: 1px solid #333; padding: 6px; text-align: center; color: #15803d; font-weight: bold;">100% học sinh đã ra lớp đầy đủ!</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // Render Dynamic Tables for Print
  let dynamicTablesPrintHtml = '';
  if (data.dynamicTables && data.dynamicTables.length > 0) {
    dynamicTablesPrintHtml = data.dynamicTables.map((tbl, tIdx) => {
      const meaningfulRows = tbl.rows.filter(r => isMeaningfulTableRow(r.data, tbl.headers));
      if (meaningfulRows.length === 0) return '';
      const ths = tbl.headers.map(h => `<th style="border: 1px solid #333; padding: 5px; text-align: left;">${h}</th>`).join('');
      const trs = meaningfulRows.map((r, rIdx) => {
        const tds = tbl.headers.map(h => `<td style="border: 1px solid #333; padding: 5px;">${(r.data && r.data[h] !== undefined) ? r.data[h] : ((r as any)[h] ?? '')}</td>`).join('');
        return `
          <tr>
            <td style="border: 1px solid #333; padding: 5px; text-align: center;">${rIdx + 1}</td>
            <td style="border: 1px solid #333; padding: 5px; font-weight: 500;">${r.className}</td>
            <td style="border: 1px solid #333; padding: 5px;">${r.authorName}</td>
            ${tds}
          </tr>
        `;
      }).join('');

      return `
        <div style="margin-top: 14px; margin-bottom: 10px; page-break-inside: avoid;">
          <div style="font-weight: bold; font-size: 10.5pt; color: #000;">Bảng ${tIdx + 1}: ${tbl.title}</div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 9pt;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid #333; padding: 5px; width: 35px; text-align: center;">STT</th>
                <th style="border: 1px solid #333; padding: 5px; width: 90px; text-align: left;">Lớp / Đơn Vị</th>
                <th style="border: 1px solid #333; padding: 5px; width: 120px; text-align: left;">Người Báo Cáo</th>
                ${ths}
              </tr>
            </thead>
            <tbody>
              ${trs}
            </tbody>
          </table>
        </div>
      `;
    }).join('');
  }

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Báo Cáo Tổng Hợp: ${data.period?.title || data.periodTitle}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 11pt;
          line-height: 1.35;
          color: #000;
          margin: 0;
          padding: 10px;
        }
        table { border-collapse: collapse; width: 100%; }
        tr { page-break-inside: avoid; }
        .no-print {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-bottom: 15px;
        }
        .btn-print {
          background-color: #059669;
          color: #fff;
          border: none;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: bold;
          border-radius: 4px;
          cursor: pointer;
        }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="no-print">
        <button class="btn-print" onclick="window.print()">🖨️ In Ngay / Lưu PDF (Ctrl+P)</button>
      </div>

      <!-- HEADER QUỐC HIỆU VÀ ĐƠN VỊ (CHUẨN NGHỊ ĐỊNH 30/2020/NĐ-CP) -->
      <table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 14px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 10pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">TRƯỜNG THCS VÀ THPT</div>
            <div style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">ĐỐC BINH KIỀU</div>
            <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 4px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 90px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            <div style="font-size: 10pt; margin-top: 6px;">Số: &nbsp; &nbsp; /BC-THCS&amp;THPTĐBK</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 10.5pt; font-weight: bold; margin-top: 2px;">Độc lập – Tự do – Hạnh phúc</div>
            <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 4px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 170px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            <div style="font-size: 10pt; font-style: italic; margin-top: 6px;">Đồng Tháp, ngày &nbsp; &nbsp; &nbsp; &nbsp; tháng &nbsp; &nbsp; &nbsp; &nbsp; năm ${year || '2026'}</div>
          </td>
        </tr>
      </table>

      <!-- TIÊU ĐỀ BÁO CÁO -->
      <div style="text-align: center; margin-top: 14px; margin-bottom: 18px;">
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0; color: #000;">
          ${reportTitleInfo.mainType}
        </div>
        <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 0; color: #000; line-height: 1.35;">
          ${reportTitleInfo.subTitle}
        </div>
        <div style="text-align: center; margin-top: 5px; margin-bottom: 12px;">
          <span style="display: inline-block; width: 200px; border-bottom: 1.5px solid #000;"></span>
        </div>
      </div>

      ${isMeetingMinutesReport ? `
        <!-- NỘI DUNG TỔNG HỢP BIÊN BẢN HỌP CỦA CÁC TỔ CHUYÊN MÔN -->
        ${renderConsolidatedDepartmentMeetingContent(data, currentUser, schoolInfo, year)}

        ${printBreakdownHtml ? `
          <div style="margin-top: 20px;">
            <h3 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1px solid #000; padding-bottom: 3px; margin: 12px 0 6px 0;">
              TỔNG HỢP CHI TIẾT THEO CÁC CÂU HỎI &amp; CHỈ SỐ BIỂU MẪU ĐỢT BÁO CÁO
            </h3>
            ${printBreakdownHtml}
          </div>
        ` : ''}

        ${dynamicTablesPrintHtml ? `
          <div style="margin-top: 20px;">
            <h3 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1px solid #000; padding-bottom: 3px; margin: 12px 0 6px 0;">
              CÁC BẢNG SỐ LIỆU ĐỘNG TỔNG HỢP
            </h3>
            ${dynamicTablesPrintHtml}
          </div>
        ` : ''}
      ` : `
        <!-- PHẦN I: TỔNG QUAN TIẾN ĐỘ -->
        <div>
          <h3 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1px solid #000; padding-bottom: 3px; margin: 0 0 6px 0;">
            I. TỔNG QUAN TIẾN ĐỘ THỰC HIỆN
          </h3>
          <p style="font-size: 10pt; line-height: 1.5; margin: 0 0 10px 0;">
            - Đối tượng nộp: <b>${data.targetAudienceLabel}</b> (Tổng số: ${data.totalTargetCount})<br/>
            - Đã nộp: <b>${data.submittedCount} / ${data.totalTargetCount}</b> (<b style="color: #059669;">${data.completionRate}%</b>) • Chưa nộp: <b>${data.pendingCount}</b> • Hạn chót: ${data.period?.deadline || 'Không ấn định'}
          </p>
        </div>

        <!-- PHẦN II: KẾT QUẢ TỔNG HỢP THEO TỪNG ĐỀ MỤC TRONG FORM -->
        <div>
          <h3 style="font-size: 11pt; font-weight: bold; text-transform: uppercase; color: #000; border-bottom: 1px solid #000; padding-bottom: 3px; margin: 10px 0 6px 0;">
            II. KẾT QUẢ TỔNG HỢP CHI TIẾT THEO TỪNG ĐỀ MỤC BIỂU MẪU
          </h3>
          ${printBreakdownHtml}
        </div>

        <!-- PHẦN III: SĨ SỐ (NẾU CÓ) -->
        ${homeroomPrintHtml}
      `}

      <!-- CHỮ KÝ PHÊ DUYỆT -->
      <div style="margin-top: 30px; page-break-inside: avoid;">
        <table style="border: none;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; text-transform: uppercase; font-size: 10pt;">NGƯỜI LẬP BIỂU</div>
              <div style="font-size: 9pt; font-style: italic;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 55px;"></div>
              <div style="font-weight: bold; font-size: 10.5pt;">${currentUser.name}</div>
              <div style="font-size: 9pt;">${currentUser.roleTitle}</div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; text-transform: uppercase; font-size: 10pt;">HIỆU TRƯỞNG</div>
              <div style="font-size: 9pt; font-style: italic;">(Ký tên, đóng dấu)</div>
              <div style="height: 55px;"></div>
              <div style="font-weight: bold; font-size: 10.5pt;">${schoolInfo.principalName}</div>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}

