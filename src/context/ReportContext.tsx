import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ReportSubmission, 
  ReportPeriod, 
  Department, 
  AppNotification, 
  SchoolInfo, 
  FirebaseConfig, 
  User, 
  ReviewHistory,
  SubmissionStatus
} from '../types';
import { StorageService, setLocal } from '../services/storage';
import { getStoredFirebaseConfig, saveStoredFirebaseConfig, testFirebaseConnection, getFirebaseInstance } from '../services/firebase';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { EmailService } from '../services/emailService';
import { useAuth } from './AuthContext';

interface ReportContextType {
  submissions: ReportSubmission[];
  periods: ReportPeriod[];
  departments: Department[];
  allUsers: User[];
  notifications: AppNotification[];
  schoolInfo: SchoolInfo;
  firebaseConfig: FirebaseConfig;
  
  // Actions for Submissions
  submitReport: (data: {
    periodId: string;
    title: string;
    content: string;
    attachments: any[];
    isDraft?: boolean;
    lateExplanation?: string;
  }) => Promise<ReportSubmission>;
  
  updateReport: (
    id: string, 
    data: Partial<ReportSubmission>
  ) => Promise<ReportSubmission>;

  deleteReport: (id: string) => void;

  reviewReport: (
    submissionId: string,
    action: 'approved' | 'rejected' | 'requested_edit',
    comment: string
  ) => Promise<void>;

  // Actions for Periods (Campaigns)
  createPeriod: (periodData: Omit<ReportPeriod, 'id' | 'createdAt'>) => ReportPeriod;
  updatePeriod: (id: string, periodData: Partial<ReportPeriod>) => ReportPeriod;
  deletePeriod: (id: string) => void;

  // Department management
  saveDepartment: (dept: Department) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: number;

  // Firebase
  updateFirebaseConfig: (config: Partial<FirebaseConfig>) => void;
  syncToFirebase: () => Promise<{ success: boolean; count: number; message: string }>;
  syncFromFirebase: () => Promise<{ success: boolean; count: number; message: string }>;
  testFirebase: () => Promise<{ success: boolean; message: string }>;

  // Reminders
  sendDeadlineReminderToUser: (teacher: User, period: ReportPeriod) => void;
  sendBulkReminders: (period: ReportPeriod, users: User[]) => void;

