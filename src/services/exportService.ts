import * as XLSX from 'xlsx';
import { ReportSubmission, ReportPeriod, Department, User, SchoolInfo } from '../types';

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
  }
};
