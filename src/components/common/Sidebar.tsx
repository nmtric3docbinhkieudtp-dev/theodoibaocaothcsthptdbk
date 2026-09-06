import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportContext';
import { 
  LayoutDashboard, 
  FilePlus2, 
  Files, 
  CheckSquare, 
  CalendarRange, 
  BarChart3, 
  FileSpreadsheet, 
  Settings, 
  GraduationCap,
  ShieldCheck,
  Users,
  X,
  Image as ImageIcon
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'submit' 
  | 'reports' 
  | 'approvals' 
  | 'periods' 
  | 'departments' 
  | 'progress'
  | 'personnel'
  | 'export' 
  | 'settings';

interface SidebarProps {
  activeView?: string;
  activeTab?: string;
  onNavigate?: (tab: NavTab) => void;
  onSelectTab?: (tab: NavTab) => void;
  onOpenSubmit?: () => void;
  onOpenCreatePeriod?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenLogoModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  activeTab,
  onNavigate,
  onSelectTab,
  onOpenSubmit,
  onOpenCreatePeriod,
  isMobileOpen = false,
  onCloseMobile,
  onOpenLogoModal
}) => {
  const currentTab = activeView || activeTab || 'dashboard';
  const { currentUser, isPrincipal, isDeptHead, isAdmin } = useAuth();
  const { schoolInfo } = useReports();

  const handleSelect = (tab: NavTab) => {
    if (tab === 'export' && !isAdmin && !isPrincipal) {
      return;
    }
    if (tab === 'submit') {
      if (isAdmin || isPrincipal) {
        if (onOpenCreatePeriod) {
          onOpenCreatePeriod();
        } else if (onNavigate) {
          onNavigate('periods');
        }
      } else if (onOpenSubmit) {
        onOpenSubmit();
      }
    } else {
      if (onNavigate) onNavigate(tab);
      if (onSelectTab) onSelectTab(tab);
    }
    if (onCloseMobile) onCloseMobile();
  };
  const { submissions = [], periods = [] } = useReports();

  // Calculate pending reviews for current user
  const pendingReviewsCount = submissions.filter(sub => {
    if (isDeptHead && currentUser.role === 'dept_head') {
      return sub.departmentId === currentUser.departmentId && sub.status === 'submitted';
    }
    if (isPrincipal) {
      return sub.status === 'dept_approved' || (sub.departmentId === 'bgh' && sub.status === 'submitted');
    }
    if (isAdmin) {
      return sub.status === 'submitted' || sub.status === 'dept_approved';
    }
    return false;
  }).length;

  // Active deadlines count
  const activePeriodsCount = periods.filter(p => p.status === 'active').length;

  // Late count
  const lateSubmissionsCount = submissions.filter(s => s.isLate).length;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Tổng quan hệ thống',
      icon: LayoutDashboard
    },
    {
      id: 'submit',
      label: (isAdmin || isPrincipal) ? 'Ban hành yêu cầu báo cáo' : 'Điền & nộp báo cáo',
      icon: FilePlus2,
      badge: (isAdmin || isPrincipal) ? 'Tạo mẫu & Đặt hạn' : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
    },
    {
      id: 'reports',
      label: 'Danh sách báo cáo',
      icon: Files,
      badge: submissions.length,
      badgeColor: 'bg-slate-800 text-slate-300'
    },
    ...((isAdmin || isPrincipal || isDeptHead) ? [{
      id: 'approvals' as NavTab,
      label: 'Kiểm duyệt báo cáo',
      icon: CheckSquare,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold animate-pulse'
    }] : []),
    {
      id: 'periods',
      label: (isAdmin || isPrincipal) ? 'Quản lý đợt & Hạn chót' : 'Đợt nộp & Hạn chót',
      icon: CalendarRange,
      badge: activePeriodsCount > 0 ? `${activePeriodsCount} đợt` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    },
    {
      id: 'departments',
      label: 'Tiến độ & Trễ hạn',
      icon: BarChart3,
      badge: lateSubmissionsCount > 0 ? `${lateSubmissionsCount} trễ` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
    },
    {
      id: 'personnel',
      label: 'Nhân sự & Giáo viên',
      icon: Users,
      badge: '120 CB-GV',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    },
    ...((isAdmin || isPrincipal) ? [{
      id: 'export' as NavTab,
      label: 'Tổng Hợp & Xuất 53 Lớp',
      icon: FileSpreadsheet,
      badge: '53 Lớp',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    }] : []),
    ...(isAdmin ? [{
      id: 'settings' as NavTab,
      label: 'Cài Đặt & Logo Trường',
      icon: Settings,
      badge: 'Quản trị',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    }] : [])
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        id="app-main-sidebar-drawer"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-slate-900 text-slate-200 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out border-r border-slate-800/80 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Drawer Header with Title & Close button */}
        <div className="p-4 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div 
              onClick={isAdmin && onOpenLogoModal ? () => { onCloseMobile?.(); onOpenLogoModal(); } : undefined}
              className={`w-8 h-8 rounded-xl bg-white flex items-center justify-center font-bold shadow-xs overflow-hidden ring-1 ring-emerald-500/30 ${
                isAdmin && onOpenLogoModal ? 'cursor-pointer hover:ring-emerald-400' : ''
              }`}
              title={isAdmin ? "Nhấn để đổi logo nhà trường (Admin)" : schoolInfo.name}
            >
              {schoolInfo.logoUrl ? (
                <img src={schoolInfo.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
                  <GraduationCap className="w-5 h-5" />
                </div>
              )}
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-wide">MENU HỆ THỐNG</div>
              <div className="text-[10px] text-emerald-400 font-medium truncate max-w-[140px]">
                {schoolInfo.name || 'THCS & THPT Đốc Binh Kiều'}
              </div>
            </div>
          </div>
          <button
            id="btn-close-sidebar-drawer"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Chức Năng Nghiệp Vụ
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id || (item.id === 'departments' && currentTab === 'progress');

            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 transition ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                  <span className="truncate text-left">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile Footer in Sidebar */}
        <div className="p-3 m-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 shrink-0 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={currentUser.name}
              className="w-8 h-8 rounded-xl object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-emerald-400 truncate">
                {currentUser.roleTitle}
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
            <span className="truncate">{currentUser.departmentName}</span>
            <span className="text-emerald-400 font-semibold shrink-0">Trực tuyến</span>
          </div>

          {/* Admin Logo Button */}
          {isAdmin && onOpenLogoModal && (
            <button
              type="button"
              onClick={() => {
                onCloseMobile?.();
                onOpenLogoModal();
              }}
              className="w-full py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-emerald-950/60 text-emerald-300 hover:text-emerald-200 border border-slate-700/80 hover:border-emerald-500/40 flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Đổi Logo Nhà Trường</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
