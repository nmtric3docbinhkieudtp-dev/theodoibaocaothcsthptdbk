import { DepartmentMeetingMinutesData, SchoolInfo } from '../types';
import { splitSmartLines } from './homeroomReportExporter';

/**
 * Mẫu văn bản triển khai mặc định chuẩn theo hướng dẫn năm học 2026-2027
 */
export const DEFAULT_DEPARTMENT_MEETING_DOCUMENTS = `- Kế hoạch giáo dục nhà trường năm học 2026-2027 (bản dự thảo).
- Công văn số 3284/SGDĐT-GDPT ngày 24 tháng 8 năm 2026 về việc hướng dẫn xây dựng và tổ chức thực hiện kế hoạch giáo dục của nhà trường cấp trung học.
- Công văn số 1061/HD-SGDĐT ngày 28 tháng 8 năm 2026 về hướng dẫn thực hiện nhiệm vụ giáo dục phổ thông năm học 2026 – 2027.
- Công văn số 1091/HD-SGDĐT ngày 08 tháng 9 năm 2026 về việc hướng dẫn tổ chức sinh hoạt chuyên môn tại cơ sở giáo dục phổ thông và sinh hoạt cụm chuyên môn kể từ năm học 2026 – 2027.`;

export const DEFAULT_DEPARTMENT_MEETING_CENTRAL_TASKS = `- Góp ý dự thảo kế hoạch giáo dục nhà trường. Tập trung đánh giá các số liệu, chỉ tiêu trong kế hoạch giáo dục.
- Triển khai các văn bản trọng tâm đầu năm do Sở GDĐT gửi. Ngoài ra, các văn bản về dạy học 2 buổi/ngày, dạy thêm học thêm, STEM/STEAM, giáo dục hòa nhập, khung năng lực AI, khung năng lực số,… nhà trường sẽ triển khai sau.
- Xây dựng Kế hoạch giáo dục của tổ chuyên môn, Kế hoạch bài dạy (phụ lục 1,2 công văn 3284). Phân phối chương trình từng môn học, từng khối lớp. Thời gian gửi kế hoạch giáo dục của tổ chuyên môn, phân phối chương trình gửi lại chậm nhất 23/9/2026 (thứ 5 tuần sau).
- Triển khai về nội dung sinh hoạt chuyên môn. Trong đó lưu ý về các biểu mẫu Sở gửi kèm trong công văn 1091. Lưu ý: Trường THCS và THPT Đốc Binh Kiều thuộc cụm 2.
- Tổ trưởng thông báo danh sách học sinh khuyết tật về giáo viên trong tổ để biết và có sự quan tâm, hỗ trợ đối với các trường hợp này. Về hồ sơ theo quy định nhà trường sẽ có hướng dẫn sau. Lưu ý: danh sách này chỉ dùng để thông báo cho giáo viên dạy lớp biết, không chia sẻ ra bên ngoài trường (có danh sách kèm theo).
- Theo Công văn 1061 việc kiểm tra, đánh giá học sinh sẽ tiếp tục thực hiện theo Công văn số 471/SGDĐT-GDPT ngày 22 tháng 8 năm 2025 của Sở GDĐT về việc thực hiện kiểm tra, đánh giá đối với cấp THCS và THPT. Tổ trưởng thông báo để giáo viên có định hướng trong việc giảng dạy học sinh.
- Thông báo về số cột điểm trong năm học theo môn học để GVBM nắm:`;

/**
 * Tạo mã HTML cho 2 bảng số cột điểm THCS và THPT chuẩn quy định
 */
