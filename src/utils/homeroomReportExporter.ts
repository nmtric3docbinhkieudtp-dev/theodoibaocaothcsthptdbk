import { HomeroomMeetingMinutesData, AbsentStudentItem, TalentAchievementItem, ClassCadreItem, CustomFormField, CustomDynamicTable, ReportAttachment } from '../types';

/**
 * Trình hỗ trợ in trực tiếp hoặc lưu PDF an toàn (hỗ trợ cả popup và iframe cho môi trường sandbox)
 */
export function printOrSavePdfHelper(htmlContent: string): void {
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Fallback nếu trình duyệt chặn popup
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }
  }
}

/**
 * Tạo văn bản hoàn chỉnh cho Biên bản tập trung học sinh đầu năm học 2026-2027
 */
export function generateHomeroomMinutesText(data: HomeroomMeetingMinutesData): string {
  const talentsText = data.talents && data.talents.length > 0
    ? data.talents.map((t, idx) => `  ${idx + 1}. ${t.competition}: ${t.prize ? `Giải ${t.prize}` : 'Tham gia'} - Họ tên HS: ${t.studentName || 'Chưa có'}`).join('\n')
    : '  (Chưa ghi nhận thành tích / năng khiếu nổi bật)';

  const cadresText = data.cadres && data.cadres.length > 0
    ? data.cadres.map((c, idx) => `  ${idx + 1}. [${c.role}] - Họ tên: ${c.studentName || '...'} | Học lực: ${c.academicPerf || '...'} | Hạnh kiểm: ${c.conductPerf || '...'} | SĐT: ${c.phone || '...'}`).join('\n')
    : '  (Chưa phân công)';

  const absentListText = data.absentStudents && data.absentStudents.length > 0
    ? data.absentStudents.map((s, idx) => 
        `  ${idx + 1}. ${s.studentName} | Lớp cũ: ${s.previousClass || 'N/A'} | Địa chỉ: ${s.currentAddress || 'Chưa rõ'} | SĐT HS: ${s.studentPhone || 'Không có'} | SĐT PH: ${s.parentPhone || 'Không có'} | Lý do: ${s.reason || 'Chưa rõ'}`
      ).join('\n')
    : '  (Không có - 100% học sinh ra lớp tập trung đầy đủ)';

  return `SỞ GDĐT TỈNH ĐỒNG THÁP               CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
TRƯỜNG THCS-THPT ĐỐC BINH KIỀU           Độc lập - Tự do - Hạnh phúc

                           BIÊN BẢN
          TẬP TRUNG HỌC SINH ĐẦU NĂM HỌC ${data.academicYear || '2026 – 2027'}

Vào lúc ${data.timeHour || '07'} giờ ${data.timeMinute || '30'} phút, Ngày ${data.meetingDate || '28'} tháng ${data.meetingMonth || '8'} năm ${data.meetingYear || '2026'}.
Địa điểm: Phòng số ${data.roomNumber || '...'} trường THCS-THPT Đốc Binh Kiều.

- Họ tên GVCN: ${data.teacherName}
- Lớp: ${data.className}
- Sĩ số học sinh: Tổng số: ${data.totalStudents || 0} em. Trong đó: Nam: ${data.maleStudents || 0} em; Nữ: ${data.femaleStudents || 0} em.

NỘI DUNG:
1. Thông tin học sinh có năng khiếu, đạt thành tích trong các phong trào, hội thi các cấp:
${talentsText}

2. Danh sách Ban cán sự lớp năm học ${data.academicYear || '2026 – 2027'}:
${cadresText}

3. Danh sách học sinh chưa ra lớp tập trung:
${absentListText}

${data.additionalNotes ? `Ý kiến / Đề xuất thêm của GVCN: ${data.additionalNotes}\n` : ''}
Biên bản kết thúc vào lúc ${data.timeHour || '09'} giờ 00 phút cùng ngày.
GIÁO VIÊN CHỦ NHIỆM: ${data.teacherName}`;
}

/**
 * Tạo mã HTML cho Biên bản tập trung học sinh chuẩn thể thức văn bản hành chính
 */
