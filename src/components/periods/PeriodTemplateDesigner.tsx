import React, { useState } from 'react';
import { 
  Layers, 
  Table as TableIcon, 
  Plus, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  CornerDownRight, 
  Eye, 
  Sparkles, 
  Copy,
  Columns,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { CustomFormField, CustomDynamicTable, PeriodFormTemplate } from '../../types';

interface PeriodTemplateDesignerProps {
  template: PeriodFormTemplate;
  onChange: (updated: PeriodFormTemplate) => void;
  onClear: () => void;
  previewTab: 'edit' | 'render';
  onTabChange: (tab: 'edit' | 'render') => void;
}

export const PeriodTemplateDesigner: React.FC<PeriodTemplateDesignerProps> = ({
  template,
  onChange,
  onClear,
  previewTab,
  onTabChange
}) => {
  // State for which field is currently being edited
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldSearchTerm, setFieldSearchTerm] = useState('');

  // State for Table editing or creation
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [editingTableIndex, setEditingTableIndex] = useState<number | null>(null);
  const [tableFormTitle, setTableFormTitle] = useState('');
  const [tableFormHeaders, setTableFormHeaders] = useState<string[]>([]);
  const [newColumnInput, setNewColumnInput] = useState('');

  // --------------------------------------------------------------------------
  // FIELD ACTIONS (Sửa nội dung, chèn dòng ở giữa, di chuyển dòng)
  // --------------------------------------------------------------------------
  const fields = template.fields || [];
  const tables = template.tables || [];

  // Sửa thông tin 1 câu hỏi/dòng nhập liệu
  const handleUpdateField = (index: number, updates: Partial<CustomFormField>) => {
    const updated = [...fields];
    if (!updated[index]) return;
    updated[index] = {
      ...updated[index],
      ...updates
    };
    onChange({
      ...template,
      fields: updated
    });
  };

  // Chèn 1 dòng mới vào vị trí `targetIndex`
  // Ví dụ: targetIndex = i + 1 là chèn ngay bên dưới dòng i (ở giữa các dòng)
  const handleInsertFieldAt = (targetIndex: number) => {
    const newFieldId = 'field-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newField: CustomFormField = {
      id: newFieldId,
      label: `Câu hỏi ${targetIndex + 1}: `,
      type: 'textarea',
      required: false
    };

    const updated = [...fields];
    const safeIndex = Math.max(0, Math.min(targetIndex, updated.length));
    updated.splice(safeIndex, 0, newField);

    onChange({
      ...template,
      fields: updated
    });

    // Tự động mở chế độ chỉnh sửa để người dùng gõ ngay nội dung
    setEditingFieldId(newFieldId);
  };

  // Di chuyển câu hỏi lên
  const handleMoveFieldUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    onChange({
      ...template,
      fields: updated
    });
  };

  // Di chuyển câu hỏi xuống
  const handleMoveFieldDown = (index: number) => {
    if (index >= fields.length - 1) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    onChange({
      ...template,
      fields: updated
    });
  };

  // Xóa câu hỏi
  const handleDeleteField = (index: number) => {
    const target = fields[index];
    const updated = fields.filter((_, i) => i !== index);
    onChange({
      ...template,
      fields: updated
    });
    if (editingFieldId === target?.id) {
      setEditingFieldId(null);
    }
  };

  // --------------------------------------------------------------------------
  // TABLE ACTIONS (Tự tạo bảng mới, sửa bảng, thêm/bớt cột)
  // --------------------------------------------------------------------------

  // Mở trình tạo bảng mới
  const handleStartCreateTable = () => {
    setIsCreatingTable(true);
    setEditingTableIndex(null);
    setTableFormTitle(`Bảng ${tables.length + 1}. Thống kê số liệu`);
    setTableFormHeaders(['STT', 'Nội dung chỉ tiêu', 'Đơn vị tính', 'Số lượng', 'Ghi chú']);
    setNewColumnInput('');
  };

  // Mở trình sửa bảng đã có
  const handleStartEditTable = (index: number) => {
    const tbl = tables[index];
    if (!tbl) return;
    setIsCreatingTable(false);
    setEditingTableIndex(index);
    setTableFormTitle(tbl.title || `Bảng ${index + 1}`);
    setTableFormHeaders([...(tbl.headers || ['STT', 'Nội dung', 'Số lượng', 'Ghi chú'])]);
    setNewColumnInput('');
  };

  // Thêm 1 cột vào bảng đang soạn
  const handleAddColumnToTable = () => {
    const trimmed = newColumnInput.trim();
    if (!trimmed) return;
    if (tableFormHeaders.includes(trimmed)) {
      alert('Tên cột này đã tồn tại trong bảng!');
      return;
    }
    setTableFormHeaders([...tableFormHeaders, trimmed]);
    setNewColumnInput('');
  };

  // Xóa 1 cột khỏi bảng đang soạn
  const handleRemoveColumnFromTable = (colIndex: number) => {
    if (tableFormHeaders.length <= 1) {
      alert('Bảng phải có ít nhất 1 cột!');
      return;
    }
    setTableFormHeaders(tableFormHeaders.filter((_, i) => i !== colIndex));
  };

  // Sửa tên 1 cột
  const handleRenameColumn = (colIndex: number, newName: string) => {
    const updated = [...tableFormHeaders];
    updated[colIndex] = newName;
    setTableFormHeaders(updated);
  };

  // Gợi ý nhanh mẫu cột cho bảng
  const applyTablePreset = (preset: 'student' | 'academic' | 'tasks' | 'finance') => {
    if (preset === 'student') {
      setTableFormTitle('Bảng thống kê sĩ số & chuyên cần');
      setTableFormHeaders(['STT', 'Lớp', 'Sĩ số', 'Có mặt', 'Vắng có phép', 'Vắng không phép', 'Ghi chú']);
    } else if (preset === 'academic') {
      setTableFormTitle('Bảng thống kê chất lượng học tập');
      setTableFormHeaders(['STT', 'Khối / Lớp', 'Tốt / Giỏi', 'Khá', 'Đạt', 'Chưa đạt', 'Ghi chú']);
    } else if (preset === 'tasks') {
      setTableFormTitle('Bảng theo dõi tiến độ nhiệm vụ công việc');
      setTableFormHeaders(['STT', 'Nội dung nhiệm vụ', 'Người phụ trách', 'Thời hạn hoàn thành', 'Kết quả đạt được']);
    } else if (preset === 'finance') {
      setTableFormTitle('Bảng thống kê thu chi & cơ sở vật chất');
      setTableFormHeaders(['STT', 'Danh mục', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Tình trạng']);
    }
  };

  // Lưu bảng (Tạo mới hoặc Sửa)
  const handleSaveTable = () => {
    if (!tableFormTitle.trim()) {
      alert('Vui lòng nhập Tiêu đề bảng!');
      return;
    }
    if (tableFormHeaders.length === 0) {
      alert('Bảng cần có ít nhất 1 cột!');
      return;
    }

    const currentTables = [...tables];

    if (isCreatingTable || editingTableIndex === null) {
      // Tạo mới
      const newTable: CustomDynamicTable = {
        id: 'table-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        title: tableFormTitle.trim(),
        headers: tableFormHeaders,
        rows: []
      };
      onChange({
        ...template,
        tables: [...currentTables, newTable]
      });
    } else {
      // Cập nhật bảng hiện có
      currentTables[editingTableIndex] = {
        ...currentTables[editingTableIndex],
        title: tableFormTitle.trim(),
        headers: tableFormHeaders
      };
      onChange({
        ...template,
        tables: currentTables
      });
    }

    setIsCreatingTable(false);
    setEditingTableIndex(null);
  };

  // Hủy sửa/tạo bảng
  const handleCancelTableForm = () => {
    setIsCreatingTable(false);
    setEditingTableIndex(null);
  };

  // Xóa 1 bảng
  const handleDeleteTable = (index: number) => {
    const updated = tables.filter((_, i) => i !== index);
    onChange({
      ...template,
      tables: updated
    });
    if (editingTableIndex === index) {
      setEditingTableIndex(null);
    }
  };

  // Xóa sạch tất cả bảng
  const handleClearAllTables = () => {
    if (window.confirm('Thầy/Cô có chắc chắn muốn bỏ toàn bộ các bảng, chỉ giữ lại các câu hỏi nhập liệu từ trên xuống dưới không?')) {
      onChange({
        ...template,
        tables: []
      });
      setIsCreatingTable(false);
      setEditingTableIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER BAR: THÔNG KÊ & CHUYỂN TAB */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-emerald-200">
        <div className="flex items-center gap-2 text-xs font-black text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span>
            Đã có: <strong className="text-emerald-700 font-extrabold">{fields.length} câu hỏi</strong> 
            {tables.length > 0 ? (
              <span> và <strong className="text-blue-700 font-extrabold">{tables.length} bảng số liệu</strong></span>
            ) : (
              <span className="text-slate-500 font-normal"> (Chưa có bảng - rất gọn gàng)</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => onTabChange('edit')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                previewTab === 'edit'
                  ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa Nội Dung & Chèn Dòng ({fields.length})</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('render')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                previewTab === 'render'
                  ? 'bg-white text-blue-800 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem Thử Form Giáo Viên</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer ml-1"
          >
            Gỡ bỏ mẫu
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: CHỈNH SỬA CÂU TỪ, CHÈN DÒNG Ở GIỮA, VÀ TỰ TẠO / SỬA BẢNG     */}
      {/* ==================================================================== */}
      {previewTab === 'edit' && (
        <div className="space-y-4">
          
          {/* HƯỚNG DẪN THAO TÁC RÕ RÀNG */}
          <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-900">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Tiện ích chỉnh sửa thông minh & chèn dòng linh hoạt:</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              • <strong>Sửa nội dung câu chữ:</strong> Nhấp trực tiếp vào ô câu hỏi bên dưới hoặc bấm nút <strong>"Sửa"</strong> để đổi câu từ, chuyển loại ô (Nhiều dòng / 1 dòng / Số liệu).<br />
              • <strong>Chèn thêm dòng ở giữa:</strong> Bấm nút <strong>"+ Chèn dòng bên dưới"</strong> tại bất kỳ vị trí nào để thêm câu hỏi xen kẽ mà không lo lệch thứ tự.<br />
              • <strong>Tự tạo bảng & Sửa bảng:</strong> Bấm <strong>"+ Tự Tạo Bảng Mới"</strong> hoặc <strong>"Sửa Bảng"</strong> để đổi tên cột, thêm cột theo đúng ý mình.
            </p>
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* MỤC 1: DANH SÁCH CÂU HỎI / DÒNG NHẬP LIỆU (CÓ CHÈN DÒNG Ở GIỮA)   */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Danh Sách Các Dòng Nhập Liệu ({fields.length} mục):</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleInsertFieldAt(0)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1 border border-emerald-200 cursor-pointer"
                  title="Chèn câu hỏi lên vị trí đầu tiên"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Chèn ở đầu</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertFieldAt(fields.length)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Thêm câu hỏi vào cuối form"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Thêm ở cuối</span>
                </button>
              </div>
            </div>

            {fields.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <div>Chưa có câu hỏi nào trong biểu mẫu.</div>
                <button
                  type="button"
                  onClick={() => handleInsertFieldAt(0)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Câu Hỏi Đầu Tiên</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {fields.map((field, index) => {
                  const isEditing = editingFieldId === field.id;

                  return (
                    <div
                      key={field.id || index}
                      className={`rounded-xl border transition p-2.5 space-y-2 ${
                        isEditing 
                          ? 'bg-emerald-50/70 border-emerald-400 shadow-sm ring-1 ring-emerald-300' 
                          : 'bg-slate-50/80 hover:bg-slate-100/80 border-slate-200'
                      }`}
                    >
                      {/* ROW HEADER & CONTENT */}
                      <div className="flex items-start gap-2 justify-between">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {/* Số thứ tự dòng */}
                          <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                            {index + 1}
                          </span>

                          {/* Nội dung câu hỏi (Xem hoặc Sửa trực tiếp) */}
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <label className="block text-[11px] font-bold text-emerald-950">
                                  Chỉnh sửa câu từ / tiêu đề dòng {index + 1}:
                                </label>
                                <textarea
                                  rows={2}
                                  value={field.label}
                                  onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                                  placeholder="Nhập nội dung câu hỏi, yêu cầu..."
                                  className="w-full text-xs p-2.5 rounded-lg border border-emerald-400 bg-white font-semibold text-slate-900 focus:outline-emerald-600 shadow-inner"
                                  autoFocus
                                />

                                {/* Loại ô nhập & Bắt buộc */}
                                <div className="flex flex-wrap items-center gap-3 pt-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-bold text-slate-700">Kiểu ô nhập:</span>
                                    <select
                                      value={field.type}
                                      onChange={(e) => handleUpdateField(index, { type: e.target.value as any })}
                                      className="text-xs px-2 py-1 rounded-md border border-slate-300 bg-white font-medium"
                                    >
                                      <option value="textarea">Văn bản nhiều dòng (Đoạn văn, chi tiết)</option>
                                      <option value="text">Văn bản 1 dòng (Ngắn gọn)</option>
                                      <option value="number">Số liệu thống kê (Sĩ số, số lượng)</option>
                                    </select>
                                  </div>

                                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(field.required)}
                                      onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                                      className="rounded text-emerald-600"
                                    />
                                    <span>Bắt buộc điền</span>
                                  </label>

                                  <button
                                    type="button"
                                    onClick={() => setEditingFieldId(null)}
                                    className="ml-auto px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Xong</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div 
                                  onClick={() => setEditingFieldId(field.id)}
                                  className="font-bold text-slate-900 text-xs leading-snug cursor-pointer hover:text-emerald-700 flex items-center gap-1.5 group"
                                  title="Nhấp để sửa câu từ"
                                >
                                  <span>{field.label}</span>
                                  <Edit3 className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition shrink-0" />
                                </div>

                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className={`px-2 py-0.5 rounded font-bold ${
                                    field.type === 'number' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : field.type === 'textarea' 
                                      ? 'bg-amber-100 text-amber-900' 
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {field.type === 'number' ? '🔢 Ô nhập số' : field.type === 'textarea' ? '📝 Nhiều dòng' : '📄 Một dòng'}
                                  </span>

                                  {field.required && (
                                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                                      * Bắt buộc
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* NÚT THAO TÁC CỦA DÒNG */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0">
                            {/* Nút Sửa câu từ */}
                            <button
                              type="button"
                              onClick={() => setEditingFieldId(field.id)}
                              className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              title="Sửa nội dung, câu từ dòng này"
                            >
                              <Edit3 className="w-3 h-3 text-slate-500" />
                              <span>Sửa</span>
                            </button>

                            {/* Nút CHÈN DÒNG BÊN DƯỚI (Ở GIỮA CÁC DÒNG) */}
                            <button
                              type="button"
                              onClick={() => handleInsertFieldAt(index + 1)}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              title={`Chèn thêm 1 dòng mới ngay dưới dòng ${index + 1} (ở giữa dòng ${index + 1} và ${index + 2})`}
                            >
                              <CornerDownRight className="w-3 h-3 text-emerald-600" />
                              <span>+ Chèn dòng</span>
                            </button>

                            {/* Mũi tên Lên / Xuống */}
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveFieldUp(index)}
                                disabled={index === 0}
                                className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Đẩy dòng này lên trên"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveFieldDown(index)}
                                disabled={index === fields.length - 1}
                                className="p-1 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Đẩy dòng này xuống dưới"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Nút Xóa dòng */}
                            <button
                              type="button"
                              onClick={() => handleDeleteField(index)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                              title="Xóa dòng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------------ */}
          {/* MỤC 2: DANH SÁCH BẢNG SỐ LIỆU (TỰ TẠO BẢNG & SỬA BẢNG CỦA MÌNH)     */}
          {/* ------------------------------------------------------------------ */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span>Bảng Số Liệu Thống Kê ({tables.length} bảng):</span>
              </div>

              <div className="flex items-center gap-2">
                {tables.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllTables}
                    className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1 border border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Bỏ tất cả bảng</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStartCreateTable}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Tự Tạo Bảng Mới Theo Ý Mình</span>
                </button>
              </div>
            </div>

            {/* FORM TỰ TẠO HOẶC CHỈNH SỬA BẢNG */}
            {(isCreatingTable || editingTableIndex !== null) && (
              <div className="p-4 rounded-2xl bg-blue-50/90 border-2 border-blue-400 shadow-md space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <div className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                    <TableIcon className="w-4 h-4 text-blue-700" />
                    <span>{isCreatingTable ? 'Thiết Kế Bảng Mới Theo Ý Muốn' : `Chỉnh Sửa Bảng: ${tableFormTitle}`}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelTableForm}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Tiêu đề bảng */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-blue-950">
                    Tiêu đề / Tên bảng số liệu:
                  </label>
                  <input
                    type="text"
                    value={tableFormTitle}
                    onChange={(e) => setTableFormTitle(e.target.value)}
                    placeholder="Ví dụ: Bảng 1. Thống kê sĩ số học sinh và tình hình vắng học..."
                    className="w-full text-xs p-2.5 rounded-xl border border-blue-300 bg-white font-bold text-slate-900 focus:outline-blue-600"
                  />
                </div>

                {/* Gợi ý mẫu bảng nhanh 1-click */}
                <div className="space-y-1.5 bg-white/80 p-2.5 rounded-xl border border-blue-200">
                  <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Chọn nhanh mẫu cột thông dụng của nhà trường:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyTablePreset('student')}
                      className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold cursor-pointer transition"
                    >
                      👥 Sĩ số & Chuyên cần
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTablePreset('academic')}
                      className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-bold cursor-pointer transition"
                    >
                      📊 Học lực & Điểm số
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTablePreset('tasks')}
                      className="px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-[11px] font-bold cursor-pointer transition"
                    >
                      📋 Tiến độ nhiệm vụ
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTablePreset('finance')}
                      className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold cursor-pointer transition"
                    >
                      💰 Kinh phí / Cơ sở vật chất
                    </button>
                  </div>
                </div>

                {/* Quản lý danh sách các cột */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-blue-950">
                    Danh sách các cột trong bảng ({tableFormHeaders.length} cột):
                  </label>

                  <div className="space-y-1.5">
                    {tableFormHeaders.map((header, colIdx) => (
                      <div
                        key={colIdx}
                        className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 text-xs"
                      >
                        <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {colIdx + 1}
                        </span>

                        <input
                          type="text"
                          value={header}
                          onChange={(e) => handleRenameColumn(colIdx, e.target.value)}
                          placeholder="Tên cột..."
                          className="flex-1 min-w-0 px-2 py-1 rounded border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-blue-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveColumnFromTable(colIdx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                          title="Xóa cột này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Thêm cột mới */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={newColumnInput}
                      onChange={(e) => setNewColumnInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddColumnToTable();
                        }
                      }}
                      placeholder="Gõ tên cột cần thêm (Ví dụ: Ghi chú, Lý do, Tỷ lệ...)"
                      className="flex-1 min-w-0 text-xs px-3 py-1.5 rounded-lg border border-blue-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddColumnToTable}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm cột</span>
                    </button>
                  </div>
                </div>

                {/* Nút Lưu / Hủy */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={handleCancelTableForm}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTable}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isCreatingTable ? 'Lưu & Tạo Bảng Mới' : 'Lưu Thay Đổi Bảng'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* DANH SÁCH BẢNG HIỆN CÓ */}
            {tables.length === 0 ? (
              <div className="p-3.5 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Chưa có bảng số liệu nào. Nếu biểu mẫu cần bảng thống kê, Thầy/Cô hãy bấm <strong>"+ Tự Tạo Bảng Mới Theo Ý Mình"</strong> ở trên.
              </div>
            ) : (
              <div className="space-y-2">
                {tables.map((tbl, tblIdx) => (
                  <div
                    key={tbl.id || tblIdx}
                    className="p-3 rounded-xl bg-blue-50/40 border border-blue-200 text-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-extrabold text-blue-950 flex items-center gap-1.5">
                          <TableIcon className="w-4 h-4 text-blue-700 shrink-0" />
                          <span>{tbl.title}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {tbl.headers.map((h, hIdx) => (
                            <span 
                              key={hIdx}
                              className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-slate-800 font-semibold"
                            >
                              {h}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditTable(tblIdx)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                        >
                          <Edit3 className="w-3 h-3 text-blue-600" />
                          <span>Sửa bảng</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTable(tblIdx)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition cursor-pointer"
                          title="Xóa bảng này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: XEM THỰC TẾ GIAO DIỆN GIÁO VIÊN ĐIỀN (1 TRANG CUỘN LIỀN MẠCH)   */}
      {/* ==================================================================== */}
      {previewTab === 'render' && (
        <div className="space-y-3 p-4 bg-slate-50/90 rounded-2xl border border-slate-200 max-h-[420px] overflow-y-auto pr-1 animate-in fade-in">
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Giao diện hoàn chỉnh giáo viên sẽ nhìn thấy (1 trang duy nhất, điền từ trên xuống dưới):</span>
          </div>

          <div className="space-y-4 pt-1">
            {fields.map((f, i) => (
              <div key={f.id || i} className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-900 flex items-start gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[11px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{f.label}</span>
                  {f.required && <span className="text-rose-600">*</span>}
                </label>

                {f.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    disabled
                    placeholder="Giáo viên nhập nội dung chi tiết tại đây..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-400 cursor-not-allowed"
                  />
                ) : f.type === 'number' ? (
                  <input
                    type="number"
                    disabled
                    placeholder="Nhập số liệu..."
                    className="w-48 text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-400 cursor-not-allowed"
                  />
                ) : (
                  <input
                    type="text"
                    disabled
                    placeholder="Nhập thông tin ngắn gọn..."
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50/50 text-slate-400 cursor-not-allowed"
                  />
                )}
              </div>
            ))}

            {tables.map((tbl, i) => (
              <div key={tbl.id || i} className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <TableIcon className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{tbl.title}</span>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        {tbl.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-2 border-b border-slate-200 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-slate-400 italic">
                        <td colSpan={tbl.headers.length} className="p-3 text-center bg-slate-50/50">
                          (Giáo viên bấm "+ Thêm dòng" để nhập trực tiếp vào các cột này)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
