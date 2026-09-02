import mammoth from 'mammoth';
import { CustomFormField, CustomDynamicTable, PeriodFormTemplate } from '../types';

export interface ParsedTemplateResult {
  title: string;
  description: string;
  fields: CustomFormField[];
  tables: CustomDynamicTable[];
  fullRawText: string;
  recommendedAudience?: 'all' | 'homeroom_teachers' | 'dept_heads_only' | 'teachers_only';
}

/**
 * Parses plain text / markdown / docx raw content into structured web form fields and data tables.
 */
export function parseFormContent(text: string, fileName?: string): ParsedTemplateResult {
  const lines = text.split(/\r?\n/).map(l => l.trim());
  
  let title = '';
  let description = '';
  const fields: CustomFormField[] = [];
  const tables: CustomDynamicTable[] = [];

  // Determine Title from first non-empty lines or filename
  for (const line of lines) {
    if (!line) continue;
    // Strip markdown header hashes or bullets
    const cleanLine = line.replace(/^[#*\-•\d.]+\s*/, '').trim();
    if (cleanLine.length > 5 && !title) {
      title = cleanLine;
      break;
    }
  }

  if (!title && fileName) {
    title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  // Parse lines for sections, questions, tables, and criteria
  let inMarkdownTable = false;
  let currentTableHeaders: string[] = [];
  let currentTableRows: Record<string, string>[] = [];
  let currentTableTitle = 'Bảng dữ liệu tổng hợp';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) {
      if (inMarkdownTable && currentTableHeaders.length > 0) {
        tables.push({
          id: 'tbl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          title: currentTableTitle,
          headers: currentTableHeaders,
          rows: currentTableRows.length > 0 ? currentTableRows : [
            currentTableHeaders.reduce((acc, h, idx) => ({ ...acc, [h]: idx === 0 ? '1' : '' }), {})
          ]
        });
        inMarkdownTable = false;
        currentTableHeaders = [];
        currentTableRows = [];
      }
      continue;
    }

    // Detect Markdown table row: e.g. | STT | Họ tên | Lớp | Kết quả |
    if (line.startsWith('|') && line.endsWith('|')) {
      const segments = line.split('|').map(s => s.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Ignore markdown table divider line |---|---|
      if (segments.every(s => s.replace(/[-:]/g, '').length === 0)) {
        continue;
      }

      if (!inMarkdownTable) {
        inMarkdownTable = true;
        currentTableHeaders = segments;
        currentTableRows = [];
      } else {
        const rowObj: Record<string, string> = {};
        currentTableHeaders.forEach((h, idx) => {
          rowObj[h] = segments[idx] || '';
        });
        currentTableRows.push(rowObj);
      }
      continue;
    } else if (inMarkdownTable) {
      // Finished markdown table
      if (currentTableHeaders.length > 0) {
        tables.push({
          id: 'tbl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          title: currentTableTitle,
          headers: currentTableHeaders,
          rows: currentTableRows.length > 0 ? currentTableRows : [
            currentTableHeaders.reduce((acc, h, idx) => ({ ...acc, [h]: idx === 0 ? '1' : '' }), {})
          ]
        });
      }
      inMarkdownTable = false;
      currentTableHeaders = [];
      currentTableRows = [];
    }

    // Detect explicitly labeled tables: e.g. "Bảng 1: Danh sách học sinh", "Bảng theo dõi..."
    if (line.match(/^(Bảng|Biểu mẫu số|Danh sách|Ma trận)\s*[\d.:\-]/i)) {
      currentTableTitle = line.replace(/^[#*]+\s*/, '').trim();
    }

    // Detect field indicators:
    // 1. Lines with colon: "1. Số lượng học sinh tham gia:", "- Kinh phí thực hiện:", "Họ và tên GV:"
    // 2. Lines with underline placeholders: "Lớp: .........." or "Sĩ số: ____________"
    // 3. Numbered criteria: "1. Đánh giá ưu điểm", "2. Tồn tại, hạn chế", "3. Đề xuất kiến nghị"
    // 4. Checklist items: "[ ] Đã kiểm tra nề nếp", "- [x] Hoàn thành"
    
    const isCheckbox = line.match(/^(\[[\sxX]?\]|- \[[xX\s]?\]|☑|☐)\s*(.+)/);
    if (isCheckbox) {
      fields.push({
        id: 'fld-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        label: isCheckbox[2].trim(),
        type: 'checkbox',
        required: false
      });
      continue;
    }

    const isQuestionOrCriterion = line.match(/^(\d+[\.\)]|[IVXLCDM]+[\.\)]|[-*•]|Câu \d+:|Mục \d+:)?\s*([^:_\n]{3,80})(:|[\.]{3,}|_{3,}|$)/);
    
    if (isQuestionOrCriterion && !line.startsWith('#') && line.length < 150) {
      const rawLabel = isQuestionOrCriterion[2]?.trim() || line;
      
      // Filter out general headers or very short labels
      if (rawLabel.length >= 3 && !['CỘNG HÒA', 'ĐỘC LẬP', 'TRƯỜNG THCS', 'BÁO CÁO', 'BIÊN BẢN'].some(skip => rawLabel.toUpperCase().includes(skip))) {
        
        let type: CustomFormField['type'] = 'text';
        const lower = rawLabel.toLowerCase();

        if (lower.includes('số lượng') || lower.includes('sĩ số') || lower.includes('kinh phí') || lower.includes('tỷ lệ') || lower.includes('tổng số') || lower.includes('điểm')) {
          type = 'number';
        } else if (lower.includes('nội dung') || lower.includes('đánh giá') || lower.includes('ưu điểm') || lower.includes('hạn chế') || lower.includes('kiến nghị') || lower.includes('nguyên nhân') || lower.includes('kế hoạch') || lower.includes('nhận xét') || lower.includes('chi tiết')) {
          type = 'textarea';
        }

        fields.push({
          id: 'fld-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          label: rawLabel,
          type,
          placeholder: `Nhập ${rawLabel.toLowerCase()}...`,
          required: lower.includes('bắt buộc') || lower.includes('*')
        });
      }
    }
  }

  // Handle remaining table if any
  if (inMarkdownTable && currentTableHeaders.length > 0) {
    tables.push({
      id: 'tbl-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: currentTableTitle,
      headers: currentTableHeaders,
      rows: currentTableRows.length > 0 ? currentTableRows : [
        currentTableHeaders.reduce((acc, h, idx) => ({ ...acc, [h]: idx === 0 ? '1' : '' }), {})
      ]
    });
  }

  // If no fields or tables could be detected, generate default structural sections
  if (fields.length === 0 && tables.length === 0) {
    const meaningfulParagraphs = lines.filter(l => l.length > 10 && !l.toUpperCase().includes('CỘNG HÒA') && !l.toUpperCase().includes('TRƯỜNG'));
    
    if (meaningfulParagraphs.length > 0) {
      meaningfulParagraphs.slice(0, 8).forEach((para, idx) => {
        const shortLabel = para.slice(0, 60).replace(/^[#*\-•\d.]+\s*/, '').trim();
        fields.push({
          id: 'fld-' + Date.now() + '-' + idx,
          label: shortLabel || `Mục ${idx + 1}`,
          type: para.length > 40 ? 'textarea' : 'text',
          placeholder: 'Nhập nội dung tương ứng...'
        });
      });
    } else {
      // Fallback standard fields
      fields.push(
        { id: 'fld-1', label: '1. Mục đích / Nội dung trọng tâm', type: 'text', required: true },
        { id: 'fld-2', label: '2. Số liệu / Thống kê kết quả', type: 'number' },
        { id: 'fld-3', label: '3. Đánh giá ưu điểm và kết quả đạt được', type: 'textarea' },
        { id: 'fld-4', label: '4. Khó khăn, tồn tại và nguyên nhân', type: 'textarea' },
        { id: 'fld-5', label: '5. Đề xuất, kiến nghị với Ban Giám Hiệu', type: 'textarea' }
      );
    }
  }

  // Recommend audience
  let recommendedAudience: ParsedTemplateResult['recommendedAudience'] = 'all';
  const fullLower = text.toLowerCase();
  if (fullLower.includes('chủ nhiệm') || fullLower.includes('gvcn') || fullLower.includes('sĩ số lớp') || fullLower.includes('học sinh vắng')) {
    recommendedAudience = 'homeroom_teachers';
  } else if (fullLower.includes('tổ trưởng') || fullLower.includes('chuyên môn tổ') || fullLower.includes('sinh hoạt tổ')) {
    recommendedAudience = 'dept_heads_only';
  } else if (fullLower.includes('giáo án') || fullLower.includes('tiết dạy') || fullLower.includes('dự giờ')) {
    recommendedAudience = 'teachers_only';
  }

  return {
    title: title || 'Biểu mẫu báo cáo chuẩn hóa',
    description: `Biểu mẫu được tạo tự động từ tệp ${fileName || 'đính kèm'}, bao gồm ${fields.length} trường nhập liệu và ${tables.length} bảng số liệu.`,
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
