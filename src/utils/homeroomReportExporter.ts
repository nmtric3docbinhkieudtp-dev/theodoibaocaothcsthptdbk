import { HomeroomMeetingMinutesData, AbsentStudentItem, TalentAchievementItem, ClassCadreItem, CustomFormField, CustomDynamicTable } from '../types';

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
- Số lượng học sinh của lớp: ${data.totalStudents || 0}, trong đó nam: ${data.maleStudents || 0}; nữ: ${data.femaleStudents || 0}
+ Số học sinh vắng: ${data.absentCount || 0} (có mẫu riêng kèm theo).
* GVCN gửi danh sách học sinh vắng SAU KHI KẾT THÚC BUỔI TẬP TRUNG HỌC SINH ĐẦU NĂM.

--------------------------------------------------------------------------------
1. TÌM HIỂU VỀ NĂNG KHIẾU, THÀNH TÍCH CỦA HỌC SINH:
${talentsText}

--------------------------------------------------------------------------------
2. PHÂN CÔNG CÁC CHỨC DANH TRONG LỚP (BAN CÁN SỰ LỚP & ĐOÀN ĐỘI):
${cadresText}

--------------------------------------------------------------------------------
3. DANH SÁCH HỌC SINH VẮNG ĐẦU NĂM HỌC ${data.academicYear || '2026 – 2027'} CỦA LỚP ${data.className}:
(Tổng số học sinh vắng: ${data.absentStudents?.length || 0} em)
${absentListText}

