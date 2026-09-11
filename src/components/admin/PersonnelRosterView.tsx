import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { User, Department } from '../../types';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  CloudUpload, 
  UserCheck, 
  GraduationCap, 
  Award, 
  Building2, 
  Phone, 
  Mail, 
  ShieldAlert, 
  Eye, 
  LogIn, 
  BookOpen, 
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Layers,
  KeyRound,
  RotateCcw,
  Lock,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

export const PersonnelRosterView: React.FC = () => {
  const { allUsers = [], currentUser, switchUser, isAdmin, isPrincipal, resetUserPassword, canSwitchUser } = useAuth();
  const { departments = [], syncToFirebase } = useReports();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [filterParty, setFilterParty] = useState<string>('all');
  const [filterDegree, setFilterDegree] = useState<string>('all');
  const [filterHomeroom, setFilterHomeroom] = useState<string>('all'); // 'all' | 'gvcn_only' | 'non_gvcn'
  const [filterPasswordStatus, setFilterPasswordStatus] = useState<string>('all'); // 'all' | 'changed' | 'default'
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
  
  // Reset Password State (Admin only)
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ success: boolean; message: string; copied?: boolean } | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Filtered roster
  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      // Exclude admin if wanted, or keep
      if (u.id === 'user-admin' && allUsers.length > 1) {
        if (selectedDept !== 'all' || selectedSchool !== 'all') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchSubject = u.subject?.toLowerCase().includes(q) || false;
        const matchSpec = u.specialization?.toLowerCase().includes(q) || false;
        const matchRole = u.roleTitle.toLowerCase().includes(q);
        const matchClass = u.homeroomClass?.toLowerCase().includes(q) || false;
        const matchCampus = u.homeroomCampus?.toLowerCase().includes(q) || false;
        if (!matchName && !matchEmail && !matchSubject && !matchSpec && !matchRole && !matchClass && !matchCampus) {
          return false;
        }
      }

      if (filterHomeroom === 'gvcn_only' && !u.isHomeroomTeacher) return false;
      if (filterHomeroom === 'non_gvcn' && u.isHomeroomTeacher) return false;

      if (selectedDept !== 'all' && u.departmentId !== selectedDept) {
        return false;
      }

      if (selectedSchool !== 'all' && u.originalSchool !== selectedSchool) {
        return false;
      }

      if (selectedRole !== 'all') {
        if (selectedRole === 'principal' && u.role !== 'principal') return false;
        if (selectedRole === 'dept_head_cm' && (u.role !== 'dept_head' || u.departmentId === 'van_phong' || u.departmentId === 'bgh')) return false;
        if (selectedRole === 'dept_head' && u.role !== 'dept_head') return false;
        if (selectedRole === 'teacher' && u.role !== 'teacher') return false;
        if (selectedRole === 'admin' && u.role !== 'admin') return false;
      }

      if (filterParty === 'party' && !u.partyMember) return false;
      if (filterParty === 'non_party' && u.partyMember) return false;

      if (filterDegree !== 'all') {
        if (filterDegree === 'master' && !u.qualification?.includes('Thạc')) return false;
        if (filterDegree === 'bachelor' && !(u.qualification?.includes('Đại học') || u.qualification?.includes('ĐH') || u.qualification?.includes('Kỹ sư'))) return false;
        if (filterDegree === 'college' && !u.qualification?.includes('Cao đẳng')) return false;
        if (filterDegree === 'intermediate' && !u.qualification?.includes('Trung cấp')) return false;
      }

      if (filterPasswordStatus === 'changed' && !u.hasChangedPassword) return false;
      if (filterPasswordStatus === 'default' && u.hasChangedPassword) return false;

      return true;
    });
  }, [allUsers, searchQuery, selectedDept, selectedSchool, selectedRole, filterParty, filterDegree, filterHomeroom, filterPasswordStatus]);

  // Statistics
  const stats = useMemo(() => {
    const totalStaff = allUsers.filter(u => u.id !== 'user-admin').length;
    const partyCount = allUsers.filter(u => u.partyMember).length;
    const mastersCount = allUsers.filter(u => u.qualification?.includes('Thạc')).length;
    const homeroomCount = allUsers.filter(u => u.isHomeroomTeacher).length;
    const deptHeadCmCount = allUsers.filter(u => u.role === 'dept_head' && u.departmentId !== 'van_phong' && u.departmentId !== 'bgh').length;
    const thptCount = allUsers.filter(u => u.originalSchool === 'THPTĐBK').length;
    const thcsDbkCount = allUsers.filter(u => u.originalSchool === 'THCSĐBK').length;
    const thcsTkCount = allUsers.filter(u => u.originalSchool === 'THCSTK').length;
    const changedPasswordCount = allUsers.filter(u => u.hasChangedPassword).length;
    const defaultPasswordCount = allUsers.filter(u => !u.hasChangedPassword && u.id !== 'user-admin').length;

    return {
      totalStaff,
      partyCount,
      partyPercentage: totalStaff ? Math.round((partyCount / totalStaff) * 100) : 0,
      mastersCount,
      homeroomCount,
      deptHeadCmCount,
      thptCount,
      thcsDbkCount,
      thcsTkCount,
      changedPasswordCount,
      defaultPasswordCount
    };
  }, [allUsers]);

  const handleConfirmResetPassword = () => {
    if (!userToReset) return;
    if (!isAdmin) {
      setResetFeedback({
        success: false,
        message: 'Chỉ tài khoản Quản trị viên (Admin) mới có quyền reset mật khẩu!'
      });
      return;
    }

    setIsResetting(true);
    try {
      const res = resetUserPassword(userToReset.id);
      setResetFeedback({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setResetFeedback({
        success: false,
        message: err.message || 'Lỗi khi đặt lại mật khẩu'
      });
    } finally {
      setIsResetting(false);
    }
  };

  const copyResetNotification = (target: User) => {
    const text = `Kính gửi Thầy/Cô ${target.name},\nQuản trị viên hệ thống trường THCS & THPT Đốc Binh Kiều đã đặt lại mật khẩu tài khoản đăng nhập của Thầy/Cô về mặc định là: 123456.\nThầy/Cô vui lòng đăng nhập vào hệ thống bằng mật khẩu 123456 và đổi lại mật khẩu cá nhân mới khi cần thiết.\nTrân trọng!`;
    navigator.clipboard.writeText(text);
    setResetFeedback(prev => prev ? { ...prev, copied: true } : null);
  };

  const handleSyncToFirebase = async () => {
    setIsSyncing(true);
    setSyncStatus('Đang đồng bộ dữ liệu 120 nhân sự lên Firebase...');
    try {
      const res = await syncToFirebase();
      setSyncStatus(res.message);
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (e: any) {
      setSyncStatus(`Lỗi: ${e.message || e}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'STT',
      'Họ và tên',
      'Đơn vị trường',
      'Tổ công tác',
      'Chức vụ',
      'Môn/Nhiệm vụ',
      'Ngày sinh',
      'Giới tính',
      'Đảng viên',
      'Trình độ',
      'Chuyên ngành',
      'LLCT',
      'Tin học',
      'Ngoại ngữ',
      'Email'
    ];

    const rows = filteredUsers.map((u, idx) => [
      u.orderNo || idx + 1,
      `"${u.name}"`,
      `"${u.originalSchool || 'THPTĐBK'}"`,
      `"${u.departmentName}"`,
      `"${u.roleTitle}"`,
      `"${u.subject || ''}"`,
      `"${u.dateOfBirth || ''}"`,
      `"${u.gender || ''}"`,
      u.partyMember ? 'Đảng viên' : 'Quần chúng',
      `"${u.qualification || ''}"`,
      `"${u.specialization || ''}"`,
      `"${u.politicalTheory || ''}"`,
      `"${u.itSkill || ''}"`,
      `"${u.foreignLanguage || ''}"`,
      `"${u.email}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Danh_Sach_Nhan_Su_Doc_Binh_Kieu_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center border border-emerald-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Danh Sách Nhân Sự & Cán Bộ Giáo Viên
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                  {stats.totalStaff} Nhân sự
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Trường THCS & THPT Đốc Binh Kiều (Hợp nhất dữ liệu THPT Đốc Binh Kiều, THCS Đốc Binh Kiều & THCS Tân Kiều)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất CSV / Excel</span>
            </button>

            <button
              onClick={handleSyncToFirebase}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
            >
              <CloudUpload className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ lên Firebase'}</span>
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}

        {/* High Density Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/60">
            <div className="text-[11px] font-semibold text-slate-500">Tổng nhân sự</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{stats.totalStaff}</div>
            <div className="text-[10px] text-slate-500 font-medium">6 tổ CM + 1 tổ VP</div>
          </div>

          <div 
            onClick={() => {
              setFilterHomeroom('gvcn_only');
              setSelectedRole('all');
              setSelectedDept('all');
            }}
            className={`rounded-xl p-2 border cursor-pointer transition ${
              filterHomeroom === 'gvcn_only'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                : 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-100/60'
            }`}
            title="Nhấp để xem 53 GVCN"
          >
            <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              <span>53 GVCN</span>
            </div>
            <div className="text-lg font-black text-amber-900 mt-0.5">{stats.homeroomCount || 53}</div>
            <div className="text-[10px] text-amber-700 font-bold">53 Lớp chủ nhiệm</div>
          </div>

          <div 
            onClick={() => {
              setSelectedRole('dept_head_cm');
              setFilterHomeroom('all');
              setSelectedDept('all');
              setSelectedSchool('all');
            }}
            className={`rounded-xl p-2 border cursor-pointer transition ${
              selectedRole === 'dept_head_cm'
                ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-500'
                : 'bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/60'
            }`}
            title="Nhấp để lọc danh sách 19 Tổ trưởng & Tổ phó chuyên môn"
          >
            <div className="text-[11px] font-semibold text-blue-800 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Tổ Trưởng/Phó</span>
            </div>
            <div className="text-lg font-black text-blue-900 mt-0.5">{stats.deptHeadCmCount || 19}</div>
            <div className="text-[10px] text-blue-700 font-bold">19 Thầy Cô (6 tổ CM)</div>
          </div>

          <div className="bg-red-50/50 rounded-xl p-2 border border-red-200/60">
            <div className="text-[11px] font-semibold text-red-700">Đảng viên</div>
            <div className="text-lg font-black text-red-900 mt-0.5">{stats.partyCount}</div>
            <div className="text-[10px] text-red-600 font-bold">Tỷ lệ {stats.partyPercentage}%</div>
          </div>

          <div className="bg-amber-50/50 rounded-xl p-2 border border-amber-200/60">
            <div className="text-[11px] font-semibold text-amber-700">Thạc sỹ</div>
            <div className="text-lg font-black text-amber-900 mt-0.5">{stats.mastersCount}</div>
            <div className="text-[10px] text-amber-600">Trình độ cao</div>
          </div>

          <div className="bg-sky-50/50 rounded-xl p-2 border border-sky-200/60">
            <div className="text-[11px] font-semibold text-sky-700">THPT ĐBK</div>
            <div className="text-lg font-black text-sky-900 mt-0.5">{stats.thptCount}</div>
            <div className="text-[10px] text-sky-600">14 lớp THPT</div>
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-2 border border-indigo-200/60">
            <div className="text-[11px] font-semibold text-indigo-700">THCS ĐBK</div>
            <div className="text-lg font-black text-indigo-900 mt-0.5">{stats.thcsDbkCount}</div>
            <div className="text-[10px] text-indigo-600">24 lớp ĐBK</div>
          </div>

          <div className="bg-teal-50/50 rounded-xl p-2 border border-teal-200/60">
            <div className="text-[11px] font-semibold text-teal-700">THCS Tân Kiều</div>
            <div className="text-lg font-black text-teal-900 mt-0.5">{stats.thcsTkCount}</div>
            <div className="text-[10px] text-teal-600">15 lớp Tân Kiều</div>
          </div>

          <div 
            onClick={() => {
              setFilterPasswordStatus(filterPasswordStatus === 'default' ? 'all' : 'default');
            }}
            className={`rounded-xl p-2 border cursor-pointer transition ${
              filterPasswordStatus === 'default'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100'
            }`}
            title="Nhấp để lọc danh sách cán bộ đang dùng mật khẩu mặc định 123456"
          >
            <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>MK: 123456</span>
            </div>
            <div className="text-lg font-black text-amber-900 mt-0.5">{stats.defaultPasswordCount}</div>
            <div className="text-[10px] text-slate-500 font-medium">Cần hỗ trợ reset</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, lớp chủ nhiệm, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 transition"
            />
          </div>

          {/* GVCN Quick Filter */}
          <div>
            <select
              value={filterHomeroom}
              onChange={(e) => setFilterHomeroom(e.target.value)}
              className={`w-full py-2 px-2.5 text-xs rounded-xl border focus:outline-emerald-600 transition font-medium ${
                filterHomeroom === 'gvcn_only'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Tất cả nhiệm vụ</option>
              <option value="gvcn_only">⭐ 53 GVCN</option>
              <option value="non_gvcn">Không chủ nhiệm</option>
            </select>
          </div>

          {/* Dept Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 transition"
            >
              <option value="all">Tất cả 7 Tổ</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.memberCount || 0})
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 transition"
            >
              <option value="all">Tất cả Cơ sở</option>
              <option value="THPTĐBK">THPT Đốc Binh Kiều</option>
              <option value="THCSĐBK">THCS Đốc Binh Kiều</option>
              <option value="THCSTK">THCS Tân Kiều</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 transition"
            >
              <option value="all">Tất cả Chức vụ</option>
              <option value="principal">Ban Giám Hiệu (4)</option>
              <option value="dept_head_cm">⭐ 19 Tổ trưởng & Phó CM</option>
              <option value="dept_head">Tất cả Tổ trưởng & Phó (22)</option>
              <option value="teacher">Giáo viên / Nhân viên</option>
            </select>
          </div>

          {/* Password Status Filter */}
          <div>
            <select
              value={filterPasswordStatus}
              onChange={(e) => setFilterPasswordStatus(e.target.value)}
              className={`w-full py-2 px-2.5 text-xs rounded-xl border focus:outline-emerald-600 transition font-medium ${
                filterPasswordStatus !== 'all'
                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">Mật khẩu: Tất cả</option>
              <option value="changed">🔒 Đã đổi MK ({stats.changedPasswordCount})</option>
              <option value="default">🔑 Mặc định 123456 ({stats.defaultPasswordCount})</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Hiển thị <strong className="text-slate-900">{filteredUsers.length}</strong> / {allUsers.length} nhân sự</span>
            {filterHomeroom === 'gvcn_only' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                Đang lọc 53 GVCN
              </span>
            )}
            {selectedRole === 'dept_head_cm' && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold">
                ⭐ Đang lọc 19 Tổ trưởng & Tổ phó Chuyên môn
              </span>
            )}
            {filterPasswordStatus === 'default' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-amber-700" />
                Đang lọc cán bộ dùng MK mặc định 123456 ({stats.defaultPasswordCount})
              </span>
            )}
            {filterPasswordStatus === 'changed' && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                Đang lọc cán bộ đã đổi MK cá nhân ({stats.changedPasswordCount})
              </span>
            )}
          </div>
          {(searchQuery || selectedDept !== 'all' || selectedSchool !== 'all' || selectedRole !== 'all' || filterParty !== 'all' || filterHomeroom !== 'all' || filterPasswordStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('all');
                setSelectedSchool('all');
                setSelectedRole('all');
                setFilterParty('all');
                setFilterDegree('all');
                setFilterHomeroom('all');
                setFilterPasswordStatus('all');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline text-[11px]"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Main High-Density Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] scrollbar-thin">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-900 text-slate-200 text-[11px] font-bold tracking-wider uppercase z-10">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3 min-w-[200px]">Họ và Tên</th>
                <th className="py-2.5 px-3 min-w-[90px]">Trường gốc</th>
                <th className="py-2.5 px-3 min-w-[170px]">Tổ Chuyên Môn</th>
                <th className="py-2.5 px-3 min-w-[140px]">Chức Vụ</th>
                <th className="py-2.5 px-3 min-w-[110px]">Môn / Nhiệm Vụ</th>
                <th className="py-2.5 px-3 min-w-[130px]">Trình Độ / Chuyên Ngành</th>
                <th className="py-2.5 px-3 min-w-[90px]">LLCT</th>
                <th className="py-2.5 px-3 min-w-[80px]">Tin Học</th>
                <th className="py-2.5 px-3 min-w-[80px]">Ngoại Ngữ</th>
                <th className="py-2.5 px-3 w-28 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.map((user, index) => {
                const isSelected = selectedUserDetail?.id === user.id;
                const isCurrent = currentUser.id === user.id;

                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCurrent ? 'bg-emerald-50/40 font-medium' : ''
                    } ${isSelected ? 'bg-indigo-50/40' : ''}`}
                  >
                    {/* STT */}
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {user.orderNo || index + 1}
                    </td>

                    {/* Họ và Tên */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] flex-shrink-0 border border-slate-200/80">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 truncate">
                              {user.name}
                            </span>
                            {user.partyMember && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-700 border border-red-200">
                                ĐV
                              </span>
                            )}
                            {user.hasChangedPassword ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Đã đổi mật khẩu cá nhân">
                                <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                                Đã đổi MK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200" title="Đang dùng mật khẩu mặc định 123456">
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                123456
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-600 text-white">
                                Đang chọn
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {user.dateOfBirth ? `${user.dateOfBirth} • ` : ''}{user.gender || ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Trường gốc */}
                    <td className="py-2 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.originalSchool === 'THPTĐBK' 
                          ? 'bg-sky-50 text-sky-700 border border-sky-200' 
                          : user.originalSchool === 'THCSĐBK'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : user.originalSchool === 'THCSTK'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.originalSchool || 'THPTĐBK'}
                      </span>
                    </td>

                    {/* Tổ Chuyên môn */}
                    <td className="py-2 px-3 font-semibold text-slate-700 text-[11px]">
                      {user.departmentName}
                    </td>

                    {/* Chức Vụ Sau Sáp Nhập (Hiện tại) & Trước sáp nhập */}
                    <td className="py-2 px-3">
                      <div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          user.role === 'principal'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : user.role === 'dept_head'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {user.positionAfter || user.roleTitle}
                        </span>
                        {user.positionBefore && user.positionBefore !== user.positionAfter && (
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            Trước SN: {user.positionBefore}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Môn / Nhiệm Vụ & GVCN */}
                    <td className="py-2 px-3">
                      <div className="text-slate-800 font-medium">{user.subject || '-'}</div>
                      {user.isHomeroomTeacher && (
                        <div className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-amber-100/90 text-amber-900 border border-amber-300/80 text-[10px] font-bold">
                          <GraduationCap className="w-3 h-3 text-amber-700 shrink-0" />
                          <span>GVCN {user.homeroomClass} ({user.homeroomStudentCount} HS)</span>
                        </div>
                      )}
                    </td>

                    {/* Trình độ / Chuyên ngành */}
                    <td className="py-2 px-3">
                      <div className="text-[11px] font-bold text-slate-800">
                        {user.qualification || '-'}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                        {user.specialization || ''}
                      </div>
                    </td>

                    {/* LLCT */}
                    <td className="py-2 px-3">
                      {user.politicalTheory ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          user.politicalTheory === 'Cao cấp'
                            ? 'bg-red-100 text-red-800'
                            : user.politicalTheory === 'Trung cấp'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.politicalTheory}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Tin học */}
                    <td className="py-2 px-3 text-[11px] text-slate-600">
                      {user.itSkill || '-'}
                    </td>

                    {/* Ngoại ngữ */}
                    <td className="py-2 px-3 text-[11px] text-slate-600">
                      {user.foreignLanguage || '-'}
                    </td>

                    {/* Thao tác */}
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedUserDetail(user)}
                          title="Xem hồ sơ chi tiết"
                          className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              setUserToReset(user);
                              setResetFeedback(null);
                            }}
                            title={`Đặt lại mật khẩu về mặc định 123456 cho ${user.name} (Chỉ Quản trị viên)`}
                            className="p-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 border border-amber-200 transition cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canSwitchUser && (
                          <button
                            onClick={() => switchUser(user.id)}
                            title={`Chuyển quyền sang ${user.name} (Quyền Quản trị viên)`}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                            }`}
                          >
                            {isCurrent ? 'Đang dùng' : 'Chọn'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                  {selectedUserDetail.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base">
                      {selectedUserDetail.name}
                    </h3>
                    {selectedUserDetail.partyMember && (
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-extrabold">
                        Đảng viên
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedUserDetail.roleTitle} • {selectedUserDetail.departmentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUserDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400">Trường/Cơ sở gốc</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedUserDetail.originalSchool || 'THPTĐBK'}</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400">Môn / Công tác</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedUserDetail.subject || 'Chưa cập nhật'}</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400">Ngày sinh & Giới tính</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {selectedUserDetail.dateOfBirth || '-'} ({selectedUserDetail.gender || '-'})
                </div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400">Trình độ chuyên môn</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedUserDetail.qualification || '-'}</div>
              </div>

              <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400">Chuyên ngành đào tạo</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedUserDetail.specialization || '-'}</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400">Lý luận chính trị</div>
                <div className="font-bold text-slate-800 mt-0.5">{selectedUserDetail.politicalTheory || 'Chưa'}</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl">
                <div className="text-[10px] text-slate-400">Ngoại ngữ & Tin học</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  NN: {selectedUserDetail.foreignLanguage || '-'} • Tin: {selectedUserDetail.itSkill || '-'}
                </div>
              </div>

              {selectedUserDetail.managementDegree && (
                <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400">Bồi dưỡng CBQL / QLGD</div>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedUserDetail.managementDegree}</div>
                </div>
              )}

              <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">Email ngành</div>
                  <div className="font-mono text-slate-700 mt-0.5">{selectedUserDetail.email}</div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedUserDetail.email);
                    alert(`Đã sao chép email: ${selectedUserDetail.email}`);
                  }}
                  className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 cursor-pointer"
                >
                  Sao chép
                </button>
              </div>

              {/* Mật khẩu & Bảo mật */}
              <div className="col-span-2 bg-amber-50/60 border border-amber-200/80 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    <span>Mật khẩu & Tài khoản đăng nhập</span>
                  </div>
                  <div className="text-xs text-slate-700 flex items-center gap-1.5">
                    <span>Trạng thái:</span>
                    {selectedUserDetail.hasChangedPassword ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Đã đổi mật khẩu cá nhân
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">
                        <Lock className="w-3 h-3 text-amber-700" />
                        Mặc định: 123456
                      </span>
                    )}
                  </div>
                  {!isAdmin && (
                    <div className="text-[10px] text-slate-500 italic">
                      * Chỉ tài khoản Quản trị viên (Admin) mới có quyền đặt lại mật khẩu.
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserToReset(selectedUserDetail);
                      setResetFeedback(null);
                    }}
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer active:scale-98"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại mật khẩu (123456)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserDetail(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition"
              >
                Đóng
              </button>

              <button
                onClick={() => {
                  switchUser(selectedUserDetail.id);
                  setSelectedUserDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                Đăng nhập thử vai trò cán bộ này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal (Admin Exclusive) */}
      {userToReset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Đặt Lại Mật Khẩu Về 123456
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    Đặc quyền Quản trị viên (Admin)
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setUserToReset(null);
                  setResetFeedback(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 leading-none"
              >
                ✕
              </button>
            </div>

            {/* Target User Info */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="text-[11px] text-slate-500 font-medium">Cán bộ / Giáo viên được đặt lại:</div>
              <div className="font-extrabold text-slate-900 text-sm">{userToReset.name}</div>
              <div className="text-xs text-slate-600">
                {userToReset.roleTitle} • {userToReset.departmentName}
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Email: {userToReset.email}
              </div>
              <div className="text-xs pt-1 flex items-center gap-2">
                <span className="text-slate-500">Mật khẩu hiện tại:</span>
                {userToReset.hasChangedPassword ? (
                  <span className="text-emerald-700 font-bold">Đã đổi mật khẩu cá nhân</span>
                ) : (
                  <span className="text-slate-600 font-medium">Đang dùng mật khẩu mặc định (123456)</span>
                )}
              </div>
            </div>

            {/* Instruction Note */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Quy tắc đặt lại mật khẩu:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800 pl-1">
                <li>Mật khẩu tài khoản sẽ được đưa về giá trị mặc định: <strong className="font-mono text-xs bg-amber-100 px-1 rounded">123456</strong></li>
                <li>Thầy/Cô có thể đăng nhập ngay với mật khẩu 123456 và tự đổi mật khẩu mới trong menu tài khoản.</li>
                <li>Hệ thống lưu lại trên trình duyệt và tự động đồng bộ lên Firebase.</li>
              </ul>
            </div>

            {/* Feedback message if any */}
            {resetFeedback && (
              <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                resetFeedback.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {resetFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{resetFeedback.message}</span>
                </div>

                {resetFeedback.success && (
                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-emerald-200/60">
                    <span className="text-[11px] text-emerald-700">Mật khẩu mới: <strong className="font-mono">123456</strong></span>
                    <button
                      type="button"
                      onClick={() => copyResetNotification(userToReset)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      {resetFeedback.copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{resetFeedback.copied ? 'Đã sao chép!' : 'Sao chép tin gửi Thầy/Cô'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setUserToReset(null);
                  setResetFeedback(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                {resetFeedback?.success ? 'Đóng' : 'Hủy bỏ'}
              </button>

              {!resetFeedback?.success && (
                <button
                  type="button"
                  onClick={handleConfirmResetPassword}
                  disabled={isResetting}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-98"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'Đang đặt lại...' : 'Xác nhận đặt lại về 123456'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