  // School info
  updateSchoolInfo: (info: SchoolInfo) => void;
  resetAllData: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, allUsers } = useAuth();
  
  const [submissions, setSubmissions] = useState<ReportSubmission[]>(() => StorageService.getSubmissions());
  const [periods, setPeriods] = useState<ReportPeriod[]>(() => StorageService.getPeriods());
  const [departments, setDepartments] = useState<Department[]>(() => StorageService.getDepartments());
  const [notifications, setNotifications] = useState<AppNotification[]>(() => StorageService.getNotifications());
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>(() => StorageService.getSchoolInfo());
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>(() => getStoredFirebaseConfig());

  // Real-time Firestore sync & Auto bootstrap
  useEffect(() => {
    const { db, isReady } = getFirebaseInstance();
    if (!isReady || !db) return;

    let unsubscribeSubs: (() => void) | null = null;
    let unsubscribePeriods: (() => void) | null = null;
    let unsubscribeDepts: (() => void) | null = null;

    const setupFirestoreRealtime = async () => {
      try {
        const subsSnap = await getDocs(collection(db, 'submissions'));
        if (subsSnap.empty) {
          // If Firestore is empty, seed it automatically with the initial data
          await StorageService.syncAllToFirebase();
        } else {
          // If Firestore already has data, load it into state
          const list: ReportSubmission[] = subsSnap.docs.map(d => d.data() as ReportSubmission);
          setSubmissions(list);
          setLocal('dbk_submissions_data', list);
        }
      } catch (err) {
        console.warn('Firestore initial check error:', err);
      }

      // Realtime listener for Submissions
      try {
        unsubscribeSubs = onSnapshot(collection(db, 'submissions'), (snapshot) => {
          if (!snapshot.empty) {
            const list: ReportSubmission[] = snapshot.docs.map(d => d.data() as ReportSubmission);
            list.sort((a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime());
            setSubmissions(list);
            setLocal('dbk_submissions_data', list);
          }
        }, (err) => console.warn('Submissions snapshot listener error:', err));

        // Realtime listener for Periods
        unsubscribePeriods = onSnapshot(collection(db, 'periods'), (snapshot) => {
          if (!snapshot.empty) {
            const list: ReportPeriod[] = snapshot.docs.map(d => d.data() as ReportPeriod);
            setPeriods(list);
            setLocal('dbk_periods_data', list);
          }
        }, (err) => console.warn('Periods snapshot listener error:', err));

        // Realtime listener for Departments
        unsubscribeDepts = onSnapshot(collection(db, 'departments'), (snapshot) => {
          if (!snapshot.empty) {
            const list: Department[] = snapshot.docs.map(d => d.data() as Department);
            setDepartments(list);
            setLocal('dbk_departments_data', list);
          }
        }, (err) => console.warn('Departments snapshot listener error:', err));
      } catch (err) {
        console.warn('Setting up Firestore snapshot error:', err);
      }
    };

    setupFirestoreRealtime();

    return () => {
      if (unsubscribeSubs) unsubscribeSubs();
      if (unsubscribePeriods) unsubscribePeriods();
      if (unsubscribeDepts) unsubscribeDepts();
    };
  }, []);

  // Refresh notifications when user changes
  useEffect(() => {
    setNotifications(StorageService.getNotifications(currentUser.id));
  }, [currentUser.id]);

  // Submit a report
  const submitReport = async (data: {
    periodId: string;
    title: string;
    content: string;
    attachments: any[];
    isDraft?: boolean;
    lateExplanation?: string;
  }): Promise<ReportSubmission> => {
    const period = periods.find(p => p.id === data.periodId);
    const now = new Date();
    const isDraft = Boolean(data.isDraft);

    let isLate = false;
    let lateMinutes = 0;

    if (period && !isDraft) {
      const deadlineDate = new Date(period.deadline);
      if (now.getTime() > deadlineDate.getTime()) {
        isLate = true;
        lateMinutes = Math.floor((now.getTime() - deadlineDate.getTime()) / (1000 * 60));
      }
    }

    const newSub: ReportSubmission = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      periodId: data.periodId,
      periodTitle: period ? period.title : 'Báo cáo định kỳ',
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorEmail: currentUser.email,
      authorRole: currentUser.role,
      authorRoleTitle: currentUser.roleTitle,
      departmentId: currentUser.departmentId,
      departmentName: currentUser.departmentName,
      title: data.title,
      content: data.content,
      attachments: data.attachments || [],
      status: isDraft ? 'draft' : 'submitted',
      submittedAt: isDraft ? null : now.toISOString(),
      updatedAt: now.toISOString(),
      isLate,
      lateDurationMinutes: isLate ? lateMinutes : undefined,
      lateExplanation: data.lateExplanation,
      reviewHistory: [],
      version: 1
    };

    const updated = StorageService.saveSubmission(newSub);
    setSubmissions(updated);

    // Notify Department Head if submitted
    if (!isDraft) {
      const dept = departments.find(d => d.id === currentUser.departmentId);
      if (dept && dept.headUserId) {
        StorageService.addNotification({
          id: 'notif-' + Date.now(),
          userId: dept.headUserId,
          title: `Báo cáo mới cần duyệt từ ${currentUser.name}`,
          message: `${currentUser.name} vừa nộp báo cáo "${newSub.title}" thuộc đợt "${newSub.periodTitle}".`,
          type: 'system',
          linkId: newSub.id,
          isRead: false,
          createdAt: now.toISOString()
        });
      }
    }

    return newSub;
  };

  const updateReport = async (id: string, data: Partial<ReportSubmission>): Promise<ReportSubmission> => {
    const existing = submissions.find(s => s.id === id);
    if (!existing) throw new Error('Không tìm thấy báo cáo');

    const updatedSub: ReportSubmission = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
      version: existing.version + 1
    };

    const updated = StorageService.saveSubmission(updatedSub);
    setSubmissions(updated);
    return updatedSub;
  };

  const deleteReport = (id: string) => {
    const updated = StorageService.deleteSubmission(id);
    setSubmissions(updated);
  };

  // Review workflow: Dept Head -> BGH
  const reviewReport = async (
    submissionId: string,
    action: 'approved' | 'rejected' | 'requested_edit',
    comment: string
  ) => {
    const sub = submissions.find(s => s.id === submissionId);
    if (!sub) return;

    const now = new Date().toISOString();
    const isDeptHeadReview = currentUser.role === 'dept_head';
    const isPrincipalReview = currentUser.role === 'principal' || currentUser.role === 'admin';

    const reviewRecord: ReviewHistory = {
      id: 'rev-' + Date.now(),
      reviewedBy: currentUser.id,
      reviewerName: currentUser.name,
      reviewerRole: currentUser.role,
      reviewerRoleTitle: currentUser.roleTitle,
      action,
      comment,
      timestamp: now
    };

    let newStatus: SubmissionStatus = sub.status;

    if (isDeptHeadReview) {
      if (action === 'approved') {
        newStatus = 'dept_approved'; // Pushed to BGH
      } else {
        newStatus = 'dept_rejected'; // Returned to teacher
      }
    } else if (isPrincipalReview) {
      if (action === 'approved') {
        newStatus = 'principal_approved'; // Fully approved
      } else {
        newStatus = 'principal_rejected'; // Requested modification by BGH
      }
    }

    const updatedSub: ReportSubmission = {
      ...sub,
      status: newStatus,
      updatedAt: now,
      deptHeadReview: isDeptHeadReview ? reviewRecord : sub.deptHeadReview,
      principalReview: isPrincipalReview ? reviewRecord : sub.principalReview,
      reviewHistory: [reviewRecord, ...sub.reviewHistory]
    };

    const updated = StorageService.saveSubmission(updatedSub);
    setSubmissions(updated);

    // Send email & in-app notification to teacher
    EmailService.sendReviewOutcomeNotification(
      updatedSub,
      currentUser,
      action === 'approved',
      comment
    );

    // If Dept Head approved, notify Principal
    if (isDeptHeadReview && action === 'approved') {
      const bghUsers = allUsers.filter(u => u.role === 'principal');
      for (const bgh of bghUsers) {
        StorageService.addNotification({
          id: 'notif-bgh-' + Date.now() + Math.random(),
          userId: bgh.id,
          title: `Báo cáo đã qua tổ duyệt: ${updatedSub.authorName}`,
          message: `${currentUser.name} (${currentUser.roleTitle}) đã duyệt báo cáo "${updatedSub.title}" và chuyển Ban Giám Hiệu phê duyệt.`,
          type: 'system',
          linkId: updatedSub.id,
          isRead: false,
          createdAt: now
        });
      }
    }
  };

  // Period management
  const createPeriod = (periodData: Omit<ReportPeriod, 'id' | 'createdAt'>): ReportPeriod => {
    const newPeriod: ReportPeriod = {
      ...periodData,
      id: 'period-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = StorageService.savePeriod(newPeriod);
    setPeriods(updated);

    // Broadcast notification to school
    StorageService.addNotification({
      id: 'notif-period-' + Date.now(),
      userId: 'all',
      title: `Đợt báo cáo mới: ${newPeriod.title}`,
      message: `Nhà trường vừa ban hành đợt nộp báo cáo mới. Thời hạn chót: ${new Date(newPeriod.deadline).toLocaleString('vi-VN')}.`,
      type: 'new_period',
      linkId: newPeriod.id,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    return newPeriod;
  };

  const updatePeriod = (id: string, periodData: Partial<ReportPeriod>): ReportPeriod => {
    const existing = periods.find(p => p.id === id);
    if (!existing) throw new Error('Không tìm thấy đợt báo cáo');
    const updatedPeriod = { ...existing, ...periodData };
    const updated = StorageService.savePeriod(updatedPeriod);
    setPeriods(updated);
    return updatedPeriod;
  };

  const deletePeriod = (id: string) => {
    const updated = StorageService.deletePeriod(id);
    setPeriods(updated);
  };

  const saveDepartment = (dept: Department) => {
    const updated = StorageService.saveDepartment(dept);
    setDepartments(updated);
  };

  // Notification handlers
  const markNotificationRead = (id: string) => {
    const updated = StorageService.markNotificationAsRead(id);
    setNotifications(updated.filter(n => n.userId === 'all' || n.userId === currentUser.id));
  };

  const markAllNotificationsRead = () => {
    const updated = StorageService.markAllNotificationsAsRead(currentUser.id);
    setNotifications(updated.filter(n => n.userId === 'all' || n.userId === currentUser.id));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Firebase integration actions
  const updateFirebaseConfig = (config: Partial<FirebaseConfig>) => {
    const updated = saveStoredFirebaseConfig(config);
    setFirebaseConfig(updated);
  };

  const syncToFirebase = async () => {
    return await StorageService.syncAllToFirebase();
  };

  const syncFromFirebase = async () => {
    const res = await StorageService.syncAllFromFirebase();
    if (res.success) {
      setSubmissions(StorageService.getSubmissions());
      setPeriods(StorageService.getPeriods());
      setDepartments(StorageService.getDepartments());
      setSchoolInfo(StorageService.getSchoolInfo());
    }
    return res;
  };

  const testFirebase = async () => {
    return await testFirebaseConnection();
  };

  // Reminders
  const sendDeadlineReminderToUser = (teacher: User, period: ReportPeriod) => {
    const diffMs = new Date(period.deadline).getTime() - Date.now();
    const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    EmailService.sendDeadlineReminder(teacher, period, days);
    setNotifications(StorageService.getNotifications(currentUser.id));
  };

  const sendBulkReminders = (period: ReportPeriod, users: User[]) => {
    EmailService.sendBulkRemindersForPeriod(period, users);
    setNotifications(StorageService.getNotifications(currentUser.id));
  };

  const updateSchoolInfo = (info: SchoolInfo) => {
    const updated = StorageService.saveSchoolInfo(info);
    setSchoolInfo(updated);
  };

  const resetAllData = () => {
    StorageService.resetToInitialData();
    setSubmissions(StorageService.getSubmissions());
    setPeriods(StorageService.getPeriods());
    setDepartments(StorageService.getDepartments());
    setNotifications(StorageService.getNotifications(currentUser.id));
    setSchoolInfo(StorageService.getSchoolInfo());
  };

  return (
    <ReportContext.Provider
      value={{
        submissions,
        periods,
        departments,
        allUsers,
        notifications,
        schoolInfo,
        firebaseConfig,
        submitReport,
        updateReport,
        deleteReport,
        reviewReport,
        createPeriod,
        updatePeriod,
        deletePeriod,
        saveDepartment,
        markNotificationRead,
        markAllNotificationsRead,
        unreadCount,
        updateFirebaseConfig,
        syncToFirebase,
        syncFromFirebase,
        testFirebase,
        sendDeadlineReminderToUser,
        sendBulkReminders,
        updateSchoolInfo,
        resetAllData
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReports = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};
