import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Table as TableIcon, 
  FileText, 
  CheckSquare, 
  AlignLeft, 
  Hash, 
  ListOrdered, 
  Layers, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  Columns,
  Eye,
  Edit3,
  UploadCloud
} from 'lucide-react';
import { CustomFormField, CustomDynamicTable } from '../../types';
import { ImportFormFromDocModal } from '../common/ImportFormFromDocModal';
import { ParsedTemplateResult } from '../../utils/formFileParser';

interface CustomReportFormBuilderProps {
  fields: CustomFormField[];
  tables: CustomDynamicTable[];
  onFieldsChange: (fields: CustomFormField[]) => void;
  onTablesChange: (tables: CustomDynamicTable[]) => void;
  fieldValues: Record<string, any>;
  onFieldValueChange: (fieldId: string, value: any) => void;
  onApplyParsedTitle?: (title: string) => void;
}

export const CustomReportFormBuilder: React.FC<CustomReportFormBuilderProps> = ({
  fields,
  tables,
  onFieldsChange,
  onTablesChange,
  fieldValues,
  onFieldValueChange,
  onApplyParsedTitle
}) => {
  const [activeTab, setActiveTab] = useState<'fill' | 'design'>('fill');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Design state for new field
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFormField['type']>('text');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // Design state for new table
  const [newTableTitle, setNewTableTitle] = useState('');
  const [newTableColumns, setNewTableColumns] = useState('STT, Nội dung công việc, Người thực hiện, Thời hạn, Kết quả');

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
        // Initialize with 1 empty row
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
        // Re-index STT if first column
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
    if (parsed.title && onApplyParsedTitle) {
      onApplyParsedTitle(parsed.title);
    }
    setActiveTab('fill');
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Bộ Thiết Kế & Nhập Biểu Mẫu Tùy Biến (Custom Form & Table Builder)</span>
          </h4>
          <p className="text-[11px] text-slate-500">
            Tự do tạo các trường câu hỏi, chỉ tiêu số liệu và bảng biểu trực quan theo nhu cầu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Tải lên tệp .docx, .txt, hoặc .md để hệ thống tự động bóc tách và tạo Form biểu mẫu chuẩn trên Web"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Tạo Form Tự Động Từ Tệp (.docx/.txt/.md)</span>
          </button>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('fill')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'fill' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Điền Biểu Mẫu ({fields.length + tables.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('design')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'design' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Trường / Bảng</span>
            </button>
          </div>
        </div>
      </div>

      {/* DESIGN TAB: Add New Custom Field or Table */}
      {activeTab === 'design' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Section 1: Add Custom Field */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>1. Thêm Trường Dữ Liệu / Chỉ Tiêu Báo Cáo</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tên trường / Tiêu chí câu hỏi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Số lượng học sinh tham gia, Kinh phí thực hiện, Đánh giá chung..."
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Định dạng nhập liệu
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
                >
                  <option value="text">Văn bản ngắn (Text)</option>
                  <option value="number">Số liệu / Thống kê (Number)</option>
                  <option value="textarea">Đoạn văn dài (Textarea)</option>
                  <option value="checkbox">Hộp kiểm / Xác nhận (Checkbox)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Bắt buộc phải điền</span>
              </label>

              <button
                type="button"
                onClick={handleAddField}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Trường Này</span>
              </button>
            </div>
          </div>

          {/* Section 2: Add Custom Data Table */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <TableIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>2. Thêm Bảng Số Liệu / Ma Trận Nhiều Cột</span>
            </h5>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tiêu đề bảng số liệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bảng tổng hợp thành tích học sinh giỏi, Bảng theo dõi nề nếp..."
                  value={newTableTitle}
                  onChange={(e) => setNewTableTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Danh sách tên các cột <span className="text-slate-400 font-normal">(phân tách bằng dấu phẩy)</span>
                </label>
                <input
                  type="text"
                  placeholder="STT, Họ và tên, Lớp, Giải thưởng / Điểm số, Ghi chú"
                  value={newTableColumns}
                  onChange={(e) => setNewTableColumns(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddTable}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tạo Bảng Số Liệu</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* FILL TAB: Render and input fields / tables */}
      {activeTab === 'fill' && (
        <div className="space-y-4">
          
          {fields.length === 0 && tables.length === 0 ? (
            <div className="text-center py-8 px-4 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Chưa có trường hoặc bảng tùy biến nào</p>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
                  Thầy/Cô có thể tự thiết kế thủ công từng mục hoặc tải lên tệp (.docx, .txt, .md) để tạo Form web tự động.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Tải Tệp Mẫu Lên (.docx / .txt / .md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('design')}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thiết Kế Thủ Công</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Render Custom Fields */}
          {fields.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <h5 className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Các Trường Dữ Liệu ({fields.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">Điền thông tin trực tiếp vào bên dưới</span>
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map((field) => (
                  <div key={field.id} className="relative bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                        title="Xóa trường này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder || 'Nhập nội dung...'}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        placeholder={field.placeholder || 'Nhập số lượng...'}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        rows={2}
                        placeholder={field.placeholder || 'Nhập đánh giá / nội dung chi tiết...'}
                        value={fieldValues[field.id] || ''}
                        onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                        className="w-full text-xs p-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    )}

                    {field.type === 'checkbox' && (
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={Boolean(fieldValues[field.id])}
                          onChange={(e) => onFieldValueChange(field.id, e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Đã hoàn thành / Đạt chuẩn</span>
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Render Custom Tables */}
          {tables.map((table) => (
            <div key={table.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-blue-600" />
                  <h5 className="text-xs font-bold text-slate-900">{table.title}</h5>
                  <span className="text-[10px] text-slate-400">({table.rows.length} hàng)</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAddTableRow(table.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-emerald-200"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Thêm Hàng</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveTable(table.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="Xóa bảng này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Table Data Matrix */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                      {table.headers.map((h, idx) => (
                        <th key={idx} className="p-2 border-r border-slate-200 last:border-r-0">
                          {h}
                        </th>
                      ))}
                      <th className="p-2 w-10 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                        {table.headers.map((h, cIdx) => (
                          <td key={cIdx} className="p-1.5 border-r border-slate-100 last:border-r-0">
                            <input
                              type="text"
                              value={row[h] || ''}
                              onChange={(e) => handleTableCellChange(table.id, rIdx, h, e.target.value)}
                              className="w-full text-xs px-2 py-1 rounded bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          </td>
                        ))}
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTableRow(table.id, rIdx)}
                            disabled={table.rows.length <= 1}
                            className="text-slate-300 hover:text-rose-500 disabled:opacity-30 p-1"
                            title="Xóa hàng này"
                          >
                            <Trash2 className="w-3 h-3" />
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
