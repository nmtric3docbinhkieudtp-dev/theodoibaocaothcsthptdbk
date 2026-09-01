import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  School, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Search, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  AlertCircle,
  Building,
  KeyRound,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { allUsers = [], login } = useAuth();

  const [tab, setTab] = useState<'form' | 'directory'>('form');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Directory search
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryGroup, setDirectoryGroup] = useState<'all' | 'bgh' | 'dept_head' | 'teacher'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 4 BGH members
  const bghUsers = allUsers.filter(u => u.departmentId === 'bgh' || u.role === 'principal' || u.role === 'admin');
  
  // 7 Dept Heads
  const deptHeadUsers = allUsers.filter(u => u.role === 'dept_head' && u.departmentId !== 'bgh');

  const filteredDirectoryUsers = allUsers.filter(u => {
    // Filter by group
    if (directoryGroup === 'bgh') {
      if (u.departmentId !== 'bgh' && u.role !== 'principal' && u.role !== 'admin') return false;
    } else if (directoryGroup === 'dept_head') {
      if (u.role !== 'dept_head' || u.departmentId === 'bgh') return false;
    } else if (directoryGroup === 'teacher') {
      if (u.role === 'principal' || u.role === 'admin' || u.role === 'dept_head') return false;
    }

    // Filter by search
    if (!directorySearch.trim()) return true;
    const q = directorySearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.roleTitle.toLowerCase().includes(q) ||
      u.departmentName.toLowerCase().includes(q) ||
      (u.subject && u.subject.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.orderNo && `tt${u.orderNo}`.includes(q))
    );
  });

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Họ tên cán bộ / giáo viên!');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await login(identifier.trim(), password.trim() || '123456');
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đăng nhập không xác định');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectFromDirectory = async (user: User) => {
    setSelectedUser(user);
    setIdentifier(user.email);
    setPassword('123456');
    setErrorMsg(null);
    
    // Auto sign in directly from directory for convenience
    setIsSubmitting(true);
    try {
      const res = await login(user.email, '123456');
      if (!res.success) {
        setErrorMsg(res.message);
      } else {
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi đăng nhập');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Quản trị / BGH</span>;
      case 'principal':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Ban Giám Hiệu</span>;
      case 'dept_head':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Tổ trưởng (7 Tổ)</span>;
      case 'teacher':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Giáo viên / Nhân viên</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-between text-slate-100 selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md ring-2 ring-emerald-400/30">
              <School className="w-6 h-6" />
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
              <span>Năm học 2025 - 2026</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col items-center justify-center">
        
        {/* Title & Description */}
        <div className="text-center max-w-2xl mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cổng Thông Tin Báo Cáo Định Kỳ & Kiểm Duyệt Chuyên Môn</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng Nhập Hệ Thống Quản Lý Toàn Trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5">
            Dành cho Ban Giám Hiệu, 7 Tổ trưởng chuyên môn và toàn thể 120 Cán bộ - Giáo viên - Nhân viên
          </p>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
          
          {/* Navigation Tabs between Form & Directory */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5 text-xs font-bold">
            <button
              onClick={() => {
                setTab('form');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer ${
                tab === 'form' 
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Đăng nhập bằng Tài khoản & Mật khẩu</span>
            </button>

            <button
              onClick={() => {
                setTab('directory');
                setErrorMsg(null);
              }}
              className={`flex-1 py-3 px-4 rounded-2xl flex items-center justify-center gap-2 transition cursor-pointer ${
                tab === 'directory' 
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/80' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Đăng nhập nhanh theo Danh bạ 120 Thầy/Cô</span>
            </button>
          </div>

          {/* Tab 1: Form Login */}
          {tab === 'form' && (
            <div className="p-6 sm:p-8">
              
              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-medium">{errorMsg}</div>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="font-bold">{successMsg}</div>
                </div>
              )}

              <form onSubmit={handleFormLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Email / Họ và tên Cán bộ - Giáo viên:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Ví dụ: nmtri.c3docbinhkieu.dtp@moet.edu.vn hoặc Nguyễn Minh Trí"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      className="w-full text-xs pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Có thể nhập địa chỉ email ngành giáo dục (@moet.edu.vn) hoặc họ tên có dấu.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Mật khẩu đăng nhập:
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                      Mặc định: 123456
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu (Mặc định: 123456)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Ghi nhớ phiên đăng nhập</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setIdentifier('nmtri.c3docbinhkieu.dtp@moet.edu.vn');
                      setPassword('123456');
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    ⚡ Điền nhanh tài khoản Thầy Trí (Admin)
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Leadership Accounts Showcase */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Truy cập nhanh tài khoản Lãnh đạo & Tổ trưởng:</span>
                  <button
                    type="button"
                    onClick={() => setTab('directory')}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    Xem tất cả 120 cán bộ →
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectFromDirectory(bghUsers.find(u => u.name === 'Nguyễn Minh Trí') || bghUsers[1])}
                    className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-purple-950 truncate">Thầy Nguyễn Minh Trí</div>
                      <div className="text-[10px] text-purple-700">Phó Hiệu trưởng (Quản trị hệ thống)</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-200 text-purple-900 shrink-0">Admin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectFromDirectory(bghUsers.find(u => u.name === 'Lê Thanh Cường') || bghUsers[0])}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-left transition flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-emerald-950 truncate">Thầy Lê Thanh Cường</div>
                      <div className="text-[10px] text-emerald-700">Hiệu trưởng (Ban Giám Hiệu)</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">Hiệu trưởng</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Directory Quick Sign-in for All 120 Teachers */}
          {tab === 'directory' && (
            <div className="p-6">
              
              {/* Group Filter Chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  type="button"
                  onClick={() => setDirectoryGroup('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    directoryGroup === 'all' 
                      ? 'bg-slate-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({allUsers.length} Cán bộ - GV)
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryGroup('bgh')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    directoryGroup === 'bgh' 
                      ? 'bg-purple-800 text-white' 
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  Ban Giám Hiệu ({bghUsers.length} Lãnh đạo)
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryGroup('dept_head')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    directoryGroup === 'dept_head' 
                      ? 'bg-blue-800 text-white' 
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  Tổ trưởng ({deptHeadUsers.length} Thầy/Cô)
                </button>
                <button
                  type="button"
                  onClick={() => setDirectoryGroup('teacher')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    directoryGroup === 'teacher' 
                      ? 'bg-amber-800 text-white' 
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Giáo viên & Nhân viên ({allUsers.length - bghUsers.length - deptHeadUsers.length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo họ tên, môn dạy, tổ chuyên môn hoặc mã số (1-120)..."
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              {/* Staff List Scrollable */}
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                {filteredDirectoryUsers.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Không tìm thấy cán bộ - giáo viên nào phù hợp với từ khóa.
                  </div>
                ) : (
                  filteredDirectoryUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleSelectFromDirectory(user)}
                      className="p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-400 bg-white hover:bg-emerald-50/50 transition flex items-center justify-between gap-3 cursor-pointer group shadow-2xs hover:shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 transition">
                          {user.orderNo || '•'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-950 flex items-center gap-2 truncate">
                            <span>{user.name}</span>
                            {user.partyMember && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] bg-red-100 text-red-800 font-black">Đảng viên</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {user.roleTitle} • {user.departmentName} {user.subject ? `(${user.subject})` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {getRoleBadge(user.role)}
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 transition">
                          Đăng nhập →
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

        {/* Security & Support Footer Note */}
        <div className="text-center text-[11px] text-slate-400 mt-6 max-w-lg">
          Mỗi cán bộ - giáo viên chịu trách nhiệm về nội dung báo cáo nộp từ tài khoản của mình. Mọi thông tin thắc mắc về tài khoản xin liên hệ Ban Quản trị nhà trường.
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 py-3 text-center text-xs text-slate-400">
        © 2025 - 2026 TRƯỜNG THCS & THPT ĐỐC BINH KIỀU • TỈNH ĐỒNG THÁP
      </footer>

    </div>
  );
};
