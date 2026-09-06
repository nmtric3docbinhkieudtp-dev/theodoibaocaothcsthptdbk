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
import { FirebaseSettingsModal } from './components/admin/FirebaseSettingsModal';
import { LogoManagementModal } from './components/admin/LogoManagementModal';
import { StorageService } from './services/storage';
import { ReportSubmission } from './types';

const MainLayout: React.FC = () => {
  const { isAuthenticated, currentUser, isAdmin, isPrincipal } = useAuth();
  const [activeView, setActiveView] = useState<NavTab>('dashboard');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreatePeriodModalOpen, setIsCreatePeriodModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConsolidationModalOpen, setIsConsolidationModalOpen] = useState(false);
  const [consolidationPeriodId, setConsolidationPeriodId] = useState<string | undefined>(undefined);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
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

  // If user is not authenticated, show full login portal
  if (!isAuthenticated) {
    return <LoginPage />;
  }

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
        <main className="w-full min-w-0">
          {activeView === 'dashboard' && (
            <Dashboard
              onOpenSubmit={(periodId) => handleOpenSubmit(periodId)}
              onOpenCreatePeriod={handleOpenCreatePeriod}
              onOpenReportDetail={handleOpenReportDetail}
              onOpenConsolidation={(isAdmin || isPrincipal) ? handleOpenConsolidation : undefined}
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
            />
          )}

          {(activeView === 'departments' || activeView === 'progress') && (
            <DepartmentProgress
              onOpenDetail={handleOpenReportDetail}
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

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ReportProvider>
        <MainLayout />
      </ReportProvider>
    </AuthProvider>
  );
};

export default App;
