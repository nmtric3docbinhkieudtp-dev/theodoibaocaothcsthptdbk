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
  UploadCloud,
  Download,
  Clock,
  BookOpen,
  School,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { CustomFormField, CustomDynamicTable } from '../../types';
import { ImportFormFromDocModal } from '../common/ImportFormFromDocModal';
import { ParsedTemplateResult } from '../../utils/formFileParser';
import { exportCustomReportToWord } from '../../utils/homeroomReportExporter';

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
  // Navigation Section Tabs (identical structure to Homeroom form)
  const [activeSection, setActiveSection] = useState<'info' | 'tables' | 'notes' | 'preview' | 'design'>('info');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
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

  // Field stats
  const filledFieldsCount = fields.filter(f => fieldValues[f.id] !== undefined && fieldValues[f.id] !== '').length;
  const totalTableRows = tables.reduce((acc, t) => acc + t.rows.length, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner with Actions */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-3.5 rounded-2xl border border-emerald-200/80 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{formTitle}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                Năm học {academicYear}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Đơn vị: Trường THCS-THPT Đốc Binh Kiều • Người thực hiện: <span className="font-bold text-slate-800">{authorName}</span> ({departmentOrClass})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {!readOnlyStructure && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Tải tệp Word (.docx) hoặc txt để hệ thống tự động bóc tách thành form"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Tải Tệp Mẫu (.docx)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadWord}
            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Xuất văn bản Word (.doc) theo quy chuẩn hành chính"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Word (.doc)</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs (I. Thông tin & Chỉ tiêu, II. Bảng số liệu, III. Đánh giá, IV. Xem trước) */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveSection('info')}
          className={`px-3.5 py-2.5 font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'info'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>I. Thông Tin & Chỉ Tiêu ({filledFieldsCount}/{fields.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('tables')}
          className={`px-3.5 py-2.5 font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'tables'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <TableIcon className="w-4 h-4 text-blue-600" />
          <span>II. Bảng Số Liệu Chi Tiết ({tables.length} bảng / {totalTableRows} dòng)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('notes')}
          className={`px-3.5 py-2.5 font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'notes'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlignLeft className="w-4 h-4 text-amber-600" />
          <span>III. Đánh Giá & Kiến Nghị</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('preview')}
          className={`px-3.5 py-2.5 font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            activeSection === 'preview'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4 text-slate-600" />
          <span>IV. Xem Trước Báo Cáo</span>
        </button>

        {!readOnlyStructure && (
          <button
            type="button"
            onClick={() => setActiveSection('design')}
            className={`px-3.5 py-2.5 font-bold border-b-2 whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ml-auto ${
              activeSection === 'design'
                ? 'border-purple-600 text-purple-700 bg-purple-50/50'
                : 'border-transparent text-slate-500 hover:text-purple-700'
            }`}
          >
            <Edit3 className="w-4 h-4 text-purple-600" />
            <span>Thiết Kế Cấu Trúc Form</span>
          </button>
        )}
      </div>

      {/* SECTION I: THÔNG TIN VÀ CHỈ TIÊU BÁO CÁO */}
      {activeSection === 'info' && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
          <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Các Trường Dữ Liệu & Chỉ Tiêu Báo Cáo ({fields.length})</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Điền đầy đủ các thông tin và chỉ tiêu được yêu cầu theo mẫu quy định.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Đã điền {filledFieldsCount} / {fields.length}
            </span>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">Chưa có trường thông tin chỉ tiêu nào</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Mục này sẽ chứa các câu hỏi, chỉ tiêu số lượng hoặc câu hỏi khảo sát từ mẫu báo cáo.
              </p>
              {!readOnlyStructure && (
                <button
                  type="button"
                  onClick={() => setActiveSection('design')}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm Trường Chỉ Tiêu</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {fields.map((field) => (
                <div key={field.id} className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 transition-all hover:border-slate-300">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label className="block text-xs font-bold text-slate-800">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>
                    {!readOnlyStructure && (
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition"
                        title="Xóa trường này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      placeholder={field.placeholder || 'Nhập nội dung...'}
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-medium"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      placeholder={field.placeholder || '0'}
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold"
                    />
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      rows={2}
                      placeholder={field.placeholder || 'Nhập đánh giá / nội dung chi tiết...'}
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => onFieldValueChange(field.id, e.target.value)}
                      className="w-full text-xs p-2.5 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  )}

                  {field.type === 'checkbox' && (
                    <label className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={Boolean(fieldValues[field.id])}
                        onChange={(e) => onFieldValueChange(field.id, e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Đã hoàn thành / Đạt chuẩn quy định</span>
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION II: BẢNG SỐ LIỆU CHI TIẾT */}
      {activeSection === 'tables' && (
        <div className="space-y-4">
          {tables.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
              <TableIcon className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-800">Không có bảng số liệu thống kê nào</p>
              <p className="text-[11px] text-slate-500">
                Đợt báo cáo này chỉ yêu cầu các trường thông tin văn bản hoặc tự do.
              </p>
              {!readOnlyStructure && (
                <button
                  type="button"
                  onClick={() => setActiveSection('design')}
                  className="mt-2 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Bảng Số Liệu Mới</span>
                </button>
              )}
            </div>
          ) : (
            tables.map((table, tIdx) => (
              <div key={table.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center">
                      {tIdx + 1}
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900">{table.title}</h5>
                      <span className="text-[11px] text-slate-500">Tổng cộng {table.rows.length} hàng dữ liệu</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddTableRow(table.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Dòng</span>
                    </button>

                    {!readOnlyStructure && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTable(table.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa bảng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

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
                              className="text-slate-300 hover:text-rose-500 disabled:opacity-20 p-1 transition"
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
            ))
          )}
        </div>
      )}

      {/* SECTION III: ĐÁNH GIÁ, THUẬN LỢI & KIẾN NGHỊ */}
      {activeSection === 'notes' && (
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
          <div className="border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-amber-600" />
              <span>Đánh Giá Chung, Thuận Lợi, Khó Khăn & Đề Xuất Kiến Nghị</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Ghi chú thêm các thuận lợi, vướng mắc phát sinh và kiến nghị giải pháp tới Ban Giám Hiệu nhà trường.
            </p>
          </div>

          <div>
            <textarea
              rows={8}
              value={notes}
              onChange={(e) => onNotesChange && onNotesChange(e.target.value)}
              placeholder="1. Đánh giá tình hình thực hiện:&#10;- Thuận lợi: ...&#10;- Khó khăn, vướng mắc: ...&#10;&#10;2. Đề xuất, kiến nghị với BGH nhà trường:&#10;- Về cơ sở vật chất, trang thiết bị: ...&#10;- Về công tác phối hợp chuyên môn: ..."
              className="w-full text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* SECTION IV: XEM TRƯỚC BÁO CÁO */}
      {activeSection === 'preview' && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-6 font-serif max-w-4xl mx-auto text-slate-900">
          {/* Official Letterhead */}
          <div className="grid grid-cols-2 text-center text-xs pb-4 border-b border-slate-300">
            <div>
              <div className="uppercase">SỞ GDĐT TỈNH ĐỒNG THÁP</div>
              <div className="font-bold uppercase">TRƯỜNG THCS-THPT ĐỐC BINH KIỀU</div>
              <div className="text-[10px]">***</div>
            </div>
            <div>
              <div className="font-bold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="font-bold underline">Độc lập - Tự do - Hạnh phúc</div>
              <div className="italic text-[11px] mt-1">Đốc Binh Kiều, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-2">
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-wide">{formTitle}</h2>
            <div className="italic text-xs text-slate-600 mt-1">Năm học: {academicYear}</div>
          </div>

          {/* Author Details */}
          <div className="text-xs space-y-1 text-slate-800">
            <p>- Người thực hiện báo cáo: <strong className="font-bold">{authorName}</strong></p>
            <p>- Chức vụ / Bộ phận: <strong className="font-bold">{authorRole} - {departmentOrClass}</strong></p>
            <p>- Đơn vị công tác: Trường THCS-THPT Đốc Binh Kiều</p>
          </div>

          {/* Fields Preview */}
          {fields.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-xs uppercase tracking-wide">I. THÔNG TIN & CHỈ TIÊU BÁO CÁO:</div>
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    {fields.map((f) => (
                      <tr key={f.id} className="border-b border-slate-200 last:border-b-0">
                        <td className="p-2 font-bold bg-slate-50 w-2/5 border-r border-slate-200">{f.label}</td>
                        <td className="p-2">
                          {f.type === 'checkbox' 
                            ? (fieldValues[f.id] ? '✓ Đã hoàn thành' : 'Chưa hoàn thành') 
                            : (fieldValues[f.id] || '---')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tables Preview */}
          {tables.length > 0 && (
            <div className="space-y-4">
              <div className="font-bold text-xs uppercase tracking-wide">II. CÁC BẢNG SỐ LIỆU THỐNG KÊ CHI TIẾT:</div>
              {tables.map((t, idx) => (
                <div key={t.id} className="space-y-1">
                  <div className="font-bold text-xs italic">{idx + 1}. {t.title}</div>
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                          {t.headers.map((h, i) => (
                            <th key={i} className="p-2 border-r border-slate-200 last:border-r-0 text-center">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {t.rows.map((r, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-200 last:border-b-0">
                            {t.headers.map((h, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0">{r[h] || ''}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes Preview */}
          {notes && (
            <div className="space-y-2">
              <div className="font-bold text-xs uppercase tracking-wide">III. ĐÁNH GIÁ & KIẾN NGHỊ:</div>
              <div className="text-xs whitespace-pre-line leading-relaxed text-justify p-3 bg-slate-50 rounded-lg border border-slate-200">
                {notes}
              </div>
            </div>
          )}

          {/* Signature */}
          <div className="grid grid-cols-2 text-center text-xs pt-6">
            <div></div>
            <div>
              <div className="font-bold uppercase">NGƯỜI LẬP BÁO CÁO</div>
              <div className="italic text-[11px] text-slate-500">(Ký và ghi rõ họ tên)</div>
              <div className="h-16"></div>
              <div className="font-bold text-sm">{authorName}</div>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleDownloadWord}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Tải Báo Cáo Ra Tệp Word (.doc) Chuẩn Hành Chính</span>
            </button>
          </div>
        </div>
      )}

      {/* DESIGN TAB (Admin custom builder) */}
      {!readOnlyStructure && activeSection === 'design' && (
        <div className="p-4 bg-white border border-purple-200 rounded-2xl space-y-5 shadow-2xs">
          <div className="border-b border-purple-100 pb-2.5 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-purple-950 uppercase tracking-wider flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-600" />
                <span>Thiết Kế Cấu Trúc Biểu Mẫu Trực Tuyến</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Thêm trường chỉ tiêu hoặc tạo bảng ma trận để giáo viên điền trực tiếp trên hệ thống.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Nhập Từ Tệp Word (.docx)</span>
            </button>
          </div>

          {/* Add Field Form */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thêm Trường Chỉ Tiêu / Câu Hỏi Mới</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tên trường / Câu hỏi</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Số học sinh chưa ra lớp, Kinh phí hoạt động..."
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-emerald-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Kiểu dữ liệu</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-emerald-600 font-medium"
                >
                  <option value="text">Văn bản ngắn (Text)</option>
                  <option value="number">Số lượng / Chỉ tiêu (Number)</option>
                  <option value="textarea">Văn bản dài / Đánh giá (Textarea)</option>
                  <option value="checkbox">Hộp kiểm hoàn thành (Checkbox)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddField}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Vào Biểu Mẫu</span>
              </button>
            </div>
          </div>

          {/* Add Table Form */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <TableIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Tạo Bảng Số Liệu Chi Tiết</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tiêu đề bảng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bảng danh sách học sinh đạt giải phong trào..."
                  value={newTableTitle}
                  onChange={(e) => setNewTableTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Danh sách tên các cột <span className="text-slate-400 font-normal">(phân tách bằng dấu phẩy)</span>
                </label>
                <input
                  type="text"
                  placeholder="STT, Họ và tên, Lớp, Giải thưởng, Ghi chú"
                  value={newTableColumns}
                  onChange={(e) => setNewTableColumns(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-white border border-slate-300 focus:outline-blue-600 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddTable}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Tạo Bảng Số Liệu</span>
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
