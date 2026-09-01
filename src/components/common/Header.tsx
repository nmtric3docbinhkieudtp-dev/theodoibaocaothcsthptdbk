import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { 
  Bell, 
  CheckCircle2, 
  ChevronDown, 
  School, 
  Sparkles,
  Menu,
  Clock,
  LogOut,
  UserCheck
} from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  onOpenNotifications?: () => void;
  onOpenSubmit?: () => void;
  onOpenReportDetail?: (submission: any) => void;
  onToggleMobileMenu?: () => void;
  onNavigate?: (tab: any) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenSubmit,
  onOpenReportDetail,
  onToggleMobileMenu,
  onNavigate
}) => {
  const { currentUser, allUsers = [], switchUser, logout } = useAuth();
  const { 
    schoolInfo, 
    unreadCount, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead
  } = useReports();
  
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  const filteredSwitcherUsers = allUsers.filter(u => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.roleTitle.toLowerCase().includes(q) ||
      u.departmentName.toLowerCase().includes(q) ||
      (u.subject && u.subject.toLowerCase().includes(q))
    );
  });

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'principal':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'dept_head':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'teacher':
        return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 shadow-2xs transition-all">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        
        {/* Left: Mobile Toggle & School Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Hamburger menu toggle button (visible on all screens to open/close menu on demand) */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              id="btn-toggle-main-menu"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition cursor-pointer shrink-0 font-medium text-xs border border-slate-200"
              aria-label="Mở menu chức năng"
              title="Nhấn để mở / đóng danh sách menu"
            >
              <Menu className="w-4 h-4 text-emerald-700" />
              <span className="font-bold hidden sm:inline">Menu</span>
            </button>
          )}

          {/* School Badge Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-600 flex items-center justify-center text-white shadow-xs shrink-0 ring-1 ring-emerald-600/20">
            <School className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate uppercase">
                THCS & THPT ĐỐC BINH KIỀU
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Đồng Tháp
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate hidden xs:block">
              Hệ thống Quản lý & Nộp Báo Cáo Định Kỳ • Năm học 2025 - 2026
            </p>
          </div>
        </div>

        {/* Right: Actions, Firebase Status, Notifications, Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          
          {/* Quick Submit Button */}
          {onOpenSubmit && (
            <button
              id="btn-quick-submit"
              onClick={onOpenSubmit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Nộp Báo Cáo</span>
              <span className="xs:hidden">Nộp</span>
            </button>
          )}

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              id="btn-open-notifications"
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowRoleMenu(false);
              }}
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Thông báo"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Thông báo hệ thống</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800">
                      {unreadCount} mới
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] text-emerald-700 hover:underline font-semibold cursor-pointer"
                    >
                      Đã đọc tất cả
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Không có thông báo mới nào
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.type === 'new_period' && onNavigate) onNavigate('periods');
                          if (n.type === 'system' && onNavigate) onNavigate('approvals');
                          setShowNotifMenu(false);
                        }}
                        className={`p-3 text-xs transition cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                          !n.isRead ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.isRead ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 line-clamp-1">{n.title}</div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User & Role Switcher */}
          <div className="relative">
            <button
              id="btn-role-switcher"
              onClick={() => {
                setShowRoleMenu(!showRoleMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                alt={currentUser.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover border border-slate-200"
              />
              <div className="hidden text-left sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                  {currentUser.roleTitle}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Menu Popup */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tài khoản đang thao tác:
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeColor(currentUser.role)}`}>
                      {currentUser.roleTitle}
                    </span>
                    <span className="text-xs text-slate-600 font-medium truncate">
                      {currentUser.departmentName}
                    </span>
                  </div>
                </div>

                <div className="px-3 py-2">
                  <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                    <span>⚡ Chọn tài khoản cán bộ ({allUsers.length}):</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">120 Nhân sự</span>
                  </div>

                  {/* Search inside popup */}
                  <div className="mb-2">
                    <input
                      type="text"
                      placeholder="Tìm tên giáo viên, môn, tổ..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-emerald-600"
                    />
                  </div>

                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                    {filteredSwitcherUsers.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        Không tìm thấy cán bộ phù hợp
                      </div>
                    ) : (
                      filteredSwitcherUsers.map((user) => {
                        const isSelected = user.id === currentUser.id;
                        return (
                          <button
                            key={user.id}
                            onClick={() => {
                              switchUser(user.id);
                              setShowRoleMenu(false);
                              setUserSearch('');
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center gap-2.5 transition cursor-pointer ${
                              isSelected 
                                ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200' 
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {user.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold truncate flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {user.partyMember && (
                                  <span className="px-1 py-0.1 text-[8px] bg-red-100 text-red-700 rounded font-black">ĐV</span>
                                )}
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {user.roleTitle} • {user.departmentName}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Dropdown footer with Logout action */}
                <div className="p-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    ID: {currentUser.id}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
