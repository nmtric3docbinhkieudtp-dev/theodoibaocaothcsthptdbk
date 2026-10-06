import { HomeroomMeetingMinutesData, AbsentStudentItem, TalentAchievementItem, ClassCadreItem, CustomFormField, CustomDynamicTable, ReportAttachment } from '../types';

/**
 * Phân tích nội dung và tách dòng thông minh:
 * - Tách theo ký tự xuống dòng thực tế (\n, \r\n)
 * - Tự động nhận diện và ngắt dòng cho các dấu gạch đầu dòng (- , • , + , * , – )
 *   hoặc mục đánh số (1. , 2. ) ngay cả khi người dùng gõ / dán dính liền trên 1 dòng.
 * - Tuyệt đối không ngắt nhầm các số hiệu văn bản (như 3284/SGDĐT-GDPT, 1061/HD-SGDĐT) hay khoảng năm học (2026-2027).
 */
export function splitSmartLines(text: string): string[] {
  if (!text) return [];
  const rawSegments = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  const result: string[] = [];

  for (const segment of rawSegments) {
    let normalized = segment;

    // 1. Sau dấu kết thúc [.;:!?\)] có dấu gạch đầu dòng: "...dự thảo). - Công văn số..."
    normalized = normalized.replace(/([.;:!?\)])\s*([-•+*–])\s+/g, '$1\n$2 ');

    // 2. Có từ 2 khoảng trắng liên tiếp trở lên rồi đến dấu gạch đầu dòng: "...trung học.      - Công văn..."
    normalized = normalized.replace(/\s{2,}([-•+*–])\s+/g, '\n$1 ');

    // 3. Ở giữa câu có " - " hoặc " – " theo sau bởi từ viết hoa (tiếng Việt): "...văn bản - Kế hoạch..."
    // Đảm bảo không ngắt năm học như 2026-2027 hoặc 2026 – 2027
    normalized = normalized.replace(/([a-z0-9à-ỹ\)])\s+([-•+*–])\s+([A-ZÀ-Ỹ])/g, '$1\n$2 $3');

    // 4. Có danh sách đánh số dạng "1. ", "2. ", "a) ", "b) " sau dấu kết câu hoặc khoảng trắng rộng
    normalized = normalized.replace(/([.;:!?\)])\s*(\d+[\.\)]|[a-zA-Z]\))\s+/g, '$1\n$2 ');

    const subLines = normalized
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    result.push(...subLines);
  }

  return result;
}

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
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">ĐỐC BINH KIỀU</div>
            <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 4px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 90px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            <div style="font-size: 11pt; margin-top: 2px;">Số: &nbsp; &nbsp; /BB-THCS&amp;THPTĐBK</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 11.5pt; font-weight: bold; margin-top: 2px;">Độc lập – Tự do – Hạnh phúc</div>
            <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 4px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 170px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 2px;">Đồng Tháp, ngày ${data.meetingDate || '28'} tháng ${data.meetingMonth || '8'} năm ${data.meetingYear || '2026'}</div>
          </td>
        </tr>
      </table>

      <div class="main-title" style="text-align: center; margin-top: 16px; margin-bottom: 20px;">
        <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">BIÊN BẢN</div>
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0;">TẬP TRUNG HỌC SINH ĐẦU NĂM HỌC</div>
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin-top: 4px;">NĂM HỌC: ${data.academicYear || '2026 – 2027'}</div>
        <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 3px; margin-bottom: 14px;">
          <span style="display: inline-block; width: 160px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
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
 * Sinh mã HTML chuẩn Nghị định 30/2020/NĐ-CP cho ĐƠN XIN NGHỈ PHÉP
 * - Khổ giấy A4 đứng (lề trên 20mm, lề dưới 20mm, lề trái 30mm, lề phải 15mm)
 * - Cỡ chữ 12-14pt, font Times New Roman quy chuẩn
 * - Không có dòng Số: ... /BC-THCS... vì đây là đơn xin nghỉ phép, không phải báo cáo
 * - Không có chữ "BÁO CÁO" phía trên chữ "ĐƠN XIN NGHỈ PHÉP"
 * - Cấu trúc trích xuất chuẩn theo form: Họ và tên giáo viên, Môn dạy, Ngày nghỉ, Lý do nghỉ, Cách thức xử lý (Đổi tiết / Dạy thay)...
 * - Bảng thống kê tiết đổi / dạy thay chi tiết, có cột Chữ ký người dạy ở ngoài cùng bên phải
 * - 3 vị trí ký duyệt: Ý kiến Tổ trưởng chuyên môn, Người làm đơn, Ý kiến Ban Giám hiệu
 */
