import * as XLSX from 'xlsx';
import { ReportSubmission, ReportPeriod, Department, User, SchoolInfo } from '../types';
import { PeriodConsolidationResult } from '../utils/consolidationHelper';

export const ExportService = {
  // Export full submissions list to Excel (.xlsx)
  exportSubmissionsToExcel(
    submissions: ReportSubmission[], 
    periods: ReportPeriod[], 
    departments: Department[],
    schoolInfo: SchoolInfo,
    fileNamePrefix = 'Bao_Cao_Tong_Hop_Doc_Binh_Kieu'
  ) {
    const wb = XLSX.utils.book_new();

    // 1. Data rows for main submission list
    const mainData = submissions.map((sub, index) => {
      let statusText = 'Bản nháp';
      if (sub.status === 'submitted') statusText = 'Chờ Tổ trưởng duyệt';
      if (sub.status === 'dept_approved') statusText = 'Tổ trưởng đã duyệt - Chờ BGH';
      if (sub.status === 'dept_rejected') statusText = 'Tổ trưởng yêu cầu chỉnh sửa';
      if (sub.status === 'principal_approved') statusText = 'Ban Giám Hiệu đã duyệt';
      if (sub.status === 'principal_rejected') statusText = 'BGH yêu cầu bổ sung';

      let lateText = 'Đúng hạn';
      if (sub.isLate) {
        const mins = sub.lateDurationMinutes || 0;
        if (mins > 1440) {
          const days = (mins / 1440).toFixed(1);
          lateText = `Trễ ${days} ngày`;
        } else if (mins > 60) {
          const hours = Math.floor(mins / 60);
          const remMins = mins % 60;
          lateText = `Trễ ${hours}h${remMins}m`;
        } else {
          lateText = `Trễ ${mins} phút`;
        }
      }

      const formattedSubmitTime = sub.submittedAt 
        ? new Date(sub.submittedAt).toLocaleString('vi-VN') 
        : 'Chưa gửi';

      return {
        'STT': index + 1,
        'Mã Báo Cáo': sub.id,
        'Tên Báo Cáo': sub.title,
        'Đợt Báo Cáo': sub.periodTitle,
        'Họ và Tên Người Nộp': sub.authorName,
        'Chức Vụ': sub.authorRoleTitle,
        'Tổ / Bộ Môn': sub.departmentName,
        'Thời Gian Nộp': formattedSubmitTime,
        'Kỷ Luật Hạn Nộp': lateText,
        'Trạng Thái Phê Duyệt': statusText,
        'Tổ Trưởng Duyệt': sub.deptHeadReview ? `${sub.deptHeadReview.reviewerName} (${sub.deptHeadReview.action === 'approved' ? 'Đã duyệt' : 'Trả lại'})` : 'Chưa duyệt',
        'Nhận Xét Của Tổ Trưởng': sub.deptHeadReview?.comment || '',
        'Ban Giám Hiệu Phê Duyệt': sub.principalReview ? `${sub.principalReview.reviewerName} (${sub.principalReview.action === 'approved' ? 'Phê duyệt' : 'Yêu cầu sửa'})` : 'Chưa duyệt',
        'Ý Kiến Ban Giám Hiệu': sub.principalReview?.comment || '',
        'Số Tệp Đính Kèm': sub.attachments.length,
        'Danh Sách Tệp': sub.attachments.map(a => a.name).join(', ')
      };
    });

    const wsMain = XLSX.utils.json_to_sheet(mainData);
    XLSX.utils.book_append_sheet(wb, wsMain, 'Báo Cáo Tổng Hợp');

    // 2. Department Statistics Sheet
    const deptStats = departments.map(dept => {
      const deptSubs = submissions.filter(s => s.departmentId === dept.id);
      const submittedCount = deptSubs.filter(s => s.status !== 'draft').length;
      const approvedCount = deptSubs.filter(s => s.status === 'principal_approved').length;
      const lateCount = deptSubs.filter(s => s.isLate).length;
      const totalStaff = dept.memberCount || 10;
      const completionRate = Math.min(100, Math.round((submittedCount / totalStaff) * 100));

      return {
        'Mã Tổ': dept.code,
        'Tổ / Phòng Ban': dept.name,
        'Tổ Trưởng': dept.headUserName,
        'Tổng Số Thành Viên': totalStaff,
        'Số Báo Cáo Đã Nộp': submittedCount,
        'Đã Duyệt Hoàn Tất': approvedCount,
        'Số Báo Cáo Nộp Trễ': lateCount,
        'Tỷ Lệ Hoàn Thành (%)': `${completionRate}%`
      };
    });

    const wsDept = XLSX.utils.json_to_sheet(deptStats);
    XLSX.utils.book_append_sheet(wb, wsDept, 'Tiến Độ Theo Tổ');

    // 3. Late Submissions Tracker Sheet
    const lateSubs = submissions.filter(s => s.isLate);
    const lateData = lateSubs.map((sub, idx) => ({
      'STT': idx + 1,
      'Họ và Tên': sub.authorName,
      'Tổ Chuyên Môn': sub.departmentName,
      'Báo Cáo': sub.title,
      'Đợt Báo Cáo': sub.periodTitle,
      'Thời Gian Nộp': sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('vi-VN') : '',
      'Thời Gian Trễ': sub.lateDurationMinutes ? `${Math.floor(sub.lateDurationMinutes / 60)} giờ ${sub.lateDurationMinutes % 60} phút` : 'Trễ hạn',
      'Lý Do / Giải Trình': sub.lateExplanation || 'Không ghi lý do'
    }));

    const wsLate = XLSX.utils.json_to_sheet(lateData);
    XLSX.utils.book_append_sheet(wb, wsLate, 'Danh Sách Nộp Trễ');

    // 4. Custom Dynamic Tables Sheets (Aggregating all rows submitted by all teachers)
    // Group all tables across submissions by table title
    const tableGroups = new Map<string, {
      title: string;
      headers: string[];
      rows: Array<{
        sub: ReportSubmission;
        row: Record<string, string>;
      }>;
    }>();

    submissions.forEach(sub => {
      const customTables = sub.structuredData?.customTables || [];
      customTables.forEach(tbl => {
        const titleKey = tbl.title.trim() || 'Bảng số liệu tổng hợp';
        if (!tableGroups.has(titleKey)) {
          tableGroups.set(titleKey, {
            title: titleKey,
            headers: [...tbl.headers],
            rows: []
          });
        }
        const group = tableGroups.get(titleKey)!;
        // Merge any additional headers if different
        tbl.headers.forEach(h => {
          if (!group.headers.includes(h)) {
            group.headers.push(h);
          }
        });

        // Add rows with teacher context
        (tbl.rows || []).forEach(row => {
          // Check if row is not completely empty
          const hasData = Object.values(row).some(v => v !== undefined && v !== '');
          if (hasData) {
            group.rows.push({ sub, row });
          }
        });
      });
    });

    // Create a sheet for each dynamic table group
    tableGroups.forEach((group, titleKey) => {
      if (group.rows.length > 0) {
        const sheetRows = group.rows.map((item, rIdx) => {
          const rowData: Record<string, any> = {
            'STT': rIdx + 1,
            'Người Nộp': item.sub.authorName,
            'Lớp / Tổ': item.sub.homeroomClass || item.sub.departmentName,
            'Đợt Báo Cáo': item.sub.periodTitle
          };

          // Map table headers
          group.headers.forEach(h => {
            rowData[h] = item.row[h] || '';
          });

          rowData['Thời Gian Nộp'] = item.sub.submittedAt ? new Date(item.sub.submittedAt).toLocaleDateString('vi-VN') : '';
          return rowData;
        });

        const wsDynamicTable = XLSX.utils.json_to_sheet(sheetRows);
        // Clean sheet name (Excel limit max 31 chars, no invalid chars : \ / ? * [ ])
        const cleanSheetName = titleKey
          .replace(/[\\/?*[\]:]/g, '')
          .substring(0, 31);

        // Ensure unique sheet name
        let finalSheetName = cleanSheetName;
        let counter = 1;
        while (wb.SheetNames.includes(finalSheetName)) {
          finalSheetName = `${cleanSheetName.substring(0, 28)}_${counter++}`;
        }

        XLSX.utils.book_append_sheet(wb, wsDynamicTable, finalSheetName);
      }
    });

    // 5. Custom Form Fields Aggregation Sheet
    // If any submissions have customFieldValues
    const subsWithFields = submissions.filter(s => s.structuredData?.customFieldValues);
    if (subsWithFields.length > 0) {
      // Collect all unique field labels
      const fieldLabelsMap = new Map<string, string>(); // fieldId -> label
      subsWithFields.forEach(s => {
        (s.structuredData?.template?.fields || []).forEach(f => {
          fieldLabelsMap.set(f.id, f.label);
        });
      });

      const fieldRows = subsWithFields.map((s, idx) => {
        const rowData: Record<string, any> = {
          'STT': idx + 1,
          'Người Nộp': s.authorName,
          'Lớp / Tổ': s.homeroomClass || s.departmentName,
          'Đợt Báo Cáo': s.periodTitle
        };

        fieldLabelsMap.forEach((label, fieldId) => {
          const val = s.structuredData?.customFieldValues?.[fieldId];
          rowData[label] = val !== undefined && val !== null ? val : '';
        });

        rowData['Thời Gian Nộp'] = s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('vi-VN') : '';
        return rowData;
      });

      const wsFields = XLSX.utils.json_to_sheet(fieldRows);
      XLSX.utils.book_append_sheet(wb, wsFields, 'Tổng Hợp Trường Dữ Liệu');
    }

    // 6. Absent Students Sheet (Homeroom Minutes)
    const absentStudentRows: any[] = [];
    submissions.forEach(sub => {
      const minutes = sub.structuredData?.homeroomMinutes;
      if (minutes?.absentStudents && minutes.absentStudents.length > 0) {
        minutes.absentStudents.forEach((student, sIdx) => {
          absentStudentRows.push({
            'STT': absentStudentRows.length + 1,
            'Lớp': minutes.className || sub.homeroomClass || '-',
            'Giáo Viên Chủ Nhiệm': minutes.teacherName || sub.authorName,
            'Họ và Tên Học Sinh': student.studentName || '',
            'Lớp Năm Học Trước': student.previousClass || '',
            'Nơi Ở Hiện Nay': student.currentAddress || '',
            'Số ĐT Học Sinh': student.studentPhone || '',
            'Số ĐT Phụ Huynh': student.parentPhone || '',
            'Lý Do Chưa Ra Lớp': student.reason || 'Chưa rõ lý do'
          });
        });
      }
    });

    if (absentStudentRows.length > 0) {
      const wsAbsent = XLSX.utils.json_to_sheet(absentStudentRows);
      XLSX.utils.book_append_sheet(wb, wsAbsent, 'Tổng Hợp Học Sinh Vắng');
    }

    // Generate and trigger download
    const dateStr = new Date().toISOString().split('T')[0];
    const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fullFileName);
  },

  // Open formatted print dialog for printable Vietnamese school report
  printOfficialSummaryReport(
    submissions: ReportSubmission[],
    activePeriod: ReportPeriod | null,
    departments: Department[],
    schoolInfo: SchoolInfo,
    currentUser: User
  ) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup trong trình duyệt để in báo cáo.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const tableRows = submissions.map((s, idx) => {
      let statusBadge = 'Chờ duyệt';
      if (s.status === 'principal_approved') statusBadge = 'Đã phê duyệt';
      if (s.status === 'dept_approved') statusBadge = 'Tổ trưởng đã duyệt';
      if (s.status === 'dept_rejected' || s.status === 'principal_rejected') statusBadge = 'Yêu cầu sửa';

      return `
        <tr>
          <td style="text-align: center; padding: 6px 8px; border: 1px solid #333;">${idx + 1}</td>
          <td style="padding: 6px 8px; border: 1px solid #333; font-weight: 500;">${s.authorName}</td>
          <td style="padding: 6px 8px; border: 1px solid #333;">${s.departmentName}</td>
          <td style="padding: 6px 8px; border: 1px solid #333;">${s.title}</td>
          <td style="text-align: center; padding: 6px 8px; border: 1px solid #333;">${s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('vi-VN') : '-'}</td>
          <td style="text-align: center; padding: 6px 8px; border: 1px solid #333; ${s.isLate ? 'color: #b91c1c; font-weight: bold;' : 'color: #15803d;'}">
            ${s.isLate ? 'Nộp trễ' : 'Đúng hạn'}
          </td>
          <td style="text-align: center; padding: 6px 8px; border: 1px solid #333;">${statusBadge}</td>
          <td style="padding: 6px 8px; border: 1px solid #333; font-size: 11px;">${s.principalReview?.comment || s.deptHeadReview?.comment || '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Báo Cáo Tổng Hợp - ${schoolInfo.name}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: "Times New Roman", Times, serif; font-size: 13pt; line-height: 1.4; color: #000; margin: 30px 40px; }
          .header-grid { display: flex; justify-content: space-between; text-align: center; margin-bottom: 25px; }
          .sub-header { font-size: 11pt; text-transform: uppercase; }
          .bold { font-weight: bold; }
          .title { text-align: center; font-size: 16pt; font-weight: bold; text-transform: uppercase; margin: 20px 0 10px 0; }
          .subtitle { text-align: center; font-style: italic; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11pt; }
          th { background-color: #f2f2f2; border: 1px solid #333; padding: 8px; text-align: center; }
          .footer-sign { display: flex; justify-content: space-between; margin-top: 40px; text-align: center; page-break-inside: avoid; }
          .sign-box { width: 45%; }
          .sign-title { font-weight: bold; text-transform: uppercase; margin-bottom: 70px; }
          @media print {
            body { margin: 15mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 8px 16px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ In Báo Cáo / Lưu PDF</button>
        </div>

        <div class="header-grid">
          <div>
            <div class="sub-header">${schoolInfo.departmentOfEducation}</div>
            <div class="bold" style="font-size: 12pt; text-transform: uppercase;">${schoolInfo.formalName}</div>
            <div style="font-size: 11pt;">Số: ...../BC-ĐBK</div>
          </div>
          <div>
            <div class="bold" style="font-size: 12pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="bold" style="font-size: 12pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="font-style: italic; margin-top: 5px; font-size: 11pt;">Đốc Binh Kiều, ngày ${todayStr.split('/')[0]} tháng ${todayStr.split('/')[1]} năm ${todayStr.split('/')[2]}</div>
          </div>
        </div>

        <div class="title">BÁO CÁO TỔNG HỢP TIẾN ĐỘ VÀ KẾT QUẢ NỘP BÁO CÁO</div>
        <div class="subtitle">Đợt báo cáo: ${activePeriod ? activePeriod.title : 'Tổng hợp toàn trường'}</div>

        <p><strong>I. TỔNG QUAN TÌNH HÌNH:</strong></p>
        <ul>
          <li>Tổng số báo cáo ghi nhận: <strong>${submissions.length}</strong> báo cáo.</li>
          <li>Số báo cáo nộp đúng hạn: <strong>${submissions.filter(s => !s.isLate).length}</strong>.</li>
          <li>Số báo cáo nộp trễ hạn: <strong>${submissions.filter(s => s.isLate).length}</strong>.</li>
          <li>Số báo cáo đã hoàn tất phê duyệt: <strong>${submissions.filter(s => s.status === 'principal_approved').length}</strong>.</li>
        </ul>

        <p><strong>II. DANH SÁCH CHI TIẾT CÁC BÁO CÁO:</strong></p>
        <table>
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th style="width: 140px;">Người nộp</th>
              <th style="width: 120px;">Tổ chuyên môn</th>
              <th>Tên báo cáo</th>
              <th style="width: 80px;">Ngày nộp</th>
              <th style="width: 75px;">Hạn nộp</th>
              <th style="width: 95px;">Trạng thái</th>
              <th style="width: 130px;">Ghi chú / Ý kiến duyệt</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer-sign">
          <div class="sign-box">
            <div class="sign-title">NGƯỜI LẬP BIỂU</div>
            <div class="bold">${currentUser.name}</div>
            <div style="font-size: 11pt;">${currentUser.roleTitle}</div>
          </div>
          <div class="sign-box">
            <div class="sign-title">HIỆU TRƯỞNG</div>
            <div class="bold">${schoolInfo.principalName}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  },

  // -------------------------------------------------------------
  // TỔNG HỢP NỘI DUNG TOÀN TRƯỜNG & 53 LỚP (CONSOLIDATION ENGINE)
  // -------------------------------------------------------------

  // Xuất file Excel tổng hợp nội dung chi tiết đa sheet (Sĩ số, Học sinh chưa ra lớp, Năng khiếu, Ban cán sự, Nội dung báo cáo)
  exportConsolidatedPeriodToExcel(
    data: PeriodConsolidationResult,
    schoolInfo: SchoolInfo,
    fileNamePrefix = 'Bao_Cao_Tong_Hop_53_Lop'
  ) {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Tổng Quan
    const summaryData = [
      { 'Chỉ Số / Hạng Mục': 'Tên đợt báo cáo', 'Giá Trị': data.period?.title || 'Tổng hợp báo cáo 53 lớp' },
      { 'Chỉ Số / Hạng Mục': 'Năm học', 'Giá Trị': data.period?.academicYear || '2026 - 2027' },
      { 'Chỉ Số / Hạng Mục': 'Đơn vị', 'Giá Trị': schoolInfo.formalName },
      { 'Chỉ Số / Hạng Mục': 'Tổng số lớp chủ nhiệm', 'Giá Trị': 53 },
      { 'Chỉ Số / Hạng Mục': 'Số lớp đã nộp báo cáo', 'Giá Trị': `${data.submittedCount} / 53` },
      { 'Chỉ Số / Hạng Mục': 'Tỷ lệ nộp báo cáo (%)', 'Giá Trị': `${data.completionRate}%` },
      { 'Chỉ Số / Hạng Mục': 'Tổng sĩ số học sinh ghi nhận', 'Giá Trị': data.totalEnrolledStudents },
      { 'Chỉ Số / Hạng Mục': 'Số học sinh hiện diện (đã ra lớp)', 'Giá Trị': data.totalPresentStudents },
      { 'Chỉ Số / Hạng Mục': 'Số học sinh chưa ra lớp toàn trường', 'Giá Trị': data.totalAbsentStudents },
      { 'Chỉ Số / Hạng Mục': 'Tỷ lệ ra lớp toàn trường (%)', 'Giá Trị': `${data.overallAttendanceRate}%` },
      { 'Chỉ Số / Hạng Mục': 'Số lượng học sinh năng khiếu ghi nhận', 'Giá Trị': data.talents.length },
      { 'Chỉ Số / Hạng Mục': 'Ngày xuất file', 'Giá Trị': new Date().toLocaleDateString('vi-VN') }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Quan');

    // 2. Dynamic Tables Sheets (DANH SÁCH TỔNG HỢP NỘI DUNG TỪ 53 LỚP / TOÀN TRƯỜNG)
    data.dynamicTables.forEach((tbl, tIdx) => {
      const rows = tbl.rows.map((r, rIdx) => {
        const rowData: Record<string, any> = {
          'STT': rIdx + 1,
          'Lớp': r.className,
          'Điểm Trường': r.campus,
          'Khối': r.grade ? `Khối ${r.grade}` : '',
          'Người Nộp / GVCN': r.authorName,
          'Thời Gian Nộp': r.submittedAt ? new Date(r.submittedAt).toLocaleString('vi-VN') : ''
        };
        tbl.headers.forEach(h => {
          rowData[h] = r.data[h] || '';
        });
        return rowData;
      });

      if (rows.length > 0) {
        const wsDyn = XLSX.utils.json_to_sheet(rows);
        const cleanName = tbl.title.replace(/[\\/?*[\]:]/g, '').substring(0, 26);
        const sheetTitle = `DS_${tIdx + 1}_${cleanName}`.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, wsDyn, sheetTitle);
      }
    });

    // 3. Sheet Ma Trận Chỉ Số Biểu Mẫu 53 Lớp (nếu có các trường tùy biến)
    if (data.fieldMatrix && data.fieldMatrix.columns.length > 0) {
      const matrixRows = data.fieldMatrix.rows.map(r => {
        const rowData: Record<string, any> = {
          'STT': r.stt,
          'Lớp': r.className,
          'Cơ Sở': r.campus,
          'Khối': `Khối ${r.grade}`,
          'Người Báo Cáo': r.authorName,
          'Trạng Thái': r.hasSubmitted ? 'Đã nộp' : 'Chưa nộp'
        };
        data.fieldMatrix.columns.forEach(col => {
          rowData[col.label] = r.values[col.id] !== undefined ? r.values[col.id] : '';
        });
        return rowData;
      });

      // Thêm dòng Tổng cộng nếu có cột số
      if (Object.keys(data.fieldMatrix.numericTotals).length > 0) {
        const totalsRow: Record<string, any> = {
          'STT': 0,
          'Lớp': 'TỔNG CỘNG TOÀN TRƯỜNG',
          'Cơ Sở': '-',
          'Khối': '-',
          'Người Báo Cáo': '-',
          'Trạng Thái': `${data.submittedCount}/53 lớp`
        };
        data.fieldMatrix.columns.forEach(col => {
          if (col.type === 'number') {
            totalsRow[col.label] = data.fieldMatrix.numericTotals[col.id] || 0;
          } else {
            totalsRow[col.label] = '-';
          }
        });
        matrixRows.push(totalsRow);
      }

      const wsMatrix = XLSX.utils.json_to_sheet(matrixRows);
      XLSX.utils.book_append_sheet(wb, wsMatrix, 'Ma_Tran_Chi_So_53_Lop');
    }

    // 4. Sheet Danh Sách Học Sinh Vắng (nếu có)
    if (data.absentStudents.length > 0) {
      const absentRows = data.absentStudents.map((s, idx) => ({
        'STT': idx + 1,
        'Lớp': s.className,
        'Khối': `Khối ${s.grade}`,
        'Điểm Trường': s.campus === 'THPT' ? 'Điểm THPT' : (s.campus === 'TK' ? 'Điểm Tân Kiều' : 'Điểm Đốc Binh Kiều'),
        'Giáo Viên Chủ Nhiệm': s.teacherName,
        'Họ và Tên Học Sinh': s.studentName,
        'Lớp Năm Trước': s.previousClass,
        'Nơi Ở Hiện Nay': s.currentAddress,
        'Số ĐT Học Sinh': s.studentPhone,
        'Số ĐT Phụ Huynh': s.parentPhone,
        'Lý Do Chưa Ra Lớp': s.reason
      }));
      const wsAbsent = XLSX.utils.json_to_sheet(absentRows);
      XLSX.utils.book_append_sheet(wb, wsAbsent, 'DS_HS_Chua_Ra_Lop_53_Lop');
    }

    // 5. Sheet Bảng Tổng Hợp Sĩ Số & Tỷ Lệ Ra Lớp (53 Lớp)
    const classRows = data.classStats.map((c) => ({
      'STT': c.stt,
      'Lớp': c.className,
      'Điểm Trường': c.campus === 'THPT' ? 'THPT' : (c.campus === 'TK' ? 'Tân Kiều' : 'Đốc Binh Kiều'),
      'Khối': `Khối ${c.grade}`,
      'Giáo Viên Chủ Nhiệm': c.teacherName,
      'Sĩ Số Đầu Năm': c.totalStudents,
      'Nam': c.maleStudents,
      'Nữ': c.femaleStudents,
      'Hiện Diện': c.presentStudents,
      'Vắng / Chưa Ra Lớp': c.absentStudentsCount,
      'Tỷ Lệ Ra Lớp (%)': c.hasSubmitted ? `${c.attendanceRate}%` : 'Chưa nộp',
      'Trạng Thái Nộp': c.hasSubmitted ? 'Đã nộp báo cáo' : 'Chưa nộp',
      'Ghi Chú / Đề Xuất': c.notes || ''
    }));

    // Thêm dòng Tổng cộng toàn trường ở cuối
    classRows.push({
      'STT': 0,
      'Lớp': 'TỔNG CỘNG TOÀN TRƯỜNG',
      'Điểm Trường': '-',
      'Khối': '-',
      'Giáo Viên Chủ Nhiệm': '-',
      'Sĩ Số Đầu Năm': data.totalEnrolledStudents,
      'Nam': data.totalMaleStudents,
      'Nữ': data.totalFemaleStudents,
      'Hiện Diện': data.totalPresentStudents,
      'Vắng / Chưa Ra Lớp': data.totalAbsentStudents,
      'Tỷ Lệ Ra Lớp (%)': `${data.overallAttendanceRate}%`,
      'Trạng Thái Nộp': `${data.submittedCount}/53 lớp`,
      'Ghi Chú / Đề Xuất': ''
    });

    const wsClasses = XLSX.utils.json_to_sheet(classRows);
    XLSX.utils.book_append_sheet(wb, wsClasses, 'Tong_Hop_Si_So_53_Lop');

    // 6. Sheet Học Sinh Năng Khiếu Toàn Trường
    if (data.talents.length > 0) {
      const talentRows = data.talents.map((t, idx) => ({
        'STT': idx + 1,
        'Lớp': t.className,
        'Giáo Viên Chủ Nhiệm': t.teacherName,
        'Họ và Tên Học Sinh': t.studentName,
        'Cuộc Thi / Năng Khiếu': t.competition,
        'Giải Thưởng / Thành Tích': t.prize,
        'Ghi Chú / Bồi Dưỡng': t.note
      }));
      const wsTalent = XLSX.utils.json_to_sheet(talentRows);
      XLSX.utils.book_append_sheet(wb, wsTalent, 'DS_Hoc_Sinh_Nang_Khieu');
    }

    // 7. Sheet Ban Cán Sự 53 Lớp
    if (data.cadres.length > 0) {
      const cadreRows = data.cadres.map((cd, idx) => ({
        'STT': idx + 1,
        'Lớp': cd.className,
        'GVCN': cd.teacherName,
        'Chức Vụ': cd.role,
        'Họ và Tên': cd.studentName,
        'Học Lực Năm Trước': cd.academicPerf,
        'Hạnh Kiểm Năm Trước': cd.conductPerf,
        'Số Điện Thoại': cd.phone
      }));
      const wsCadre = XLSX.utils.json_to_sheet(cadreRows);
      XLSX.utils.book_append_sheet(wb, wsCadre, 'Ban_Can_Su_53_Lop');
    }

    // 8. Sheet Tổng Hợp Nội Dung Chi Tiết Của 53 Báo Cáo
    const feedbackRows = data.feedbacks.map((f, idx) => ({
      'STT': idx + 1,
      'Lớp / Đơn Vị': f.className,
      'Người Báo Cáo': f.authorName,
      'Tổ Bộ Môn': f.departmentName,
      'Thời Gian Nộp': f.submittedAt ? new Date(f.submittedAt).toLocaleString('vi-VN') : '',
      'Tiêu Đề Báo Cáo': f.title,
      'Nội Dung Chi Tiết': f.content,
      'Ý Kiến Đề Xuất Với BGH': f.notes
    }));
    if (feedbackRows.length > 0) {
      const wsFeedbacks = XLSX.utils.json_to_sheet(feedbackRows);
      XLSX.utils.book_append_sheet(wb, wsFeedbacks, 'Tong_Hop_Noi_Dung_53_Nguoi');
    }

    // Xuất file
    const dateStr = new Date().toISOString().split('T')[0];
    const fullFileName = `${fileNamePrefix}_${dateStr}.xlsx`;
    XLSX.writeFile(wb, fullFileName);
  },

  // Xuất file Word (.doc) Tổng Hợp Nội Dung 53 Lớp Toàn Trường
  exportConsolidatedPeriodToWord(
    data: PeriodConsolidationResult,
    schoolInfo: SchoolInfo,
    currentUser: User
  ) {
    const todayStr = new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const parts = todayStr.split('/');
    const day = parts[0] || '28';
    const month = parts[1] || '08';
    const year = parts[2] || '2026';

    // Bảng sĩ số 53 lớp HTML
    const classRowsHtml = data.classStats.map(c => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 5px;">${c.stt}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold;">${c.className}</td>
        <td style="border: 1px solid #000; padding: 5px;">${c.teacherName}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px;">${c.totalStudents}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px;">${c.maleStudents}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px;">${c.femaleStudents}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px;">${c.presentStudents}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px; ${c.absentStudentsCount > 0 ? 'color: red; font-weight: bold;' : ''}">${c.absentStudentsCount}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold;">${c.hasSubmitted ? `${c.attendanceRate}%` : 'Chưa nộp'}</td>
        <td style="border: 1px solid #000; padding: 5px; font-size: 10pt;">${c.notes || '-'}</td>
      </tr>
    `).join('');

    // Bảng học sinh chưa ra lớp HTML
    const absentRowsHtml = data.absentStudents.length > 0 
      ? data.absentStudents.map(s => `
        <tr>
          <td style="text-align: center; border: 1px solid #000; padding: 5px;">${s.stt}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold;">${s.className}</td>
          <td style="border: 1px solid #000; padding: 5px;">${s.teacherName}</td>
          <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">${s.studentName}</td>
          <td style="border: 1px solid #000; padding: 5px; font-size: 10pt;">${s.currentAddress}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 5px;">${s.studentPhone}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 5px;">${s.parentPhone}</td>
          <td style="border: 1px solid #000; padding: 5px; color: #b91c1c;">${s.reason}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td colspan="8" style="border: 1px solid #000; padding: 12px; text-align: center; font-style: italic; color: green;">
            Tất cả 53 lớp đều đạt 100% sĩ số. Không có học sinh vắng.
          </td>
        </tr>
      `;

    // Bảng học sinh năng khiếu HTML
    const talentRowsHtml = data.talents.map(t => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 5px;">${t.stt}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold;">${t.className}</td>
        <td style="border: 1px solid #000; padding: 5px; font-weight: bold;">${t.studentName}</td>
        <td style="border: 1px solid #000; padding: 5px;">${t.competition}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 5px;">${t.prize}</td>
        <td style="border: 1px solid #000; padding: 5px;">${t.note || '-'}</td>
      </tr>
    `).join('');

    // Tổng hợp phản ánh kiến nghị của 53 GVCN
    const feedbackItemsHtml = data.feedbacks
      .filter(f => f.notes || f.content)
      .map(f => `
        <div style="margin-bottom: 12px; padding: 8px; border-left: 3px solid #047857; background-color: #f9fafb;">
          <strong>- Lớp ${f.className} (${f.authorName}):</strong>
          ${f.notes ? `<div style="margin-top: 3px;"><em>Đề xuất:</em> ${f.notes}</div>` : ''}
          ${f.content && f.content.length > 50 ? `<div style="margin-top: 3px; font-size: 10pt; color: #4b5563;"><em>Trích đoạn:</em> ${f.content.substring(0, 300)}...</div>` : ''}
        </div>
      `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Báo Cáo Tổng Hợp 53 Lớp - ${schoolInfo.name}</title>
        <style>
          body { font-family: "Times New Roman", Times, serif; font-size: 12pt; line-height: 1.4; color: #000; margin: 30px 40px; }
          .header-grid { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .header-grid td { vertical-align: top; text-align: center; }
          .bold { font-weight: bold; }
          .main-title { text-align: center; font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 20px 0 6px 0; }
          .subtitle { text-align: center; font-style: italic; margin-bottom: 20px; font-size: 11pt; }
          .section-title { font-size: 13pt; font-weight: bold; margin-top: 20px; margin-bottom: 8px; text-transform: uppercase; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; font-size: 11pt; }
          table.data-table th { background-color: #f3f4f6; border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; }
          table.data-table td { border: 1px solid #000; padding: 5px; }
          .footer-sign { width: 100%; margin-top: 40px; border-collapse: collapse; }
          .footer-sign td { vertical-align: top; text-align: center; width: 50%; }
        </style>
      </head>
      <body>
        <table class="header-grid">
          <tr>
            <td style="width: 45%;">
              <div>${schoolInfo.departmentOfEducation}</div>
              <div class="bold" style="font-size: 11pt; text-transform: uppercase;">${schoolInfo.formalName}</div>
              <div style="font-size: 10pt;">Số: ...../BC-TH-ĐBK</div>
            </td>
            <td style="width: 55%;">
              <div class="bold" style="font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div class="bold" style="font-size: 11pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
              <div style="font-style: italic; margin-top: 4px; font-size: 10pt;">Đốc Binh Kiều, ngày ${day} tháng ${month} năm ${year}</div>
            </td>
          </tr>
        </table>

        <div class="main-title">BÁO CÁO TỔNG HỢP KẾT QUẢ VÀ NỘI DUNG BÁO CÁO TOÀN TRƯỜNG</div>
        <div class="subtitle">Đợt báo cáo: ${data.period?.title || 'Biên bản tập trung học sinh đầu năm học 2026 - 2027'} (Tổng hợp từ 53 lớp)</div>

        <div class="section-title">I. TỔNG QUAN TÌNH HÌNH THỰC HIỆN VÀ TIẾN ĐỘ NỘP BÁO CÁO</div>
        <p>- Tổng số lớp chủ nhiệm toàn trường: <strong>53 lớp</strong> (Gồm 18 lớp THPT, 20 lớp THCS Điểm Đốc Binh Kiều, 15 lớp THCS Điểm Tân Kiều).</p>
        <p>- Số lớp đã nộp báo cáo hoàn tất: <strong>${data.submittedCount} / 53 lớp</strong> (Đạt tỷ lệ: <strong>${data.completionRate}%</strong>).</p>
        <p>- Tổng sĩ số học sinh ghi nhận: <strong>${data.totalEnrolledStudents.toLocaleString('vi-VN')}</strong> học sinh (Trong đó Nam: ${data.totalMaleStudents}, Nữ: ${data.totalFemaleStudents}).</p>
        <p>- Số học sinh hiện diện có mặt: <strong>${data.totalPresentStudents.toLocaleString('vi-VN')}</strong> học sinh. Tỷ lệ ra lớp: <strong>${data.overallAttendanceRate}%</strong>.</p>
        <p>- Tổng số học sinh chưa ra lớp cần tiếp tục vận động: <strong>${data.totalAbsentStudents}</strong> học sinh.</p>

        ${data.dynamicTables.length > 0 ? data.dynamicTables.map((tbl, tIdx) => `
          <div class="section-title">II.${tIdx + 1}. DANH SÁCH TỔNG HỢP: ${tbl.title.toUpperCase()} (TỔNG HỢP 53 LỚP / TOÀN TRƯỜNG)</div>
          <p><em>(Tổng cộng ${tbl.totalRows} bản ghi được tổng hợp từ các lớp đã nộp báo cáo)</em></p>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 35px;">STT</th>
                <th style="width: 60px;">Lớp</th>
                <th style="width: 140px;">GVCN / Người Báo Cáo</th>
                ${tbl.headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tbl.rows.map(r => `
                <tr>
                  <td style="text-align: center; border: 1px solid #000; padding: 5px;">${r.stt}</td>
                  <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold;">${r.className}</td>
                  <td style="border: 1px solid #000; padding: 5px;">${r.authorName}</td>
                  ${tbl.headers.map(h => `<td style="border: 1px solid #000; padding: 5px;">${r.data[h] || '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('') : ''}

        ${data.fieldMatrix.columns.length > 0 ? `
          <div class="section-title">III. BẢNG MA TRẬN CHỈ SỐ BIỂU MẪU CỦA 53 LỚP CHỦ NHIỆM</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 35px;">STT</th>
                <th style="width: 60px;">Lớp</th>
                <th style="width: 140px;">GVCN</th>
                ${data.fieldMatrix.columns.map(c => `<th>${c.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.fieldMatrix.rows.map(r => `
                <tr>
                  <td style="text-align: center; border: 1px solid #000; padding: 5px;">${r.stt}</td>
                  <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold;">${r.className}</td>
                  <td style="border: 1px solid #000; padding: 5px;">${r.authorName}</td>
                  ${data.fieldMatrix.columns.map(c => `<td style="text-align: ${c.type === 'number' ? 'center' : 'left'}; border: 1px solid #000; padding: 5px;">${r.values[c.id] !== undefined && r.values[c.id] !== '' ? r.values[c.id] : '-'}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        ${data.absentStudents.length > 0 ? `
          <div class="section-title">IV. DANH SÁCH TỔNG HỢP HỌC SINH CHƯA RA LỚP TOÀN TRƯỜNG</div>
          <p><em>(Danh sách phục vụ công tác chỉ đạo Đoàn thanh niên, Đội TNTP và GVCN đi vận động học sinh đến trường)</em></p>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">STT</th>
                <th style="width: 55px;">Lớp</th>
                <th style="width: 130px;">GVCN</th>
                <th style="width: 140px;">Họ và tên học sinh</th>
                <th>Nơi ở hiện nay</th>
                <th style="width: 85px;">SĐT HS</th>
                <th style="width: 85px;">SĐT Phụ huynh</th>
                <th style="width: 150px;">Lý do chưa ra lớp</th>
              </tr>
            </thead>
            <tbody>
              ${absentRowsHtml}
            </tbody>
          </table>
        ` : ''}

        <div class="section-title">V. BẢNG TỔNG HỢP SĨ SỐ VÀ TIẾN ĐỘ 53 LỚP CHỦ NHIỆM</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 30px;">STT</th>
              <th style="width: 55px;">Lớp</th>
              <th style="width: 140px;">GVCN</th>
              <th style="width: 50px;">Sĩ số</th>
              <th style="width: 45px;">Nam</th>
              <th style="width: 45px;">Nữ</th>
              <th style="width: 50px;">Hiện diện</th>
              <th style="width: 50px;">Vắng</th>
              <th style="width: 65px;">Tỷ lệ (%)</th>
              <th>Ghi chú / Phản ánh của GVCN</th>
            </tr>
          </thead>
          <tbody>
            ${classRowsHtml}
            <tr style="font-weight: bold; background-color: #f3f4f6;">
              <td colspan="3" style="text-align: center; border: 1px solid #000; padding: 6px;">TỔNG CỘNG TOÀN TRƯỜNG</td>
              <td style="text-align: center; border: 1px solid #000; padding: 6px;">${data.totalEnrolledStudents}</td>
              <td style="text-align: center; border: 1px solid #000; padding: 6px;">${data.totalMaleStudents}</td>
              <td style="text-align: center; border: 1px solid #000; padding: 6px;">${data.totalFemaleStudents}</td>
              <td style="text-align: center; border: 1px solid #000; padding: 6px;">${data.totalPresentStudents}</td>
              <td style="text-align: center; border: 1px solid #000; padding: 6px; color: red;">${data.totalAbsentStudents}</td>
              <td style="text-align: center; border: 1px solid #000; padding: 6px;">${data.overallAttendanceRate}%</td>
              <td style="border: 1px solid #000; padding: 6px;">Đã nộp ${data.submittedCount}/53 lớp</td>
            </tr>
          </tbody>
        </table>

        ${data.talents.length > 0 ? `
          <div class="section-title">IV. TỔNG HỢP HỌC SINH CÓ NĂNG KHIẾU / ĐẠT GIẢI THƯỞNG</div>
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 30px;">STT</th>
                <th style="width: 55px;">Lớp</th>
                <th style="width: 140px;">Họ tên học sinh</th>
                <th>Cuộc thi / Lĩnh vực năng khiếu</th>
                <th style="width: 80px;">Giải thưởng</th>
                <th style="width: 150px;">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${talentRowsHtml}
            </tbody>
          </table>
        ` : ''}

        <div class="section-title">V. TỔNG HỢP Ý KIẾN VÀ ĐỀ XUẤT KIẾN NGHỊ CỦA GIÁO VIÊN VỚI BGH</div>
        ${feedbackItemsHtml || '<p><em>(Không có kiến nghị đặc biệt nào)</em></p>'}

        <table class="footer-sign">
          <tr>
            <td>
              <div class="bold" style="text-transform: uppercase;">NGƯỜI LẬP BIỂU TỔNG HỢP</div>
              <div style="font-size: 10pt; margin-bottom: 60px;">(Ký và ghi rõ họ tên)</div>
              <div class="bold">${currentUser.name}</div>
              <div style="font-size: 10pt;">${currentUser.roleTitle}</div>
            </td>
            <td>
              <div class="bold" style="text-transform: uppercase;">HIỆU TRƯỞNG</div>
              <div style="font-size: 10pt; margin-bottom: 60px;">(Ký tên, đóng dấu)</div>
              <div class="bold">${schoolInfo.principalName}</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Download Word file
    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_Tong_Hop_53_Lop_Doc_Binh_Kieu_${year}_${month}_${day}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // In ấn Báo Cáo Tổng Hợp 53 Lớp A4
  printConsolidatedContentReport(
    data: PeriodConsolidationResult,
    schoolInfo: SchoolInfo,
    currentUser: User
  ) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Vui lòng cho phép popup trình duyệt để in báo cáo.');
      return;
    }

    const todayStr = new Date().toLocaleDateString('vi-VN');

    // Bảng học sinh vắng
    const absentRowsHtml = data.absentStudents.map(s => `
      <tr>
        <td style="text-align: center; border: 1px solid #333; padding: 4px;">${s.stt}</td>
        <td style="text-align: center; border: 1px solid #333; padding: 4px; font-weight: bold;">${s.className}</td>
        <td style="border: 1px solid #333; padding: 4px;">${s.teacherName}</td>
        <td style="border: 1px solid #333; padding: 4px; font-weight: bold;">${s.studentName}</td>
        <td style="border: 1px solid #333; padding: 4px; font-size: 10pt;">${s.currentAddress}</td>
        <td style="text-align: center; border: 1px solid #333; padding: 4px;">${s.parentPhone}</td>
        <td style="border: 1px solid #333; padding: 4px; color: #b91c1c;">${s.reason}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>In Báo Cáo Tổng Hợp - ${schoolInfo.name}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: "Times New Roman", Times, serif; font-size: 11pt; line-height: 1.35; color: #000; margin: 20px; }
          .header-grid { display: flex; justify-content: space-between; text-align: center; margin-bottom: 15px; }
          .title { text-align: center; font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 15px 0 5px 0; }
          .subtitle { text-align: center; font-style: italic; margin-bottom: 15px; font-size: 10pt; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 10pt; }
          th { background-color: #f2f2f2; border: 1px solid #333; padding: 5px; text-align: center; font-weight: bold; }
          td { border: 1px solid #333; padding: 4px; }
          .footer-sign { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; page-break-inside: avoid; }
          .sign-box { width: 45%; }
          @media print {
            body { margin: 10mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 15px; text-align: right;">
          <button onclick="window.print()" style="padding: 8px 18px; background: #059669; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">🖨️ In Ngay / Lưu PDF</button>
        </div>

        <div class="header-grid">
          <div>
            <div style="font-size: 10pt;">${schoolInfo.departmentOfEducation}</div>
            <div style="font-weight: bold; font-size: 11pt; text-transform: uppercase;">${schoolInfo.formalName}</div>
            <div style="font-size: 9pt;">Số: ...../BC-TH-ĐBK</div>
          </div>
          <div>
            <div style="font-weight: bold; font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-weight: bold; font-size: 11pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="font-style: italic; margin-top: 3px; font-size: 9pt;">Đốc Binh Kiều, ngày ${todayStr}</div>
          </div>
        </div>

        <div class="title">BÁO CÁO TỔNG HỢP DANH SÁCH HỌC SINH CHƯA RA LỚP VÀ SĨ SỐ TOÀN TRƯỜNG</div>
        <div class="subtitle">Đợt báo cáo: ${data.period?.title || 'Tập trung học sinh đầu năm'} (Tổng hợp từ 53 lớp)</div>

        <p><strong>I. TỔNG QUAN TIẾN ĐỘ VÀ SĨ SỐ TOÀN TRƯỜNG:</strong></p>
        <ul>
          <li>Đã nộp báo cáo: <strong>${data.submittedCount} / 53 lớp</strong> (Tỷ lệ: <strong>${data.completionRate}%</strong>).</li>
          <li>Tổng sĩ số ghi nhận: <strong>${data.totalEnrolledStudents}</strong> học sinh (Nam: ${data.totalMaleStudents}, Nữ: ${data.totalFemaleStudents}).</li>
          <li>Hiện diện có mặt: <strong>${data.totalPresentStudents}</strong> học sinh (Tỷ lệ ra lớp: <strong>${data.overallAttendanceRate}%</strong>).</li>
          <li>Tổng số học sinh chưa ra lớp cần vận động: <strong>${data.totalAbsentStudents}</strong> học sinh.</li>
        </ul>

        <p><strong>II. DANH SÁCH HỌC SINH CHƯA RA LỚP TOÀN TRƯỜNG:</strong></p>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">STT</th>
              <th style="width: 50px;">Lớp</th>
              <th style="width: 120px;">GVCN</th>
              <th style="width: 140px;">Họ tên học sinh</th>
              <th>Nơi ở hiện nay</th>
              <th style="width: 90px;">SĐT Phụ huynh</th>
              <th style="width: 160px;">Lý do chưa ra lớp</th>
            </tr>
          </thead>
          <tbody>
            ${absentRowsHtml}
          </tbody>
        </table>

        <div class="footer-sign">
          <div class="sign-box">
            <div style="font-weight: bold; text-transform: uppercase;">NGƯỜI LẬP BIỂU</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold;">${currentUser.name}</div>
            <div style="font-size: 9pt;">${currentUser.roleTitle}</div>
          </div>
          <div class="sign-box">
            <div style="font-weight: bold; text-transform: uppercase;">HIỆU TRƯỞNG</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold;">${schoolInfo.principalName}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
