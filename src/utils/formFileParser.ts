import mammoth from 'mammoth';
import { CustomFormField, CustomDynamicTable } from '../types';

export interface ParsedTemplateResult {
  title: string;
  description: string;
  fields: CustomFormField[];
  tables: CustomDynamicTable[];
  fullRawText: string;
  recommendedAudience?: 'all' | 'homeroom_teachers' | 'dept_heads_only' | 'teachers_only';
}

/**
 * Clean cell or label text: strips HTML tags, markdown bold/italic, backslashes, dotted/underline blanks.
 */
export function cleanRawText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '') // remove HTML tags
    .replace(/\*\*/g, '') // remove markdown bold
    .replace(/\*/g, '') // remove markdown italic
    .replace(/__/g, '')
    .replace(/\\-/g, '-') // escaped hyphens \-
    .replace(/\\([#*_`])/g, '$1') // escaped chars
    .replace(/^[\\#*\-•+\s]+/, '') // leading bullets, backslashes, hashes
    .replace(/[\.]{3,}/g, '') // trailing or inline dotted lines e.g. .............
    .replace(/[—_]{3,}/g, '') // underline blanks e.g. _________
    .trim();
}

/**
 * Check if a table row is a markdown divider row (e.g. | :-: | :-: | or |---|---|)
 */
function isTableDivider(segments: string[]): boolean {
  if (segments.length === 0) return false;
  return segments.every(cell => {
    const s = cell.trim().replace(/[-:|\s]/g, '');
    return s.length === 0;
  });
}

/**
 * Checks if a line is a markdown table row (starts/ends with pipe or has multiple pipes)
 */
function isTableRowLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) return true;
  if (trimmed.includes('|') && trimmed.split('|').length >= 3) return true;
  return false;
}

/**
 * Parses plain text / markdown / docx raw content into structured web form fields and data tables.
 */
export function parseFormContent(text: string, fileName?: string): ParsedTemplateResult {
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map(l => l.trim());

  const fields: CustomFormField[] = [];
  const tables: CustomDynamicTable[] = [];

  // Pass 1: Identify Table blocks and their preceding title lines
  const tableTitleLineIndices = new Set<number>();
  const tableLineIndices = new Set<number>();

  for (let i = 0; i < lines.length; i++) {
    if (isTableRowLine(lines[i])) {
      tableLineIndices.add(i);
      // If this is the first row of a table, find preceding line for table title
      if (i > 0 && !isTableRowLine(lines[i - 1])) {
        // Look back up to 3 non-empty lines for table title
        for (let back = i - 1; back >= Math.max(0, i - 4); back--) {
          if (lines[back]) {
            tableTitleLineIndices.add(back);
            break;
          }
        }
      }
    }
  }

  // Pass 2: Extract Tables
  let inTable = false;
  let currentTableHeaders: string[] = [];
  let currentTableRows: Record<string, string>[] = [];
  let currentTableTitle = 'Bảng số liệu thống kê';

  const finishCurrentTable = () => {
    if (currentTableHeaders.length > 0) {
      // Ensure there is at least 1 row
      const finalRows = currentTableRows.length > 0 ? currentTableRows : [
        currentTableHeaders.reduce((acc, h, idx) => ({ ...acc, [h]: idx === 0 ? '1' : '' }), {})
      ];

      tables.push({
        id: 'tbl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title: currentTableTitle,
        headers: currentTableHeaders,
        rows: finalRows
      });
    }
    inTable = false;
    currentTableHeaders = [];
    currentTableRows = [];
    currentTableTitle = 'Bảng số liệu thống kê';
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isTableRowLine(line)) {
      // Extract segments between pipes
      const rawSegments = line.split('|');
      // Trim and drop empty outer segments if string starts/ends with pipe
      let segments = rawSegments.map(s => s.trim());
      if (line.startsWith('|') && segments.length > 0 && segments[0] === '') {
        segments.shift();
      }
      if (line.endsWith('|') && segments.length > 0 && segments[segments.length - 1] === '') {
        segments.pop();
      }

      // Check if divider line (| :-: | :-: |)
      if (isTableDivider(segments)) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        // Determine title from preceding line if recorded
        for (let back = i - 1; back >= Math.max(0, i - 4); back--) {
          if (lines[back]) {
            const candidateTitle = cleanRawText(lines[back]).replace(/[:]+$/, '');
            if (candidateTitle.length >= 3) {
              currentTableTitle = candidateTitle;
            }
            break;
          }
        }

        // Clean headers
        currentTableHeaders = segments.map((h, hIdx) => {
          const cleaned = cleanRawText(h);
          return cleaned || `Cột ${hIdx + 1}`;
        });
        currentTableRows = [];
      } else {
        // Data row
        const rowObj: Record<string, string> = {};
        currentTableHeaders.forEach((h, hIdx) => {
          const rawVal = segments[hIdx] !== undefined ? segments[hIdx] : '';
          rowObj[h] = cleanRawText(rawVal);
        });

        // Even if some columns are empty, preserve the row (e.g. TT or item name is filled)
        const hasSomeContent = Object.values(rowObj).some(v => v !== '');
        if (hasSomeContent) {
          currentTableRows.push(rowObj);
        }
      }
    } else {
      if (inTable) {
        finishCurrentTable();
      }
    }
  }

  if (inTable) {
    finishCurrentTable();
  }

  // Pass 3: Extract Form Fields from non-table and non-table-title lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (tableLineIndices.has(i)) continue; // Table row
    if (tableTitleLineIndices.has(i)) continue; // Used as table title

    // Checkbox items: e.g. [ ] Hoàn thành, - [x] Đã nộp
    const isCheckbox = line.match(/^(\[[\sxX]?\]|- \[[xX\s]?\]|☑|☐)\s*(.+)/);
    if (isCheckbox) {
      fields.push({
        id: 'fld-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        label: cleanRawText(isCheckbox[2]),
        type: 'checkbox',
        required: false
      });
      continue;
    }

    // Check if line contains a question, prompt, or colon
    // e.g. "\- Số học sinh chưa ra lớp đến thời điểm ngày 07/9/2026:"
    // e.g. "Họ và tên lớp trưởng: 2"
    // e.g. "1. Số lượng học sinh..."
    const hasColon = line.includes(':');
    const hasUnderline = /[\.]{3,}|_{3,}/.test(line);
    const hasNumbering = /^(\d+[\.\)]|[IVXLCDM]+[\.\)]|[-*•\\])\s+/.test(line);

    if (hasColon || hasUnderline || hasNumbering) {
      let rawLabel = line;
      let rawVal = '';

      if (hasColon) {
        const colonIdx = line.indexOf(':');
        rawLabel = line.slice(0, colonIdx);
        rawVal = line.slice(colonIdx + 1).trim();
      }

      // If rawVal is empty and next line is a single answer (e.g. "2" or short text)
      if (!rawVal && i + 1 < lines.length && lines[i + 1]) {
        const nextLine = lines[i + 1].trim();
        if (
          !isTableRowLine(nextLine) && 
          !tableTitleLineIndices.has(i + 1) && 
          !nextLine.includes(':') && 
          nextLine.length <= 40 &&
          !/^(\d+[\.\)]|[IVXLCDM]+[\.\)])/.test(nextLine)
        ) {
          rawVal = nextLine;
          i++; // Skip the answer line since it belongs to this field
        }
      }

      const cleanLabel = cleanRawText(rawLabel);

      // Skip formal boilerplate lines like "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", "TRƯỜNG..."
      if (
        cleanLabel.length >= 2 &&
        !['CỘNG HÒA', 'ĐỘC LẬP', 'TRƯỜNG THCS', 'BÁO CÁO TỔNG HỢP'].some(skip => cleanLabel.toUpperCase().includes(skip))
      ) {
        let type: CustomFormField['type'] = 'text';
        const lower = cleanLabel.toLowerCase();

        if (
          lower.includes('số học sinh') ||
          lower.includes('số lượng') ||
          lower.includes('sĩ số') ||
          lower.includes('kinh phí') ||
          lower.includes('tỷ lệ') ||
          lower.includes('tổng số') ||
          lower.includes('điểm') ||
          lower.includes('năm sinh')
        ) {
          type = 'number';
        } else if (
          lower.includes('nội dung') ||
          lower.includes('đánh giá') ||
          lower.includes('ưu điểm') ||
          lower.includes('hạn chế') ||
          lower.includes('kiến nghị') ||
          lower.includes('nguyên nhân') ||
          lower.includes('kế hoạch') ||
          lower.includes('nhận xét') ||
          lower.includes('chi tiết') ||
          lower.includes('lý do')
        ) {
          type = 'textarea';
        }

        fields.push({
          id: 'fld-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          label: cleanLabel,
          type,
          placeholder: rawVal ? `Giá trị mặc định: ${rawVal}` : `Nhập ${cleanLabel.toLowerCase()}...`,
          required: lower.includes('bắt buộc') || lower.includes('*')
        });
      }
    }
  }

  // Pass 4: Determine sensible Title
  let title = '';
  // Check if first non-empty line was a clean title (doesn't end with ':' and not a table title)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const l = lines[i];
    if (!l) continue;
    if (!tableLineIndices.has(i) && !tableTitleLineIndices.has(i) && !l.includes(':')) {
      const cleaned = cleanRawText(l);
      if (cleaned.length >= 6 && !cleaned.toUpperCase().includes('CỘNG HÒA')) {
        title = cleaned;
        break;
      }
    }
  }

  if (!title && fileName) {
    title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  if (!title) {
    if (text.toLowerCase().includes('chưa ra lớp') || text.toLowerCase().includes('học sinh')) {
      title = 'Báo Cáo Thống Kê Học Sinh Chưa Ra Lớp & Thành Tích Thi Đua';
    } else {
      title = 'Biểu Mẫu Báo Cáo Chuẩn Web';
    }
  }

  // Audience inference
  let recommendedAudience: ParsedTemplateResult['recommendedAudience'] = 'all';
  const fullLower = text.toLowerCase();
  if (fullLower.includes('chưa ra lớp') || fullLower.includes('chủ nhiệm') || fullLower.includes('gvcn') || fullLower.includes('sĩ số lớp')) {
    recommendedAudience = 'homeroom_teachers';
  } else if (fullLower.includes('tổ trưởng') || fullLower.includes('chuyên môn tổ') || fullLower.includes('sinh hoạt tổ')) {
    recommendedAudience = 'dept_heads_only';
  } else if (fullLower.includes('giáo án') || fullLower.includes('tiết dạy') || fullLower.includes('dự giờ')) {
    recommendedAudience = 'teachers_only';
  }

  return {
    title,
    description: `Biểu mẫu chuẩn Web gồm ${fields.length} trường thông tin và ${tables.length} bảng số liệu.`,
    fields,
    tables,
    fullRawText: text,
    recommendedAudience
  };
}

/**
 * Extracts raw text from File (supports .txt, .md, .docx, .json)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'docx' || ext === 'doc') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || '';
  }

  // For txt, md, json, csv, etc.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
