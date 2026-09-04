import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { 
  UploadCloud, 
  FileText, 
  FileCode, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Table as TableIcon, 
  RefreshCw,
  Eye,
  Plus,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { extractTextFromFile, parseFormContent, parseTemplateFile, ParsedTemplateResult } from '../../utils/formFileParser';
import { CustomFormField, CustomDynamicTable, ReportPeriod, TargetAudienceType } from '../../types';

interface ImportFormFromDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyParsedForm: (parsed: ParsedTemplateResult) => void;
  onCreatePeriodFromParsed?: (parsed: ParsedTemplateResult, extra: {
    deadline: string;
    academicYear: string;
    semester: 'HK1' | 'HK2' | 'Ca_Nam';
    targetAudience: TargetAudienceType;
  }) => void;
  mode?: 'fill_submission' | 'create_period';
}

export const ImportFormFromDocModal: React.FC<ImportFormFromDocModalProps> = ({
  isOpen,
  onClose,
  onApplyParsedForm,
  onCreatePeriodFromParsed,
  mode = 'fill_submission'
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedTemplateResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [manualText, setManualText] = useState('');
  const [inputTab, setInputTab] = useState<'upload' | 'paste'>('upload');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Period Creation additional config
  const [deadline, setDeadline] = useState(() => {
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return nextWeek.toISOString().slice(0, 16);
  });
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [semester, setSemester] = useState<'HK1' | 'HK2' | 'Ca_Nam'>('HK1');
  const [targetAudience, setTargetAudience] = useState<TargetAudienceType>('all');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = async (file: File) => {
    setIsParsing(true);
    setErrorMsg(null);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const result = await parseTemplateFile(file);
      setParsedResult(result);
      if (result.recommendedAudience) {
        setTargetAudience(result.recommendedAudience);
      }
    } catch (err: any) {
      console.error('Error parsing form file:', err);
      setErrorMsg(err.message || 'Lỗi khi đọc file. Vui lòng thử lại với file .docx, .txt hoặc dán nội dung.');
      setParsedResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleProcessManualText = () => {
    if (!manualText.trim()) {
      setErrorMsg('Vui lòng dán nội dung văn bản hoặc Markdown vào khung!');
      return;
    }
    setIsParsing(true);
    setErrorMsg(null);
    try {
      const result = parseFormContent(manualText, 'Bieu_mau_soan_thao.txt');
      setParsedResult(result);
      if (result.recommendedAudience) {
        setTargetAudience(result.recommendedAudience);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể nhận diện biểu mẫu từ văn bản đã nhập.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirm = () => {
    if (!parsedResult) return;

    if (mode === 'create_period' && onCreatePeriodFromParsed) {
      onCreatePeriodFromParsed(parsedResult, {
        deadline: new Date(deadline).toISOString(),
        academicYear,
        semester,
        targetAudience
      });
    } else {
      onApplyParsedForm(parsedResult);
    }
    onClose();
  };

  const handleReset = () => {
    setParsedResult(null);
    setFileName(null);
    setFileSize(null);
    setManualText('');
    setErrorMsg(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Biểu Mẫu Chuẩn Từ Tệp Đính Kèm (.TXT / .DOCX / .MD)"
      subtitle="Hệ thống tự động phân tích và tạo Form nhập liệu & Bảng số liệu chuẩn hóa trên Web"
      maxWidth="3xl"
    >
      <div className="space-y-4">
        
        {/* Helper Instructions Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 text-xs text-slate-700 space-y-1">
          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Tính năng Tạo Form Chuẩn Hóa Thông Minh (Smart Form Generator)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">
            Thầy/Cô chỉ cần tải lên file biểu mẫu (<strong>.docx</strong> Word, <strong>.txt</strong> văn bản, hoặc <strong>.md</strong> Markdown). Hệ thống sẽ tự động bóc tách các mục câu hỏi, chỉ tiêu số lượng, ô nhận xét và bảng số liệu thành <strong>giao diện biểu mẫu Web trực quan</strong>.
          </p>
        </div>

        {/* State 1: Upload or Paste File */}
        {!parsedResult && (
          <div className="space-y-3">
            
            {/* Tab switch */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setInputTab('upload')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  inputTab === 'upload' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>1. Tải Lên Tệp Tin (.docx, .txt, .md)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputTab('paste')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  inputTab === 'paste' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>2. Dán Nội Dung Văn Bản Trực Tiếp</span>
              </button>
            </div>

            {inputTab === 'upload' ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleProcessFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragOver ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".docx,.doc,.txt,.md,.markdown,.json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessFile(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  {isParsing ? (
                    <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {isParsing ? 'Đang đọc và phân tích cấu trúc tệp...' : 'Kéo thả hoặc bấm để chọn tệp biểu mẫu'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Hỗ trợ định dạng: <strong>.DOCX (Word)</strong>, <strong>.TXT (Text)</strong>, <strong>.MD (Markdown)</strong>
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Dán nội dung văn bản / markdown biểu mẫu vào đây:
                </label>
                <textarea
                  rows={8}
                  placeholder={`Ví dụ:\nBÁO CÁO TỔNG KẾT THÁNG 9\n1. Sĩ số học sinh: ....\n2. Đánh giá nề nếp và học tập:\n3. Bảng tổng hợp học sinh giỏi:\n| STT | Họ và tên | Lớp | Thành tích |`}
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  className="w-full text-xs p-3 rounded-2xl border border-slate-300 font-mono bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleProcessManualText}
                  disabled={isParsing || !manualText.trim()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Phân Tích & Tạo Form Web Chuẩn</span>
                </button>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* State 2: Preview & Confirm Parsed Form */}
        {parsedResult && (
          <div className="space-y-4 animate-in fade-in">
            
            {/* Header summary */}
            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Đã nhận diện thành công
                </span>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Tải tệp khác
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Tiêu đề biểu mẫu nhận diện:</label>
                <input
                  type="text"
                  value={parsedResult.title}
                  onChange={(e) => setParsedResult({ ...parsedResult, title: e.target.value })}
                  className="w-full text-sm font-bold text-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <Layers className="w-3.5 h-3.5" />
                  {parsedResult.fields.length} trường dữ liệu
                </span>
                <span className="flex items-center gap-1 font-semibold text-blue-700">
                  <TableIcon className="w-3.5 h-3.5" />
                  {parsedResult.tables.length} bảng số liệu
                </span>
                {fileName && (
                  <span className="text-slate-400 text-[11px]">
                    Nguồn: {fileName}
                  </span>
                )}
              </div>
            </div>

            {/* Mode-specific configurations (If creating a period) */}
            {mode === 'create_period' && (
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                <h5 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Cấu hình ban hành Đợt Báo Cáo theo Form này:</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Hạn nộp chót (Deadline) *
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Đối tượng thực hiện
                    </label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold"
                    >
                      <option value="all">Toàn trường (120 Cán bộ - GV - NV)</option>
                      <option value="homeroom_teachers">Chỉ 53 GV Chủ Nhiệm</option>
                      <option value="dept_heads_only">Chỉ Tổ trưởng & Tổ phó</option>
                      <option value="teachers_only">Giáo viên giảng dạy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Học kỳ
                    </label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value as any)}
                      className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="HK1">Học kỳ I</option>
                      <option value="HK2">Học kỳ II</option>
                      <option value="Ca_Nam">Cả Năm</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Preview of Fields and Tables */}
            <div className="max-h-72 overflow-y-auto space-y-3 p-1">
              
              {/* Fields List */}
              {parsedResult.fields.length > 0 && (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                  <h6 className="text-xs font-bold text-slate-800">
                    Danh sách các trường nhập liệu tự động ({parsedResult.fields.length}):
                  </h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parsedResult.fields.map((f, idx) => (
                      <div key={f.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-2">
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">{f.label}</span>
                          <span className="text-[10px] text-slate-400">
                            Loại: {f.type === 'textarea' ? 'Văn bản dài' : f.type === 'number' ? 'Số liệu' : f.type === 'checkbox' ? 'Hộp kiểm' : 'Văn bản ngắn'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tables List */}
              {parsedResult.tables.length > 0 && (
                <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-200 space-y-2">
                  <h6 className="text-xs font-bold text-blue-900">
                    Bảng số liệu cấu trúc ({parsedResult.tables.length}):
                  </h6>
                  {parsedResult.tables.map((t, idx) => (
                    <div key={t.id || idx} className="bg-white p-3 rounded-xl border border-blue-100 text-xs space-y-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <TableIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>{t.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.headers.map((h, hIdx) => (
                          <span key={hIdx} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-semibold">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Chọn tệp khác
              </button>
              
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{mode === 'create_period' ? 'Ban Hành Đợt Báo Cáo Theo Form Này' : 'Áp Dụng Form Này Vào Báo Cáo Của Tôi'}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </Modal>
  );
};
