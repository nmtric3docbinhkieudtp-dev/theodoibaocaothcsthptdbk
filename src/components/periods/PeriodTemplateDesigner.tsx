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
  AlertCircle,
  FileText,
  AlignLeft,
  CheckSquare,
  CircleDot,
  ChevronDown,
  Calendar,
  Clock,
  Sliders,
  UploadCloud,
  Hash,
  Bookmark,
  GripVertical,
  Type,
  ListPlus,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { CustomFormField, CustomDynamicTable, PeriodFormTemplate, FormFieldType } from '../../types';

interface PeriodTemplateDesignerProps {
  template: PeriodFormTemplate;
  onChange: (updated: PeriodFormTemplate) => void;
  onClear: () => void;
  previewTab: 'edit' | 'render';
  onTabChange: (tab: 'edit' | 'render') => void;
}

// Định nghĩa các loại câu hỏi phong cách Google Forms
interface FieldTypeDefinition {
  type: FormFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  hasOptions?: boolean;
}

const GOOGLE_FORM_FIELD_TYPES: FieldTypeDefinition[] = [
  { type: 'text', label: 'Trả lời ngắn', icon: Type, description: 'Một dòng văn bản ngắn gọn (Họ tên, mã số, lớp...)' },
  { type: 'textarea', label: 'Đoạn văn', icon: AlignLeft, description: 'Nhiều dòng cho phép gõ dài (Nhận xét, khó khăn, đề xuất)' },
  { type: 'radio', label: 'Trắc nghiệm (1 đáp án)', icon: CircleDot, description: 'Người điền chọn duy nhất 1 trong các phương án', hasOptions: true },
  { type: 'checkbox', label: 'Hộp kiểm (Nhiều đáp án)', icon: CheckSquare, description: 'Người điền có thể tích chọn 1 hoặc nhiều phương án', hasOptions: true },
  { type: 'dropdown', label: 'Menu thả xuống', icon: ChevronDown, description: 'Danh sách cuộn chọn 1 mục (gọn gàng)', hasOptions: true },
  { type: 'scale', label: 'Thang đo tuyến tính', icon: Sliders, description: 'Đánh giá điểm số / mức độ từ 1 đến 5 hoặc 1 đến 10' },
  { type: 'number', label: 'Số liệu', icon: Hash, description: 'Chỉ cho phép nhập số (sĩ số, số tiết, kinh phí...)' },
  { type: 'date', label: 'Ngày tháng', icon: Calendar, description: 'Chọn ngày cụ thể trên lịch' },
  { type: 'time', label: 'Thời gian', icon: Clock, description: 'Chọn giờ và phút' },
  { type: 'file', label: 'Tải tệp lên', icon: UploadCloud, description: 'Giáo viên đính kèm minh chứng, ảnh hoặc biên bản' },
  { type: 'section', label: 'Tiêu đề phần / Phân mục', icon: Bookmark, description: 'Thẻ tiêu đề chia nhỏ biểu mẫu (không cần trả lời)' },
];