export function generateHomeroomReportHtml(data: HomeroomMeetingMinutesData, isForPrint = false): string {
  const talentsRows = data.talents && data.talents.length > 0 
    ? data.talents.map((t, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px;">${t.competition}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${t.prize || ''}</td>
        <td style="border: 1px solid #000; padding: 6px;">${t.studentName || ''}</td>
        <td style="border: 1px solid #000; padding: 6px;">${t.note || ''}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: center; font-style: italic;">Chưa ghi nhận thành tích / năng khiếu</td></tr>';

  const cadresRows = data.cadres && data.cadres.length > 0
    ? data.cadres.map((c, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${c.role}</td>
        <td style="border: 1px solid #000; padding: 6px;">${c.studentName || ''}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${c.academicPerf || ''}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${c.conductPerf || ''}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${c.phone || ''}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="6" style="border: 1px solid #000; padding: 8px; text-align: center; font-style: italic;">Chưa phân công ban cán sự</td></tr>';

  const absentRows = data.absentStudents && data.absentStudents.length > 0
    ? data.absentStudents.map((s, idx) => `
      <tr>
        <td style="text-align: center; border: 1px solid #000; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${s.studentName || ''}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${s.previousClass || ''}</td>
        <td style="border: 1px solid #000; padding: 6px;">${s.currentAddress || ''}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${s.studentPhone || ''}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: center;">${s.parentPhone || ''}</td>
        <td style="border: 1px solid #000; padding: 6px;">${s.reason || ''}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="7" style="border: 1px solid #000; padding: 10px; text-align: center; font-style: italic; color: #047857;">
          Lớp tập trung đầy đủ 100% (Không có học sinh vắng)
        </td>
      </tr>
    `;

  return `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' lang="vi">
    <head>
      <meta charset="utf-8">
      <title>Biên bản tập trung học sinh - Lớp ${data.className}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 15mm 20mm 25mm;
        }
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.45;
          color: #000000;
          margin: 0;
          padding: 10px;
          background-color: #ffffff;
        }
        table.meta-header {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        table.meta-header td {
          vertical-align: top;
          text-align: center;
          padding: 0;
        }
        .main-title {
          text-align: center;
          margin-top: 16px;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 13pt;
          font-weight: bold;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        table.data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
          font-size: 12pt;
        }
        table.data-table th {
          border: 1px solid #000;
          background-color: #f2f2f2;
          padding: 6px;
          font-weight: bold;
          text-align: center;
        }
        table.data-table td {
          border: 1px solid #000;
          padding: 6px;
        }
        .notice-box {
          font-style: italic;
          font-weight: bold;
          margin: 6px 0;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }
        .print-btn-bar {
          position: fixed;
          top: 12px;
          right: 20px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          display: flex;
          gap: 10px;
        }
        .btn-print {
          background: #059669;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        }
        .btn-close {
          background: #e2e8f0;
          color: #1e293b;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      ${isForPrint ? `
        <div class="no-print print-btn-bar">
          <button class="btn-print" onclick="window.print()">🖨️ In Ngay / Lưu PDF (Ctrl+P)</button>
          <button class="btn-close" onclick="window.close()">Đóng</button>
        </div>
      ` : ''}

      <table class="meta-header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 2px;">TRƯỜNG THCS VÀ THPT</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;"><span style="text-decoration: underline;">ĐỐC BINH KIỀU</span></div>
            <div style="font-size: 11pt; margin-top: 10px;">Số: &nbsp; &nbsp; /BB-THCS&amp;THPTĐBK</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 11.5pt; font-weight: bold; margin-top: 2px;"><span style="text-decoration: underline;">Độc lập – Tự do – Hạnh phúc</span></div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 10px;">Đồng Tháp, ngày ${data.meetingDate || '28'} tháng ${data.meetingMonth || '8'} năm ${data.meetingYear || '2026'}</div>
          </td>
        </tr>
      </table>

      <div class="main-title" style="text-align: center; margin-top: 16px; margin-bottom: 20px;">
        <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">BIÊN BẢN</div>
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0;">TẬP TRUNG HỌC SINH ĐẦU NĂM HỌC ${data.academicYear || '2026 – 2027'}</div>
        <div style="text-align: center; margin-top: 4px; margin-bottom: 12px;">
          <span style="display: inline-block; width: 220px; border-bottom: 1.5px solid #000;"></span>
        </div>
      </div>

      <p style="margin: 6px 0;">Vào lúc ${data.timeHour || '07'} giờ ${data.timeMinute || '30'} phút, Ngày ${data.meetingDate || '28'} tháng ${data.meetingMonth || '8'} năm ${data.meetingYear || '2026'}.</p>
      <p style="margin: 6px 0;">Địa điểm: Phòng số ${data.roomNumber || '...'} trường THCS-THPT Đốc Binh Kiều.</p>
      <p style="margin: 6px 0;">- Họ tên GVCN: <strong>${data.teacherName}</strong></p>
      <p style="margin: 6px 0;">- Lớp: <strong>${data.className}</strong></p>
      <p style="margin: 6px 0;">- Sĩ số học sinh: Tổng số: <strong>${data.totalStudents || 0}</strong> em. Trong đó: Nam: <strong>${data.maleStudents || 0}</strong> em; Nữ: <strong>${data.femaleStudents || 0}</strong> em.</p>

      <div class="section-title">NỘI DUNG:</div>
      <p style="font-weight: bold; margin-top: 12px; margin-bottom: 6px;">1. Thông tin học sinh có năng khiếu, đạt thành tích trong các phong trào, hội thi các cấp:</p>
      
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 45px;">TT</th>
            <th>Nội dung cuộc thi / Năng khiếu</th>
            <th style="width: 110px;">Giải thưởng</th>
            <th>Họ và tên học sinh</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          ${talentsRows}
        </tbody>
      </table>

      <p style="font-weight: bold; margin-top: 16px; margin-bottom: 6px;">2. Danh sách Ban cán sự lớp năm học ${data.academicYear || '2026 – 2027'}:</p>
      
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 45px;">TT</th>
            <th style="width: 180px;">Nhiệm vụ</th>
            <th>Họ và tên học sinh</th>
            <th style="width: 90px;">Học lực</th>
            <th style="width: 95px;">Hạnh kiểm</th>
            <th style="width: 120px;">Số điện thoại</th>
          </tr>
        </thead>
        <tbody>
          ${cadresRows}
        </tbody>
      </table>

      <p style="font-weight: bold; margin-top: 16px; margin-bottom: 6px;">3. Danh sách học sinh chưa ra lớp tập trung:</p>
      
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;">TT</th>
            <th>Họ và tên học sinh</th>
            <th style="width: 80px;">Lớp cũ</th>
            <th>Nơi ở hiện nay</th>
            <th style="width: 105px;">SĐT HS</th>
            <th style="width: 105px;">SĐT PH</th>
            <th>Lý do chưa ra lớp</th>
          </tr>
        </thead>
        <tbody>
          ${absentRows}
        </tbody>
      </table>

      ${data.additionalNotes ? `
        <div style="margin-top: 15px;">
          <strong>Ý kiến / Đề xuất thêm của GVCN:</strong><br>
          <div style="font-style: italic; margin-top: 4px;">${data.additionalNotes}</div>
        </div>
      ` : ''}

      <table style="width: 100%; margin-top: 35px; border-collapse: collapse; page-break-inside: avoid;">
        <tr>
          <td style="width: 50%; text-align: center;"></td>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold;">GIÁO VIÊN CHỦ NHIỆM</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 65px;"></div>
            <div style="font-weight: bold;">${data.teacherName}</div>
          </td>
        </tr>
      </table>

      ${isForPrint ? `
        <script>
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 500);
          });
        </script>
      ` : ''}
    </body>
    </html>
  `;
}

/**
 * Xuất biên bản chủ nhiệm ra file Word (.doc)
 */
export function exportHomeroomReportToWord(data: HomeroomMeetingMinutesData, fileName?: string): void {
  const htmlContent = generateHomeroomReportHtml(data, false);
  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `Bien_Ban_Tap_Trung_Lop_${data.className}_${data.teacherName.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Xuất / In Biên bản chủ nhiệm ra PDF (.pdf)
 */
export function exportHomeroomReportToPdf(data: HomeroomMeetingMinutesData): void {
  const htmlContent = generateHomeroomReportHtml(data, true);
  printOrSavePdfHelper(htmlContent);
}

/**
 * Xuất danh sách học sinh vắng ra định dạng CSV/Excel
 */
export function exportAbsentStudentsToExcel(
  absentStudents: AbsentStudentItem[], 
  className: string, 
  teacherName: string,
  academicYear: string = '2026-2027'
): void {
  const headers = [
    'STT',
    'Họ và tên học sinh',
    'Lớp năm học trước',
    'Nơi ở hiện nay (thông tin chi tiết)',
    'Số điện thoại học sinh',
    'Số điện thoại phụ huynh',
    'Lý do chưa ra lớp'
  ];

  const rows = (absentStudents || []).map((s, idx) => [
    idx + 1,
    `"${s.studentName || ''}"`,
    `"${s.previousClass || ''}"`,
    `"${s.currentAddress || ''}"`,
    `"${s.studentPhone || ''}"`,
    `"${s.parentPhone || ''}"`,
    `"${s.reason || ''}"`
  ]);

  const titleHeader = [
    `"DANH SÁCH HỌC SINH VẮNG ĐẦU NĂM HỌC ${academicYear}"`,
    `"Lớp: ${className} - GVCN: ${teacherName}"`,
    `"Tổng số học sinh vắng: ${absentStudents?.length || 0} em"`,
    ""
  ].join('\n');

  const csvContent = '\uFEFF' + titleHeader + '\n' + [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `DS_Hoc_Sinh_Vang_Lop_${className}_${academicYear}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sinh mã HTML cho Báo cáo biểu mẫu tùy biến (Custom form & tables)
 */
export function generateCustomReportHtml({
  title,
  authorName,
  authorRole,
  departmentOrClass,
  academicYear = '2026 – 2027',
  fields = [],
  fieldValues = {},
  tables = [],
  notes = '',
  isForPrint = false
}: {
  title: string;
  authorName: string;
  authorRole?: string;
  departmentOrClass?: string;
  academicYear?: string;
  fields: CustomFormField[];
  fieldValues: Record<string, any>;
  tables: CustomDynamicTable[];
  notes?: string;
  isForPrint?: boolean;
}): string {
  const fieldsRows = fields.filter(f => fieldValues[f.id] !== undefined && fieldValues[f.id] !== '').map((f) => {
    let valStr = String(fieldValues[f.id]);
    if (f.type === 'checkbox') valStr = fieldValues[f.id] ? 'Đã hoàn thành / Đạt chuẩn' : 'Chưa hoàn thành';
    return `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold; width: 40%; background-color: #fafafa;">${f.label}</td>
        <td style="border: 1px solid #000; padding: 6px;">${valStr}</td>
      </tr>
    `;
  }).join('');

  const tablesHtml = tables.map((t, tIdx) => {
    const headerHtml = t.headers.map(h => `<th style="border: 1px solid #000; background-color: #f2f2f2; padding: 6px; text-align: center;">${h}</th>`).join('');
    const rowsHtml = t.rows.map(r => {
      const cells = t.headers.map(h => `<td style="border: 1px solid #000; padding: 6px;">${r[h] || ''}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <div style="font-weight: bold; font-size: 12pt; margin-top: 14px; margin-bottom: 6px;">
        ${tIdx + 1}. ${t.title}
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12pt;">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }).join('');

  const today = new Date();
  const dateStr = `Đốc Binh Kiều, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  return `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' lang="vi">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 15mm 20mm 25mm;
        }
        body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.45; color: #000; background: #fff; margin: 0; padding: 10px; }
        table.meta-header { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.meta-header td { vertical-align: top; text-align: center; }
        .main-title { text-align: center; font-size: 15pt; font-weight: bold; margin-top: 15px; margin-bottom: 15px; text-transform: uppercase; }
        .section-title { font-size: 13pt; font-weight: bold; margin-top: 16px; margin-bottom: 8px; }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
        }
        .print-btn-bar {
          position: fixed;
          top: 12px;
          right: 20px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          display: flex;
          gap: 10px;
        }
        .btn-print {
          background: #059669;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        }
        .btn-close {
          background: #e2e8f0;
          color: #1e293b;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      ${isForPrint ? `
        <div class="no-print print-btn-bar">
          <button class="btn-print" onclick="window.print()">🖨️ In Ngay / Lưu PDF (Ctrl+P)</button>
          <button class="btn-close" onclick="window.close()">Đóng</button>
        </div>
      ` : ''}

      <table class="meta-header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 2px;">TRƯỜNG THCS VÀ THPT</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;"><span style="text-decoration: underline;">ĐỐC BINH KIỀU</span></div>
            <div style="font-size: 11pt; margin-top: 10px;">Số: &nbsp; &nbsp; /BC-THCS&amp;THPTĐBK</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 11.5pt; font-weight: bold; margin-top: 2px;"><span style="text-decoration: underline;">Độc lập – Tự do – Hạnh phúc</span></div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 10px;">${dateStr}</div>
          </td>
        </tr>
      </table>

      <div class="main-title" style="text-align: center; margin-top: 16px; margin-bottom: 20px;">
        <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">BÁO CÁO</div>
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0;">${title.replace(/^Báo cáo (tổng hợp:?|:?)/i, '')}</div>
        <div style="text-align: center; margin-top: 4px; margin-bottom: 12px;">
          <span style="display: inline-block; width: 220px; border-bottom: 1.5px solid #000;"></span>
        </div>
        <div style="font-size: 11pt; font-weight: normal; font-style: italic; margin-top: 4px;">Năm học: ${academicYear}</div>
      </div>

      <div style="margin-bottom: 14px; font-size: 12.5pt;">
        <p style="margin: 4px 0;">- Người thực hiện báo cáo: <strong>${authorName}</strong></p>
        <p style="margin: 4px 0;">- Chức danh / Tổ: <strong>${authorRole || ''} - ${departmentOrClass || ''}</strong></p>
        <p style="margin: 4px 0;">- Đơn vị: Trường THCS-THPT Đốc Binh Kiều</p>
      </div>

      ${fieldsRows ? `
        <div class="section-title">I. THÔNG TIN & CHỈ TIÊU BÁO CÁO:</div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12pt;">
          <tbody>${fieldsRows}</tbody>
        </table>
      ` : ''}

      ${tablesHtml ? `
        <div class="section-title">II. CÁC BẢNG SỐ LIỆU THỐNG KÊ CHI TIẾT:</div>
        ${tablesHtml}
      ` : ''}

      ${notes ? `
        <div class="section-title">III. ĐÁNH GIÁ, THUẬN LỢI, KHÓ KHĂN & KIẾN NGHỊ:</div>
        <div style="font-size: 12pt; white-space: pre-line; line-height: 1.5; margin-bottom: 16px; text-align: justify;">
          ${notes}
        </div>
      ` : ''}

      <table style="width: 100%; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top;"></td>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <div style="font-weight: bold; font-size: 12.5pt;">NGƯỜI LẬP BÁO CÁO</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold; font-size: 12.5pt;">${authorName}</div>
          </td>
        </tr>
      </table>

      ${isForPrint ? `
        <script>
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 500);
          });
        </script>
      ` : ''}
    </body>
    </html>
  `;
}

/**
 * Xuất báo cáo biểu mẫu tùy biến ra tệp Word (.doc) quy chuẩn hành chính
 */
export function exportCustomReportToWord(options: {
  title: string;
  authorName: string;
  authorRole?: string;
  departmentOrClass?: string;
  academicYear?: string;
  fields: CustomFormField[];
  fieldValues: Record<string, any>;
  tables: CustomDynamicTable[];
  notes?: string;
  fileName?: string;
}): void {
  const htmlContent = generateCustomReportHtml({ ...options, isForPrint: false });
  const blob = new Blob(['\uFEFF' + htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (options.fileName || options.title).replace(/[^a-zA-Z0-9_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ ]/gi, '_');
  link.download = `${safeName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất / In báo cáo biểu mẫu tùy biến ra tệp PDF (.pdf)
 */
export function exportCustomReportToPdf(options: {
  title: string;
  authorName: string;
  authorRole?: string;
  departmentOrClass?: string;
  academicYear?: string;
  fields: CustomFormField[];
  fieldValues: Record<string, any>;
  tables: CustomDynamicTable[];
  notes?: string;
}): void {
  const htmlContent = generateCustomReportHtml({ ...options, isForPrint: true });
  printOrSavePdfHelper(htmlContent);
}

/**
 * Sinh mã HTML cho báo cáo thường (Standard Report soạn thảo văn bản)
 */
export function generateStandardReportHtml({
  title,
  content,
  authorName,
  authorRole,
  departmentOrClass,
  academicYear = '2026 – 2027',
  attachments = [],
  isForPrint = false
}: {
  title: string;
  content: string;
  authorName: string;
  authorRole?: string;
  departmentOrClass?: string;
  academicYear?: string;
  attachments?: ReportAttachment[];
  isForPrint?: boolean;
}): string {
  const today = new Date();
  const dateStr = `Đốc Binh Kiều, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  const formattedContent = (content || 'Chưa có nội dung báo cáo')
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('-') || trimmed.startsWith('+') || trimmed.startsWith('*')) {
        return `<p style="margin: 3px 0; padding-left: 20px; text-indent: 0; text-align: justify;">${trimmed}</p>`;
      }
      return `<p style="margin: 5px 0; text-indent: 20px; text-align: justify;">${trimmed}</p>`;
    })
    .filter(Boolean)
    .join('');

  const attachmentsList = attachments && attachments.length > 0 ? `
    <div style="margin-top: 16px;">
      <div style="font-weight: bold; font-size: 12pt;">Tệp đính kèm (${attachments.length}):</div>
      <ul style="margin: 4px 0 12px 20px; font-size: 11pt;">
        ${attachments.map(a => `<li>${a.name} (${(a.size / 1024).toFixed(1)} KB)</li>`).join('')}
      </ul>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' lang="vi">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 15mm 20mm 25mm;
        }
        body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.45; color: #000; background: #fff; margin: 0; padding: 10px; }
        table.meta-header { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.meta-header td { vertical-align: top; text-align: center; }
        .main-title { text-align: center; font-size: 15pt; font-weight: bold; margin-top: 15px; margin-bottom: 15px; text-transform: uppercase; }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
        }
        .print-btn-bar {
          position: fixed;
          top: 12px;
          right: 20px;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 8px 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 9999;
          display: flex;
          gap: 10px;
        }
        .btn-print {
          background: #059669;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        }
        .btn-close {
          background: #e2e8f0;
          color: #1e293b;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      ${isForPrint ? `
        <div class="no-print print-btn-bar">
          <button class="btn-print" onclick="window.print()">🖨️ In Ngay / Lưu PDF (Ctrl+P)</button>
          <button class="btn-close" onclick="window.close()">Đóng</button>
        </div>
      ` : ''}

      <table class="meta-header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 2px;">TRƯỜNG THCS VÀ THPT</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;"><span style="text-decoration: underline;">ĐỐC BINH KIỀU</span></div>
            <div style="font-size: 11pt; margin-top: 10px;">Số: &nbsp; &nbsp; /BC-THCS&amp;THPTĐBK</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 11.5pt; font-weight: bold; margin-top: 2px;"><span style="text-decoration: underline;">Độc lập – Tự do – Hạnh phúc</span></div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 10px;">${dateStr}</div>
          </td>
        </tr>
      </table>

      <div class="main-title" style="text-align: center; margin-top: 16px; margin-bottom: 20px;">
        <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">BÁO CÁO</div>
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0;">${title.replace(/^Báo cáo (tổng hợp:?|:?)/i, '')}</div>
        <div style="text-align: center; margin-top: 4px; margin-bottom: 12px;">
          <span style="display: inline-block; width: 220px; border-bottom: 1.5px solid #000;"></span>
        </div>
        <div style="font-size: 11pt; font-weight: normal; font-style: italic; margin-top: 4px;">Năm học: ${academicYear}</div>
      </div>

      <div style="margin-bottom: 16px; font-size: 12.5pt;">
        <p style="margin: 4px 0;">- Người thực hiện báo cáo: <strong>${authorName}</strong></p>
        <p style="margin: 4px 0;">- Chức vụ / Bộ phận: <strong>${authorRole || ''} - ${departmentOrClass || ''}</strong></p>
        <p style="margin: 4px 0;">- Đơn vị: Trường THCS-THPT Đốc Binh Kiều</p>
      </div>

      <div style="font-size: 13pt; line-height: 1.5; margin-bottom: 20px;">
        <div style="font-weight: bold; margin-bottom: 8px;">NỘI DUNG BÁO CÁO:</div>
        ${formattedContent}
      </div>

      ${attachmentsList}

      <table style="width: 100%; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top;"></td>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <div style="font-weight: bold; font-size: 12.5pt;">NGƯỜI LẬP BÁO CÁO</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold; font-size: 12.5pt;">${authorName}</div>
          </td>
        </tr>
      </table>

      ${isForPrint ? `
        <script>
          window.addEventListener('load', function() {
            setTimeout(function() {
              window.print();
            }, 500);
          });
        </script>
      ` : ''}
    </body>
    </html>
  `;
}

/**
 * Xuất báo cáo thường ra tệp Word (.doc)
 */
export function exportStandardReportToWord(options: {
  title: string;
  content: string;
  authorName: string;
  authorRole?: string;
  departmentOrClass?: string;
  academicYear?: string;
  attachments?: ReportAttachment[];
  fileName?: string;
}): void {
  const htmlContent = generateStandardReportHtml({ ...options, isForPrint: false });
  const blob = new Blob(['\uFEFF' + htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (options.fileName || options.title).replace(/[^a-zA-Z0-9_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ ]/gi, '_');
  link.download = `${safeName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất / In báo cáo thường ra tệp PDF (.pdf)
 */
export function exportStandardReportToPdf(options: {
  title: string;
  content: string;
  authorName: string;
  authorRole?: string;
  departmentOrClass?: string;
  academicYear?: string;
  attachments?: ReportAttachment[];
}): void {
  const htmlContent = generateStandardReportHtml({ ...options, isForPrint: true });
  printOrSavePdfHelper(htmlContent);
}
