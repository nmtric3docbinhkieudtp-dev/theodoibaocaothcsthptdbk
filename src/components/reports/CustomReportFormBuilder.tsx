import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Table as TableIcon, 
  FileText, 
  CheckSquare, 
  AlignLeft, 
  Layers, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Columns,
  Eye,
  Edit3,
  UploadCloud,
  Download,
  School,
  CheckCircle2,
  HelpCircle,
  X,
  CornerDownRight,
  ArrowUp,
  ArrowDown,
  Check,
  CircleDot,
  Calendar,
  Clock,
  Sliders,
  Hash,
  Bookmark,
  Type
} from 'lucide-react';
import { CustomFormField, CustomDynamicTable } from '../../types';
import { ImportFormFromDocModal } from '../common/ImportFormFromDocModal';
import { ParsedTemplateResult } from '../../utils/formFileParser';
import { exportCustomReportToWord, splitSmartLines } from '../../utils/homeroomReportExporter';

interface CustomReportFormBuilderProps {
  fields: CustomFormField[];
  tables: CustomDynamicTable[];
  onFieldsChange: (fields: CustomFormField[]) => void;
  onTablesChange: (tables: CustomDynamicTable[]) => void;
  fieldValues: Record<string, any>;
  onFieldValueChange: (fieldId: string, value: any) => void;
  onApplyParsedTitle?: (title: string) => void;
  readOnlyStructure?: boolean;
  formTitle?: string;
  authorName?: string;
  authorRole?: string;
  departmentOrClass?: string;
  academicYear?: string;
  notes?: string;
  onNotesChange?: (notes: string) => void;
}