${data.additionalNotes ? `\n* GHI CHÚ / ĐỀ XUẤT THÊM:\n${data.additionalNotes}` : ''}
`;
}

/**
 * Xuất file Word (.doc) đúng chuẩn định dạng văn bản hành chính sư phạm
 */
export function exportHomeroomReportToWord(data: HomeroomMeetingMinutesData, fileName?: string) {
  const defaultTalentsRows = (data.talents || []).map((t, idx) => `
    <tr>
      <td style="text-align: center; border: 1px solid #000; padding: 6px;">${idx + 1}</td>
      <td style="border: 1px solid #000; padding: 6px;">${t.competition || ''}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">${t.prize || ''}</td>
      <td style="border: 1px solid #000; padding: 6px;">${t.studentName || ''}</td>
    </tr>
  `).join('');

  const cadreRows = (data.cadres || []).map((c, idx) => `
    <tr>
      <td style="text-align: center; border: 1px solid #000; padding: 6px;">${idx + 1}</td>
      <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">${c.role || ''}</td>
      <td style="border: 1px solid #000; padding: 6px;">${c.studentName || ''}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">${c.academicPerf || ''}</td>
      <td style="border: 1px solid #000; padding: 6px; text-align: center;">${c.conductPerf || ''}</td>
      <td style="border: 1px solid #000; padding: 6px;">${c.phone || ''}</td>
    </tr>
  `).join('');

  const absentRows = (data.absentStudents && data.absentStudents.length > 0)
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

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Biên bản tập trung học sinh - Lớp ${data.className}</title>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13pt;
          line-height: 1.4;
          color: #000;
        }
        table.meta-header {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        table.meta-header td {
          vertical-align: top;
          text-align: center;
        }
        .main-title {
          text-align: center;
          font-size: 16pt;
          font-weight: bold;
          margin-top: 15px;
          margin-bottom: 15px;
          text-transform: uppercase;
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
      </style>
    </head>
    <body>
      <table class="meta-header">
        <tr>
          <td style="width: 45%;">
            <div>SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-weight: bold;">TRƯỜNG THCS-THPT ĐỐC BINH KIỀU</div>
            <div style="margin-top: 2px;">***</div>
          </td>
          <td style="width: 55%;">
            <div style="font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="margin-top: 5px; font-style: italic; font-size: 11pt;">Đốc Binh Kiều, ngày ${data.meetingDate || '28'} tháng ${data.meetingMonth || '8'} năm ${data.meetingYear || '2026'}</div>
          </td>
        </tr>
      </table>

      <div class="main-title">
        BIÊN BẢN<br>
        <span style="font-size: 14pt;">TẬP TRUNG HỌC SINH ĐẦU NĂM HỌC ${data.academicYear || '2026 – 2027'}</span>
      </div>

      <div style="margin-bottom: 12px;">
        <p style="margin: 4px 0;">Vào lúc <strong>${data.timeHour || '07'}</strong> giờ <strong>${data.timeMinute || '30'}</strong> phút, Ngày <strong>${data.meetingDate || '28'}</strong> tháng <strong>${data.meetingMonth || '8'}</strong> năm <strong>${data.meetingYear || '2026'}</strong>.</p>
        <p style="margin: 4px 0;">Địa điểm: Phòng số <strong>${data.roomNumber || '...'}</strong> trường THCS-THPT Đốc Binh Kiều.</p>
        <p style="margin: 4px 0;">- Họ tên GVCN: <strong>${data.teacherName}</strong></p>
        <p style="margin: 4px 0;">- Lớp: <strong>${data.className}</strong></p>
        <p style="margin: 4px 0;">- Số lượng học sinh của lớp: <strong>${data.totalStudents || 0}</strong>, trong đó nam: <strong>${data.maleStudents || 0}</strong>; nữ: <strong>${data.femaleStudents || 0}</strong></p>
        <p style="margin: 4px 0;">+ Số học sinh vắng: <strong>${data.absentCount || 0}</strong> em (có mẫu riêng kèm theo).</p>
        <p class="notice-box">* GVCN gửi danh sách học sinh vắng SAU KHI KẾT THÚC BUỔI TẬP TRUNG HỌC SINH ĐẦU NĂM.</p>
      </div>

      <div class="section-title">1. TÌM HIỂU VỀ NĂNG KHIẾU, THÀNH TÍCH CỦA HỌC SINH:</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 40px;">TT</th>
            <th style="width: 45%;">Cuộc thi</th>
            <th style="width: 20%;">Đạt giải</th>
            <th>Họ tên học sinh đạt giải</th>
          </tr>
        </thead>
        <tbody>
          ${defaultTalentsRows}
        </tbody>
      </table>

      <div class="section-title">2. PHÂN CÔNG CÁC CHỨC DANH TRONG LỚP:</div>
      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 35px;">TT</th>
            <th style="width: 25%;">Chức danh</th>
            <th style="width: 25%;">Họ và tên</th>
            <th style="width: 12%;">Học lực</th>
            <th style="width: 12%;">Hạnh kiểm</th>
            <th>Số điện thoại</th>
          </tr>
        </thead>
        <tbody>
          ${cadreRows}
        </tbody>
      </table>

      <div class="main-title" style="font-size: 14pt; margin-top: 25px;">
        DANH SÁCH HỌC SINH VẮNG ĐẦU NĂM HỌC ${data.academicYear || '2026 – 2027'}<br>
        <span style="font-size: 13pt;">CỦA LỚP: ${data.className}</span>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th style="width: 30px;">TT</th>
            <th style="width: 18%;">Họ và tên học sinh</th>
            <th style="width: 10%;">Lớp năm trước</th>
            <th style="width: 30%;">Nơi ở hiện nay</th>
            <th style="width: 12%;">SĐT học sinh</th>
            <th style="width: 12%;">SĐT phụ huynh</th>
            <th style="width: 18%;">Lý do chưa ra lớp</th>
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

      <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; text-align: center;"></td>
          <td style="width: 50%; text-align: center;">
            <div style="font-weight: bold;">GIÁO VIÊN CHỦ NHIỆM</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 70px;"></div>
            <div style="font-weight: bold;">${data.teacherName}</div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

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
 * Xuất danh sách học sinh vắng ra định dạng CSV/Excel
 */
export function exportAbsentStudentsToExcel(
  absentStudents: AbsentStudentItem[], 
  className: string, 
  teacherName: string,
  academicYear: string = '2026-2027'
) {
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
 * Xuất báo cáo biểu mẫu tùy biến (Custom Report Form & Tables) ra tệp Word (.doc) quy chuẩn hành chính
 */
export function exportCustomReportToWord({
  title,
  authorName,
  authorRole,
  departmentOrClass,
  academicYear = '2026 – 2027',
  fields = [],
  fieldValues = {},
  tables = [],
  notes = '',
  fileName
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
  fileName?: string;
}) {
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

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 13pt; line-height: 1.4; color: #000; }
        table.meta-header { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        table.meta-header td { vertical-align: top; text-align: center; }
        .main-title { text-align: center; font-size: 15pt; font-weight: bold; margin-top: 15px; margin-bottom: 15px; text-transform: uppercase; }
        .section-title { font-size: 13pt; font-weight: bold; margin-top: 16px; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <table class="meta-header">
        <tr>
          <td style="width: 45%;">
            <div>SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-weight: bold;">TRƯỜNG THCS-THPT ĐỐC BINH KIỀU</div>
            <div style="margin-top: 2px;">***</div>
          </td>
          <td style="width: 55%;">
            <div style="font-weight: bold;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-weight: bold; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
            <div style="margin-top: 5px; font-style: italic; font-size: 11pt;">${dateStr}</div>
          </td>
        </tr>
      </table>

      <div class="main-title">
        ${title}<br>
        <span style="font-size: 12pt; font-weight: normal; font-style: italic;">Năm học: ${academicYear}</span>
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

      <table style="width: 100%; margin-top: 25px; border-collapse: collapse;">
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
    </body>
    </html>
  `;

  const blob = new Blob(['\uFEFF' + htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeName = (fileName || title).replace(/[^a-zA-Z0-9_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ ]/gi, '_');
  link.download = `${safeName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
