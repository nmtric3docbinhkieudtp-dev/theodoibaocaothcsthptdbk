import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  School, 
  Lock, 
  User as UserIcon,
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle,
  Sparkles,
  HelpCircle,
  X,
  Check
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { toUsername, normalizeVietnamese } from '../../utils/userUtils';

export const LoginPage: React.FC = () => {
  const { allUsers = [], login } = useAuth();
  const schoolInfo = StorageService.getSchoolInfo();

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper directory modal (for teachers to easily look up their username if unsure)
  const [isLookupOpen, setIsLookupOpen] = useState(false);
  const [lookupQuery, setLookupQuery] = useState('');

  const filteredLookupUsers = allUsers.filter(u => {
    if (!lookupQuery.trim()) return true;
    const q = normalizeVietnamese(lookupQuery);
    const uNorm = normalizeVietnamese(u.name);
    const uUname = toUsername(u.name);
    const uClass = normalizeVietnamese(u.homeroomClass);
    const uDept = normalizeVietnamese(u.departmentName);
    return uNorm.includes(q) || uUname.includes(q) || uClass.includes(q) || uDept.includes(q);
  });

  const handleSelectUserFromLookup = (u: any) => {
    const uname = toUsername(u.name);
    setUsername(uname);
    setIsLookupOpen(false);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập của Thầy/Cô (ví dụ: nguyenminhtri)');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu để đăng nhập!');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await login(username.trim(), password.trim());
      if (!res.success) {
        setErrorMsg(res.message);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đăng nhập. Vui lòng thử lại!');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center shadow-md ring-2 ring-emerald-400/30 overflow-hidden shrink-0">
              {schoolInfo.logoUrl ? (
                <img src={schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                  <School className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-emerald-300 uppercase">
                SỞ GIÁO DỤC VÀ ĐÀO TẠO TỈNH ĐỒNG THÁP
              </div>
              <div className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
                TRƯỜNG THCS & THPT ĐỐC BINH KIỀU
              </div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Năm học 2026 - 2027</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2.5 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cổng Báo Cáo Chuyên Môn Nhà Trường</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng Nhập Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
            Dành cho Cán bộ, Giáo viên và Nhân viên toàn trường
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 text-slate-800">
          
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input 1: Tên đăng nhập */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Ví dụ: nguyenminhtri, huynhthanhdan..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:bg-white focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/20 focus:outline-hidden transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                💡 <strong className="text-emerald-700 font-semibold">Tên đăng nhập:</strong> Họ và tên viết liền, chữ thường, không dấu (Ví dụ: Nguyễn Minh Trí → <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-bold">nguyenminhtri</code>).
              </p>
            </div>

            {/* Input 2: Mật khẩu */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Nhập mật khẩu của Thầy/Cô"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 text-sm font-medium focus:bg-white focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/20 focus:outline-hidden transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                🔑 <strong className="text-emerald-700 font-semibold">Mật khẩu:</strong> Mật khẩu mặc định là <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-800 font-bold">123456</code> (nếu đã đổi, Thầy/Cô dùng mật khẩu đã đổi của mình).
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-98 text-white font-bold text-base shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng Nhập Ngay</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Quick Lookup Button */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => setIsLookupOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <span>Thầy/Cô chưa rõ tên đăng nhập? Bấm vào đây để tra cứu</span>
            </button>
          </div>

        </div>

        {/* Small Footer Notice */}
        <p className="text-center text-xs text-slate-400 mt-5 leading-relaxed">
          Hệ thống lưu trữ và đồng bộ báo cáo tập trung theo chỉ đạo của Ban Giám Hiệu.
        </p>

      </main>

      {/* Simple Username Lookup Modal */}
      {isLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 flex flex-col max-h-[85vh]">
            
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Tra Cứu Tên Đăng Nhập
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLookupOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Gõ tên Thầy/Cô (ví dụ: Dân, Thơ, Trí, Liên...) hoặc lớp chủ nhiệm"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-hidden font-medium"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
              {filteredLookupUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Không tìm thấy tên Thầy/Cô trong danh bạ 120 nhân sự.
                </div>
              ) : (
                filteredLookupUsers.map((u) => {
                  const uname = toUsername(u.name);
                  return (
                    <div
                      key={u.id}
                      className="py-2.5 px-3 hover:bg-emerald-50/50 rounded-xl transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5">
                          <span>{u.roleTitle}</span>
                          <span>•</span>
                          <span>{u.departmentName}</span>
                          {u.isHomeroomTeacher && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                              GVCN {u.homeroomClass}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-emerald-800 font-mono font-bold mt-1">
                          Tên đăng nhập: <span className="bg-emerald-100/70 px-1.5 py-0.5 rounded text-emerald-950 font-black">{uname}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectUserFromLookup(u)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer shrink-0"
                      >
                        Chọn tên này
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => setIsLookupOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-300 transition cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Bottom Footer Bar */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md px-4 py-3 text-center text-xs text-slate-400">
        Trường THCS & THPT Đốc Binh Kiều • Tháp Mười, Đồng Tháp • Năm học 2026 - 2027
      </footer>

    </div>
  );
};