export function getGradingTablesHtml(): string {
  return `
    <div style="margin-top: 10px; margin-bottom: 12px;">
      <!-- BẢNG ĐIỂM THCS -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-bottom: 6px;">
        <thead>
          <tr style="background-color: #ffff00; font-weight: bold; text-align: center;">
            <th style="border: 1px solid #000; padding: 5px 4px; width: 34%;">Môn/Hoạt động<br>THCS</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 14%;">Tiết/năm</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 14%;">TX/HK</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 12%;">Giữa kỳ</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 12%;">Cuối kỳ</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 14%;">Tổng cột<br>điểm/HK</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Toán, Ngữ văn,<br>KHTN</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">140</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">4</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">6</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Tiếng Anh, LS &amp;<br>Địa lí</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">105</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">4</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">6</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Công nghệ 8,9</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">52</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">3</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">5</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">GDCD, Tin học,<br>Công nghệ 6,7</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">35</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">2</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">4</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">GDTC, Nghệ thuật</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">70</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét 3 lần</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">HĐTN-HN</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">105</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét 4 lần</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">GD địa phương</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">35</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét 2 lần</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
          </tr>
        </tbody>
      </table>

      <!-- BẢNG ĐIỂM THPT -->
      <table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 6px;">
        <thead>
          <tr style="background-color: #ffff00; font-weight: bold; text-align: center;">
            <th style="border: 1px solid #000; padding: 5px 4px; width: 34%;">Môn học/Hoạt động<br>THPT</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 14%;">Tiết/năm</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 14%;">ĐG thường<br>xuyên/HK</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 12%;">Giữa kỳ</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 12%;">Cuối kỳ</th>
            <th style="border: 1px solid #000; padding: 5px 4px; width: 14%;">Tổng cột<br>điểm/HK</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Ngữ văn, Toán,<br>Tiếng Anh</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">105</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">4</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">6</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Vật lí, Hóa học,<br>Sinh học, Địa lí,<br>GDKT&amp;PL, Tin<br>học, Công nghệ</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">70</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">3</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">5</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Lịch sử</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">52</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">3</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">5</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Giáo dục QPAN</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">35</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">2</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center; font-weight: bold;">4</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">Giáo dục thể chất</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">70</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét 3 lần</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">HĐTN-HN</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">105</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét 4 lần</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 4px 6px; font-weight: bold;">GD địa phương</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">35</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét 2 lần</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
            <td style="border: 1px solid #000; padding: 4px; text-align: center;">nhận xét</td>
          </tr>
          <tr style="background-color: #f9f9f9; font-weight: bold; text-align: center;">
            <td colspan="6" style="border: 1px solid #000; padding: 6px; font-size: 11pt;">
              Riêng các môn có học chuyên đề thì +1 cột điểm vào ĐGTX
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Sinh mã HTML hoàn chỉnh cho Biên bản sinh hoạt tổ chuyên môn
 * Thiết kế đúng chuẩn thể thức Nghị định 30/2020/NĐ-CP và khớp chính xác 100% tài liệu mẫu
 */
export function generateDepartmentMeetingHtml(
  data: DepartmentMeetingMinutesData,
  schoolInfo?: Partial<SchoolInfo>,
  isForPrint = false
): string {
  const deptDisplayName = data.departmentName ? data.departmentName.replace(/^Tổ\s+/i, '').trim().toUpperCase() : '........';
  const meetingNum = data.meetingNumber || 'lần....';
  const academicYear = data.academicYear || '2026 - 2027';

  const timeHour = data.timeHour || '...';
  const timeMinute = data.timeMinute || '...';
  const meetingDate = data.meetingDate || '...';
  const meetingMonth = data.meetingMonth || '...';
  const meetingYear = data.meetingYear || '2026';
  const location = data.location || '...........';

  const totalMembers = data.totalMembers || '......';
  const presentMembers = data.presentMembers || '......';
  const absentCount = data.absentCount || '....';
  const absentWithPermission = data.absentWithPermission || '.....';
  const absentReason = data.absentReason || '......';
  const absentWithoutPermission = data.absentWithoutPermission || '.......';
  const chairPerson = data.chairPerson || '.........................';
  const secretary = data.secretary || '.......................................';

  // Chuyển đổi text có ngắt dòng thành HTML paragraphs/bullet items với tính năng tự hiểu xuống hàng
  const formatTextToHtml = (text: string, defaultPlaceholder = '……………….') => {
    if (!text || !text.trim()) {
      return `<p style="margin: 4px 0; text-indent: 0;">${defaultPlaceholder}</p>`;
    }
    const lines = splitSmartLines(text);
    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('+') || trimmed.startsWith('*') || trimmed.startsWith('–')) {
        return `<p style="margin: 4px 0 4px 20px; text-indent: -12px; text-align: justify; line-height: 1.55;">${trimmed}</p>`;
      }
      return `<p style="margin: 4px 0; text-indent: 20px; text-align: justify; line-height: 1.55;">${trimmed}</p>`;
    }).filter(Boolean).join('');
  };

  const strengthsHtml = formatTextToHtml(data.reviewStrengths, '…');
  const weaknessesHtml = formatTextToHtml(data.reviewWeaknesses, '…');
  const causesHtml = formatTextToHtml(data.reviewCauses, '…');
  const solutionsHtml = formatTextToHtml(data.reviewSolutions, '…');

  const docsHtml = formatTextToHtml(data.documentsDeployed, DEFAULT_DEPARTMENT_MEETING_DOCUMENTS);
  const tasksHtml = formatTextToHtml(data.centralTasks, DEFAULT_DEPARTMENT_MEETING_CENTRAL_TASKS);

  const memberOpinionsHtml = formatTextToHtml(data.memberOpinions, '……………….');
  const conclusionHtml = formatTextToHtml(data.conclusion, '………………..');
  const recommendationsHtml = formatTextToHtml(data.recommendations, '……………….');

  const tablesHtml = data.includeGradeTable !== false ? getGradingTablesHtml() : '';

  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Biên Bản Sinh Hoạt Tổ Chuyên Môn ${meetingNum} - Năm học ${academicYear}</title>
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
          box-sizing: border-box;
        }
        .meta-header {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 12px;
        }
        .meta-header td {
          vertical-align: top;
          text-align: center;
          padding: 0;
        }
        .main-title {
          text-align: center;
          margin-top: 18px;
          margin-bottom: 22px;
        }
        .section-header {
          font-weight: bold;
          font-size: 13pt;
          margin-top: 14px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .sub-section-header {
          font-weight: bold;
          font-size: 13pt;
          margin-top: 8px;
          margin-bottom: 4px;
        }
        p {
          margin: 4px 0;
        }
        .page-break {
          page-break-before: always;
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
          <button class="btn-close" onclick="window.close()">Đóng cửa sổ</button>
        </div>
      ` : ''}

      <!-- HEADER QUỐC HIỆU VÀ TÊN TRƯỜNG -->
      <table class="meta-header" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 16px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; text-transform: uppercase;">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">TRƯỜNG THCS VÀ THPT</div>
            <div style="font-size: 11.5pt; font-weight: bold; text-transform: uppercase; margin-top: 1px;">ĐỐC BINH KIỀU</div>
            <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 2px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 90px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            ${data.departmentName ? `<div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; margin-top: 2px;">TỔ ${deptDisplayName}</div>` : ''}
            <div style="font-size: 11pt; margin-top: 2px;">Số: &nbsp; &nbsp; /BB-THCS&amp;THPTĐBK</div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div style="font-size: 11.5pt; font-weight: bold; margin-top: 2px;">Độc lập – Tự do – Hạnh phúc</div>
            <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 2px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 170px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
            </div>
            <div style="font-size: 11pt; font-style: italic; margin-top: 2px;">
              Đồng Tháp, ngày ${meetingDate} tháng ${meetingMonth} năm ${meetingYear}
            </div>
          </td>
        </tr>
      </table>

      <!-- TIÊU ĐỀ BIÊN BẢN -->
      <div class="main-title" style="text-align: center; margin-top: 16px; margin-bottom: 20px;">
        <div style="font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0 0 4px 0;">BIÊN BẢN</div>
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin: 0;">
          HỌP TỔ CHUYÊN MÔN ${meetingNum.toUpperCase()}
        </div>
        <div style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin-top: 4px;">
          NĂM HỌC: ${academicYear}
        </div>
        <div style="text-align: center; font-size: 1pt; line-height: 1pt; margin-top: 3px; margin-bottom: 14px;">
          <span style="display: inline-block; width: 160px; border-bottom: 1.5px solid #000; height: 1px; vertical-align: top;"></span>
        </div>
      </div>

      <!-- THỜI GIAN, ĐỊA ĐIỂM, THÀNH PHẦN -->
      <div style="margin-bottom: 16px; font-size: 13pt; line-height: 1.6;">
        <p style="margin: 3px 0; text-indent: 0;"><strong>Thời gian:</strong> Vào lúc ${timeHour} giờ ${timeMinute} phút, ngày ${meetingDate} tháng ${meetingMonth} năm ${meetingYear}.</p>
        <p style="margin: 3px 0; text-indent: 0;"><strong>Địa điểm:</strong> Tại phòng ${location}.</p>
        
        <p style="margin: 6px 0 2px 0; font-weight: bold;">Thành phần tham dự:</p>
        <p style="margin: 2px 0 2px 20px;">- Tổng số thành viên của tổ: <strong>${totalMembers}</strong>; Số lượng có mặt: <strong>${presentMembers}</strong>.</p>
        <p style="margin: 2px 0 2px 20px;">
          - Vắng: <strong>${absentCount}</strong> (Có phép: ${absentWithPermission}${absentReason ? `, lý do: ${absentReason}` : ''}; Không phép: ${absentWithoutPermission}).
        </p>
        <p style="margin: 4px 0 2px 0;"><strong>Chủ trì cuộc họp:</strong> ${chairPerson} - ${data.chairTitle || 'Tổ trưởng'}.</p>
        <p style="margin: 2px 0 4px 0;"><strong>Thư ký cuộc họp:</strong> ${secretary}.</p>
      </div>

      <!-- NỘI DUNG BIÊN BẢN -->
      <div style="margin-top: 16px;">
        <div class="section-header" style="font-size: 13.5pt; font-weight: bold; text-transform: uppercase; margin-top: 18px; margin-bottom: 10px; text-align: center;">
          NỘI DUNG CUỘC HỌP
        </div>

        <!-- MỤC 1: ĐÁNH GIÁ HOẠT ĐỘNG -->
        <div class="sub-section-header" style="font-weight: bold; font-size: 13pt; margin-top: 12px; margin-bottom: 4px;">
          1. Đánh giá hoạt động của tổ trong thời gian qua:
        </div>
        <div style="padding-left: 5px;">
          <p style="margin: 3px 0;">- Ưu điểm: ${strengthsHtml}</p>
          <p style="margin: 3px 0;">- Hạn chế: ${weaknessesHtml}</p>
          <p style="margin: 3px 0;">- Nguyên nhân của hạn chế: ${causesHtml}</p>
          <p style="margin: 3px 0;">- Giải pháp khắc phục: ${solutionsHtml}</p>
        </div>

        <!-- MỤC 2: TRIỂN KHAI CÁC VĂN BẢN -->
        <div class="sub-section-header" style="font-weight: bold; font-size: 13pt; margin-top: 12px; margin-bottom: 4px;">
          2. Triển khai các văn bản:
        </div>
        <div style="padding-left: 5px;">
          ${docsHtml}
        </div>

        <!-- MỤC 3: TRIỂN KHAI NỘI DUNG CÔNG VIỆC TRỌNG TÂM -->
        <div class="sub-section-header" style="font-weight: bold; font-size: 13pt; margin-top: 12px; margin-bottom: 4px;">
          3. Triển khai nội dung công việc trọng tâm của trường/tổ:
        </div>
        <div style="padding-left: 5px;">
          ${tasksHtml}
          ${tablesHtml}
        </div>

        <!-- MỤC 4: Ý KIẾN CỦA CÁC THÀNH VIÊN -->
        <div class="sub-section-header" style="font-weight: bold; font-size: 13pt; margin-top: 12px; margin-bottom: 4px;">
          4. Ý kiến của các thành viên trong cuộc họp đối với trường/tổ/cá nhân:
        </div>
        <div style="padding-left: 5px;">
          ${memberOpinionsHtml}
        </div>

        <!-- MỤC 5: KẾT LUẬN CỦA CHỦ TRÌ -->
        <div class="sub-section-header" style="font-weight: bold; font-size: 13pt; margin-top: 12px; margin-bottom: 4px;">
          5. Kết luận của chủ trì:
        </div>
        <div style="padding-left: 5px;">
          ${conclusionHtml}
        </div>

        <!-- MỤC 6: ĐỀ XUẤT KIẾN NGHỊ -->
        <div class="sub-section-header" style="font-weight: bold; font-size: 13pt; margin-top: 12px; margin-bottom: 4px;">
          6. Đề xuất, kiến nghị với nhà trường:
        </div>
        <div style="padding-left: 5px;">
          ${recommendationsHtml}
        </div>
      </div>

      <!-- KẾT THÚC VÀ CHỮ KÝ 2 BÊN -->
      <div style="margin-top: 20px; margin-bottom: 25px; font-size: 13pt; line-height: 1.6;">
        <p style="text-indent: 25px; margin: 0;">
          Cuộc họp kết thúc vào lúc ${data.endHour || '…'} giờ ${data.endMinute || '…'} phút cùng ngày, biên bản đã được thông qua toàn thể cuộc họp và thống nhất ký tên./.
        </p>
      </div>

      <table style="width: 100%; border: none; border-collapse: collapse; margin-top: 25px; page-break-inside: avoid;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase;">THƯ KÝ</div>
            <div style="font-style: italic; font-size: 11pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 70px;"></div>
            <div style="font-weight: bold; font-size: 12.5pt;">${secretary !== '.......................................' ? secretary : ''}</div>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top; border: none; padding: 0;">
            <div style="font-weight: bold; font-size: 13pt; text-transform: uppercase;">CHỦ TRÌ CUỘC HỌP</div>
            <div style="font-style: italic; font-size: 11pt; margin-top: 2px;">(Ký và ghi rõ họ tên)</div>
            <div style="height: 70px;"></div>
            <div style="font-weight: bold; font-size: 12.5pt;">${chairPerson !== '.........................' ? chairPerson : ''}</div>
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
 * Xuất file Word (.doc) cho Biên bản sinh hoạt tổ chuyên môn
 */