export const PeriodTemplateDesigner: React.FC<PeriodTemplateDesignerProps> = ({
  template,
  onChange,
  onClear,
  previewTab,
  onTabChange
}) => {
  // State for which field is currently active/selected (Google Forms style active card)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // Theme color selection (Google Forms style color accent)
  const [accentTheme, setAccentTheme] = useState<'emerald' | 'purple' | 'blue' | 'amber'>('emerald');

  // Interactive preview state (mock filling the form to test live)
  const [mockResponses, setMockResponses] = useState<Record<string, any>>({});

  // State for Table editing or creation
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [editingTableIndex, setEditingTableIndex] = useState<number | null>(null);
  const [tableFormTitle, setTableFormTitle] = useState('');
  const [tableFormHeaders, setTableFormHeaders] = useState<string[]>([]);
  const [newColumnInput, setNewColumnInput] = useState('');

  // Dropdown menu state for question types
  const [openTypeSelectorId, setOpenTypeSelectorId] = useState<string | null>(null);

  const fields = template.fields || [];
  const tables = template.tables || [];

  // Theme color styles
  const themeStyles = {
    emerald: {
      borderActive: 'border-emerald-500 ring-2 ring-emerald-200/80',
      badge: 'bg-emerald-100 text-emerald-800',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      accentBar: 'bg-emerald-600',
      radioActive: 'border-emerald-600 bg-emerald-600',
      checkActive: 'bg-emerald-600 border-emerald-600'
    },
    purple: {
      borderActive: 'border-purple-500 ring-2 ring-purple-200/80',
      badge: 'bg-purple-100 text-purple-800',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white',
      accentBar: 'bg-purple-600',
      radioActive: 'border-purple-600 bg-purple-600',
      checkActive: 'bg-purple-600 border-purple-600'
    },
    blue: {
      borderActive: 'border-blue-500 ring-2 ring-blue-200/80',
      badge: 'bg-blue-100 text-blue-800',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
      accentBar: 'bg-blue-600',
      radioActive: 'border-blue-600 bg-blue-600',
      checkActive: 'bg-blue-600 border-blue-600'
    },
    amber: {
      borderActive: 'border-amber-500 ring-2 ring-amber-200/80',
      badge: 'bg-amber-100 text-amber-800',
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
      accentBar: 'bg-amber-600',
      radioActive: 'border-amber-600 bg-amber-600',
      checkActive: 'bg-amber-600 border-amber-600'
    }
  }[accentTheme];

  // --------------------------------------------------------------------------
  // FIELD ACTIONS (GOOGLE FORMS CRUD)
  // --------------------------------------------------------------------------

  // Update field
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

  // Add a new question (At target index or at the end)
  const handleInsertFieldAt = (targetIndex: number, type: FormFieldType = 'textarea') => {
    const newFieldId = 'field-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    
    let defaultOptions: string[] | undefined = undefined;
    if (type === 'radio' || type === 'checkbox' || type === 'dropdown') {
      defaultOptions = ['Tùy chọn 1', 'Tùy chọn 2', 'Tùy chọn 3'];
    }

    const isSection = type === 'section';
    const newField: CustomFormField = {
      id: newFieldId,
      label: isSection ? `PHẦN ${targetIndex + 1}: TIÊU ĐỀ PHÂN ĐOẠN` : `Câu hỏi ${targetIndex + 1}: `,
      type: type,
      required: isSection ? false : false,
      options: defaultOptions,
      scaleMin: type === 'scale' ? 1 : undefined,
      scaleMax: type === 'scale' ? 5 : undefined,
      scaleMinLabel: type === 'scale' ? 'Chưa đạt' : undefined,
      scaleMaxLabel: type === 'scale' ? 'Rất tốt' : undefined
    };

    const updated = [...fields];
    const safeIndex = Math.max(0, Math.min(targetIndex, updated.length));
    updated.splice(safeIndex, 0, newField);

    onChange({
      ...template,
      fields: updated
    });

    setActiveFieldId(newFieldId);
  };

  // Duplicate a question (Feature signature of Google Forms)
  const handleDuplicateField = (index: number) => {
    const original = fields[index];
    if (!original) return;

    const copyId = 'field-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const duplicatedField: CustomFormField = {
      ...JSON.parse(JSON.stringify(original)),
      id: copyId,
      label: original.label + ' (Bản sao)'
    };

    const updated = [...fields];
    updated.splice(index + 1, 0, duplicatedField);

    onChange({
      ...template,
      fields: updated
    });

    setActiveFieldId(copyId);
  };

  // Move field Up / Down
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;
    const updated = [...fields];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onChange({
      ...template,
      fields: updated
    });
  };

  // Delete field
  const handleDeleteField = (index: number) => {
    const target = fields[index];
    const updated = fields.filter((_, i) => i !== index);
    onChange({
      ...template,
      fields: updated
    });
    if (activeFieldId === target?.id) {
      setActiveFieldId(null);
    }
  };

  // --------------------------------------------------------------------------
  // OPTION ACTIONS (FOR MULTIPLE CHOICE / CHECKBOX / DROPDOWN)
  // --------------------------------------------------------------------------
  const handleAddOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    if (!field) return;
    const currentOptions = field.options || [];
    const newOptionName = `Tùy chọn ${currentOptions.length + 1}`;
    handleUpdateField(fieldIndex, { options: [...currentOptions, newOptionName] });
  };

  const handleUpdateOption = (fieldIndex: number, optionIndex: number, val: string) => {
    const field = fields[fieldIndex];
    if (!field || !field.options) return;
    const updatedOptions = [...field.options];
    updatedOptions[optionIndex] = val;
    handleUpdateField(fieldIndex, { options: updatedOptions });
  };

  const handleDeleteOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    if (!field || !field.options) return;
    if (field.options.length <= 1) {
      alert('Cần có ít nhất 1 phương án lựa chọn!');
      return;
    }
    const updatedOptions = field.options.filter((_, i) => i !== optionIndex);
    handleUpdateField(fieldIndex, { options: updatedOptions });
  };

  // Change question type
  const handleChangeFieldType = (index: number, newType: FormFieldType) => {
    const field = fields[index];
    if (!field) return;

    let options = field.options;
    if ((newType === 'radio' || newType === 'checkbox' || newType === 'dropdown') && (!options || options.length === 0)) {
      options = ['Tùy chọn 1', 'Tùy chọn 2', 'Tùy chọn 3'];
    }

    handleUpdateField(index, {
      type: newType,
      options,
      scaleMin: newType === 'scale' ? 1 : undefined,
      scaleMax: newType === 'scale' ? 5 : undefined,
      scaleMinLabel: newType === 'scale' ? 'Chưa đạt' : undefined,
      scaleMaxLabel: newType === 'scale' ? 'Rất tốt' : undefined
    });

    setOpenTypeSelectorId(null);
  };

  // --------------------------------------------------------------------------
  // PRESET EDUCATION FORM TEMPLATES (NGÂN HÀNG MẪU BÁO CÁO CỦA NHÀ TRƯỜNG)
  // --------------------------------------------------------------------------
  const applyPresetTemplate = (preset: 'homeroom_weekly' | 'academic_review' | 'activity_survey') => {
    if (preset === 'homeroom_weekly') {
      const presetFields: CustomFormField[] = [
        { id: 'sec-1', label: 'I. THÔNG TIN CHUNG VÀ NỀ NẾP LỚP HỌC', type: 'section' },
        { id: 'f-1', label: '1. Sĩ số học sinh đầu tuần và biến động trong tuần:', type: 'textarea', required: true, description: 'Ghi rõ số lượng có mặt, chuyển đi, chuyển đến hoặc vắng dài ngày' },
        { id: 'f-2', label: '2. Tình hình chuyên cần và chấp hành nội quy:', type: 'radio', required: true, options: ['Tốt - 100% đúng giờ', 'Khá - Có 1-2 học sinh đi trễ', 'Trung bình - Còn hiện tượng trốn tiết/vắng', 'Cần chấn chỉnh khẩn cấp'] },
        { id: 'f-3', label: '3. Các vi phạm nề nếp nổi cộm trong tuần (nếu có):', type: 'checkbox', options: ['Không thuộc bài / thiếu bài tập', 'Sử dụng điện thoại trái phép', 'Đồng phục chưa nghiêm túc', 'Mâu thuẫn học đường', 'Không có vi phạm'] },
        { id: 'sec-2', label: 'II. HOẠT ĐỘNG HỌC TẬP VÀ PHONG TRÀO', type: 'section' },
        { id: 'f-4', label: '4. Đánh giá mức độ tích cực học tập của lớp trong tuần:', type: 'scale', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Rất thụ động', scaleMaxLabel: 'Rất tích cực, sôi nổi', required: true },
        { id: 'f-5', label: '5. Các đề xuất, kiến nghị với Ban Giám Hiệu:', type: 'textarea', placeholder: 'Nhập nội dung đề xuất về cơ sở vật chất, học sinh cá biệt...' }
      ];

      const presetTables: CustomDynamicTable[] = [
        {
          id: 'tbl-1',
          title: 'Bảng thống kê chuyên cần & điểm trừ thi đua theo ngày',
          headers: ['Thứ', 'Có mặt', 'Vắng có phép', 'Vắng không phép', 'Học sinh tuyên dương', 'Ghi chú'],
          rows: []
        }
      ];

      onChange({
        defaultTemplateContent: '',
        fields: presetFields,
        tables: presetTables
      });
      setActiveFieldId('f-1');
    } else if (preset === 'academic_review') {
      const presetFields: CustomFormField[] = [
        { id: 'sec-1', label: 'I. KẾT QUẢ GIẢNG DẠY VÀ THỰC HIỆN CHƯƠNG TRÌNH', type: 'section' },
        { id: 'f-1', label: '1. Tiến độ thực hiện chương trình môn học:', type: 'radio', required: true, options: ['Đúng tiến độ kế hoạch dạy học', 'Chậm tiến độ (Cần dạy bù)', 'Nhanh hơn tiến độ quy định'] },
        { id: 'f-2', label: '2. Số tiết thực hành / hoạt động trải nghiệm đã tổ chức:', type: 'number', required: true, placeholder: 'Nhập số tiết' },
        { id: 'f-3', label: '3. Nhận xét chất lượng tiếp thu bài của học sinh các khối lớp:', type: 'textarea', required: true },
        { id: 'sec-2', label: 'II. HỒ SƠ CHUYÊN MÔN & ĐỔI MỚI PHƯƠNG PHÁP', type: 'section' },
        { id: 'f-4', label: '4. Mức độ ứng dụng công nghệ thông tin & bài giảng số:', type: 'scale', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Ít ứng dụng', scaleMaxLabel: 'Thường xuyên, hiệu quả cao' },
        { id: 'f-5', label: '5. Tải lên giáo án mẫu hoặc phiếu học tập minh chứng:', type: 'file' }
      ];

      const presetTables: CustomDynamicTable[] = [
        {
          id: 'tbl-2',
          title: 'Bảng thống kê kiểm tra đánh giá định kỳ',
          headers: ['Khối lớp', 'Tổng số HS', 'Điểm Giỏi (8-10)', 'Điểm Khá (6.5-7.9)', 'Điểm Đạt (5-6.4)', 'Chưa đạt (<5)'],
          rows: []
        }
      ];

      onChange({
        defaultTemplateContent: '',
        fields: presetFields,
        tables: presetTables
      });
      setActiveFieldId('f-1');
    } else if (preset === 'activity_survey') {
      const presetFields: CustomFormField[] = [
        { id: 'f-1', label: '1. Họ và tên người tham gia khảo sát / báo cáo:', type: 'text', required: true },
        { id: 'f-2', label: '2. Đơn vị công tác / Tổ bộ môn:', type: 'dropdown', required: true, options: ['Tổ Toán - Tin', 'Tổ Ngữ Văn', 'Tổ Ngoại Ngữ', 'Tổ KHTN', 'Tổ KHXH', 'Tổ GDTC - QP', 'Tổ Văn Phòng'] },
        { id: 'f-3', label: '3. Đánh giá mức độ hiệu quả của đợt công tác vừa qua:', type: 'scale', scaleMin: 1, scaleMax: 5, scaleMinLabel: 'Chưa đạt kỳ vọng', scaleMaxLabel: 'Rất xuất sắc' },
        { id: 'f-4', label: '4. Những thuận lợi đã đạt được:', type: 'textarea' },
        { id: 'f-5', label: '5. Đóng góp giải pháp cải tiến cho đợt tiếp theo:', type: 'textarea', required: true }
      ];

      onChange({
        defaultTemplateContent: '',
        fields: presetFields,
        tables: []
      });
      setActiveFieldId('f-1');
    }
  };

  // --------------------------------------------------------------------------
  // TABLE ACTIONS
  // --------------------------------------------------------------------------
  const handleStartCreateTable = () => {
    setIsCreatingTable(true);
    setEditingTableIndex(null);
    setTableFormTitle(`Bảng ${tables.length + 1}. Thống kê số liệu`);
    setTableFormHeaders(['STT', 'Nội dung chỉ tiêu', 'Đơn vị tính', 'Số lượng', 'Ghi chú']);
    setNewColumnInput('');
  };

  const handleStartEditTable = (index: number) => {
    const tbl = tables[index];
    if (!tbl) return;
    setIsCreatingTable(false);
    setEditingTableIndex(index);
    setTableFormTitle(tbl.title || `Bảng ${index + 1}`);
    setTableFormHeaders([...(tbl.headers || ['STT', 'Nội dung', 'Số lượng', 'Ghi chú'])]);
    setNewColumnInput('');
  };

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

  const handleRemoveColumnFromTable = (colIndex: number) => {
    if (tableFormHeaders.length <= 1) {
      alert('Bảng phải có ít nhất 1 cột!');
      return;
    }
    setTableFormHeaders(tableFormHeaders.filter((_, i) => i !== colIndex));
  };

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

  return (
    <div className="space-y-4">
      {/* ==================================================================== */}
      {/* GOOGLE FORMS TOP TOOLBAR & VIEW CONTROLLER                           */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Tab Switcher (Chế độ thiết kế vs Xem thử) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => onTabChange('edit')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                previewTab === 'edit'
                  ? 'bg-white text-emerald-800 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Thiết Kế Mẫu ({fields.length} câu)</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange('render')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                previewTab === 'render'
                  ? 'bg-white text-blue-800 shadow-2xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Xem Thử Như Giáo Viên Điền</span>
            </button>
          </div>

          {/* Theme Palette Switcher */}
          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold">Tông màu:</span>
            <button
              type="button"
              onClick={() => setAccentTheme('emerald')}
              className={`w-4 h-4 rounded-full bg-emerald-600 transition cursor-pointer ${accentTheme === 'emerald' ? 'ring-2 ring-emerald-300 ring-offset-1 scale-110' : 'opacity-60'}`}
              title="Màu xanh ngọc"
            />
            <button
              type="button"
              onClick={() => setAccentTheme('purple')}
              className={`w-4 h-4 rounded-full bg-purple-600 transition cursor-pointer ${accentTheme === 'purple' ? 'ring-2 ring-purple-300 ring-offset-1 scale-110' : 'opacity-60'}`}
              title="Màu tím Google Forms"
            />
            <button
              type="button"
              onClick={() => setAccentTheme('blue')}
              className={`w-4 h-4 rounded-full bg-blue-600 transition cursor-pointer ${accentTheme === 'blue' ? 'ring-2 ring-blue-300 ring-offset-1 scale-110' : 'opacity-60'}`}
              title="Màu xanh dương"
            />
            <button
              type="button"
              onClick={() => setAccentTheme('amber')}
              className={`w-4 h-4 rounded-full bg-amber-600 transition cursor-pointer ${accentTheme === 'amber' ? 'ring-2 ring-amber-300 ring-offset-1 scale-110' : 'opacity-60'}`}
              title="Màu cam hổ phách"
            />
          </div>
        </div>

        {/* Right: Template Presets & Clear */}
        <div className="flex items-center gap-2">
          {/* Quick presets */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-bold hidden md:inline">Mẫu giáo dục nhanh:</span>
            <button
              type="button"
              onClick={() => applyPresetTemplate('homeroom_weekly')}
              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition cursor-pointer"
              title="Nạp mẫu báo cáo tuần chủ nhiệm"
            >
              📋 Báo cáo tuần GVCN
            </button>
            <button
              type="button"
              onClick={() => applyPresetTemplate('academic_review')}
              className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-[11px] font-bold border border-indigo-200 transition cursor-pointer hidden sm:inline-flex"
              title="Nạp mẫu báo cáo chuyên môn"
            >
              📚 Chuyên môn tổ
            </button>
          </div>

          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
          >
            Làm lại từ đầu
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: TRÌNH THIẾT KẾ PHONG CÁCH GOOGLE FORMS (GOOGLE FORMS BUILDER) */}
      {/* ==================================================================== */}
      {previewTab === 'edit' && (
        <div className="space-y-4">
          
          {/* GOOGLE FORMS MAIN HEADER BANNER */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
            <div className={`h-2.5 w-full ${themeStyles.accentBar}`}></div>
            <div className="p-4 sm:p-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>Trình Thiết Kế Biểu Mẫu Trực Tuyến</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${themeStyles.badge}`}>
                    Google Forms Mode
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                  <span>{fields.length} câu hỏi</span>
                  <span>•</span>
                  <span>{tables.length} bảng số liệu</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Tạo và tùy biến mẫu báo cáo linh hoạt như Google Forms: hỗ trợ Trắc nghiệm, Hộp kiểm, Thang đo đánh giá 1-5, Ngày tháng, Ô nhập số, Tệp minh chứng và Bảng số liệu thống kê giáo dục.
              </p>
            </div>
          </div>

          {/* GOOGLE FORMS FLOATING ACTIONS BAR */}
          <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1 pr-1">
                + Thêm nhanh:
              </span>

              {/* Add Question Button */}
              <button
                type="button"
                onClick={() => handleInsertFieldAt(fields.length, 'textarea')}
                className={`px-3 py-1.5 rounded-xl ${themeStyles.btn} text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Câu Hỏi</span>
              </button>

              {/* Add Multiple Choice */}
              <button
                type="button"
                onClick={() => handleInsertFieldAt(fields.length, 'radio')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <CircleDot className="w-3.5 h-3.5 text-purple-600" />
                <span>Trắc nghiệm</span>
              </button>

              {/* Add Checkboxes */}
              <button
                type="button"
                onClick={() => handleInsertFieldAt(fields.length, 'checkbox')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hộp kiểm</span>
              </button>

              {/* Add Rating Scale */}
              <button
                type="button"
                onClick={() => handleInsertFieldAt(fields.length, 'scale')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer hidden sm:flex"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Thang đo 1-5</span>
              </button>

              {/* Add Section Header */}
              <button
                type="button"
                onClick={() => handleInsertFieldAt(fields.length, 'section')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                <span>Tiêu đề phần</span>
              </button>
            </div>

            {/* Add Table Button */}
            <button
              type="button"
              onClick={handleStartCreateTable}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <TableIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>+ Thêm Bảng Số Liệu</span>
            </button>
          </div>

          {/* LIST OF QUESTION CARDS (GOOGLE FORMS STYLE CARDS) */}
          <div className="space-y-3.5">
            {fields.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-700">Chưa có câu hỏi nào trong biểu mẫu</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Thầy/Cô có thể bấm <strong>"+ Thêm Câu Hỏi"</strong> ở trên, chọn một mẫu có sẵn hoặc tải tệp tài liệu để hệ thống tự động bóc tách.
                </p>
                <button
                  type="button"
                  onClick={() => handleInsertFieldAt(0, 'textarea')}
                  className={`px-4 py-2 rounded-xl ${themeStyles.btn} font-bold text-xs inline-flex items-center gap-1.5 shadow-xs cursor-pointer`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo Câu Hỏi Đầu Tiên</span>
                </button>
              </div>
            ) : (
              fields.map((field, index) => {
                const isActive = activeFieldId === field.id;
                const fieldTypeInfo = GOOGLE_FORM_FIELD_TYPES.find(t => t.type === field.type) || GOOGLE_FORM_FIELD_TYPES[0];
                const FieldIcon = fieldTypeInfo.icon;
                const isSection = field.type === 'section';

                // ==========================================================
                // SECTION CARD (TIÊU ĐỀ PHÂN ĐOẠN)
                // ==========================================================
                if (isSection) {
                  return (
                    <div
                      key={field.id || index}
                      onClick={() => setActiveFieldId(field.id)}
                      className={`bg-white rounded-2xl border transition-all p-4 space-y-3 cursor-pointer ${
                        isActive
                          ? `${themeStyles.borderActive} shadow-md`
                          : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                            <Bookmark className="w-4 h-4" />
                          </span>
                          <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                            Phân mục / Tiêu đề nhóm nội dung
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateField(index);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Nhân bản phân mục này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteField(index);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa phân mục này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isActive ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                            placeholder="Nhập tên phân mục (Ví dụ: PHẦN I: TÌNH HÌNH HỌC SINH VÀ NỀ NẾP)..."
                            className="w-full text-sm font-black p-2 rounded-xl border border-amber-300 bg-amber-50/50 text-slate-900 focus:outline-amber-600"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={field.description || ''}
                            onChange={(e) => handleUpdateField(index, { description: e.target.value })}
                            placeholder="Mô tả bổ sung về mục tiêu, yêu cầu của phần này (không bắt buộc)..."
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-700"
                          />
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-sm font-black text-slate-900">{field.label}</div>
                          {field.description && (
                            <div className="text-xs text-slate-500 italic">{field.description}</div>
                          )}
                        </div>
                      )}

                      {/* Section Card Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsertFieldAt(index + 1, 'textarea');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                          <span>+ Thêm câu hỏi vào phần này</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveField(index, 'up');
                            }}
                            disabled={index === 0}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveField(index, 'down');
                            }}
                            disabled={index === fields.length - 1}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // ==========================================================
                // QUESTION CARD (THẺ CÂU HỎI CHUẨN GOOGLE FORMS)
                // ==========================================================
                return (
                  <div
                    key={field.id || index}
                    onClick={() => setActiveFieldId(field.id)}
                    className={`bg-white rounded-2xl border transition-all duration-150 overflow-hidden relative cursor-pointer ${
                      isActive
                        ? `${themeStyles.borderActive} shadow-lg ring-1`
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Google Forms Left Accent Strip when active */}
                    {isActive && (
                      <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${themeStyles.accentBar}`}></div>
                    )}

                    <div className="p-4 sm:p-5 space-y-3.5 pl-5">
                      
                      {/* CARD TOP ROW: QUESTION TITLE + TYPE SELECTOR */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        {/* Question Title & Index */}
                        <div className="flex-1 min-w-0 flex items-start gap-2">
                          <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 mt-1">
                            {index + 1}
                          </span>

                          <div className="flex-1 min-w-0 space-y-1">
                            {isActive ? (
                              <textarea
                                rows={2}
                                value={field.label}
                                onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                                placeholder="Nhập câu hỏi hoặc nội dung yêu cầu tại đây..."
                                className="w-full text-sm font-bold p-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-400 bg-slate-50/60 focus:bg-white text-slate-900 transition"
                                autoFocus
                              />
                            ) : (
                              <div className="text-sm font-bold text-slate-900 leading-snug">
                                {field.label}
                                {field.required && <span className="text-rose-600 ml-1 font-black">*</span>}
                              </div>
                            )}

                            {/* Question Description / Subtitle (Google Forms style) */}
                            {isActive ? (
                              <input
                                type="text"
                                value={field.description || ''}
                                onChange={(e) => handleUpdateField(index, { description: e.target.value })}
                                placeholder="Ghi chú / Hướng dẫn điền câu hỏi này (nếu cần)..."
                                className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 placeholder:text-slate-400"
                              />
                            ) : field.description ? (
                              <div className="text-xs text-slate-500 italic">{field.description}</div>
                            ) : null}
                          </div>
                        </div>

                        {/* QUESTION TYPE SELECTOR (DROPDOWN) */}
                        <div className="relative shrink-0 self-start">
                          <div className="relative">
                            <select
                              value={field.type}
                              onChange={(e) => handleChangeFieldType(index, e.target.value as FormFieldType)}
                              className="text-xs font-bold pl-8 pr-7 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 shadow-2xs hover:border-slate-400 focus:outline-emerald-500 cursor-pointer appearance-none"
                            >
                              {GOOGLE_FORM_FIELD_TYPES.map((t) => (
                                <option key={t.type} value={t.type}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                            <FieldIcon className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* CARD BODY: SPECIFIC FIELD TYPE CONFIGURATION */}
                      <div className="pt-1">
                        {/* 1. SHORT ANSWER / TEXT */}
                        {field.type === 'text' && (
                          <div className="max-w-md">
                            <input
                              type="text"
                              disabled
                              placeholder={field.placeholder || "Văn bản câu trả lời ngắn..."}
                              className="w-full text-xs p-2 rounded-lg border-b border-dashed border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed"
                            />
                          </div>
                        )}

                        {/* 2. PARAGRAPH / TEXTAREA */}
                        {field.type === 'textarea' && (
                          <div>
                            <textarea
                              rows={2}
                              disabled
                              placeholder={field.placeholder || "Văn bản câu trả lời dài (đoạn văn nhiều dòng)..."}
                              className="w-full text-xs p-2.5 rounded-xl border-b border-dashed border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed"
                            />
                          </div>
                        )}

                        {/* 3. MULTIPLE CHOICE (RADIO) */}
                        {field.type === 'radio' && (
                          <div className="space-y-2">
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 text-xs">
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0"></div>
                                {isActive ? (
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleUpdateOption(index, optIdx, e.target.value)}
                                    placeholder={`Tùy chọn ${optIdx + 1}`}
                                    className="flex-1 min-w-0 p-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-emerald-500 bg-white"
                                  />
                                ) : (
                                  <span className="text-slate-700 font-medium">{opt}</span>
                                )}

                                {isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(index, optIdx)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="Xóa lựa chọn này"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {/* Allow Other option checkbox */}
                            {isActive && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(index)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Thêm tùy chọn</span>
                                </button>
                                <span className="text-slate-300">hoặc</span>
                                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(field.allowOther)}
                                    onChange={(e) => handleUpdateField(index, { allowOther: e.target.checked })}
                                    className="rounded text-emerald-600"
                                  />
                                  <span>Thêm tùy chọn "Mục khác..."</span>
                                </label>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. CHECKBOXES */}
                        {field.type === 'checkbox' && (
                          <div className="space-y-2">
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 text-xs">
                                <div className="w-4 h-4 rounded-md border-2 border-slate-300 shrink-0"></div>
                                {isActive ? (
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleUpdateOption(index, optIdx, e.target.value)}
                                    placeholder={`Tùy chọn ${optIdx + 1}`}
                                    className="flex-1 min-w-0 p-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-emerald-500 bg-white"
                                  />
                                ) : (
                                  <span className="text-slate-700 font-medium">{opt}</span>
                                )}

                                {isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(index, optIdx)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="Xóa lựa chọn này"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {isActive && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddOption(index)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Thêm tùy chọn</span>
                                </button>
                                <span className="text-slate-300">hoặc</span>
                                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(field.allowOther)}
                                    onChange={(e) => handleUpdateField(index, { allowOther: e.target.checked })}
                                    className="rounded text-emerald-600"
                                  />
                                  <span>Thêm tùy chọn "Mục khác..."</span>
                                </label>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 5. DROPDOWN */}
                        {field.type === 'dropdown' && (
                          <div className="space-y-2">
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 text-xs">
                                <span className="w-4 text-center font-bold text-slate-400">{optIdx + 1}.</span>
                                {isActive ? (
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleUpdateOption(index, optIdx, e.target.value)}
                                    placeholder={`Mục ${optIdx + 1}`}
                                    className="flex-1 min-w-0 p-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800 focus:outline-emerald-500 bg-white"
                                  />
                                ) : (
                                  <span className="text-slate-700 font-medium">{opt}</span>
                                )}

                                {isActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOption(index, optIdx)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                    title="Xóa lựa chọn này"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}

                            {isActive && (
                              <button
                                type="button"
                                onClick={() => handleAddOption(index)}
                                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 pt-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm lựa chọn menu</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* 6. LINEAR SCALE (1-5 OR 1-10) */}
                        {field.type === 'scale' && (
                          <div className="space-y-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
                            {isActive ? (
                              <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700">Thang điểm:</span>
                                  <select
                                    value={field.scaleMin || 1}
                                    onChange={(e) => handleUpdateField(index, { scaleMin: Number(e.target.value) })}
                                    className="p-1 rounded border border-slate-300 bg-white"
                                  >
                                    <option value={1}>1</option>
                                    <option value={0}>0</option>
                                  </select>
                                  <span>đến</span>
                                  <select
                                    value={field.scaleMax || 5}
                                    onChange={(e) => handleUpdateField(index, { scaleMax: Number(e.target.value) })}
                                    className="p-1 rounded border border-slate-300 bg-white font-bold"
                                  >
                                    <option value={5}>5 (Mức 1 đến 5)</option>
                                    <option value={10}>10 (Thang điểm 10)</option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                  <div>
                                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                                      Nhãn mức thấp nhất ({field.scaleMin || 1}):
                                    </label>
                                    <input
                                      type="text"
                                      value={field.scaleMinLabel || ''}
                                      onChange={(e) => handleUpdateField(index, { scaleMinLabel: e.target.value })}
                                      placeholder="Ví dụ: Chưa đạt / Kém"
                                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">
                                      Nhãn mức cao nhất ({field.scaleMax || 5}):
                                    </label>
                                    <input
                                      type="text"
                                      value={field.scaleMaxLabel || ''}
                                      onChange={(e) => handleUpdateField(index, { scaleMaxLabel: e.target.value })}
                                      placeholder="Ví dụ: Rất tốt / Xuất sắc"
                                      className="w-full p-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>{field.scaleMinLabel || '1'}</span>
                                <div className="flex items-center gap-1.5">
                                  {Array.from({ length: (field.scaleMax || 5) - (field.scaleMin || 1) + 1 }).map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center font-bold text-[11px] bg-white">
                                      {(field.scaleMin || 1) + i}
                                    </div>
                                  ))}
                                </div>
                                <span>{field.scaleMaxLabel || (field.scaleMax || 5)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 7. NUMBER */}
                        {field.type === 'number' && (
                          <div className="max-w-xs">
                            <input
                              type="number"
                              disabled
                              placeholder={field.placeholder || "Nhập số liệu (sĩ số, tỷ lệ, số lượng)..."}
                              className="w-full text-xs p-2 rounded-lg border-b border-dashed border-slate-300 bg-slate-50 text-slate-400 cursor-not-allowed"
                            />
                          </div>
                        )}

                        {/* 8. DATE & TIME */}
                        {(field.type === 'date' || field.type === 'time') && (
                          <div className="max-w-xs flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-2 rounded-lg border-b border-dashed border-slate-300">
                            {field.type === 'date' ? <Calendar className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            <span>{field.type === 'date' ? 'Ngày, tháng, năm' : 'Giờ : Phút'}</span>
                          </div>
                        )}

                        {/* 9. FILE UPLOAD */}
                        {field.type === 'file' && (
                          <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center gap-2 text-xs text-slate-500">
                            <UploadCloud className="w-4 h-4 text-slate-400" />
                            <span>Giáo viên sẽ bấm tải lên tệp minh chứng (PDF, Word, Ảnh...)</span>
                          </div>
                        )}
                      </div>

                      {/* CARD FOOTER: ACTIONS (DUPLICATE, DELETE, REQUIRED SWITCH, INSERT ROW) */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        {/* Insert row beneath button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInsertFieldAt(index + 1, 'textarea');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-emerald-200 shadow-2xs"
                          title={`Chèn thêm câu hỏi mới ngay dưới câu hỏi ${index + 1}`}
                        >
                          <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                          <span>+ Chèn dòng bên dưới</span>
                        </button>

                        {/* Center/Right controls */}
                        <div className="flex items-center gap-2.5">
                          {/* Duplicate Button (Signature of Google Forms) */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateField(index);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                            title="Nhân bản câu hỏi này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Nhân bản</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteField(index);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Divider */}
                          <div className="h-5 w-px bg-slate-200"></div>

                          {/* Required Switch (Google Forms style) */}
                          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                            <span>Bắt buộc</span>
                            <div className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(field.required)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleUpdateField(index, { required: e.target.checked });
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:left-[0px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                            </div>
                          </label>

                          {/* Move Up / Down Buttons */}
                          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(index, 'up');
                              }}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                              title="Di chuyển lên trên"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveField(index, 'down');
                              }}
                              disabled={index === fields.length - 1}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                              title="Di chuyển xuống dưới"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ================================================================ */}
          {/* SECTION 2: DYNAMIC DATA TABLES (BẢNG SỐ LIỆU THỐNG KÊ ĐỘNG)        */}
          {/* ================================================================ */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span>Bảng Số Liệu Thống Kê ({tables.length} bảng):</span>
              </div>

              <button
                type="button"
                onClick={handleStartCreateTable}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm Bảng Mới Theo Ý Muốn</span>
              </button>
            </div>

            {/* CREATE / EDIT TABLE FORM */}
            {(isCreatingTable || editingTableIndex !== null) && (
              <div className="p-4 rounded-2xl bg-blue-50/90 border-2 border-blue-400 shadow-md space-y-3.5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                  <div className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                    <TableIcon className="w-4 h-4 text-blue-700" />
                    <span>{isCreatingTable ? 'Thiết Kế Bảng Mới' : `Chỉnh Sửa Bảng: ${tableFormTitle}`}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingTable(false);
                      setEditingTableIndex(null);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-blue-950 mb-1">
                    Tiêu đề / Tên bảng số liệu:
                  </label>
                  <input
                    type="text"
                    value={tableFormTitle}
                    onChange={(e) => setTableFormTitle(e.target.value)}
                    placeholder="Ví dụ: Bảng 1. Thống kê sĩ số học sinh và tỷ lệ chuyên cần..."
                    className="w-full text-xs p-2.5 rounded-xl border border-blue-300 bg-white font-bold text-slate-900 focus:outline-blue-600"
                  />
                </div>

                {/* Column Management */}
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
                          onChange={(e) => {
                            const updated = [...tableFormHeaders];
                            updated[colIdx] = e.target.value;
                            setTableFormHeaders(updated);
                          }}
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

                  {/* Add Column Input */}
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
                      placeholder="Gõ tên cột cần thêm (Ví dụ: Số lượng, Tỷ lệ, Xếp loại, Ghi chú...)"
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

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreatingTable(false);
                      setEditingTableIndex(null);
                    }}
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
                    <span>Lưu Bảng</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIST OF TABLES */}
            {tables.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Chưa có bảng số liệu nào. Nếu biểu mẫu cần thống kê nhiều hàng và cột, hãy bấm nút <strong>"+ Thêm Bảng Mới"</strong>.
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
      {/* TAB 2: XEM THỰC TẾ & ĐIỀN THỬ TRỰC TIẾP NHƯ TRÊN GOOGLE FORMS        */}
      {/* ==================================================================== */}
      {previewTab === 'render' && (
        <div className="bg-slate-100/80 p-4 sm:p-6 rounded-2xl border border-slate-200 max-h-[520px] overflow-y-auto space-y-4 animate-in fade-in">
          
          {/* Form Banner Header */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className={`h-3 w-full ${themeStyles.accentBar}`}></div>
            <div className="p-4 sm:p-6 space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Biểu Mẫu Báo Cáo Điện Tử
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Vui lòng trả lời đầy đủ các câu hỏi có đánh dấu sao đỏ (<span className="text-rose-600 font-bold">*</span>) trước khi nộp báo cáo.
              </p>
            </div>
          </div>

          {/* Form Fields Rendering */}
          <div className="space-y-4">
            {fields.map((f, i) => {
              // Section Header Card
              if (f.type === 'section') {
                return (
                  <div key={f.id || i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm border-l-4 border-l-amber-500 space-y-1">
                    <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase">
                      {f.label}
                    </h2>
                    {f.description && (
                      <p className="text-xs text-slate-600">{f.description}</p>
                    )}
                  </div>
                );
              }

              // Question Card
              return (
                <div key={f.id || i} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-900 flex items-start gap-1.5 leading-snug">
                      <span>{f.label}</span>
                      {f.required && <span className="text-rose-600 font-black">*</span>}
                    </label>
                    {f.description && (
                      <div className="text-xs text-slate-500">{f.description}</div>
                    )}
                  </div>

                  {/* FIELD INPUT CONTROLS */}
                  <div className="pt-1">
                    {/* Short text */}
                    {f.type === 'text' && (
                      <input
                        type="text"
                        placeholder="Câu trả lời của bạn..."
                        value={mockResponses[f.id] || ''}
                        onChange={(e) => setMockResponses({ ...mockResponses, [f.id]: e.target.value })}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-500 bg-white"
                      />
                    )}

                    {/* Paragraph */}
                    {f.type === 'textarea' && (
                      <textarea
                        rows={3}
                        placeholder="Câu trả lời của bạn..."
                        value={mockResponses[f.id] || ''}
                        onChange={(e) => setMockResponses({ ...mockResponses, [f.id]: e.target.value })}
                        className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-500 bg-white"
                      />
                    )}

                    {/* Radio (Multiple choice) */}
                    {f.type === 'radio' && (
                      <div className="space-y-2">
                        {(f.options || []).map((opt, optIdx) => (
                          <label key={optIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-800 cursor-pointer">
                            <input
                              type="radio"
                              name={f.id}
                              checked={mockResponses[f.id] === opt}
                              onChange={() => setMockResponses({ ...mockResponses, [f.id]: opt })}
                              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                        {f.allowOther && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm pt-1">
                            <input
                              type="radio"
                              name={f.id}
                              checked={Boolean(mockResponses[f.id]?.startsWith('Khác:'))}
                              onChange={() => setMockResponses({ ...mockResponses, [f.id]: 'Khác: ' })}
                              className="w-4 h-4 text-emerald-600 cursor-pointer"
                            />
                            <span className="text-slate-700">Mục khác:</span>
                            <input
                              type="text"
                              placeholder="Nhập ý kiến khác..."
                              className="flex-1 p-1 rounded border border-slate-300 text-xs"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Checkbox */}
                    {f.type === 'checkbox' && (
                      <div className="space-y-2">
                        {(f.options || []).map((opt, optIdx) => {
                          const currentSelected: string[] = Array.isArray(mockResponses[f.id]) ? mockResponses[f.id] : [];
                          const isChecked = currentSelected.includes(opt);
                          return (
                            <label key={optIdx} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...currentSelected, opt]
                                    : currentSelected.filter(x => x !== opt);
                                  setMockResponses({ ...mockResponses, [f.id]: next });
                                }}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Dropdown */}
                    {f.type === 'dropdown' && (
                      <select
                        value={mockResponses[f.id] || ''}
                        onChange={(e) => setMockResponses({ ...mockResponses, [f.id]: e.target.value })}
                        className="w-full sm:w-72 text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white cursor-pointer"
                      >
                        <option value="">-- Chọn phương án --</option>
                        {(f.options || []).map((opt, optIdx) => (
                          <option key={optIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}

                    {/* Linear Scale (1-5 or 1-10) */}
                    {f.type === 'scale' && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
                          <span>{f.scaleMinLabel || '1'}</span>
                          <span>{f.scaleMaxLabel || (f.scaleMax || 5)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          {Array.from({ length: (f.scaleMax || 5) - (f.scaleMin || 1) + 1 }).map((_, scaleIdx) => {
                            const val = (f.scaleMin || 1) + scaleIdx;
                            const isSelected = mockResponses[f.id] === val;
                            return (
                              <button
                                key={scaleIdx}
                                type="button"
                                onClick={() => setMockResponses({ ...mockResponses, [f.id]: val })}
                                className={`w-8 h-8 rounded-full font-bold text-xs transition cursor-pointer flex items-center justify-center ${
                                  isSelected
                                    ? `${themeStyles.btn} shadow-sm scale-110`
                                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Number */}
                    {f.type === 'number' && (
                      <input
                        type="number"
                        placeholder="Nhập số..."
                        value={mockResponses[f.id] || ''}
                        onChange={(e) => setMockResponses({ ...mockResponses, [f.id]: e.target.value })}
                        className="w-48 text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white"
                      />
                    )}

                    {/* Date */}
                    {f.type === 'date' && (
                      <input
                        type="date"
                        value={mockResponses[f.id] || ''}
                        onChange={(e) => setMockResponses({ ...mockResponses, [f.id]: e.target.value })}
                        className="w-48 text-xs sm:text-sm p-2 rounded-xl border border-slate-300 bg-white cursor-pointer"
                      />
                    )}

                    {/* Time */}
                    {f.type === 'time' && (
                      <input
                        type="time"
                        value={mockResponses[f.id] || ''}
                        onChange={(e) => setMockResponses({ ...mockResponses, [f.id]: e.target.value })}
                        className="w-36 text-xs sm:text-sm p-2 rounded-xl border border-slate-300 bg-white cursor-pointer"
                      />
                    )}

                    {/* File upload */}
                    {f.type === 'file' && (
                      <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-white text-center space-y-1">
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto" />
                        <div className="text-xs font-bold text-slate-700">Tải lên tệp minh chứng</div>
                        <div className="text-[11px] text-slate-400">PDF, Word, Excel, Hình ảnh (Tối đa 25MB)</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Dynamic Tables rendering */}
            {tables.map((tbl, i) => (
              <div key={tbl.id || i} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
                <div className="text-sm font-bold text-blue-900 flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-blue-700" />
                  <span>{tbl.title}</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        {tbl.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-2.5 border-b border-slate-200 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-slate-400 italic">
                        <td colSpan={tbl.headers.length} className="p-4 text-center bg-slate-50/50">
                          (Giáo viên bấm "+ Thêm dòng" để nhập dữ liệu trực tiếp vào bảng số liệu này)
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
