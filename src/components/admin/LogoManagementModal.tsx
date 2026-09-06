import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  RotateCcw, 
  Check, 
  X, 
  Eye, 
  Sparkles, 
  School, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Layers,
  FileImage,
  ArrowRight
} from 'lucide-react';

// Preset high-quality SVG emblems specifically designed for THCS & THPT Đốc Binh Kiều
const PRESET_EMBLEMS = [
  {
    id: 'lotus_torch',
    name: 'Hoa Sen Đồng Tháp & Ngọn Đuốc Tri Thức',
    description: 'Biểu trưng hoa sen hồng Tháp Mười bao bọc ngọn đuốc sáng và trang sách',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23059669"/><stop offset="100%" stop-color="%230d9488"/></linearGradient><linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fbbf24"/><stop offset="100%" stop-color="%23f59e0b"/></linearGradient></defs><circle cx="100" cy="100" r="94" fill="%23ffffff" stroke="url(%23g1)" stroke-width="8"/><circle cx="100" cy="100" r="82" fill="none" stroke="%23d1fae5" stroke-width="2" stroke-dasharray="4 2"/><path d="M100 22 L105 35 L118 35 L108 43 L112 56 L100 48 L88 56 L92 43 L82 35 L95 35 Z" fill="url(%23gold)"/><path d="M60 145 C60 115 100 100 100 100 C100 100 140 115 140 145 C125 152 75 152 60 145 Z" fill="%23ec4899" opacity="0.9"/><path d="M72 145 C72 122 100 110 100 110 C100 110 128 122 128 145 Z" fill="%23f472b6"/><path d="M100 65 L95 95 L105 95 Z" fill="url(%23gold)"/><path d="M100 50 C108 62 106 72 100 82 C94 72 92 62 100 50 Z" fill="%23ef4444"/><path d="M50 135 Q100 115 100 148 Q100 115 150 135 Q100 162 50 135 Z" fill="%23047857"/><path d="M65 142 Q100 126 100 148 Q100 126 135 142 Q100 156 65 142 Z" fill="%23ffffff"/><text x="100" y="172" font-size="11" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="%23065f46" letter-spacing="1">ĐỐC BINH KIỀU</text><text x="100" y="184" font-size="7.5" font-weight="700" font-family="sans-serif" text-anchor="middle" fill="%23047857">ĐỒNG THÁP • 2026</text></svg>`
  },
  {
    id: 'academic_shield',
    name: 'Khiên Học Thuật Xanh Ngọc',
    description: 'Huy hiệu khiên học thuật truyền thống với cành nguyệt quế và ngôi sao vàng',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="shieldBg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="%23047857"/><stop offset="100%" stop-color="%23064e3b"/></linearGradient><linearGradient id="goldS" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23fde047"/><stop offset="100%" stop-color="%23d97706"/></linearGradient></defs><path d="M100 18 L165 36 C165 110 135 155 100 182 C65 155 35 110 35 36 Z" fill="url(%23shieldBg)" stroke="url(%23goldS)" stroke-width="6"/><path d="M100 28 L155 42 C155 105 130 145 100 168 C70 145 45 105 45 42 Z" fill="none" stroke="%2334d399" stroke-width="1.5" stroke-dasharray="3 2"/><polygon points="100,45 105,58 119,58 108,67 112,80 100,72 88,80 92,67 81,58 95,58" fill="url(%23goldS)"/><path d="M60 108 Q100 95 100 120 Q100 95 140 108 Q100 125 60 108 Z" fill="%23ffffff"/><line x1="100" y1="96" x2="100" y2="122" stroke="%23047857" stroke-width="2"/><text x="100" y="142" font-size="13" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="url(%23goldS)" letter-spacing="2">DBK</text><text x="100" y="156" font-size="8" font-weight="700" font-family="sans-serif" text-anchor="middle" fill="%23a7f3d0">THCS &amp; THPT</text></svg>`
  },
  {
    id: 'modern_crest',
    name: 'Biểu Trưng DBK Hiện Đại & Tinh Gọn',
    description: 'Phong cách tối giản, hiện đại với chữ DBK lồng ghép hoa văn giáo dục',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="circleGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%2310b981"/><stop offset="50%" stop-color="%23059669"/><stop offset="100%" stop-color="%230f766e"/></linearGradient></defs><circle cx="100" cy="100" r="90" fill="url(%23circleGrad)"/><circle cx="100" cy="100" r="82" fill="%23ffffff"/><circle cx="100" cy="100" r="74" fill="%23f0fdf4"/><path d="M70 125 L70 75 L88 75 C98 75 104 80 104 88 C104 94 99 98 92 99 C100 101 106 106 106 113 C106 121 99 125 88 125 Z M82 85 L82 95 L87 95 C91 95 94 93 94 90 C94 87 91 85 87 85 Z M82 103 L82 115 L88 115 C93 115 96 113 96 109 C96 105 93 103 88 103 Z" fill="%23047857"/><path d="M112 75 L124 75 L124 100 L138 75 L151 75 L133 101 L152 125 L138 125 L124 104 L124 125 L112 125 Z" fill="%230f766e"/><circle cx="100" cy="50" r="5" fill="%23f59e0b"/><text x="100" y="152" font-size="8.5" font-weight="800" font-family="sans-serif" text-anchor="middle" fill="%23065f46" letter-spacing="1.5">ĐỐC BINH KIỀU</text><text x="100" y="163" font-size="6.5" font-weight="600" font-family="sans-serif" text-anchor="middle" fill="%23059669">TIÊN HỌC LỄ • HẬU HỌC VĂN</text></svg>`
  },
  {
    id: 'classic_education',
    name: 'Biểu Trưng Sư Phạm Truyền Thống',
    description: 'Biểu tượng trang sách mở, bút lông và vòng nguyệt quế vinh quang',
    svgDataUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="bgC" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e3a8a"/><stop offset="100%" stop-color="%230f766e"/></linearGradient></defs><circle cx="100" cy="100" r="92" fill="url(%23bgC)"/><circle cx="100" cy="100" r="84" fill="%23ffffff"/><circle cx="100" cy="100" r="76" fill="%23ecfdf5"/><path d="M60 115 C75 105 98 110 100 120 C102 110 125 105 140 115 L140 85 C125 75 102 80 100 90 C98 80 75 75 60 85 Z" fill="%23059669"/><path d="M65 110 C78 102 98 107 100 115 C102 107 122 102 135 110 L135 88 C122 80 102 85 100 93 C98 85 78 80 65 88 Z" fill="%23ffffff"/><path d="M98 52 L102 52 L104 88 L100 92 L96 88 Z" fill="%23d97706"/><circle cx="100" cy="46" r="6" fill="%23ef4444"/><text x="100" y="145" font-size="10" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="%23047857" letter-spacing="1">TRƯỜNG THCS &amp; THPT</text><text x="100" y="160" font-size="12" font-weight="900" font-family="sans-serif" text-anchor="middle" fill="%23064e3b" letter-spacing="1">ĐỐC BINH KIỀU</text></svg>`
  }
];