export function exportDepartmentMeetingToWord(
  data: DepartmentMeetingMinutesData,
  schoolInfo?: Partial<SchoolInfo>,
  fileName?: string
): void {
  const htmlContent = generateDepartmentMeetingHtml(data, schoolInfo, false);
  const blob = new Blob(['\uFEFF' + htmlContent], {
    type: 'application/msword;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeDept = (data.departmentName || 'To_Chuyen_Mon').replace(/\s+/g, '_');
  const safeName = (fileName || `Bien_Ban_Sinh_Hoat_${safeDept}_${data.meetingNumber || 'Lan_1'}`).replace(/[^a-zA-Z0-9_àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ ]/gi, '_');
  link.download = `${safeName}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Mở cửa sổ In / Lưu PDF (.pdf) chuẩn A4 cho Biên bản sinh hoạt tổ chuyên môn
 */
export function exportDepartmentMeetingToPdf(
  data: DepartmentMeetingMinutesData,
  schoolInfo?: Partial<SchoolInfo>
): void {
  const htmlContent = generateDepartmentMeetingHtml(data, schoolInfo, true);
  
  // Thử mở popup in
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    // Nếu popup bị chặn (trong iframe sandbox), dùng iframe ẩn để kích hoạt hộp thoại in / lưu PDF trực tiếp
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
 * Tạo văn bản thuần (plain text) đồng bộ cho Biên bản sinh hoạt tổ chuyên môn
 */
export function generateDepartmentMeetingText(data: DepartmentMeetingMinutesData): string {
  return `SỞ GDĐT TỈNH ĐỒNG THÁP - TRƯỜNG THCS VÀ THPT ĐỐC BINH KIỀU - TỔ ${data.departmentName || '...'}\n` +
    `CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n` +
    `Độc lập – Tự do – Hạnh phúc\n\n` +
    `BIÊN BẢN\n` +
    `HỌP TỔ CHUYÊN MÔN ${data.meetingNumber ? data.meetingNumber.toUpperCase() : 'LẦN 1'}\n` +
    `NĂM HỌC: ${data.academicYear || '2026 - 2027'}\n\n` +
    `Thời gian: lúc ${data.timeHour || '...'} giờ ${data.timeMinute || '...'} phút, ngày ${data.meetingDate || '...'} tháng ${data.meetingMonth || '...'} năm ${data.meetingYear || '2026'}.\n` +
    `Địa điểm: Tại phòng ${data.location || '...'}\n` +
    `Thành phần tham dự:\n` +
    `- Tổng số thành viên của tổ: ${data.totalMembers || '...'}\n` +
    `- Tổng số thành viên tham dự: ${data.presentMembers || '...'}\n` +
    `- Vắng: ${data.absentCount || '0'} (Có phép: ${data.absentWithPermission || '0'}, Không phép: ${data.absentWithoutPermission || '0'})\n` +
    `- Chủ trì cuộc họp: ${data.chairPerson || '...'} - ${data.chairTitle || 'Tổ trưởng'}\n` +
    `- Thư ký cuộc họp: ${data.secretary || '...'}\n\n` +
    `NỘI DUNG CUỘC HỌP:\n` +
    `1. Đánh giá hoạt động của tổ trong thời gian qua:\n` +
    `- Ưu điểm: ${data.reviewStrengths || '...'}\n` +
    `- Hạn chế: ${data.reviewWeaknesses || '...'}\n` +
    `- Nguyên nhân của hạn chế: ${data.reviewCauses || '...'}\n` +
    `- Giải pháp khắc phục: ${data.reviewSolutions || '...'}\n\n` +
    `2. Triển khai các văn bản:\n${data.documentsDeployed || '...'}\n\n` +
    `3. Triển khai nội dung công việc trọng tâm của trường/tổ:\n${data.centralTasks || '...'}\n\n` +
    `4. Ý kiến của các thành viên trong cuộc họp: ${data.memberOpinions || '...'}\n\n` +
    `5. Kết luận của chủ trì: ${data.conclusion || '...'}\n\n` +
    `6. Đề xuất, kiến nghị với nhà trường: ${data.recommendations || '...'}\n\n` +
    `Cuộc họp kết thúc vào lúc ${data.endHour || '...'} giờ ${data.endMinute || '...'} phút cùng ngày, biên bản đã được thông qua toàn thể cuộc họp và thống nhất ký tên./.\n` +
    `Thư ký: ${data.secretary || '...'} | Chủ trì cuộc họp: ${data.chairPerson || '...'}`;
}
