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
import { StorageService, setLocal, VALID_DEPT_IDS } from '../services/storage';
import { getStoredFirebaseConfig, saveStoredFirebaseConfig, testFirebaseConnection, getFirebaseInstance } from '../services/firebase';
import { collection, doc, onSnapshot, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { OFFICIAL_DEPARTMENTS, OFFICIAL_USERS } from '../data/staffRoster';
import { INITIAL_SUBMISSIONS, INITIAL_PERIODS } from '../data/initialData';
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
    structuredData?: any;
    attachments: any[];
    isDraft?: boolean;
    lateExplanation?: string;
    isHomeroomReport?: boolean;
    homeroomClass?: string;
    homeroomStudentCount?: number;
    homeroomCampus?: string;
  }) => Promise<ReportSubmission>;
  
  updateReport: (
    id: string, 
    data: Partial<ReportSubmission>
  ) => Promise<ReportSubmission>;

  deleteReport: (id: string) => Promise<void>;
  bulkDeleteReports: (ids: string[]) => Promise<void>;
  clearTestReports: () => Promise<{ count: number }>;
  clearAllReports: () => Promise<{ count: number }>;

  reviewReport: (
    submissionId: string,
    action: 'approved' | 'rejected' | 'requested_edit',
    comment: string
  ) => Promise<void>;

  // Actions for Periods (Campaigns)
  createPeriod: (periodData: Omit<ReportPeriod, 'id' | 'createdAt'>) => ReportPeriod;
  updatePeriod: (id: string, periodData: Partial<ReportPeriod>) => ReportPeriod;
  deletePeriod: (id: string) => Promise<void>;
  clearAllPeriods: () => Promise<{ count: number }>;

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
      const validStaffIds = new Set(OFFICIAL_USERS.map(u => u.id));
      try {
        // Check and sanitize departments in Firestore
        const deptsSnap = await getDocs(collection(db, 'departments'));
        const hasInvalidDepts = deptsSnap.docs.some(docSnap => {
          if (!VALID_DEPT_IDS.includes(docSnap.id) || docSnap.id === 'bgh') return true;
          const data = docSnap.data();
          if (docSnap.id === 'gdtc_qp_nt' && data.headUserName?.includes('Nguyện')) return true;
          return false;
        });
        if (deptsSnap.empty || hasInvalidDepts || deptsSnap.size !== 7) {
          // Delete old invalid docs (including 'bgh' which is not a department)
          for (const d of deptsSnap.docs) {
            if (!VALID_DEPT_IDS.includes(d.id) || d.id === 'bgh') {
              await deleteDoc(doc(db, 'departments', d.id));
            }
          }
          // Seed the 7 official departments
          for (const offDept of OFFICIAL_DEPARTMENTS) {
            await setDoc(doc(db, 'departments', offDept.id), offDept);
          }
          setDepartments(OFFICIAL_DEPARTMENTS);
          setLocal('dbk_departments_data', OFFICIAL_DEPARTMENTS);
        }

        // Check and sanitize periods in Firestore - never auto re-seed if cleared
        const isPeriodsCleared = localStorage.getItem('dbk_periods_cleared_by_user') === 'true';
        const periodsSnap = await getDocs(collection(db, 'periods'));
        if (periodsSnap.empty && !isPeriodsCleared) {
          // If empty and explicitly cleared, leave empty
          localStorage.setItem('dbk_periods_cleared_by_user', 'true');
        }

        const subsSnap = await getDocs(collection(db, 'submissions'));
        const isSubmissionsCleared = localStorage.getItem('dbk_submissions_cleared_by_user') === 'true';
        if (subsSnap.empty && !isSubmissionsCleared) {
          localStorage.setItem('dbk_submissions_cleared_by_user', 'true');
        } else if (!subsSnap.empty) {
          // Purge any invalid old test docs
          for (const docSnap of subsSnap.docs) {
            const data = docSnap.data() as ReportSubmission;
            if (data.authorId && !validStaffIds.has(data.authorId)) {
              await deleteDoc(doc(db, 'submissions', docSnap.id)).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.warn('Firestore initial check error:', err);
      }

      // Realtime listener for Submissions
      try {
        unsubscribeSubs = onSnapshot(collection(db, 'submissions'), (snapshot) => {
          if (!snapshot.empty) {
            const list: ReportSubmission[] = snapshot.docs
              .map(d => d.data() as ReportSubmission)
              .filter(s => validStaffIds.has(s.authorId));
            list.sort((a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime());
            setSubmissions(list);
            setLocal('dbk_submissions_data', list);
          } else {
            setSubmissions([]);
            setLocal('dbk_submissions_data', []);
          }
        }, (err) => console.warn('Submissions snapshot listener error:', err));

        // Realtime listener for Periods
        unsubscribePeriods = onSnapshot(collection(db, 'periods'), (snapshot) => {
          if (!snapshot.empty) {
            const list: ReportPeriod[] = snapshot.docs.map(d => d.data() as ReportPeriod);
            setPeriods(list);
            setLocal('dbk_periods_data', list);
          } else {
            setPeriods([]);
            setLocal('dbk_periods_data', []);
          }
        }, (err) => console.warn('Periods snapshot listener error:', err));

        // Realtime listener for Departments
        unsubscribeDepts = onSnapshot(collection(db, 'departments'), (snapshot) => {
          if (!snapshot.empty) {
            const rawList: Department[] = snapshot.docs.map(d => d.data() as Department);
            const validList = rawList.filter(d => VALID_DEPT_IDS.includes(d.id));
            if (validList.length === 7) {
              const sorted = [...validList].sort((a, b) => VALID_DEPT_IDS.indexOf(a.id) - VALID_DEPT_IDS.indexOf(b.id));
              setDepartments(sorted);
              setLocal('dbk_departments_data', sorted);
            } else {
              setDepartments(OFFICIAL_DEPARTMENTS);
              setLocal('dbk_departments_data', OFFICIAL_DEPARTMENTS);
            }
          } else {
            setDepartments(OFFICIAL_DEPARTMENTS);
            setLocal('dbk_departments_data', OFFICIAL_DEPARTMENTS);
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
    structuredData?: any;
    attachments: any[];
    isDraft?: boolean;
    lateExplanation?: string;
    isHomeroomReport?: boolean;
    homeroomClass?: string;
    homeroomStudentCount?: number;
    homeroomCampus?: string;
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
      isHomeroomReport: data.isHomeroomReport ?? (period?.targetAudience === 'homeroom_teachers' || currentUser.isHomeroomTeacher),
      homeroomClass: data.homeroomClass || currentUser.homeroomClass,
      homeroomStudentCount: data.homeroomStudentCount || currentUser.homeroomStudentCount,
      homeroomCampus: data.homeroomCampus || currentUser.homeroomCampus,
      title: data.title,
      content: data.content,
      structuredData: data.structuredData,
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

  const deleteReport = async (id: string) => {
    const updated = submissions.filter(s => s.id !== id);
    setSubmissions(updated);
    setLocal('dbk_submissions_data', updated);
    StorageService.deleteSubmission(id);
    try {
      const { db } = getFirebaseInstance();
      if (db) {
        await deleteDoc(doc(db, 'submissions', id)).catch(() => {});
      }
    } catch (e) {
      console.warn('Error deleting report from Firestore:', e);
    }
  };

  const bulkDeleteReports = async (ids: string[]) => {
    const updated = submissions.filter(s => !ids.includes(s.id));
    setSubmissions(updated);
    setLocal('dbk_submissions_data', updated);
    for (const id of ids) {
      StorageService.deleteSubmission(id);
    }
    try {
      const { db } = getFirebaseInstance();
      if (db) {
        for (const id of ids) {
          await deleteDoc(doc(db, 'submissions', id)).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Error bulk deleting reports from Firestore:', e);
    }
  };

  const clearAllReports = async (): Promise<{ count: number }> => {
    const count = submissions.length;
    setSubmissions([]);
    setLocal('dbk_submissions_data', []);
    localStorage.setItem('dbk_submissions_cleared_by_user', 'true');
    StorageService.clearAllSubmissions();
    try {
      const { db } = getFirebaseInstance();
      if (db) {
        const snap = await getDocs(collection(db, 'submissions'));
        snap.forEach(d => {
          deleteDoc(doc(db, 'submissions', d.id)).catch(() => {});
        });
      }
    } catch (e) {
      console.warn('Error clearing submissions in Firestore:', e);
    }
    return { count };
  };

  const clearTestReports = async (): Promise<{ count: number }> => {
    const ids = submissions.map(s => s.id);
    if (ids.length > 0) {
      await bulkDeleteReports(ids);
    }
    return { count: ids.length };
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

  const deletePeriod = async (id: string) => {
    const updated = StorageService.deletePeriod(id);
    setPeriods(updated);
    try {
      const { db } = getFirebaseInstance();
      if (db) {
        await deleteDoc(doc(db, 'periods', id)).catch(() => {});
      }
    } catch (e) {
      console.warn('Error deleting period from Firestore:', e);
    }
  };

  const clearAllPeriods = async (): Promise<{ count: number }> => {
    const count = periods.length;
    StorageService.clearAllPeriods();
    setPeriods([]);
    setLocal('dbk_periods_data', []);
    localStorage.setItem('dbk_periods_cleared_by_user', 'true');
    try {
      const { db } = getFirebaseInstance();
      if (db) {
        const snap = await getDocs(collection(db, 'periods'));
        for (const d of snap.docs) {
          await deleteDoc(doc(db, 'periods', d.id)).catch(() => {});
        }
      }
    } catch (e) {
      console.warn('Error clearing periods from Firestore:', e);
    }
    return { count };
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
        bulkDeleteReports,
        clearTestReports,
        clearAllReports,
        reviewReport,
        createPeriod,
        updatePeriod,
        deletePeriod,
        clearAllPeriods,
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