export function generateLeaveRequestHtml({
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
  // Trích xuất chính xác các trường dữ liệu theo form nhập của giáo viên
  let teacherName = '';
  let subjectName = '';
  let leaveDateRaw = '';
  let leaveReason = '';
  let handlingMethod = '';
  const otherFields: { label: string; value: string }[] = [];

  // VÒNG 1: Trích xuất trường theo độ ưu tiên rõ ràng
  for (const f of fields) {
    const val = fieldValues[f.id];
    const valStr = val !== undefined && val !== null ? String(val).trim() : '';
    const labelLower = (f.label || '').toLowerCase();

    // 1. Phương án xử lý tiết dạy (Đổi tiết / Dạy thay / Dạy bù)
    // Nếu giá trị chọn là 'Dạy thay' hoặc 'Đổi tiết', hoặc label là xử lý/phương án -> Ghi nhận vào handlingMethod
    const isHandlingValue = valStr === 'Dạy thay' || valStr === 'Đổi tiết' || valStr === 'Dạy bù' || /dạy\s*thay|đổi\s*tiết|dạy\s*bù/i.test(valStr);
    const isHandlingLabel = (
      labelLower.includes('cách xử lý') ||
      labelLower.includes('xử lý') ||
      labelLower.includes('phương án') ||
      labelLower.includes('dạy thay') ||
      labelLower.includes('đổi tiết') ||
      labelLower.includes('hình thức') ||
      (f.options && f.options.some(opt => /dạy\s*thay|đổi\s*tiết/i.test(opt)))
    );

    if (isHandlingValue || (isHandlingLabel && !/ngày|thời\s*gian/i.test(labelLower))) {
      if (valStr && !handlingMethod) {
        handlingMethod = valStr;
      }
      continue; // Đã là phương án xử lý thì không xét làm ngày nghỉ
    }

    // 2. Họ và tên người làm đơn
    if (labelLower.includes('họ và tên') || labelLower.includes('họ tên') || labelLower.includes('người làm đơn') || labelLower.includes('tên giáo viên')) {
      if (valStr && !teacherName) teacherName = valStr;
      continue;
    }

    // 3. Môn giảng dạy
    if ((labelLower.includes('môn') && !labelLower.includes('chuyên môn')) || labelLower.includes('bộ môn') || labelLower.includes('phân môn')) {
      if (valStr && !subjectName) subjectName = valStr;
      continue;
    }

    // 4. Ngày nghỉ phép (TUYỆT ĐỐI KHÔNG CHẤP NHẬN GIÁ TRỊ "Dạy thay" hoặc "Đổi tiết")
    const isDateType = f.type === 'date';
    const isDateValue = /^\d{4}-\d{2}-\d{2}$/.test(valStr) || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(valStr);
    const isDateLabel = (
      labelLower.includes('ngày nghỉ') ||
      labelLower.includes('thời gian nghỉ') ||
      labelLower.includes('ngày xin nghỉ') ||
      labelLower.includes('xin nghỉ vào ngày') ||
      (labelLower.includes('ngày') && (labelLower.includes('nghỉ') || labelLower.includes('phép')))
    );

    if ((isDateType || isDateValue || isDateLabel) && !isHandlingValue) {
      if (valStr && !leaveDateRaw) {
        leaveDateRaw = valStr;
      }
      continue;
    }

    // 5. Lý do nghỉ
    if (labelLower.includes('lý do') || labelLower.includes('nguyên nhân')) {
      if (valStr && !leaveReason) leaveReason = valStr;
      continue;
    }

    // 6. Các trường bổ sung khác
    if (f.type !== 'section' && valStr && !isHandlingValue) {
      otherFields.push({ label: f.label.replace(/:$/, '').trim(), value: valStr });
    }
  }

  // VÒNG 2: BẢO VỆ CHỐNG NHẦM LẪN - Nếu leaveDateRaw vô tình bị gán "Dạy thay" hoặc "Đổi tiết"
  if (/dạy\s*thay|đổi\s*tiết|dạy\s*bù/i.test(leaveDateRaw)) {
    if (!handlingMethod) handlingMethod = leaveDateRaw;
    leaveDateRaw = '';
  }

  // VÒNG 3: Tìm quét lại nếu ngày nghỉ chưa tìm thấy (tìm trường type date hoặc định dạng ngày)
  if (!leaveDateRaw) {
    for (const f of fields) {
      const val = fieldValues[f.id];
      const valStr = val !== undefined && val !== null ? String(val).trim() : '';
      if (!valStr || /dạy\s*thay|đổi\s*tiết/i.test(valStr)) continue;
      if (f.type === 'date' || /^\d{4}-\d{2}-\d{2}$/.test(valStr) || /^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(valStr)) {
        leaveDateRaw = valStr;
        break;
      }
    }
  }

  // VÒNG 4: Tìm quét lại nếu handlingMethod chưa có
  if (!handlingMethod) {
    for (const f of fields) {
      const val = fieldValues[f.id];
      const valStr = val !== undefined && val !== null ? String(val).trim() : '';
      if (/dạy\s*thay|đổi\s*tiết|dạy\s*bù/i.test(valStr)) {
        handlingMethod = valStr;
        break;
      }
    }
  }

  // Fallbacks mặc định nếu form chưa điền
  if (!teacherName) teacherName = authorName || '...................................................';
  if (!subjectName) subjectName = authorRole || '................................';
  const deptName = departmentOrClass || '................................';

  // Định dạng ngày nghỉ đẹp mắt theo chuẩn tiếng Việt
  let leaveDateFormatted = leaveDateRaw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(leaveDateRaw)) {
    const [y, m, d] = leaveDateRaw.split('-');
    leaveDateFormatted = `${d}/${m}/${y}`;
  }
  if (!leaveDateFormatted) {
    leaveDateFormatted = '........................................................';
  }

  if (!leaveReason) {
    leaveReason = '................................................................................................................................';
  }

  // Ngày lập đơn
  const today = new Date();
  const dateStr = `Đốc Binh Kiều, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  // Xử lý bảng thống kê tiết đổi / dạy thay
  // Yêu cầu: Trong bảng thống kê tiết đổi phải có chỗ bên phải ngoài cùng để giáo viên ký tên vào
  const tablesHtml = tables.map((t, tIdx) => {
    let headers = [...t.headers];
    const hasSigCol = headers.some(h => /ký|chữ\s*ký|xác\s*nhận/i.test(h));
    if (!hasSigCol) {
      headers.push('Chữ ký người dạy');
    }

    const headerHtml = headers.map((h, i) => {
      const isLast = i === headers.length - 1;
      return `<th style="border: 1px solid #000; background-color: #f2f2f2; padding: 5px 4px; text-align: center; font-weight: bold; font-size: 12pt; ${isLast ? 'width: 130px;' : ''}">${h}</th>`;
    }).join('');

    let rowsToRender = t.rows && t.rows.length > 0 ? t.rows : [];
    // Nếu bảng chưa có dòng nào, tạo sẵn 2 dòng mẫu gọn gàng để tiết kiệm diện tích trang
    if (rowsToRender.length === 0) {
      rowsToRender = [
        { 'STT': '1', 'Lớp': '', 'Tiết': '', 'Người dạy': '', 'Chữ ký người dạy': '' },
        { 'STT': '2', 'Lớp': '', 'Tiết': '', 'Người dạy': '', 'Chữ ký người dạy': '' }
      ];
    }

    const rowsHtml = rowsToRender.map((r, rIdx) => {
      const cells = headers.map((h, cIdx) => {
        const isLast = cIdx === headers.length - 1;
        const cellVal = r[h] !== undefined && r[h] !== null ? String(r[h]).trim() : '';
        const isStt = /^(stt|tt)$/i.test(h);
        const isTiet = /^tiết$/i.test(h);
        const isLop = /^lớp$/i.test(h);
        const align = (isStt || isTiet || isLop || isLast) ? 'center' : 'left';
        
        if (isLast && (/ký|chữ\s*ký|xác\s*nhận/i.test(h) || !hasSigCol)) {
          return `<td style="border: 1px solid #000; padding: 3px 4px; text-align: center; height: 28px; font-size: 12pt; vertical-align: middle;">${cellVal}</td>`;
        }

        return `<td style="border: 1px solid #000; padding: 3px 6px; text-align: ${align}; font-size: 12pt;">${cellVal || (isStt ? String(rIdx + 1) : '&nbsp;')}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    const cleanTableTitle = (t.title || 'THỐNG KÊ CHI TIẾT TIẾT DẠY THAY HOẶC ĐỔI TIẾT').toUpperCase();

    return `
      <div style="font-weight: bold; font-size: 12.5pt; margin-top: 6px; margin-bottom: 3px; text-transform: uppercase;">
        ${tables.length > 1 ? `${tIdx + 1}. ` : ''}${cleanTableTitle}:
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 12pt;">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }).join('');

  const otherFieldsHtml = otherFields.map(item => `
    <p style="margin: 3px 0; text-indent: 25px; text-align: justify; font-size: 13pt;">
      ${item.label}: <strong>${item.value}</strong>
    </p>
  `).join('');

  return `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40' lang="vi">
    <head>
      <meta charset="utf-8">
      <title>ĐƠN XIN NGHỈ PHÉP - ${teacherName}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm 15mm 10mm 20mm; /* Tối ưu lề chuẩn Nghị định 30 đảm bảo 100% nằm trọn trong 1 trang A4 duy nhất */
        }
        * {
          box-sizing: border-box;
        }
        body { 
          font-family: 'Times New Roman', Times, serif; 
          font-size: 13pt; 
          line-height: 1.38; 
          color: #000; 
          background: #fff; 
          margin: 0; 
          padding: 0; 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page-container {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 2px 4px;
        }
        table.meta-header { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 6px; 
        }
        table.meta-header td { 
          vertical-align: top; 
          text-align: center; 
        }
        .main-title { 
          text-align: center; 
          margin-top: 8px; 
          margin-bottom: 6px; 
        }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0 !important; margin: 0 !important; }
          .page-container { page-break-inside: avoid !important; }
          .signature-table { page-break-inside: avoid !important; }
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

      <div class="page-container">
        <!-- HEADER CƠ QUAN VÀ QUỐC HIỆU (CHUẨN THỂ THỨC NGHỊ ĐỊNH 30/2020/NĐ-CP) -->
        <!-- BỎ DÒNG Số: ... /BC-THCS... VÌ ĐÂY LÀ ĐƠN XIN NGHỈ PHÉP, KHÔNG PHẢI BÁO CÁO -->
        <table class="meta-header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 6px;">
          <tr>
            <td style="width: 44%; text-align: center; vertical-align: top; border: none; padding: 0;">
              <div style="font-size: 12pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
              <div style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">TRƯỜNG THCS VÀ THPT</div>
              <div style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">ĐỐC BINH KIỀU</div>
              <div style="text-align: center; margin-top: 2px; margin-bottom: 2px;">
                <span style="display: inline-block; width: 95px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
              </div>
            </td>
            <td style="width: 56%; text-align: center; vertical-align: top; border: none; padding: 0;">
              <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-size: 13pt; font-weight: bold; margin-top: 1px;">Độc lập – Tự do – Hạnh phúc</div>
              <div style="text-align: center; margin-top: 2px; margin-bottom: 2px;">
                <span style="display: inline-block; width: 165px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
              </div>
            </td>
          </tr>
        </table>

        <!-- TIÊU ĐỀ: ĐƠN XIN NGHỈ PHÉP (XÓA CHỮ BÁO CÁO PHÍA TRÊN) -->
        <div class="main-title" style="text-align: center; margin-top: 8px; margin-bottom: 6px;">
          <div style="font-size: 15pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
            ĐƠN XIN NGHỈ PHÉP
          </div>
        </div>

        <!-- KÍNH GỬI: BAN GIÁM HIỆU & TỔ TRƯỞNG CHUYÊN MÔN -->
        <div style="text-align: center; margin-bottom: 6px; font-size: 13pt;">
          <div style="display: inline-block; text-align: left; line-height: 1.4;">
            <div style="font-weight: bold;">Kính gửi:</div>
            <div style="padding-left: 20px;">- Ban Giám hiệu Trường THCS và THPT Đốc Binh Kiều;</div>
            <div style="padding-left: 20px;">- Tổ trưởng Tổ chuyên môn: <strong>${deptName}</strong>.</div>
          </div>
        </div>

        <!-- NỘI DUNG FORM KHAI BÁO CỦA GIÁO VIÊN -->
        <div style="font-size: 13pt; line-height: 1.4; margin-bottom: 6px;">
          <p style="margin: 3px 0; text-indent: 25px; text-align: justify;">
            Tôi tên là: <strong>${teacherName}</strong>
          </p>
          <p style="margin: 3px 0; text-indent: 25px; text-align: justify;">
            Giáo viên giảng dạy môn: <strong>${subjectName}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Tổ chuyên môn: <strong>${deptName}</strong>
          </p>
          <p style="margin: 3px 0; text-indent: 25px; text-align: justify;">
            Nay tôi làm đơn này kính xin Ban Giám hiệu và Tổ trưởng chuyên môn cho tôi được nghỉ phép vào ngày: <strong>${leaveDateFormatted}</strong>
          </p>
          <p style="margin: 3px 0; text-indent: 25px; text-align: justify;">
            Lý do nghỉ: <strong>${leaveReason}</strong>
          </p>
          <p style="margin: 3px 0; text-indent: 25px; text-align: justify;">
            Phương án xử lý tiết dạy: <strong>${handlingMethod || 'Dạy thay'}</strong>
          </p>
          ${otherFieldsHtml}
        </div>

        <!-- BẢNG THỐNG KÊ CHI TIẾT TIẾT DẠY THAY / ĐỔI TIẾT (CÓ CHỖ KÝ TÊN BÊN PHẢI NGOÀI CÙNG) -->
        ${tablesHtml}

        <!-- GHI CHÚ / KIẾN NGHỊ THÊM (NẾU CÓ) -->
        ${notes && notes.trim() ? `
          <div style="font-size: 12pt; margin-top: 4px; margin-bottom: 4px;">
            <strong>Ghi chú / Đề xuất thêm:</strong> ${notes}
          </div>
        ` : ''}

        <!-- LỜI CAM KẾT HOÀN THÀNH NHIỆM VỤ -->
        <div style="text-indent: 25px; margin: 6px 0 8px 0; text-align: justify; line-height: 1.4; font-size: 13pt;">
          Tôi xin cam kết sẽ thực hiện đầy đủ chương trình giảng dạy, việc dạy bù hoặc đổi tiết theo đúng kế hoạch và quy chế chuyên môn của nhà trường./.
        </div>

        <!-- CHỮ KÝ PHÊ DUYỆT: THIẾT KẾ 3 CỘT GỌN GÀNG TRÊN 1 HÀNG, MỞ RỘNG KHOẢNG TRỐNG KÝ VÀ ĐÓNG MỘC THOẢI MÁI -->
        <table class="signature-table" style="width: 100%; margin-top: 10px; border-collapse: collapse; page-break-inside: avoid;">
          <tr>
            <td colspan="2" style="width: 64%;"></td>
            <td style="width: 36%; text-align: center; vertical-align: top; font-style: italic; font-size: 13pt; padding-bottom: 4px;">
              ${dateStr}
            </td>
          </tr>
          <tr>
            <td style="width: 33%; text-align: center; vertical-align: top; padding: 2px 4px;">
              <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; line-height: 1.3;">Ý KIẾN CỦA TỔ TRƯỞNG CHUYÊN MÔN</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 108px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">......................................</div>
            </td>
            <td style="width: 34%; text-align: center; vertical-align: top; padding: 2px 4px;">
              <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; line-height: 1.3;">Ý KIẾN PHÊ DUYỆT CỦA BAN GIÁM HIỆU</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên, đóng dấu)</div>
              <div style="height: 108px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">......................................</div>
            </td>
            <td style="width: 33%; text-align: center; vertical-align: top; padding: 2px 4px;">
              <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; line-height: 1.3;">NGƯỜI LÀM ĐƠN</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 108px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">${teacherName}</div>
            </td>
          </tr>
        </table>
      </div>

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
 * Sinh mã HTML cho Báo cáo biểu mẫu tùy biến (Custom form & tables)
 * Hỗ trợ chuyển đổi định dạng chuẩn văn bản hành chính theo Nghị định 30/2020/NĐ-CP
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
  // Kiểm tra xem đây có phải là Đơn xin nghỉ phép không
  const isLeaveRequest = Boolean(
    /nghỉ\s*phép/i.test(title) ||
    /xin\s*phép/i.test(title) ||
    /đơn\s*xin/i.test(title) ||
    fields.some(f => /nghỉ\s*phép/i.test(f.label) || /lý\s*do\s*nghỉ/i.test(f.label))
  );

  if (isLeaveRequest) {
    return generateLeaveRequestHtml({
      title,
      authorName,
      authorRole,
      departmentOrClass,
      academicYear,
      fields,
      fieldValues,
      tables,
      notes,
      isForPrint
    });
  }

  // Kiểm tra xem đây có phải là Biên bản không
  const isMinutes = /biên\s*bản/i.test(title) || /họp\s*tổ/i.test(title) || 
    fields.some(f => /thư\s*ký/i.test(f.label) || /chủ\s*trì/i.test(f.label));

  let cleanTitle = title.trim();
  cleanTitle = cleanTitle.replace(/^Báo cáo (tổng hợp:?|:?)\s*/i, '').trim();

  // Bóc tách ngày tháng trong tiêu đề đợt báo cáo nếu có (ví dụ: (08-10-2026))
  const titleDateMatch = title.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  const titleDateStr = titleDateMatch 
    ? `ngày ${titleDateMatch[1]} tháng ${titleDateMatch[2]} năm ${titleDateMatch[3]}` 
    : '';

  // Bóc tách thông tin mở đầu cuộc họp nếu là Biên bản
  let meetingTimeStr = '';
  let locationStr = '';
  let participantsStr = '';
  let totalMembersStr = '';
  let presentMembersStr = '';
  let absentWithPermStr = '';
  let absentWithoutPermStr = '';
  let chairPersonStr = '';
  let secretaryStr = '';
  let endTimeStr = '';

  const handledFieldIds = new Set<string>();

  if (isMinutes) {
    for (const f of fields) {
      const val = fieldValues[f.id];
      const valStr = val !== undefined && val !== null ? String(val).trim() : '';
      const labelLower = f.label.toLowerCase();

      if (labelLower.includes('thời gian') || labelLower.includes('giờ, phút') || labelLower.includes('thời điểm họp')) {
        if (!labelLower.includes('kết thúc')) {
          meetingTimeStr = valStr;
          handledFieldIds.add(f.id);
        }
      } else if (labelLower.includes('địa điểm') || labelLower.includes('phòng')) {
        locationStr = valStr;
        handledFieldIds.add(f.id);
      } else if (labelLower.includes('tổng số thành viên của tổ') || labelLower.includes('tổng số thành viên') || labelLower.includes('sĩ số')) {
        totalMembersStr = valStr;
        handledFieldIds.add(f.id);
      } else if (labelLower.includes('tham dự') || labelLower.includes('có mặt')) {
        presentMembersStr = valStr;
        handledFieldIds.add(f.id);
      } else if (labelLower.includes('vắng có phép') || labelLower.includes('có phép')) {
        absentWithPermStr = valStr;
        handledFieldIds.add(f.id);
      } else if (labelLower.includes('vắng không phép') || labelLower.includes('không phép')) {
        absentWithoutPermStr = valStr;
        handledFieldIds.add(f.id);
      } else if (labelLower.includes('thành phần')) {
        participantsStr = valStr;
        handledFieldIds.add(f.id);
      } else if (labelLower.includes('chủ trì') || labelLower.includes('chủ tọa') || (labelLower.includes('tổ trưởng') && !labelLower.includes('ý kiến'))) {
        chairPersonStr = valStr;
        handledFieldIds.add(f.id);
      } else if (labelLower.includes('thư ký')) {
        secretaryStr = valStr;
        handledFieldIds.add(f.id);
      } else if (labelLower.includes('kết thúc') || labelLower.includes('kết thúc lúc')) {
        endTimeStr = valStr;
        handledFieldIds.add(f.id);
      }
    }

    // Nếu thời gian họp chỉ có giờ phút mà chưa có ngày, bổ sung ngày từ tiêu đề
    if (meetingTimeStr && !/ngày/i.test(meetingTimeStr) && titleDateStr) {
      meetingTimeStr = `${meetingTimeStr}, ${titleDateStr}`;
    }
  }

  // Tên hiển thị người ký
  const secretaryName = secretaryStr || '';
  const chairPersonName = chairPersonStr || authorName;

  // Bóc tách tên tổ để đưa vào tiêu đề cơ quan ban hành (TỔ TOÁN, TỔ VĂN PHÒNG,...)
  let deptNameForHeader = '';
  const rawDeptStr = departmentOrClass || participantsStr || '';
  if (rawDeptStr) {
    const cleaned = rawDeptStr
      .replace(/^Thành viên tổ\s+/i, '')
      .replace(/^Tổ\s+/i, '')
      .trim();
    if (cleaned && !cleaned.toLowerCase().includes('tất cả')) {
      deptNameForHeader = cleaned.toUpperCase();
    }
  }

  // Xử lý tiêu đề phụ cho biên bản
  let minutesMainTitle = cleanTitle;
  // Loại bỏ hậu tố tác giả (ví dụ: - Trần Văn Út) nếu có
  minutesMainTitle = minutesMainTitle.replace(/\s*[-–]\s*(Thầy|Cô|GV|Tổ trưởng)?\s*[A-ZÀ-Ỹ][a-zà-ỹ]+(\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)*$/i, '').trim();
  const minutesSubTitle = minutesMainTitle.replace(/^BIÊN\s*BẢN\s*[-–:]?\s*/i, '').trim();

  // Kiểm tra xem trong các trường có mục 1 (Đánh giá hoạt động của tổ) hay không
  let hasEvaluationField = false;
  // Kiểm tra xem trong các trường có mục 3 (Triển khai công việc trọng tâm) hay không
  let hasCentralTasksField = false;

  // Lọc các trường nội dung còn lại (thể hiện dưới dạng văn bản hành chính)
  const activeFields = fields.filter(f => {
    if (handledFieldIds.has(f.id)) return false;
    
    const labelLower = (f.label || '').toLowerCase();
    if (
      labelLower.includes('đánh giá hoạt động') || 
      labelLower.includes('đánh giá của tổ') || 
      labelLower.includes('hoạt động của tổ trong thời gian qua') ||
      (labelLower.includes('đánh giá') && labelLower.includes('tổ'))
    ) {
      hasEvaluationField = true;
    }

    if (
      labelLower.includes('trọng tâm') || 
      labelLower.includes('công việc trọng tâm') || 
      labelLower.includes('nội dung công việc trọng tâm')
    ) {
      hasCentralTasksField = true;
    }

    // Luôn giữ lại tiêu đề phân mục section
    if (f.type === 'section') return true;

    // Nếu là biên bản họp thì giữ lại tất cả các trường để in mẫu đầy đủ các mục 1, 2, 3, 4, 5, 6...
    if (isMinutes) return true;

    const v = fieldValues[f.id];
    return v !== undefined && v !== null && String(v).trim() !== '';
  });

  const contentBodyHtml = activeFields.map((f) => {
    const rawVal = fieldValues[f.id];
    let valFormatted = '';

    if (f.type === 'section') {
      return `
        <div style="font-size: 13pt; font-weight: bold; margin-top: 14px; margin-bottom: 6px; color: #000;">
          ${f.label}
        </div>
      `;
    }

    if (f.type === 'checkbox') {
      if (Array.isArray(rawVal)) {
        valFormatted = rawVal.length > 0 ? rawVal.map(item => `<div>- ${item}</div>`).join('') : '<div style="font-style: italic;">Không</div>';
      } else {
        valFormatted = rawVal ? 'Đã hoàn thành / Đạt chuẩn quy định' : 'Chưa hoàn thành';
      }
    } else {
      const textVal = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
      const lines = splitSmartLines(textVal);
      if (lines.length === 0) {
        valFormatted = '';
      } else if (lines.length === 1 && !lines[0].startsWith('-') && !lines[0].startsWith('•') && !lines[0].startsWith('+') && !lines[0].startsWith('*') && !lines[0].startsWith('–')) {
        valFormatted = `<div style="text-indent: 20px; text-align: justify; line-height: 1.55;">${lines[0]}</div>`;
      } else {
        valFormatted = lines.map(line => {
          if (line.startsWith('-') || line.startsWith('+') || line.startsWith('•') || line.startsWith('*') || line.startsWith('–')) {
            return `<div style="margin: 4px 0 4px 20px; text-indent: -12px; text-align: justify; line-height: 1.55;">${line}</div>`;
          }
          if (/^(Ý kiến|\d+[\.\)]|[a-zA-Z][\.\)])/i.test(line)) {
            return `<div style="margin: 4px 0 4px 15px; font-weight: 500; text-align: justify; line-height: 1.55;">${line}</div>`;
          }
          return `<div style="margin: 3px 0; text-indent: 20px; text-align: justify; line-height: 1.55;">${line}</div>`;
        }).join('');
      }
    }

    const cleanLabel = f.label.replace(/:$/, '').trim();
    const isSubBullet = /^(ưu điểm|hạn chế|nguyên nhân|giải pháp)/i.test(cleanLabel.replace(/^[-•+*–\s]+/, ''));

    if (isSubBullet) {
      const pureLabel = cleanLabel.replace(/^[-•+*–\s]+/, '');
      const rawText = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
      const subLines = splitSmartLines(rawText);
      const textDisplay = subLines.length > 0 ? subLines.join(' ') : '';
      return `
        <div style="margin: 3px 0 3px 20px; text-indent: -12px; font-size: 13pt; line-height: 1.55; text-align: justify; color: #111;">
          <strong>- ${pureLabel}:</strong> ${textDisplay ? `<span>${textDisplay}</span>` : '<span style="font-style: italic; color: #666;">Chưa ghi nhận</span>'}
        </div>
      `;
    }

    if (!valFormatted) {
      return `
        <div style="margin-top: 14px; margin-bottom: 6px; font-size: 13pt; line-height: 1.55;">
          <div style="font-weight: bold; color: #000;">
            ${cleanLabel}${cleanLabel.endsWith(':') ? '' : ':'}
          </div>
        </div>
      `;
    }

    return `
      <div style="margin-top: 12px; margin-bottom: 8px; font-size: 13pt; line-height: 1.55;">
        <div style="font-weight: bold; margin-bottom: 4px; color: #000;">
          ${cleanLabel}${cleanLabel.endsWith(':') ? '' : ':'}
        </div>
        <div style="text-align: justify; padding-left: 2px; color: #111;">
          ${valFormatted}
        </div>
      </div>
    `;
  }).join('');

  // Nếu là biên bản mà trong danh sách các trường chưa có mục 1 (Đánh giá hoạt động của tổ), tự động chèn tiêu đề vào đầu nội dung
  let fullContentHtml = contentBodyHtml;
  if (isMinutes && !hasEvaluationField) {
    const evaluationHtmlBlock = `
      <div style="margin-top: 14px; margin-bottom: 6px; font-size: 13pt; line-height: 1.55;">
        <div style="font-weight: bold; color: #000;">
          1. Đánh giá hoạt động của tổ trong thời gian qua:
        </div>
      </div>
    `;

    // Chèn ngay đầu nội dung (dưới dòng NỘI DUNG CUỘC HỌP và ngay trên các phần Ưu điểm, Hạn chế...)
    fullContentHtml = evaluationHtmlBlock + fullContentHtml;
  }

  // Nếu là biên bản mà trong danh sách các trường chưa có mục 3 (công việc trọng tâm), tự động chèn vào đúng vị trí
  if (isMinutes && !hasCentralTasksField) {
    const centralTasksHtmlBlock = `
      <div style="margin-top: 12px; margin-bottom: 8px; font-size: 13pt; line-height: 1.55;">
        <div style="font-weight: bold; margin-bottom: 4px; color: #000;">
          3. Triển khai nội dung công việc trọng tâm của trường/tổ:
        </div>
        <div style="text-align: justify; padding-left: 2px; color: #111;">
          <div style="margin: 3px 0; text-indent: 20px;">- Góp ý dự thảo kế hoạch giáo dục nhà trường năm học 2026-2027. Tập trung đánh giá các số liệu, chỉ tiêu trong kế hoạch giáo dục.</div>
          <div style="margin: 3px 0; text-indent: 20px;">- Thảo luận việc phân công chuyên môn và thời khóa biểu áp dụng từ tuần 01.</div>
          <div style="margin: 3px 0; text-indent: 20px;">- Rà soát thiết bị dạy học, phòng bộ môn, sách giáo khoa và các điều kiện đảm bảo cho năm học mới.</div>
          <div style="margin: 3px 0; text-indent: 20px;">- Triển khai sinh hoạt chuyên môn theo nghiên cứu bài học, thao giảng và kiểm tra nội bộ tổ.</div>
        </div>
      </div>
    `;

    // Chèn sau mục 2 nếu có mục 4, 5, 6
    const insertIndex = fullContentHtml.search(/(Ý kiến của các thành viên|4\.\s*Ý kiến|Kết luận của chủ trì|5\.\s*Kết luận)/i);
    if (insertIndex !== -1) {
      fullContentHtml = fullContentHtml.slice(0, insertIndex) + centralTasksHtmlBlock + fullContentHtml.slice(insertIndex);
    } else {
      fullContentHtml += centralTasksHtmlBlock;
    }
  }

  // Bảng dữ liệu thống kê số liệu (nếu có bảng tùy biến thực sự)
  const tablesHtml = tables.map((t, tIdx) => {
    const headerHtml = t.headers.map(h => `<th style="border: 1px solid #000; background-color: #f2f2f2; padding: 6px; text-align: center;">${h}</th>`).join('');
    const rowsHtml = t.rows.map(r => {
      const cells = t.headers.map(h => `<td style="border: 1px solid #000; padding: 6px;">${r[h] || ''}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    return `
      <div style="font-weight: bold; font-size: 12.5pt; margin-top: 14px; margin-bottom: 6px;">
        ${tIdx + 1}. ${t.title}
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12pt;">
        <thead><tr>${headerHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    `;
  }).join('');

  const today = new Date();
  const dateStr = titleDateStr 
    ? `Đồng Tháp, ${titleDateStr}` 
    : `Đồng Tháp, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

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
        body { 
          font-family: 'Times New Roman', Times, serif; 
          font-size: 13pt; 
          line-height: 1.45; 
          color: #000; 
          background: #fff; 
          margin: 0; 
          padding: 10px; 
        }
        table.meta-header { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 16px; 
        }
        table.meta-header td { 
          vertical-align: top; 
          text-align: center; 
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
        table.data-table th, table.data-table td {
          border: 1px solid #000;
          padding: 6px;
        }
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

      <!-- HEADER QUỐC HIỆU VÀ TÊN ĐƠN VỊ -->
      <table class="meta-header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 2px;">TRƯỜNG THCS VÀ THPT</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">ĐỐC BINH KIỀU</div>
            <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 4px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 90px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            ${deptNameForHeader ? `<div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 2px;">TỔ ${deptNameForHeader}</div>` : ''}
            <div style="font-size: 11pt; margin-top: 2px;">Số: &nbsp; &nbsp; /${isMinutes ? 'BB' : 'BC'}-THCS&amp;THPTĐBK</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 11.5pt; font-weight: bold; margin-top: 2px;">Độc lập – Tự do – Hạnh phúc</div>
            <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 4px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 170px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 2px;">${dateStr}</div>
          </td>
        </tr>
      </table>

      <!-- TIÊU ĐỀ TÀI LIỆU -->
      <div class="main-title" style="text-align: center; margin-top: 16px; margin-bottom: 20px;">
        ${!isMinutes ? `
          <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">BÁO CÁO</div>
          <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">
            ${cleanTitle}
          </div>
        ` : `
          <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">BIÊN BẢN</div>
          <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">
            ${minutesSubTitle}
          </div>
        `}
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 4px 0 0 0;">
          NĂM HỌC: ${academicYear}
        </div>
        <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 3px; margin-bottom: 14px;">
          <span style="display: inline-block; width: 160px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
        </div>
      </div>

      <!-- NẾU LÀ BÁO CÁO: HIỂN THỊ THÔNG TIN NGƯỜI BÁO CÁO -->
      ${!isMinutes ? `
        <div style="margin-bottom: 14px; font-size: 12.5pt;">
          <p style="margin: 4px 0;">- Người thực hiện báo cáo: <strong>${authorName}</strong></p>
          <p style="margin: 4px 0;">- Chức danh / Tổ: <strong>${authorRole || ''} - ${departmentOrClass || ''}</strong></p>
          <p style="margin: 4px 0;">- Đơn vị: Trường THCS-THPT Đốc Binh Kiều</p>
        </div>
      ` : ''}

      <!-- NẾU LÀ BIÊN BẢN: HIỂN THỊ THỜI GIAN, ĐỊA ĐIỂM, THÀNH PHẦN MỞ ĐẦU -->
      ${isMinutes ? `
        <div style="margin-bottom: 16px; font-size: 13pt; line-height: 1.6;">
          ${meetingTimeStr ? `<p style="margin: 3px 0;"><strong>Thời gian:</strong> Vào lúc ${meetingTimeStr}.</p>` : ''}
          ${locationStr ? `<p style="margin: 3px 0;"><strong>Địa điểm:</strong> ${locationStr}.</p>` : ''}
          <p style="margin: 6px 0 2px 0;"><strong>Thành phần tham dự:</strong></p>
          ${participantsStr ? `<p style="margin: 2px 0 2px 20px;">- Đối tượng: ${participantsStr}.</p>` : ''}
          ${totalMembersStr || presentMembersStr ? `
            <p style="margin: 2px 0 2px 20px;">
              - Tổng số thành viên của tổ: <strong>${totalMembersStr || '...'}</strong>; Số lượng có mặt tham dự: <strong>${presentMembersStr || '...'}</strong>.
            </p>
          ` : ''}
          ${absentWithPermStr ? `<p style="margin: 2px 0 2px 20px;">- Vắng có phép: ${absentWithPermStr}.</p>` : ''}
          ${absentWithoutPermStr ? `<p style="margin: 2px 0 2px 20px;">- Vắng không phép: ${absentWithoutPermStr}.</p>` : ''}
          ${chairPersonStr ? `<p style="margin: 4px 0 2px 0;"><strong>Chủ trì cuộc họp:</strong> ${chairPersonStr}.</p>` : ''}
          ${secretaryStr ? `<p style="margin: 2px 0 4px 0;"><strong>Thư ký cuộc họp:</strong> ${secretaryStr}.</p>` : ''}
        </div>

        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; text-align: center;">
          NỘI DUNG CUỘC HỌP
        </div>
      ` : ''}

      <!-- NỘI DUNG VĂN BẢN (KHÔNG XUẤT DẠNG BẢNG 2 CỘT) -->
      ${fullContentHtml ? `
        ${!isMinutes ? `<div class="section-title">I. THÔNG TIN & NỘI DUNG BÁO CÁO:</div>` : ''}
        <div style="margin-bottom: 16px;">
          ${fullContentHtml}
        </div>
      ` : ''}

      <!-- CÁC BẢNG SỐ LIỆU (NẾU CÓ BẢNG THỐNG KÊ CHI TIẾT) -->
      ${tablesHtml ? `
        <div class="section-title">${isMinutes ? 'CÁC BẢNG SỐ LIỆU ĐÍNH KÈM:' : 'II. CÁC BẢNG SỐ LIỆU THỐNG KÊ CHI TIẾT:'}</div>
        ${tablesHtml}
      ` : ''}

      <!-- GHI CHÚ, ĐÁNH GIÁ THÊM NẾU CÓ -->
      ${notes ? `
        <div class="section-title">${isMinutes ? 'GHI CHÚ THÊM:' : 'III. ĐÁNH GIÁ, THUẬN LỢI, KHÓ KHĂN & KIẾN NGHỊ:'}</div>
        <div style="font-size: 12.5pt; white-space: pre-line; line-height: 1.5; margin-bottom: 16px; text-align: justify; text-indent: 20px;">
          ${notes}
        </div>
      ` : ''}

      <!-- KẾT THÚC CUỘC HỌP CHO BIÊN BẢN -->
      ${isMinutes ? `
        <div style="margin-top: 18px; margin-bottom: 20px; font-size: 13pt; text-indent: 25px; line-height: 1.6;">
          Cuộc họp kết thúc vào lúc ${endTimeStr || '... giờ ... phút'} cùng ngày, biên bản đã được thông qua toàn thể cuộc họp và thống nhất ký tên./.
        </div>
      ` : ''}

      <!-- CHỮ KÝ: PHÂN BIỆT RÕ BIÊN BẢN (THƯ KÝ + CHỦ TRÌ) VÀ BÁO CÁO (NGƯỜI BÁO CÁO) -->
      ${isMinutes ? `
        <table style="width: 100%; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 13.5pt; text-transform: uppercase;">THƯ KÝ</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 100px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">${secretaryName}</div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 13.5pt; text-transform: uppercase;">CHỦ TRÌ CUỘC HỌP</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 100px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">${chairPersonName}</div>
            </td>
          </tr>
        </table>
      ` : `
        <table style="width: 100%; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;"></td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 12.5pt; text-transform: uppercase;">NGƯỜI LẬP BÁO CÁO</div>
              <div style="font-style: italic; font-size: 11pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; font-size: 12.5pt;">${authorName}</div>
            </td>
          </tr>
        </table>
      `}

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
  const isLeave = /nghỉ\s*phép/i.test(title) || /xin\s*phép/i.test(title) || /đơn\s*xin/i.test(title);
  const isMinutes = /biên\s*bản/i.test(title);
  const today = new Date();
  const dateStr = `Đốc Binh Kiều, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;

  const formattedContent = (content || 'Chưa có nội dung')
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('-') || trimmed.startsWith('+') || trimmed.startsWith('*')) {
        return `<p style="margin: 4px 0; padding-left: 20px; text-indent: 0; text-align: justify;">${trimmed}</p>`;
      }
      return `<p style="margin: 6px 0; text-indent: 25px; text-align: justify;">${trimmed}</p>`;
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
      <title>${isLeave ? 'ĐƠN XIN NGHỈ PHÉP - ' + authorName : title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 15mm 20mm 30mm;
        }
        body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.5; color: #000; background: #fff; margin: 0; padding: 10px; }
        table.meta-header { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.meta-header td { vertical-align: top; text-align: center; }
        .main-title { text-align: center; font-size: 15pt; font-weight: bold; margin-top: 16px; margin-bottom: 16px; text-transform: uppercase; }
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

      <table class="meta-header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 14px;">
        <tr>
          <td style="width: 44%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 12pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">TRƯỜNG THCS VÀ THPT</div>
            <div style="font-size: 12.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">ĐỐC BINH KIỀU</div>
            <div style="text-align: center; margin-top: 4px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 100px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            ${!isLeave ? `
              <div style="font-size: 11pt; margin-top: 2px;">Số: &nbsp; &nbsp; /${isMinutes ? 'BB' : 'BC'}-THCS&amp;THPTĐBK</div>
            ` : ''}
          </td>
          <td style="width: 56%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 12pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 13pt; font-weight: bold; margin-top: 2px;">Độc lập – Tự do – Hạnh phúc</div>
            <div style="text-align: center; margin-top: 4px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 165px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            ${!isLeave ? `<div style="font-size: 11pt; font-style: italic; margin-top: 2px;">${dateStr}</div>` : ''}
          </td>
        </tr>
      </table>

      <div class="main-title" style="text-align: center; margin-top: 16px; margin-bottom: 16px;">
        ${!isMinutes && !isLeave ? `
          <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">BÁO CÁO</div>
        ` : ''}
        <div style="font-size: 15pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">
          ${isLeave ? 'ĐƠN XIN NGHỈ PHÉP' : title.replace(/^Báo cáo (tổng hợp:?|:?)\s*/i, '')}
        </div>
        ${!isLeave ? `
          <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 4px 0 0 0;">
            NĂM HỌC: ${academicYear}
          </div>
          <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 3px; margin-bottom: 14px;">
            <span style="display: inline-block; width: 160px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
          </div>
        ` : ''}
      </div>

      ${isLeave ? `
        <div style="text-align: center; margin-bottom: 18px; font-size: 13pt;">
          <div style="display: inline-block; text-align: left; line-height: 1.6;">
            <div style="font-weight: bold;">Kính gửi:</div>
            <div style="padding-left: 20px;">- Ban Giám hiệu Trường THCS và THPT Đốc Binh Kiều;</div>
            <div style="padding-left: 20px;">- Tổ trưởng Tổ chuyên môn: <strong>${departmentOrClass || '............................................'}</strong>.</div>
          </div>
        </div>
      ` : ''}

      ${!isMinutes && !isLeave ? `
        <div style="margin-bottom: 16px; font-size: 12.5pt;">
          <p style="margin: 4px 0;">- Người thực hiện báo cáo: <strong>${authorName}</strong></p>
          <p style="margin: 4px 0;">- Chức vụ / Bộ phận: <strong>${authorRole || ''} - ${departmentOrClass || ''}</strong></p>
          <p style="margin: 4px 0;">- Đơn vị: Trường THCS-THPT Đốc Binh Kiều</p>
        </div>
      ` : ''}

      <div style="font-size: 13pt; line-height: 1.6; margin-bottom: 20px;">
        ${!isLeave ? `<div style="font-weight: bold; margin-bottom: 8px;">${isMinutes ? 'NỘI DUNG BIÊN BẢN:' : 'NỘI DUNG BÁO CÁO:'}</div>` : ''}
        ${formattedContent}
      </div>

      ${attachmentsList}

      ${isLeave ? `
        <table style="width: 100%; margin-top: 10px; border-collapse: collapse; page-break-inside: avoid;">
          <tr>
            <td colspan="2" style="width: 64%;"></td>
            <td style="width: 36%; text-align: center; vertical-align: top; font-style: italic; font-size: 13pt; padding-bottom: 4px;">
              ${dateStr}
            </td>
          </tr>
          <tr>
            <td style="width: 33%; text-align: center; vertical-align: top; padding: 2px 4px;">
              <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; line-height: 1.3;">Ý KIẾN CỦA TỔ TRƯỞNG CHUYÊN MÔN</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 108px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">......................................</div>
            </td>
            <td style="width: 34%; text-align: center; vertical-align: top; padding: 2px 4px;">
              <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; line-height: 1.3;">Ý KIẾN PHÊ DUYỆT CỦA BAN GIÁM HIỆU</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên, đóng dấu)</div>
              <div style="height: 108px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">......................................</div>
            </td>
            <td style="width: 33%; text-align: center; vertical-align: top; padding: 2px 4px;">
              <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase; line-height: 1.3;">NGƯỜI LÀM ĐƠN</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 108px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">${authorName}</div>
            </td>
          </tr>
        </table>
      ` : isMinutes ? `
        <table style="width: 100%; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 13.5pt; text-transform: uppercase;">THƯ KÝ</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 100px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">......................................</div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 13.5pt; text-transform: uppercase;">CHỦ TRÌ CUỘC HỌP</div>
              <div style="font-style: italic; font-size: 12pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 100px;"></div>
              <div style="font-weight: bold; font-size: 13.5pt;">${authorName}</div>
            </td>
          </tr>
        </table>
      ` : `
        <table style="width: 100%; margin-top: 25px; border-collapse: collapse; page-break-inside: avoid;">
          <tr>
            <td style="width: 50%; text-align: center; vertical-align: top;"></td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="font-weight: bold; font-size: 12.5pt; text-transform: uppercase;">NGƯỜI LẬP BÁO CÁO</div>
              <div style="font-style: italic; font-size: 11pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; font-size: 12.5pt;">${authorName}</div>
            </td>
          </tr>
        </table>
      `}

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
