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
import { 
  getStoredFirebaseConfig, 
  saveStoredFirebaseConfig, 
  testFirebaseConnection, 
  getFirebaseInstance,
  safeFirestoreWrite,
  isFirestoreWriteQuotaExceeded,
  clearFirestoreWriteQuotaStatus
} from '../services/firebase';
import { collection, doc, onSnapshot, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { OFFICIAL_DEPARTMENTS, OFFICIAL_USERS } from '../data/staffRoster';
import { INITIAL_SUBMISSIONS, INITIAL_PERIODS } from '../data/initialData';
import { EmailService } from '../services/emailService';
import { ApiService } from '../services/apiService';
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

  confirmSubmissionForTeacher: (teacher: User, period: ReportPeriod, note?: string) => Promise<ReportSubmission>;
  syncWithServer: () => Promise<void>;
  deduplicateSubmissions: () => Promise<{ removedCount: number }>;

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

  // School info & Logo
  updateSchoolInfo: (info: SchoolInfo) => void;
  updateSchoolLogo: (logoUrl: string) => void;
  removeSchoolLogo: () => void;
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
    let unsubscribeMeta: (() => void) | null = null;

    const setupFirestoreRealtime = async () => {
      const validStaffIds = new Set(OFFICIAL_USERS.map(u => u.id));
      try {
        // Check and sync schoolInfo & custom logo from Firestore
        try {
          const metaSnap = await getDoc(doc(db, 'metadata', 'schoolInfo'));
          if (metaSnap.exists()) {
            const data = metaSnap.data() as SchoolInfo;
            if (data && (data.name || data.logoUrl)) {
              setSchoolInfo(prev => {
                const merged = { ...prev, ...data };
                setLocal('dbk_school_info_data', merged);
                return merged;
              });
            }
          }
        } catch (mErr) {
          console.warn('Firestore schoolInfo load error:', mErr);
        }

        // Listen to live metadata updates (e.g. logo changes from admin)
        unsubscribeMeta = onSnapshot(doc(db, 'metadata', 'schoolInfo'), (snap) => {
          if (snap.exists()) {
            const remote = snap.data() as SchoolInfo;
            if (remote) {
              setSchoolInfo(prev => {
                const merged = { ...prev, ...remote };
                setLocal('dbk_school_info_data', merged);
                return merged;
              });
            }
          }
        }, (err) => console.warn('SchoolInfo snapshot error:', err));
        // Check and sync user_credentials from Firestore
        try {
          const credsSnap = await getDocs(collection(db, 'user_credentials'));
          if (!credsSnap.empty) {
            const localCreds = StorageService.getUserCredentials();
            let hasNewCreds = false;
            credsSnap.docs.forEach(docSnap => {
              const data = docSnap.data();
              if (data && data.password) {
                if (data.hasChangedPassword) {
                  try {
                    localStorage.setItem(`dbk_pwd_changed_${docSnap.id}`, 'true');
                    localStorage.setItem(`dbk_pwd_dismissed_${docSnap.id}`, 'true');
                  } catch {}
                }
                if (!localCreds[docSnap.id] || localCreds[docSnap.id].password !== data.password) {
                  localCreds[docSnap.id] = {
                    userId: docSnap.id,
                    password: data.password,
                    hasChangedPassword: data.hasChangedPassword ?? true,
                    mustChangePassword: data.mustChangePassword ?? false,
                    updatedAt: data.updatedAt || new Date().toISOString()
                  };
                  hasNewCreds = true;
                }
              }
            });
            if (hasNewCreds) {
              setLocal('dbk_user_credentials', localCreds);
              StorageService.getUsers();
            }
          }
        } catch (credErr) {
          console.warn('Firestore user_credentials sync error:', credErr);
        }

        // Use official departments
        setDepartments(OFFICIAL_DEPARTMENTS);
        setLocal('dbk_departments_data', OFFICIAL_DEPARTMENTS);

        // Check and sanitize periods in Firestore - never auto re-seed if cleared
        const isPeriodsCleared = localStorage.getItem('dbk_periods_cleared_by_user') === 'true';
        const periodsSnap = await getDocs(collection(db, 'periods'));
        if (periodsSnap.empty && !isPeriodsCleared) {
          localStorage.setItem('dbk_periods_cleared_by_user', 'true');
        }

        const subsSnap = await getDocs(collection(db, 'submissions'));
        const isSubmissionsCleared = localStorage.getItem('dbk_submissions_cleared_by_user') === 'true';
        if (subsSnap.empty && !isSubmissionsCleared) {
          localStorage.setItem('dbk_submissions_cleared_by_user', 'true');
        }
      } catch (err) {
        console.warn('Firestore initial check error:', err);
      }

      // Realtime listener for Submissions
      try {
        unsubscribeSubs = onSnapshot(collection(db, 'submissions'), (snapshot) => {
          if (!snapshot.empty) {
            const rawList: ReportSubmission[] = snapshot.docs
              .map(d => d.data() as ReportSubmission)
              .filter(s => validStaffIds.has(s.authorId));
            
            // Enforce strictly 1 submission per teacher per period
            const map = new Map<string, ReportSubmission>();
            for (const s of rawList) {
              const key = `${s.periodId || 'default'}_${s.authorId || s.authorEmail || s.authorName}`;
              const existing = map.get(key);
              if (!existing) {
                map.set(key, s);
              } else {
                if (existing.status === 'draft' && s.status !== 'draft') {
                  map.set(key, s);
                } else if (existing.status === s.status) {
                  const t1 = new Date(existing.submittedAt || existing.updatedAt || 0).getTime();
                  const t2 = new Date(s.submittedAt || s.updatedAt || 0).getTime();
                  if (t2 > t1) map.set(key, s);
                }
              }
            }
            const list = Array.from(map.values());
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
            list.sort((a, b) => {
              if (a.status === 'active' && b.status !== 'active') return -1;
              if (a.status !== 'active' && b.status === 'active') return 1;
              return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            });
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
      if (unsubscribeMeta) unsubscribeMeta();
    };
  }, []);

  // Bi-directional Server Sync (Express Backend on Cloud Run)
  const syncWithServer = async () => {
    try {
      const localSubs = StorageService.getSubmissions();
      // Batch sync client submissions with server store
      const serverMerged = await ApiService.batchSyncSubmissions(localSubs);
      if (serverMerged && Array.isArray(serverMerged) && serverMerged.length > 0) {
        setSubmissions(serverMerged);
        setLocal('dbk_submissions_data', serverMerged);
      } else {
        const fetched = await ApiService.fetchSubmissions();
        if (fetched && Array.isArray(fetched) && fetched.length > 0) {
          setSubmissions(fetched);
          setLocal('dbk_submissions_data', fetched);
        }
      }

      // Sync periods
      const serverPeriods = await ApiService.fetchPeriods();
      if (serverPeriods && Array.isArray(serverPeriods) && serverPeriods.length > 0) {
        setPeriods(serverPeriods);
        setLocal('dbk_periods_data', serverPeriods);
      }
    } catch (e) {
      console.warn('[ReportContext] Server sync warning:', e);
    }
  };

  // Run server sync on mount and periodically every 5 seconds
  useEffect(() => {
    syncWithServer();
    const interval = setInterval(() => {
      syncWithServer();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update browser tab favicon dynamically if logo changes
  useEffect(() => {
    if (schoolInfo.logoUrl) {
      try {
        let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'shortcut icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = schoolInfo.logoUrl;
      } catch (e) {
        console.warn('Could not update favicon:', e);
      }
    }
  }, [schoolInfo.logoUrl]);

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

    // Kiểm tra xem người dùng đã có bài nộp hoặc bản nháp nào cho đợt báo cáo này chưa
    const existingSubs = submissions.filter(s => 
      s.authorId === currentUser.id && 
      s.periodId === data.periodId
    );
    const existingSub = existingSubs.find(s => s.status !== 'draft') || existingSubs[0];

    const submissionId = existingSub 
      ? existingSub.id 
      : ('sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6));

    const newSub: ReportSubmission = {
      id: submissionId,
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
      homeroomClass: data.homeroomClass || currentUser.homeroomClass || undefined,
      homeroomStudentCount: data.homeroomStudentCount || currentUser.homeroomStudentCount || undefined,
      homeroomCampus: data.homeroomCampus || currentUser.homeroomCampus || undefined,
      title: data.title,
      content: data.content,
      structuredData: data.structuredData || undefined,
      attachments: data.attachments || [],
      status: isDraft ? 'draft' : 'submitted',
      submittedAt: isDraft ? (existingSub?.submittedAt || null) : (existingSub?.submittedAt || now.toISOString()),
      updatedAt: now.toISOString(),
      isLate,
      lateDurationMinutes: isLate ? lateMinutes : undefined,
      lateExplanation: data.lateExplanation || undefined,
      reviewHistory: existingSub?.reviewHistory || [],
      version: existingSub ? (existingSub.version || 1) + 1 : 1
    };

    // Remove any undefined keys to strictly comply with Firestore and state rules
    const cleanSub: ReportSubmission = JSON.parse(JSON.stringify(newSub));

    let updated = StorageService.saveSubmission(cleanSub);

    // Nếu người dùng nộp chính thức, dọn dẹp triệt để bất kỳ bản ghi thừa/nháp cũ nào của người này trong cùng đợt
    if (!isDraft && existingSubs.length > 0) {
      existingSubs.forEach(s => {
        if (s.id !== submissionId) {
          updated = StorageService.deleteSubmission(s.id);
          ApiService.deleteSubmission(s.id).catch(() => {});
        }
      });
    }

    setSubmissions(updated);

    // Persist to Server API immediately (Central Express store)
    ApiService.saveSubmission(cleanSub).catch(e => console.warn('ApiService save error:', e));

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

      // If submitted late, immediately notify Admin/BGH
      if (isLate) {
        const users = StorageService.getUsers();
        const admins = users.filter(u => u.role === 'admin' || u.role === 'principal');
        const lateText = lateMinutes > 60 
          ? `${Math.floor(lateMinutes / 60)} giờ ${lateMinutes % 60} phút` 
          : `${lateMinutes} phút`;

        for (const adm of admins) {
          StorageService.addNotification({
            id: 'notif-late-' + Date.now() + '-' + adm.id,
            userId: adm.id,
            title: `⚠️ Nộp trễ hạn: ${currentUser.name} (${lateText})`,
            message: `Giáo viên/Nhân viên ${currentUser.name} (${currentUser.departmentName}) vừa nộp báo cáo trễ hạn cho yêu cầu "${newSub.periodTitle}". Thời gian trễ: ${lateText}. Lý do giải trình: "${data.lateExplanation || 'Không có giải trình'}"`,
            type: 'system',
            linkId: newSub.id,
            isRead: false,
            createdAt: now.toISOString()
          });
        }
      }
    }

    return newSub;
  };

  const confirmSubmissionForTeacher = async (
    teacher: User, 
    period: ReportPeriod, 
    note?: string
  ): Promise<ReportSubmission> => {
    const now = new Date();
    const isLate = now.getTime() > new Date(period.deadline).getTime();
    const subId = `sub-${Date.now()}-${teacher.id}`;
    const classText = teacher.homeroomClass ? ` - Lớp ${teacher.homeroomClass}` : '';
    const newSub: ReportSubmission = {
      id: subId,
      periodId: period.id,
      periodTitle: period.title,
      authorId: teacher.id,
      authorName: teacher.name,
      authorEmail: teacher.email,
      authorRole: teacher.role,
      authorRoleTitle: teacher.roleTitle,
      departmentId: teacher.departmentId,
      departmentName: teacher.departmentName,
      isHomeroomReport: Boolean(teacher.isHomeroomTeacher || period.targetAudience === 'homeroom_teachers'),
      homeroomClass: teacher.homeroomClass,
      homeroomStudentCount: teacher.homeroomStudentCount,
      homeroomCampus: teacher.homeroomCampus,
      title: `${period.title}${classText} - ${teacher.name}`,
      content: note || `Báo cáo công tác đã hoàn thành đầy đủ cho đợt "${period.title}". Ban Giám Hiệu xác nhận ghi nhận trên hệ thống.`,
      attachments: [],
      status: 'submitted',
      submittedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isLate,
      reviewHistory: [],
      version: 1
    };

    const cleanSub: ReportSubmission = JSON.parse(JSON.stringify(newSub));
    const updated = StorageService.saveSubmission(cleanSub);
    setSubmissions(updated);
    setLocal('dbk_submissions_data', updated);

    // Save to server API immediately
    try {
      await ApiService.saveSubmission(cleanSub);
    } catch (apiErr) {
      console.warn('ApiService save error in confirmSubmissionForTeacher:', apiErr);
    }

    return cleanSub;
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
    const updated = StorageService.deleteSubmission(id);
    setSubmissions(updated);
    setLocal('dbk_submissions_data', updated);
    try {
      await ApiService.deleteSubmission(id);
    } catch (e) {
      console.warn('ApiService delete error:', e);
    }
  };

  const bulkDeleteReports = async (ids: string[]) => {
    let current = submissions;
    for (const id of ids) {
      current = StorageService.deleteSubmission(id);
    }
    setSubmissions(current);
    setLocal('dbk_submissions_data', current);
    try {
      await ApiService.batchDeleteSubmissions(ids);
    } catch (e) {
      console.warn('ApiService batch delete error:', e);
    }
  };

  const deduplicateSubmissions = async (): Promise<{ removedCount: number }> => {
    try {
      const res = await ApiService.deduplicateSubmissions();
      if (res && res.submissions) {
        setSubmissions(res.submissions);
        setLocal('dbk_submissions_data', res.submissions);
        return { removedCount: res.removedCount };
      }
    } catch (e) {
      console.warn('Deduplication error:', e);
    }
    return { removedCount: 0 };
  };

  const clearAllReports = async (): Promise<{ count: number }> => {
    const count = submissions.length;
    StorageService.clearAllSubmissions();
    setSubmissions([]);
    setLocal('dbk_submissions_data', []);
    localStorage.setItem('dbk_submissions_cleared_by_user', 'true');
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
  };

  const clearAllPeriods = async (): Promise<{ count: number }> => {
    const count = periods.length;
    StorageService.clearAllPeriods();
    setPeriods([]);
    setLocal('dbk_periods_data', []);
    localStorage.setItem('dbk_periods_cleared_by_user', 'true');
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

  const updateSchoolLogo = (logoUrl: string) => {
    const updated = StorageService.saveSchoolLogo(logoUrl);
    setSchoolInfo(updated);
  };

  const removeSchoolLogo = () => {
    const updated = StorageService.removeSchoolLogo();
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
        confirmSubmissionForTeacher,
        syncWithServer,
        deduplicateSubmissions,
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
        updateSchoolLogo,
        removeSchoolLogo,
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
