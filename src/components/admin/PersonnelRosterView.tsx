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
  Layers
} from 'lucide-react';

export const PersonnelRosterView: React.FC = () => {
  const { allUsers = [], currentUser, switchUser, isAdmin, isPrincipal } = useAuth();
  const { departments = [], syncToFirebase } = useReports();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [filterParty, setFilterParty] = useState<string>('all');
  const [filterDegree, setFilterDegree] = useState<string>('all');
  const [selectedUserDetail, setSelectedUserDetail] = useState<User | null>(null);
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
        if (!matchName && !matchEmail && !matchSubject && !matchSpec && !matchRole) {
          return false;
        }
      }

      if (selectedDept !== 'all' && u.departmentId !== selectedDept) {
        return false;
      }

      if (selectedSchool !== 'all' && u.originalSchool !== selectedSchool) {
        return false;
      }

      if (selectedRole !== 'all') {
        if (selectedRole === 'principal' && u.role !== 'principal') return false;
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

      return true;
    });
  }, [allUsers, searchQuery, selectedDept, selectedSchool, selectedRole, filterParty, filterDegree]);

  // Statistics
  const stats = useMemo(() => {
    const totalStaff = allUsers.filter(u => u.id !== 'user-admin').length;
    const partyCount = allUsers.filter(u => u.partyMember).length;
    const mastersCount = allUsers.filter(u => u.qualification?.includes('Thạc')).length;
    const thptCount = allUsers.filter(u => u.originalSchool === 'THPTĐBK').length;
    const thcsDbkCount = allUsers.filter(u => u.originalSchool === 'THCSĐBK').length;
    const thcsTkCount = allUsers.filter(u => u.originalSchool === 'THCSTK').length;

    return {
      totalStaff,
      partyCount,
      partyPercentage: totalStaff ? Math.round((partyCount / totalStaff) * 100) : 0,
      mastersCount,
      thptCount,
      thcsDbkCount,
      thcsTkCount
    };
  }, [allUsers]);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/60">
            <div className="text-[11px] font-semibold text-slate-500">Tổng nhân sự</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{stats.totalStaff}</div>
            <div className="text-[10px] text-slate-500">8 tổ chuyên môn</div>
          </div>

          <div className="bg-red-50/50 rounded-xl p-2.5 border border-red-200/60">
            <div className="text-[11px] font-semibold text-red-700">Đảng viên</div>
            <div className="text-lg font-black text-red-900 mt-0.5">{stats.partyCount}</div>
            <div className="text-[10px] text-red-600 font-bold">Tỷ lệ {stats.partyPercentage}%</div>
          </div>

          <div className="bg-amber-50/50 rounded-xl p-2.5 border border-amber-200/60">
            <div className="text-[11px] font-semibold text-amber-700">Thạc sỹ</div>
            <div className="text-lg font-black text-amber-900 mt-0.5">{stats.mastersCount}</div>
            <div className="text-[10px] text-amber-600">Trình độ cao</div>
          </div>

          <div className="bg-sky-50/50 rounded-xl p-2.5 border border-sky-200/60">
            <div className="text-[11px] font-semibold text-sky-700">THPT ĐBK</div>
            <div className="text-lg font-black text-sky-900 mt-0.5">{stats.thptCount}</div>
            <div className="text-[10px] text-sky-600">Cơ sở THPT</div>
          </div>

          <div className="bg-indigo-50/50 rounded-xl p-2.5 border border-indigo-200/60">
            <div className="text-[11px] font-semibold text-indigo-700">THCS ĐBK</div>
            <div className="text-lg font-black text-indigo-900 mt-0.5">{stats.thcsDbkCount}</div>
            <div className="text-[10px] text-indigo-600">Cơ sở THCS</div>
          </div>

          <div className="bg-teal-50/50 rounded-xl p-2.5 border border-teal-200/60">
            <div className="text-[11px] font-semibold text-teal-700">THCS Tân Kiều</div>
            <div className="text-lg font-black text-teal-900 mt-0.5">{stats.thcsTkCount}</div>
            <div className="text-[10px] text-teal-600">Cơ sở sáp nhập</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo họ tên, môn dạy, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 transition"
            />
          </div>

          {/* Dept Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 transition"
            >
              <option value="all">Tất cả Tổ bộ môn ({departments.length})</option>
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
              <option value="all">Tất cả Trường/Cơ sở</option>
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
              <option value="principal">Ban Giám Hiệu</option>
              <option value="dept_head">Tổ trưởng / Tổ phó</option>
              <option value="teacher">Giáo viên / Nhân viên</option>
            </select>
          </div>

          {/* Party Member Filter */}
          <div>
            <select
              value={filterParty}
              onChange={(e) => setFilterParty(e.target.value)}
              className="w-full py-2 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-emerald-600 transition"
            >
              <option value="all">Đảng viên & Quần chúng</option>
              <option value="party">Chỉ Đảng viên</option>
              <option value="non_party">Quần chúng</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Hiển thị <strong className="text-slate-900">{filteredUsers.length}</strong> / {allUsers.length} cán bộ giáo viên, nhân viên
          </div>
          {(searchQuery || selectedDept !== 'all' || selectedSchool !== 'all' || selectedRole !== 'all' || filterParty !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDept('all');
                setSelectedSchool('all');
                setSelectedRole('all');
                setFilterParty('all');
                setFilterDegree('all');
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 truncate">
                              {user.name}
                            </span>
                            {user.partyMember && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-700 border border-red-200">
                                ĐV
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

                    {/* Chức Vụ */}
                    <td className="py-2 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                        user.role === 'principal'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : user.role === 'dept_head'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.roleTitle}
                      </span>
                    </td>

                    {/* Môn / Nhiệm Vụ */}
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      {user.subject || '-'}
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
                        <button
                          onClick={() => switchUser(user.id)}
                          title={`Chuyển quyền sang ${user.name}`}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800'
                          }`}
                        >
                          {isCurrent ? 'Đang dùng' : 'Chọn'}
                        </button>
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
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  switchUser(selectedUserDetail.id);
                  setSelectedUserDetail(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Đăng nhập thử vai trò cán bộ này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
