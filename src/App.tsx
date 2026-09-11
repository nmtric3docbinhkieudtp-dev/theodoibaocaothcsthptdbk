import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ReportProvider } from './context/ReportContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/common/Header';
import { Sidebar, NavTab } from './components/common/Sidebar';
import { Dashboard } from './components/dashboard/Dashboard';
import { ReportList } from './components/reports/ReportList';
import { ApprovalQueue } from './components/approvals/ApprovalQueue';
import { PeriodManagement } from './components/periods/PeriodManagement';
import { DepartmentProgress } from './components/departments/DepartmentProgress';
import { PersonnelRosterView } from './components/admin/PersonnelRosterView';
import { AdminReportsExport } from './components/admin/AdminReportsExport';
import { SubmitReportModal } from './components/reports/SubmitReportModal';
import { ReportDetailModal } from './components/reports/ReportDetailModal';
import { ForceChangePasswordModal } from './components/auth/ForceChangePasswordModal';
import { CreatePeriodModal } from './components/periods/CreatePeriodModal';
import { PeriodConsolidationModal } from './components/reports/PeriodConsolidationModal';
import { UnsubmittedUsersModal } from './components/periods/UnsubmittedUsersModal';
import { FirebaseSettingsModal } from './components/admin/FirebaseSettingsModal';
import { LogoManagementModal } from './components/admin/LogoManagementModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { StorageService } from './services/storage';
import { isFirestoreWriteQuotaExceeded } from './services/firebase';
import { ReportSubmission } from './types';

