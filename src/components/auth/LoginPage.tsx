import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  School, 
  Lock, 
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
  Sparkles,
  GraduationCap,
  X,
  Check
} from 'lucide-react';
import { User, UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { allUsers = [], login } = useAuth();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState<'all' | 'gvcn' | 'bgh' | 'dept_head' | 'teacher' | 'office'>('all');
  
  // Selected user for password modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick stats & Categories
  const bghUsers = allUsers.filter(u => u.departmentId === 'bgh' || u.role === 'principal' || u.role === 'admin');
  const deptHeadUsers = allUsers.filter(u => 
    (u.role === 'dept_head' || 
     u.positionAfter?.toLowerCase().includes('tổ trưởng') || 
     u.positionAfter?.toLowerCase().includes('tổ phó') || 
     u.roleTitle?.toLowerCase().includes('tổ trưởng') ||
     u.roleTitle?.toLowerCase().includes('tổ phó')
    ) && u.departmentId !== 'bgh'
  );
  const gvcnUsers = allUsers.filter(u => u.isHomeroomTeacher);
  const officeUsers = allUsers.filter(u => u.departmentId === 'van_phong');

  const filteredUsers = allUsers.filter(u => {
    // Filter by group
    if (activeGroup === 'gvcn') {
      if (!u.isHomeroomTeacher) return false;
    } else if (activeGroup === 'bgh') {
      if (u.departmentId !== 'bgh' && u.role !== 'principal' && u.role !== 'admin') return false;
    } else if (activeGroup === 'dept_head') {
      if (!deptHeadUsers.some(d => d.id === u.id)) return false;
    } else if (activeGroup === 'teacher') {
      if (u.departmentId === 'van_phong') return false;
    } else if (activeGroup === 'office') {
      if (u.departmentId !== 'van_phong') return false;
    }

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.roleTitle.toLowerCase().includes(q) ||
      u.departmentName.toLowerCase().includes(q) ||
      (u.subject && u.subject.toLowerCase().includes(q)) ||
      (u.homeroomClass && u.homeroomClass.toLowerCase().includes(q)) ||
      (u.homeroomCampus && u.homeroomCampus.toLowerCase().includes(q)) ||
      u.email.toLowerCase().includes(q) ||
      (u.orderNo && `tt${u.orderNo}`.includes(q))
    );
  });

  const handleOpenLoginModal = (user: User) => {
    setSelectedUser(user);
    setPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleConfirmLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu để đăng nhập!');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await login(selectedUser.email, password.trim());
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

  const getRoleBadge = (user: User) => {
    if (user.role === 'admin' || user.role === 'principal') {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">BGH / Admin</span>;
    }
    if (deptHeadUsers.some(d => d.id === user.id)) {
      const isPho = user.roleTitle?.toLowerCase().includes('tổ phó') || user.positionAfter?.toLowerCase().includes('tổ phó');
      return (
        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
          {isPho ? 'Tổ phó' : 'Tổ trưởng'}
        </span>
      );
    }
    if (user.isHomeroomTeacher) {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">GVCN {user.homeroomClass}</span>;
    }
    if (user.departmentId === 'van_phong' || user.roleTitle.toLowerCase().includes('nhân viên')) {
      return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 shrink-0">Nhân viên</span>;
    }
    return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">Giáo viên</span>;
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
              <span>Năm học 2026 - 2027</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col items-center justify-center">
        
        {/* Title & Description */}
        <div className="text-center max-w-2xl mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2.5 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cổng Báo Cáo Chuyên Môn & Quản Lý Nhà Trường</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Đăng Nhập Theo Danh Bạ 120 Thầy/Cô
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Chọn tên của Thầy/Cô bên dưới → Nhập mật khẩu cá nhân để vào hệ thống.
          </p>
        </div>

        {/* Directory Card Container */}
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 flex flex-col">
          
          {/* Search & Filter Header Bar */}
          <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 space-y-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                placeholder="🔍 Tìm nhanh: Gõ tên Thầy/Cô (ví dụ: Trí, Thơ, Huỳnh...), môn dạy hoặc lớp chủ nhiệm (12CB1, 6A1...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-300 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/20 focus:outline-hidden font-medium transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveGroup('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeGroup === 'all' 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Tất cả ({allUsers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGroup('gvcn')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeGroup === 'gvcn' 
                    ? 'bg-amber-600 text-white shadow-xs font-bold' 
                    : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                <span>53 Giáo viên chủ nhiệm (GVCN)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGroup('bgh')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeGroup === 'bgh' 
                    ? 'bg-purple-800 text-white shadow-xs font-bold' 
                    : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
                }`}
              >
                <span>Ban Giám Hiệu ({bghUsers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGroup('dept_head')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeGroup === 'dept_head' 
                    ? 'bg-blue-800 text-white shadow-xs font-bold' 
                    : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                <span>Tổ trưởng, Tổ phó ({deptHeadUsers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveGroup('office')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                  activeGroup === 'office' 
                    ? 'bg-teal-800 text-white shadow-xs font-bold' 
                    : 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100'
                }`}
              >
                <span>Tổ Văn phòng ({officeUsers.length})</span>
              </button>
            </div>

          </div>

          {/* Quick Notice */}
          <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hiển thị <strong>{filteredUsers.length}</strong> / {allUsers.length} thầy cô. Nhấp vào tên để đăng nhập.</span>
            </span>
          </div>

          {/* 120 Staff List Grid */}
          <div className="p-4 sm:p-5 max-h-[480px] overflow-y-auto scrollbar-thin space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600 text-sm">Không tìm thấy giáo viên nào!</p>
                <p className="mt-1">Vui lòng thử tìm với từ khóa họ tên khác hoặc chọn lại danh mục lọc.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredUsers.map((user) => {
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleOpenLoginModal(user)}
                      className="p-3 rounded-2xl border border-slate-200/90 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Order No avatar badge */}
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-emerald-600 text-slate-700 group-hover:text-white flex items-center justify-center font-bold text-xs shrink-0 transition">
                          {user.orderNo || '•'}
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-950 flex items-center gap-1.5 truncate">
                            <span>{user.name}</span>
                            {user.partyMember && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] bg-red-100 text-red-800 font-black shrink-0">
                                Đảng viên
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            {user.roleTitle} {user.subject ? `• Môn ${user.subject}` : ''}
                          </div>
                          {user.isHomeroomTeacher && (
                            <div className="text-[10px] text-amber-800 font-bold flex items-center gap-1 mt-0.5">
                              <GraduationCap className="w-3 h-3 text-amber-600" />
                              <span>GVCN Lớp {user.homeroomClass} ({user.homeroomStudentCount} HS - {user.homeroomCampus})</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 transition flex items-center gap-1"
                        >
                          <span>Đăng nhập</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Admin/Principal shortcuts footer */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium">⚡ Truy cập nhanh Lãnh đạo & Quản trị:</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleOpenLoginModal(bghUsers.find(u => u.name === 'Nguyễn Minh Trí') || bghUsers[1])}
                className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] cursor-pointer"
              >
                Thầy Nguyễn Minh Trí (PHT / Admin)
              </button>
              <button
                type="button"
                onClick={() => handleOpenLoginModal(bghUsers.find(u => u.name === 'Lê Thanh Cường') || bghUsers[0])}
                className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] cursor-pointer"
              >
                Thầy Lê Thanh Cường (Hiệu trưởng)
              </button>
            </div>
          </div>

        </div>

        {/* Modal: Password Prompt when selecting a teacher */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900 p-6 space-y-4">
              
              {/* Modal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                    {selectedUser.orderNo || '•'}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">{selectedUser.name}</h3>
                    <p className="text-xs text-slate-500">{selectedUser.roleTitle} • {selectedUser.departmentName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* GVCN Badge if applicable */}
              {selectedUser.isHomeroomTeacher && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <strong>Giáo viên chủ nhiệm: Lớp {selectedUser.homeroomClass}</strong> ({selectedUser.homeroomStudentCount} HS - {selectedUser.homeroomCampus})
                  </div>
                </div>
              )}

              {/* Alerts */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="font-medium">{errorMsg}</div>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="font-bold">{successMsg}</div>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handleConfirmLogin} className="space-y-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Mật khẩu xác nhận: <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoFocus
                      required
                      placeholder="Nhập mật khẩu..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm pl-10 pr-10 py-3 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden font-medium transition"
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

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-2 py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isSubmitting ? 'Đang vào...' : 'Xác Nhận Đăng Nhập'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 py-3 text-center text-xs text-slate-400">
        © 2026 - 2027 TRƯỜNG THCS & THPT ĐỐC BINH KIỀU • TỈNH ĐỒNG THÁP
      </footer>

    </div>
  );
};