export const CustomReportFormBuilder: React.FC<CustomReportFormBuilderProps> = ({
  fields,
  tables,
  onFieldsChange,
  onTablesChange,
  fieldValues,
  onFieldValueChange,
  onApplyParsedTitle,
  readOnlyStructure = false,
  formTitle = 'Báo Cáo Biểu Mẫu Trực Tuyến',
  authorName = 'Giáo viên',
  authorRole = 'Giáo viên',
  departmentOrClass = 'Trường THCS-THPT Đốc Binh Kiều',
  academicYear = '2026 – 2027',
  notes = '',
  onNotesChange
}) => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isDesigning, setIsDesigning] = useState(!readOnlyStructure && fields.length === 0 && tables.length === 0);
  const [isNotesOpen, setIsNotesOpen] = useState(Boolean(notes && notes.trim().length > 0));
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  
  // Design state for new field
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFormField['type']>('text');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Design state for new table
  const [newTableTitle, setNewTableTitle] = useState('');
  const [newTableColumns, setNewTableColumns] = useState('STT, Nội dung / Chỉ tiêu, Đơn vị tính, Số lượng, Ghi chú');

  // Add field
  const handleAddField = () => {
    if (!newFieldLabel.trim()) {
      alert('Vui lòng nhập tên trường / câu hỏi!');
      return;
    }
    const newField: CustomFormField = {
      id: 'field-' + Date.now(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      placeholder: newFieldPlaceholder.trim() || undefined,
      required: newFieldRequired
    };
    onFieldsChange([...fields, newField]);
    setNewFieldLabel('');
    setNewFieldPlaceholder('');
    setNewFieldRequired(false);
  };

  const handleRemoveField = (id: string) => {
    onFieldsChange(fields.filter(f => f.id !== id));
    if (editingFieldId === id) setEditingFieldId(null);
  };

  // Editing existing field inline
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);

  // Inserting field at specific index (e.g. in the middle between rows)
  const handleInsertFieldAt = (index: number) => {
    const newFieldId = 'field-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newField: CustomFormField = {
      id: newFieldId,
      label: `Câu hỏi ${index + 1}: `,
      type: 'textarea',
      required: false
    };
    const nextFields = [...fields];
    nextFields.splice(index, 0, newField);
    onFieldsChange(nextFields);
    setEditingFieldId(newFieldId);
  };

  const handleUpdateField = (fieldId: string, updates: Partial<CustomFormField>) => {
    const nextFields = fields.map(f => f.id === fieldId ? { ...f, ...updates } : f);
    onFieldsChange(nextFields);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const nextFields = [...fields];
    const temp = nextFields[index];
    nextFields[index] = nextFields[targetIndex];
    nextFields[targetIndex] = temp;
    onFieldsChange(nextFields);
  };

  // Editing existing table columns & title
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editTableTitle, setEditTableTitle] = useState('');
  const [editTableColumns, setEditTableColumns] = useState('');

  const handleStartEditTable = (t: CustomDynamicTable) => {
    setEditingTableId(t.id);
    setEditTableTitle(t.title);
    setEditTableColumns(t.headers.join(', '));
  };

  const handleSaveEditTable = (tableId: string) => {
    if (!editTableTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bảng!');
      return;
    }
    const headers = editTableColumns.split(',').map(c => c.trim()).filter(Boolean);
    if (headers.length === 0) {
      alert('Bảng phải có ít nhất 1 cột!');
      return;
    }

    const nextTables = tables.map(t => {
      if (t.id === tableId) {
        const updatedRows = t.rows.map(r => {
          const newRow: Record<string, string> = {};
          headers.forEach(h => {
            newRow[h] = r[h] !== undefined ? r[h] : '';
          });
          return newRow;
        });
        return {
          ...t,
          title: editTableTitle.trim(),
          headers,
          rows: updatedRows
        };
      }
      return t;
    });

    onTablesChange(nextTables);
    setEditingTableId(null);
  };

  // Add Table
  const handleAddTable = () => {
    if (!newTableTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bảng số liệu!');
      return;
    }
    const headers = newTableColumns.split(',').map(c => c.trim()).filter(Boolean);
    if (headers.length === 0) {
      alert('Vui lòng nhập ít nhất 1 cột tiêu đề cho bảng!');
      return;
    }
    const newTable: CustomDynamicTable = {
      id: 'table-' + Date.now(),
      title: newTableTitle.trim(),
      headers,
      rows: [
        headers.reduce((acc, h, idx) => {
          acc[h] = idx === 0 ? '1' : '';
          return acc;
        }, {} as Record<string, string>)
      ]
    };
    onTablesChange([...tables, newTable]);
    setNewTableTitle('');
  };

  const handleRemoveTable = (tableId: string) => {
    onTablesChange(tables.filter(t => t.id !== tableId));
  };

  // Table row management
  const handleAddTableRow = (tableId: string) => {
    const updated = tables.map(t => {
      if (t.id === tableId) {
        const newRow: Record<string, string> = {};
        t.headers.forEach((h, idx) => {
          newRow[h] = idx === 0 ? String(t.rows.length + 1) : '';
        });
        return { ...t, rows: [...t.rows, newRow] };
      }
      return t;
    });
    onTablesChange(updated);
  };

  const handleRemoveTableRow = (tableId: string, rowIndex: number) => {
    const updated = tables.map(t => {
      if (t.id === tableId) {
        const filtered = t.rows.filter((_, idx) => idx !== rowIndex);
        const reindexed = filtered.map((r, idx) => {
          if (t.headers[0] && (t.headers[0].toLowerCase().includes('stt') || t.headers[0] === '1')) {
            return { ...r, [t.headers[0]]: String(idx + 1) };
          }
          return r;
        });
        return { ...t, rows: reindexed };
      }
      return t;
    });
    onTablesChange(updated);
  };

  const handleTableCellChange = (tableId: string, rowIndex: number, header: string, value: string) => {
    const updated = tables.map(t => {
      if (t.id === tableId) {
        const newRows = [...t.rows];
        newRows[rowIndex] = { ...newRows[rowIndex], [header]: value };
        return { ...t, rows: newRows };
      }
      return t;
    });
    onTablesChange(updated);
  };

  const handleApplyParsedForm = (parsed: ParsedTemplateResult) => {
    onFieldsChange(parsed.fields);
    onTablesChange(parsed.tables);
    if (onApplyParsedTitle && parsed.title) {
      onApplyParsedTitle(parsed.title);
    }
  };

  const handleDownloadWord = () => {
    exportCustomReportToWord({
      title: formTitle,
      authorName,
      authorRole,
      departmentOrClass,
      academicYear,
      fields,
      fieldValues,
      tables,
      notes,
      fileName: formTitle
    });
  };

  const filledFieldsCount = fields.filter(f => fieldValues[f.id] !== undefined && fieldValues[f.id] !== '').length;
  const totalTableRows = tables.reduce((acc, t) => acc + t.rows.length, 0);

  return (
    <div className="space-y-4">
      {/* Top Header Card with Metadata & Quick Utilities */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-3.5 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>{formTitle}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                Năm học {academicYear}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              Người thực hiện: <span className="font-bold text-slate-800">{authorName}</span> ({departmentOrClass})
            </p>
          </div>
        </div>

        {/* Action buttons (Word Export / Preview) - compact and non-intrusive */}
        <div className="flex items-center gap-2 ml-auto">
          {!readOnlyStructure && (
            <>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Tải tệp Word (.docx) hoặc dán văn bản để bóc tách form"
              >
                <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Tải Tệp Mẫu</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDesigning(!isDesigning)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isDesigning
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white hover:bg-purple-50 text-purple-700 border border-purple-300'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isDesigning ? 'Đóng thiết kế' : 'Thêm câu hỏi / bảng'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Xem trước định dạng văn bản in chính thức"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Xem bản in</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadWord}
            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Xuất văn bản Word (.doc) theo quy chuẩn hành chính"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Word</span>
          </button>
        </div>
      </div>

      {/* DESIGNER PANEL (Only shown when admin toggles design mode) */}
      {isDesigning && !readOnlyStructure && (
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-purple-200 pb-2">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs sm:text-sm">
              <Edit3 className="w-4 h-4 text-purple-600" />
              <span>Thiết Kế Cấu Trúc Biểu Mẫu Báo Cáo</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDesigning(false)}
              className="text-xs text-purple-700 hover:text-purple-900 font-semibold cursor-pointer"
            >
              Hoàn tất thiết kế ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Add Field */}
            <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Thêm Trường Nhập Liệu / Câu Hỏi</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên câu hỏi / Chỉ tiêu:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Số học sinh có hoàn cảnh khó khăn..."
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-emerald-600 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Loại nhập liệu:</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="text">Văn bản 1 dòng</option>
                    <option value="number">Số lượng (Số nguyên)</option>
                    <option value="textarea">Đoạn văn nhiều dòng</option>
                    <option value="checkbox">Hộp kiểm Đạt / Chưa đạt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bắt buộc:</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFieldRequired}
                      onChange={(e) => setNewFieldRequired(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span>Bắt buộc điền</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddField}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm trường này</span>
                </button>
              </div>
            </div>

            {/* Add Table */}
            <div className="bg-white p-3.5 rounded-xl border border-purple-100 space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span>Thêm Bảng Số Liệu Chi Tiết</span>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tiêu đề bảng:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Danh sách học sinh đạt giải phong trào..."
                  value={newTableTitle}
                  onChange={(e) => setNewTableTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-blue-600 font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Danh sách tên các cột (phân cách bằng dấu phẩy):
                </label>
                <input
                  type="text"
                  placeholder="STT, Nội dung, Đơn vị tính, Số lượng, Ghi chú"
                  value={newTableColumns}
                  onChange={(e) => setNewTableColumns(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-blue-600 font-medium"
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddTable}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tạo bảng này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SINGLE CONTINUOUS STREAM: KHÔNG CHIA TAB - NHẬP LIỀN MẠCH TỪ TRÊN XUỐNG DƯỚI */}
      {/* ========================================================================= */}

      {/* KHỐI 1: CÁC TRƯỜNG THÔNG TIN & CÂU HỎI CHỈ TIÊU (CHỈ HIỂN THỊ NẾU CÓ FIELDS) */}
      {fields.length > 0 && (
        <div className="p-4 sm:p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Thông Tin & Chỉ Tiêu Báo Cáo</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    ({fields.length} mục)
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Thầy/Cô vui lòng điền các thông tin và số liệu tương ứng bên dưới:
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Đã điền {filledFieldsCount} / {fields.length}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {fields.map((field, fIdx) => (
              <div key={field.id} className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 transition-all hover:border-slate-300 space-y-2">
                {/* Field Header & Editing Controls */}
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  {editingFieldId === field.id ? (
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        placeholder="Nội dung câu hỏi..."
                        className="w-full text-xs font-bold p-1.5 rounded border border-emerald-400 bg-white"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <select
                          value={field.type}
                          onChange={(e) => handleUpdateField(field.id, { type: e.target.value as any })}
                          className="text-[11px] p-1 rounded border border-slate-300 bg-white"
                        >
                          <option value="textarea">Văn bản nhiều dòng (Đoạn)</option>
                          <option value="text">Văn bản 1 dòng (Ngắn)</option>
                          <option value="radio">Trắc nghiệm (1 đáp án)</option>
                          <option value="checkbox">Hộp kiểm (Nhiều đáp án)</option>
                          <option value="dropdown">Menu thả xuống</option>
                          <option value="scale">Thang đo 1-5</option>
                          <option value="number">Số liệu</option>
                          <option value="date">Ngày tháng</option>
                          <option value="time">Thời gian</option>
                          <option value="file">Tải tệp lên</option>
                          <option value="section">Tiêu đề phân đoạn</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => setEditingFieldId(null)}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-0.5"
                        >
                          <Check className="w-3 h-3" />
                          <span>Xong</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="block text-xs font-bold text-slate-800 flex-1">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                  )}

                  {!readOnlyStructure && isDesigning && editingFieldId !== field.id && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingFieldId(field.id)}
                        className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 text-[11px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                        title="Sửa câu từ dòng này"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInsertFieldAt(fIdx + 1)}
                        className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                        title="Chèn thêm 1 dòng ở giữa"
                      >
                        <CornerDownRight className="w-3 h-3 text-emerald-600" />
                        <span>+ Chèn</span>
                      </button>

                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => handleMoveField(fIdx, 'up')}
                          disabled={fIdx === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Lên"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveField(fIdx, 'down')}
                          disabled={fIdx === fields.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          title="Xuống"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition cursor-pointer"
                        title="Xóa trường này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Field description if any */}
                {field.description && (
                  <p className="text-[11px] text-slate-500 italic">{field.description}</p>
                )}

                {/* 1. TEXT & 3. TEXTAREA (Tự động hỗ trợ gõ Enter xuống hàng và nút tách ý thông minh) */}
                {(() => {
                  const isTextType = field.type === 'text';
                  const isTextareaType = field.type === 'textarea';
                  if (!isTextType && !isTextareaType) return null;

                  const rawCurrentVal = String(fieldValues[field.id] || '');
                  const labelLower = (field.label || '').toLowerCase();
                  
                  // Nhận diện các trường có tính chất văn bản dài/tường thuật cần xuống hàng
                  const shouldBeMultiline = isTextareaType || 
                    expandedFields[field.id] ||
                    field.label.length > 25 ||
                    labelLower.includes('văn bản') ||
                    labelLower.includes('triển khai') ||
                    labelLower.includes('vướng mắc') ||
                    labelLower.includes('đề xuất') ||
                    labelLower.includes('nội dung') ||
                    labelLower.includes('ý kiến') ||
                    labelLower.includes('đánh giá') ||
                    labelLower.includes('kết luận') ||
                    labelLower.includes('kiến nghị') ||
                    labelLower.includes('giải pháp') ||
                    labelLower.includes('kế hoạch') ||
                    labelLower.includes('nhiệm vụ') ||
                    rawCurrentVal.includes('\n') ||
                    rawCurrentVal.length > 40 ||
                    /[-•+*–]\s+/.test(rawCurrentVal);

                  // Kiểm tra xem đoạn văn bản hiện tại có nhiều ý dính liền chưa được xuống hàng hay không
                  const potentialLines = splitSmartLines(rawCurrentVal);
                  const hasUnsplitBullets = potentialLines.length > 1 && !rawCurrentVal.includes('\n');

                  if (!shouldBeMultiline) {
                    return (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder={field.placeholder || 'Nhập nội dung...'}
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                          className="w-full text-xs px-3 py-2 pr-8 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setExpandedFields(prev => ({ ...prev, [field.id]: true }))}
                          className="absolute right-2 top-2 text-slate-400 hover:text-emerald-700 cursor-pointer p-0.5"
                          title="Chuyển sang ô nhập nhiều dòng (nhấn phím Enter xuống hàng)"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  const rowCount = Math.min(8, Math.max(3, rawCurrentVal.split('\n').length + 1));

                  return (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <textarea
                          rows={rowCount}
                          placeholder={field.placeholder || 'Nhập nội dung chi tiết (nhấn phím Enter để xuống hàng mỗi ý)...'}
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                          className="w-full text-xs p-2.5 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 px-1">
                        <span className="flex items-center gap-1 text-emerald-800 font-medium">
                          💡 <span>Bạn có thể nhấn phím <strong>Enter</strong> để xuống hàng cho từng ý hoặc từng văn bản.</span>
                        </span>

                        {hasUnsplitBullets && (
                          <button
                            type="button"
                            onClick={() => {
                              onFieldValueChange(field.id, potentialLines.join('\n'));
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10.5px] transition cursor-pointer shadow-2xs"
                            title="Tự động nhận diện các dấu gạch đầu dòng và ngắt thành từng hàng riêng biệt"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Tự động tách {potentialLines.length} ý xuống hàng</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. NUMBER */}
                {field.type === 'number' && (
                  <input
                    type="number"
                    placeholder={field.placeholder || '0'}
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
                  />
                )}

                {/* 4. MULTIPLE CHOICE / RADIO */}
                {field.type === 'radio' && (
                  <div className="space-y-1.5 pt-1">
                    {(field.options && field.options.length > 0 ? field.options : ['Đạt yêu cầu', 'Chưa đạt yêu cầu']).map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`radio-${field.id}`}
                          checked={fieldValues[field.id] === opt}
                          onChange={() => onFieldValueChange(field.id, opt)}
                          className="w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* 5. CHECKBOX */}
                {field.type === 'checkbox' && (
                  field.options && field.options.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      {field.options.map((opt, optIdx) => {
                        const currentArr = Array.isArray(fieldValues[field.id]) ? fieldValues[field.id] : [];
                        const isChecked = currentArr.includes(opt);
                        return (
                          <label key={optIdx} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                const nextArr = e.target.checked
                                  ? [...currentArr, opt]
                                  : currentArr.filter((x: string) => x !== opt);
                                onFieldValueChange(field.id, nextArr);
                              }}
                              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(fieldValues[field.id])}
                        onChange={(e) => onFieldValueChange(field.id, e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Đã hoàn thành / Đạt yêu cầu</span>
                    </label>
                  )
                )}

                {/* 6. DROPDOWN / SELECT */}
                {(field.type === 'dropdown' || field.type === 'select') && (
                  <select
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="">-- Vui lòng chọn --</option>
                    {(field.options || ['Lựa chọn 1', 'Lựa chọn 2']).map((opt, optIdx) => (
                      <option key={optIdx} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {/* 7. LINEAR SCALE (1-5 OR 1-10) */}
                {field.type === 'scale' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>{field.scaleMinLabel || '1 (Chưa đạt)'}</span>
                      <span>{field.scaleMaxLabel || (field.scaleMax || 5) + ' (Rất tốt)'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-lg border border-slate-200">
                      {Array.from({ length: (field.scaleMax || 5) - (field.scaleMin || 1) + 1 }).map((_, sIdx) => {
                        const val = (field.scaleMin || 1) + sIdx;
                        const isSelected = fieldValues[field.id] === val;
                        return (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => onFieldValueChange(field.id, val)}
                            className={`w-7 h-7 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-2xs scale-105'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 8. DATE */}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                )}

                {/* 9. TIME */}
                {field.type === 'time' && (
                  <input
                    type="time"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                )}

                {/* 10. FILE */}
                {field.type === 'file' && (
                  <div className="p-2.5 rounded-lg border border-dashed border-slate-300 bg-white flex items-center gap-2 text-xs text-slate-600">
                    <UploadCloud className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] truncate">
                      {fieldValues[field.id] ? `Đã đính kèm: ${fieldValues[field.id]}` : 'Tải lên minh chứng / biên bản...'}
                    </span>
                  </div>
                )}

                {/* 11. SECTION */}
                {field.type === 'section' && (
                  <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-amber-700" />
                    <span>Phân mục phân nhóm báo cáo</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KHỐI 2: CÁC BẢNG SỐ LIỆU CHI TIẾT (CHỈ HIỂN THỊ NẾU CÓ TABLES) */}
      {tables.length > 0 && (
        <div className="space-y-4">
          {tables.map((table, tIdx) => (
            <div key={table.id} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                    {fields.length > 0 ? tIdx + 2 : tIdx + 1}
                  </span>
                  <div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900">{table.title}</h5>
                    <span className="text-[11px] text-slate-500">Bảng có {table.rows.length} dòng dữ liệu</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddTableRow(table.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm Dòng</span>
                  </button>

                  {!readOnlyStructure && isDesigning && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStartEditTable(table)}
                        className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-blue-200 shadow-2xs"
                        title="Sửa tiêu đề & các cột của bảng này"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Sửa Bảng</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveTable(table.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa bảng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Inline Table Editor when active */}
              {!readOnlyStructure && isDesigning && editingTableId === table.id && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 space-y-2.5">
                  <div className="text-xs font-bold text-blue-900">
                    Chỉnh sửa Tiêu đề và Các cột của bảng:
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tiêu đề bảng:</label>
                    <input
                      type="text"
                      value={editTableTitle}
                      onChange={(e) => setEditTableTitle(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-blue-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Các cột (phân cách bằng dấu phẩy):</label>
                    <input
                      type="text"
                      value={editTableColumns}
                      onChange={(e) => setEditTableColumns(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-blue-300 bg-white"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingTableId(null)}
                      className="px-3 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEditTable(table.id)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Lưu Thay Đổi Bảng</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Table Data Matrix */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      {table.headers.map((h, idx) => (
                        <th key={idx} className="p-2.5 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      <th className="p-2.5 w-12 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                        {table.headers.map((h, cIdx) => (
                          <td key={cIdx} className="p-1.5 border-r border-slate-100 last:border-r-0">
                            <input
                              type="text"
                              value={row[h] || ''}
                              onChange={(e) => handleTableCellChange(table.id, rIdx, h, e.target.value)}
                              placeholder="..."
                              className="w-full text-xs px-2 py-1.5 rounded-lg bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTableRow(table.id, rIdx)}
                            disabled={table.rows.length <= 1}
                            className="text-slate-300 hover:text-rose-500 disabled:opacity-20 p-1 transition cursor-pointer"
                            title="Xóa dòng này"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KHỐI 3: GHI CHÚ / KIẾN NGHỊ (HOÀN TOÀN TÙY CHỌN - KHÔNG BẮT BUỘC) */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-2">
        <div 
          onClick={() => setIsNotesOpen(!isNotesOpen)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <AlignLeft className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-800">
                Ghi chú thêm hoặc kiến nghị với BGH
              </span>
              <span className="text-[11px] text-slate-400 ml-1.5 font-normal">
                (Tùy chọn, không bắt buộc)
              </span>
            </div>
          </div>
          <button
            type="button"
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 cursor-pointer"
          >
            <span>{isNotesOpen ? 'Thu gọn' : 'Bấm để ghi thêm nếu có'}</span>
            {isNotesOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isNotesOpen && (
          <div className="pt-2">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
              placeholder="Nhập ghi chú thêm hoặc ý kiến đề xuất giải pháp với Ban Giám Hiệu (nếu có)..."
              className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed text-slate-800"
            />
          </div>
        )}
      </div>

      {/* PREVIEW MODAL (OFFICIAL LETTERHEAD PREVIEW) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600" />
                <span>Xem Trước Văn Bản Báo Cáo In Quy Chuẩn</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Body */}
            <div className="space-y-4 font-serif text-slate-900 text-xs">
              <div className="grid grid-cols-2 text-center pb-4 border-b border-slate-300">
                <div>
                  <div className="uppercase">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
                  <div className="font-bold uppercase">TRƯỜNG THCS-THPT ĐỐC BINH KIỀU</div>
                  <div className="text-[10px]">***</div>
                </div>
                <div>
                  <div className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="font-bold">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="flex justify-center mt-0.5">
                    <div className="w-[140px] h-[1.2px] bg-black"></div>
                  </div>
                  <div className="italic text-[11px] mt-1">
                    Đốc Binh Kiều, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </div>
              </div>

              <div className="text-center py-2">
                <h3 className="text-base font-bold uppercase">{formTitle}</h3>
                <div className="italic text-xs text-slate-600">Năm học: {academicYear}</div>
              </div>

              <div className="space-y-1">
                <p>- Người thực hiện: <strong>{authorName}</strong></p>
                <p>- Chức vụ / Bộ phận: <strong>{authorRole} - {departmentOrClass}</strong></p>
                <p>- Đơn vị công tác: Trường THCS-THPT Đốc Binh Kiều</p>
              </div>

              {fields.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="font-bold uppercase">I. THÔNG TIN & CHỈ TIÊU:</div>
                  <table className="w-full border-collapse border border-slate-300">
                    <tbody>
                      {fields.map((f) => (
                        <tr key={f.id} className="border-b border-slate-300">
                          <td className="p-2 font-bold bg-slate-50 w-2/5 border-r border-slate-300">{f.label}</td>
                          <td className="p-2">
                            {f.type === 'checkbox' 
                              ? (fieldValues[f.id] ? '✓ Đạt yêu cầu' : 'Chưa đạt') 
                              : (fieldValues[f.id] || '---')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {tables.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="font-bold uppercase">II. BẢNG SỐ LIỆU CHI TIẾT:</div>
                  {tables.map((t, idx) => (
                    <div key={t.id} className="space-y-1">
                      <div className="font-bold italic">Bảng {idx + 1}: {t.title}</div>
                      <table className="w-full border-collapse border border-slate-300">
                        <thead>
                          <tr className="bg-slate-100">
                            {t.headers.map((h, hIdx) => (
                              <th key={hIdx} className="border border-slate-300 p-1.5 font-bold text-center">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {t.rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {t.headers.map((h, cIdx) => (
                                <td key={cIdx} className="border border-slate-300 p-1.5">
                                  {row[h] || ''}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}

              {notes && notes.trim() && (
                <div className="space-y-1 pt-2">
                  <div className="font-bold uppercase">III. GHI CHÚ & KIẾN NGHỊ:</div>
                  <div className="p-3 bg-slate-50 border border-slate-300 rounded whitespace-pre-line leading-relaxed">
                    {notes}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDownloadWord();
                  setShowPreviewModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File Word (.doc)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Form Parser Modal from File */}
      <ImportFormFromDocModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onApplyParsedForm={handleApplyParsedForm}
        mode="fill_submission"
      />
    </div>
  );
};