interface LogoManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogoManagementModal: React.FC<LogoManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isAdmin, currentUser } = useAuth();
  const { schoolInfo, updateSchoolLogo, removeSchoolLogo } = useReports();

  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [previewLogo, setPreviewLogo] = useState<string>(schoolInfo.logoUrl || '');
  const [urlInput, setUrlInput] = useState('');
  const [urlStatus, setUrlStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPreviewLogo(schoolInfo.logoUrl || '');
      setUrlInput(schoolInfo.logoUrl && !schoolInfo.logoUrl.startsWith('data:') ? schoolInfo.logoUrl : '');
      setUrlStatus('idle');
      setSavedSuccess(false);
      setCompressionInfo(null);
    }
  }, [isOpen, schoolInfo.logoUrl]);

  // Handle client-side image compression & optimization to base64 Data URL
  const processImageFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn một tệp hình ảnh hợp lệ (PNG, JPG, SVG, WebP)!');
      return;
    }

    const originalSizeKb = Math.round(file.size / 1024);

    // If SVG, read text directly for ultra sharpness
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setPreviewLogo(result);
          setCompressionInfo(`Định dạng vector SVG nguyên gốc (${originalSizeKb} KB) - Hiển thị sắc nét không vỡ nét.`);
          setSavedSuccess(false);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // For raster images (PNG, JPG, WebP), compress on canvas to max 480x480
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setPreviewLogo(img.src);
          return;
        }

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as optimized PNG
        const optimizedDataUrl = canvas.toDataURL('image/png', 0.92);
        const optimizedSizeKb = Math.round(optimizedDataUrl.length * 0.75 / 1024);

        setPreviewLogo(optimizedDataUrl);
        setCompressionInfo(`Đã nén tối ưu: ${originalSizeKb} KB ➔ ${optimizedSizeKb} KB (${width}x${height}px) - Tốc độ tải tức thì.`);
        setSavedSuccess(false);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleTestUrl = () => {
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      setUrlStatus('invalid');
      return;
    }

    setUrlStatus('testing');
    const testImg = new Image();
    testImg.onload = () => {
      setUrlStatus('valid');
      setPreviewLogo(cleanUrl);
      setCompressionInfo(`Liên kết ảnh trực tiếp hợp lệ: ${testImg.width}x${testImg.height}px.`);
      setSavedSuccess(false);
    };
    testImg.onerror = () => {
      setUrlStatus('invalid');
    };
    testImg.src = cleanUrl;
  };

  const handleSelectPreset = (preset: typeof PRESET_EMBLEMS[0]) => {
    setPreviewLogo(preset.svgDataUrl);
    setCompressionInfo(`Đã chọn: ${preset.name} (Vector SVG chuẩn, hiển thị cực đẹp).`);
    setSavedSuccess(false);
  };

  const handleSaveLogo = async () => {
    if (!isAdmin) {
      alert('Chỉ tài khoản Quản trị viên (Admin) mới có quyền đổi logo nhà trường.');
      return;
    }

    setIsSaving(true);
    try {
      if (previewLogo) {
        updateSchoolLogo(previewLogo);
      } else {
        removeSchoolLogo();
      }
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 3500);
    } catch (e) {
      alert('Có lỗi xảy ra khi lưu logo: ' + String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    if (confirm('Bạn có muốn xóa logo tùy chỉnh và quay lại biểu trưng mặc định của nhà trường không?')) {
      setPreviewLogo('');
      setUrlInput('');
      setCompressionInfo(null);
      setSavedSuccess(false);
      removeSchoolLogo();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/30 shadow-xs">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Quản Lý &amp; Sửa Logo Nhà Trường
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-emerald-950 uppercase tracking-wide">
                  Chỉ Dành Cho Quản Trị Viên
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium">
                Logo sau khi đổi sẽ được lưu vĩnh viễn trên hệ thống và tự động cập nhật trên mọi màn hình
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Restriction Notice if not Admin */}
        {!isAdmin && (
          <div className="p-6 bg-rose-50 border-b border-rose-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-extrabold text-rose-900">
              Quyền Truy Cập Bị Giới Hạn
            </h3>
            <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto">
              Chỉ tài khoản Quản trị viên (Admin - ví dụ: Thầy Nguyễn Minh Trí) mới có quyền chỉnh sửa biểu trưng Logo của nhà trường. Tài khoản giáo viên không được phép thực hiện chức năng này.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
            >
              Đóng lại
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="p-5 sm:p-6 space-y-6">
            
            {/* Success alert banner */}
            {savedSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center justify-between text-xs text-emerald-900 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold">Đã lưu logo nhà trường thành công!</span> Logo đã được đồng bộ vào cơ sở dữ liệu và lưu cố định trên trình duyệt.
                  </div>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                  Đã áp dụng
                </span>
              </div>
            )}

            {/* Main Grid: Upload/Input Options + Live Real-time Previews */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column (Input methods - 7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Mode Tabs */}
                <div className="flex items-center p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      activeTab === 'upload' 
                        ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200' 
                        : 'hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải Ảnh Từ Máy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('url')}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      activeTab === 'url' 
                        ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200' 
                        : 'hover:text-slate-900'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    <span>Link Ảnh Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('presets')}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      activeTab === 'presets' 
                        ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200' 
                        : 'hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Huy Hiệu Mẫu Chuẩn</span>
                  </button>
                </div>

                {/* Tab 1: File Upload & Drag & Drop */}
                {activeTab === 'upload' && (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                        isDragOver 
                          ? 'border-emerald-500 bg-emerald-50/50 ring-4 ring-emerald-100' 
                          : 'border-slate-300 hover:border-emerald-500 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                          Nhấn để chọn ảnh hoặc Kéo &amp; Thả tệp ảnh vào đây
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Hỗ trợ định dạng: <strong>PNG</strong>, <strong>JPG</strong>, <strong>SVG</strong>, <strong>WebP</strong> (Khuyên dùng ảnh nền trong suốt)
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-slate-200/80 text-slate-700">
                        <FileImage className="w-3 h-3" />
                        <span>Hệ thống tự động nén nét HD và lưu trữ vĩnh viễn</span>
                      </div>
                    </div>

                    {compressionInfo && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{compressionInfo}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Direct Image URL */}
                {activeTab === 'url' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Đường dẫn liên kết ảnh trực tuyến (Image URL):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://truongthcsthptdocbinhkieu.../logo.png"
                        value={urlInput}
                        onChange={(e) => {
                          setUrlInput(e.target.value);
                          setUrlStatus('idle');
                        }}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={handleTestUrl}
                        disabled={!urlInput.trim() || urlStatus === 'testing'}
                        className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        {urlStatus === 'testing' ? 'Kiểm tra...' : 'Xem thử'}
                      </button>
                    </div>

                    {urlStatus === 'valid' && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Ảnh liên kết tải thành công và hiển thị hợp lệ!</span>
                      </div>
                    )}

                    {urlStatus === 'invalid' && (
                      <div className="text-[11px] text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Không thể tải ảnh từ URL trên. Vui lòng kiểm tra lại đường dẫn hoặc chuyển sang tải ảnh trực tiếp từ máy.</span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      💡 Mẹo: Bạn có thể sao chép địa chỉ hình ảnh từ trang thông tin điện tử của trường hoặc Google Drive/Imgur và dán vào đây.
                    </p>
                  </div>
                )}

                {/* Tab 3: Presets */}
                {activeTab === 'presets' && (
                  <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Chọn 1 trong 4 mẫu biểu trưng chuẩn của trường:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {PRESET_EMBLEMS.map((preset) => {
                        const isSelected = previewLogo === preset.svgDataUrl;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => handleSelectPreset(preset)}
                            className={`p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                            }`}
                          >
                            <img
                              src={preset.svgDataUrl}
                              alt={preset.name}
                              className="w-12 h-12 object-contain shrink-0 drop-shadow-xs"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">
                                {preset.name}
                              </div>
                              <div className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">
                                {preset.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>

              {/* Right Column: Live Previews (5 cols) */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Xem Trước Thời Gian Thực</span>
                  </div>
                  {previewLogo ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Đã chọn logo
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                      Mặc định
                    </span>
                  )}
                </div>

                {/* Badge showcase */}
                <div className="flex items-center justify-around py-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                  {/* Round badge */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border-2 border-emerald-500/30 flex items-center justify-center p-1 mx-auto shadow-xs overflow-hidden">
                      {previewLogo ? (
                        <img src={previewLogo} alt="Logo preview round" className="w-full h-full object-contain" />
                      ) : (
                        <School className="w-7 h-7 text-emerald-700" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-1 block">Khung tròn</span>
                  </div>

                  {/* Square rounded badge */}
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center p-1 mx-auto shadow-xs overflow-hidden ring-1 ring-emerald-500/20">
                      {previewLogo ? (
                        <img src={previewLogo} alt="Logo preview square" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white">
                          <School className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-1 block">Khung bo góc</span>
                  </div>
                </div>

                {/* Mockup 1: Top Navigation Bar Header */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    1. Hiển thị trên thanh tiêu đề chính (Header):
                  </span>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center ring-1 ring-emerald-600/30 overflow-hidden shrink-0 shadow-2xs">
                      {previewLogo ? (
                        <img src={previewLogo} alt="Header logo" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white">
                          <School className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-slate-900 truncate uppercase">
                        THCS &amp; THPT ĐỐC BINH KIỀU
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        Cổng Quản Lý Báo Cáo Định Kỳ
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mockup 2: Drawer Sidebar Header */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    2. Hiển thị trên Menu Ngăn Kéo (Sidebar):
                  </span>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5 text-white">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {previewLogo ? (
                        <img src={previewLogo} alt="Sidebar logo" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold">
                          <School className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-extrabold text-white truncate">
                        MENU HỆ THỐNG
                      </div>
                      <div className="text-[9px] text-emerald-400 truncate">
                        THCS &amp; THPT Đốc Binh Kiều
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mockup 3: Login Screen Identity */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    3. Hiển thị trên Màn hình Đăng nhập (Login):
                  </span>
                  <div className="bg-gradient-to-r from-slate-900 to-emerald-950 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2.5 text-white">
                    <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center ring-2 ring-emerald-400/40 overflow-hidden shrink-0 shadow-md">
                      {previewLogo ? (
                        <img src={previewLogo} alt="Login logo" className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                          <School className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-bold text-emerald-300 truncate uppercase">
                        SỞ GD&amp;ĐT TỈNH ĐỒNG THÁP
                      </div>
                      <div className="text-[11px] font-black text-white truncate uppercase">
                        THCS &amp; THPT ĐỐC BINH KIỀU
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Actions Toolbar */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetDefault}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1.5 transition cursor-pointer font-medium"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục biểu trưng mặc định ban đầu</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  onClick={handleSaveLogo}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer disabled:opacity-50 ring-1 ring-emerald-400/30"
                >
                  {isSaving ? (
                    <span>Đang lưu vào hệ thống...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu Logo Nhà Trường</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