const MainLayout: React.FC = () => {
  const { currentUser, isAdmin, isPrincipal, isImpersonating, returnToAdmin } = useAuth();
  const [activeView, setActiveView] = useState<NavTab>('dashboard');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreatePeriodModalOpen, setIsCreatePeriodModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState(false);
  const [consolidationPeriodId, setConsolidationPeriodId] = useState<string | undefined>(undefined);
  const [isUnsubmittedModalOpen, setIsUnsubmittedModalOpen] = useState(false);
  const [unsubmittedPeriodId, setUnsubmittedPeriodId] = useState<string | undefined>(undefined);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(isFirestoreWriteQuotaExceeded());
  const [dismissedQuotaBanner, setDismissedQuotaBanner] = useState(false);

  useEffect(() => {
    const handleQuotaChanged = (e: any) => {
      setIsQuotaExceeded(Boolean(e.detail?.isExceeded));
    };
    window.addEventListener('firestore-quota-status-changed', handleQuotaChanged);
    return () => window.removeEventListener('firestore-quota-status-changed', handleQuotaChanged);
  }, []);
  const [dismissedFirstTimeUserIds, setDismissedFirstTimeUserIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('dbk_dismissed_pwd_modal');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [selectedSubmission, setSelectedSubmission] = useState<ReportSubmission | null>(null);
  const [defaultPeriodForSubmit, setDefaultPeriodForSubmit] = useState<string | undefined>(undefined);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Check if first-time mandatory password change is required and not dismissed
  const creds = StorageService.getUserCredentials();
  const userCred = currentUser ? creds[currentUser.id] : null;
  const isPwdChangedLocally = currentUser ? Boolean(localStorage.getItem(`dbk_pwd_changed_${currentUser.id}`)) : false;
  const isPwdDismissedLocally = currentUser ? Boolean(localStorage.getItem(`dbk_pwd_dismissed_${currentUser.id}`)) : false;
  const hasChangedPassword = Boolean(currentUser?.hasChangedPassword || userCred?.hasChangedPassword || isPwdChangedLocally);

  // Only show change password modal when user explicitly clicks "Đổi mật khẩu"
  const isFirstTimePasswordRequired = false;

  const handleClosePasswordModal = () => {
    setIsChangePasswordOpen(false);
    if (currentUser) {
      setDismissedFirstTimeUserIds(prev => {
        const next = { ...prev, [currentUser.id]: true };
        try {
          localStorage.setItem('dbk_dismissed_pwd_modal', JSON.stringify(next));
          localStorage.setItem(`dbk_pwd_dismissed_${currentUser.id}`, 'true');
        } catch {}
        return next;
      });
    }
  };

  const handleOpenSubmit = (periodId?: string) => {
    setDefaultPeriodForSubmit(periodId);
    setIsSubmitModalOpen(true);
  };

  const handleOpenCreatePeriod = () => {
    setIsCreatePeriodModalOpen(true);
  };

  // If user role does not have access to 'export', redirect to dashboard
  useEffect(() => {
    if (activeView === 'export' && !isAdmin && !isPrincipal) {
      setActiveView('dashboard');
    }
  }, [activeView, isAdmin, isPrincipal]);

  const handleOpenReportDetail = (submission: ReportSubmission) => {
    setSelectedSubmission(submission);
    setIsDetailModalOpen(true);
  };

  const handleOpenConsolidation = (periodId?: string) => {
    // Only administrators and principals are allowed to view or open consolidation
    if (!isAdmin && !isPrincipal) {
      return;
    }
    setConsolidationPeriodId(periodId);
    setIsConsolidationModalOpen(true);
  };

  const handleOpenUnsubmitted = (periodId?: string) => {
    setUnsubmittedPeriodId(periodId);
    setIsUnsubmittedModalOpen(true);
  };

  const handleNavigate = (tab: NavTab) => {
    // Block unauthorized navigation to export tab
    if (tab === 'export' && !isAdmin && !isPrincipal) {
      return;
    }
    if (tab === 'submit') {
      if (isAdmin || isPrincipal) {
        handleOpenCreatePeriod();
      } else {
        handleOpenSubmit();
      }
    } else {
      setActiveView(tab);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Sticky Admin Impersonation Notice */}
      {isImpersonating && (
        <aside aria-label="Quản trị viên đang truy cập" className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-between shadow-md z-50 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-white/20 text-amber-100 font-bold text-[11px] uppercase tracking-wider">
              Quyền Quản Trị
            </span>
            <span>
              Thầy Nguyễn Minh Trí đang truy cập tài khoản: <strong>{currentUser.name}</strong> ({currentUser.roleTitle})
            </span>
          </div>
          <button
            onClick={returnToAdmin}
            className="px-3 py-1 bg-white hover:bg-amber-50 text-amber-950 font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer text-xs shrink-0"
          >
            <span>← Trở về tài khoản Quản trị</span>
          </button>
        </aside>
      )}

      {/* Top High-Density Header */}
      <Header
        onOpenSubmit={() => handleOpenSubmit()}
        onOpenCreatePeriod={handleOpenCreatePeriod}
        onOpenReportDetail={handleOpenReportDetail}
        onToggleMobileMenu={() => setIsMobileSidebarOpen(true)}
        onNavigate={handleNavigate}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
      />

      {/* Slide-out Navigation Drawer (Appears when clicking hamburger menu ☰) */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        onOpenSubmit={() => handleOpenSubmit()}
        onOpenCreatePeriod={handleOpenCreatePeriod}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
      />

      {/* Main Container: Full width clean layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {isQuotaExceeded && !dismissedQuotaBanner && (
          <div className="mb-4 p-3 sm:p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <p className="font-medium text-amber-900">
                <strong>Chế độ lưu trữ an toàn:</strong> Hạn ngạch ghi Firestore miễn phí hôm nay đã đạt mức tối đa (20.000 lượt ghi/ngày). Dữ liệu nộp báo cáo, lưu nháp và xuất Excel vẫn diễn ra tức thì, an toàn 100% trong bộ nhớ Local Storage của trình duyệt.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setActiveView('settings')}
                  className="px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-200 text-amber-950 font-semibold cursor-pointer text-[11px]"
                >
                  Cấu hình
                </button>
              )}
              <button
                type="button"
                onClick={() => setDismissedQuotaBanner(true)}
                className="px-2 py-1 rounded-lg hover:bg-amber-100 text-amber-800 cursor-pointer text-[11px]"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}

        <main className="w-full min-w-0">
          {activeView === 'dashboard' && (
            <Dashboard
              onOpenSubmit={(periodId) => handleOpenSubmit(periodId)}
              onOpenCreatePeriod={handleOpenCreatePeriod}
              onOpenReportDetail={handleOpenReportDetail}
              onOpenConsolidation={(isAdmin || isPrincipal) ? handleOpenConsolidation : undefined}
              onOpenUnsubmittedUsers={handleOpenUnsubmitted}
              onNavigate={handleNavigate}
            />
          )}

          {activeView === 'reports' && (
            <ReportList
              onOpenSubmit={() => handleOpenSubmit()}
              onOpenDetail={handleOpenReportDetail}
              onOpenConsolidation={(isAdmin || isPrincipal) ? () => handleOpenConsolidation() : undefined}
            />
          )}

          {activeView === 'approvals' && (
            <ApprovalQueue
              onOpenDetail={handleOpenReportDetail}
            />
          )}

          {activeView === 'periods' && (
            <PeriodManagement
              onOpenSubmit={(periodId) => handleOpenSubmit(periodId)}
              onOpenConsolidation={(isAdmin || isPrincipal) ? handleOpenConsolidation : undefined}
              onOpenUnsubmittedUsers={handleOpenUnsubmitted}
            />
          )}

          {(activeView === 'departments' || activeView === 'progress') && (
            <DepartmentProgress
              onOpenDetail={handleOpenReportDetail}
              onOpenUnsubmittedUsers={handleOpenUnsubmitted}
            />
          )}

          {activeView === 'personnel' && (
            <PersonnelRosterView />
          )}

          {activeView === 'export' && (isAdmin || isPrincipal) && (
            <AdminReportsExport
              onOpenConsolidation={handleOpenConsolidation}
            />
          )}

          {activeView === 'settings' && isAdmin && (
            <FirebaseSettingsModal
              onOpenLogoModal={() => setIsLogoModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <SubmitReportModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        defaultPeriodId={defaultPeriodForSubmit}
        onOpenCreatePeriod={handleOpenCreatePeriod}
      />

      <CreatePeriodModal
        isOpen={isCreatePeriodModalOpen}
        onClose={() => setIsCreatePeriodModalOpen(false)}
        onSuccess={(periodTitle) => {
          setIsCreatePeriodModalOpen(false);
          setActiveView('periods');
        }}
      />

      <ReportDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedSubmission(null);
        }}
        submission={selectedSubmission}
      />

      {/* Period Consolidation & 53 Homeroom Classes Full Dashboard Modal */}
      <PeriodConsolidationModal
        isOpen={isConsolidationModalOpen}
        onClose={() => {
          setIsConsolidationModalOpen(false);
          setConsolidationPeriodId(undefined);
        }}
        defaultPeriodId={consolidationPeriodId}
      />

      {/* Unsubmitted Users & Reminder Management Modal */}
      <UnsubmittedUsersModal
        isOpen={isUnsubmittedModalOpen}
        onClose={() => {
          setIsUnsubmittedModalOpen(false);
          setUnsubmittedPeriodId(undefined);
        }}
        defaultPeriodId={unsubmittedPeriodId}
        onOpenReportDetail={handleOpenReportDetail}
      />

      {/* Admin Logo Management Modal */}
      {isAdmin && (
        <LogoManagementModal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
        />
      )}

      {/* Mandatory First-Time or Manual Password Change Modal */}
      <ForceChangePasswordModal
        isOpen={isFirstTimePasswordRequired || isChangePasswordOpen}
        onClose={handleClosePasswordModal}
        isMandatory={isFirstTimePasswordRequired}
      />

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/80 py-3 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>Trường THCS & THPT Đốc Binh Kiều</strong> • Tỉnh Đồng Tháp • Cổng Nộp Báo Cáo Chuyên Môn
          </div>
          <div className="text-slate-400">
            Hỗ trợ kỹ thuật: <strong>nmtri.c3docbinhkieu.dtp@moet.edu.vn</strong>
          </div>
        </div>
      </footer>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <MainLayout />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ReportProvider>
          <AppContent />
        </ReportProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
