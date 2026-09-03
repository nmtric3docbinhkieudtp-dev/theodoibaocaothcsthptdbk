import { 
  ReportSubmission, 
  ReportPeriod, 
  User, 
  Department, 
  AppNotification, 
  EmailLog, 
  SchoolInfo 
} from '../types';
import { 
  INITIAL_SCHOOL_INFO, 
  INITIAL_DEPARTMENTS, 
  INITIAL_USERS, 
  INITIAL_PERIODS, 
  INITIAL_SUBMISSIONS, 
  INITIAL_NOTIFICATIONS 
} from '../data/initialData';
import { getFirebaseInstance } from './firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEYS = {
  USERS: 'dbk_users_data',
  DEPARTMENTS: 'dbk_departments_data',
  PERIODS: 'dbk_periods_data',
  SUBMISSIONS: 'dbk_submissions_data',
  NOTIFICATIONS: 'dbk_notifications_data',
  EMAIL_LOGS: 'dbk_email_logs_data',
  SCHOOL_INFO: 'dbk_school_info_data',
  SEEDED: 'dbk_seeded_v17_homeroom_minutes_period_sync'
};

// Safe LocalStorage helpers
export function cleanFirestorePayload<T>(obj: T): T {
  if (obj === undefined) {
    return null as any;
  }
  if (obj === null) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestorePayload(item)) as any;
  }
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        res[k] = cleanFirestorePayload(v);
      }
    }
    return res as T;
  }
  return obj;
}

export function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

export function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
  }
}

export const VALID_DEPT_IDS = ['van_phong', 'toan', 'ngu_van_tv_tb', 'su_dia_gdcd', 'khtn_cn', 'nn_tin', 'gdtc_qp_nt'];

export function initializeDatabaseIfNeeded(forceReset = false) {
  const isSeeded = localStorage.getItem(STORAGE_KEYS.SEEDED);
  const currentUsers = getLocal<User[]>(STORAGE_KEYS.USERS, []);
  const currentDepts = getLocal<Department[]>(STORAGE_KEYS.DEPARTMENTS, []);
  
  const hasOutdatedDepts = currentDepts.some(d => 
    !VALID_DEPT_IDS.includes(d.id) ||
    d.id === 'bgh' ||
    d.name.includes('Khoa học') || 
    d.name.includes('Tự nhiên') ||
    d.name.includes('Xã hội') ||
    (d.id === 'toan' && !d.headUserName?.includes('Nguyễn Văn Tới'))
  );

  const hasOldUserIds = currentUsers.some(u => u.id.startsWith('user-toan') || u.id === 'user-bgh-1' || u.id === 'user-admin');

  if (forceReset || !isSeeded || currentUsers.length < 100 || currentDepts.length !== 7 || hasOutdatedDepts || hasOldUserIds) {
    setLocal(STORAGE_KEYS.SCHOOL_INFO, INITIAL_SCHOOL_INFO);
    setLocal(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    setLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
    setLocal(STORAGE_KEYS.PERIODS, INITIAL_PERIODS);
    setLocal(STORAGE_KEYS.SUBMISSIONS, INITIAL_SUBMISSIONS);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    setLocal(STORAGE_KEYS.EMAIL_LOGS, []);
    localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');

    // Set active user key to Thầy Nguyễn Minh Trí (staff-2)
    localStorage.setItem('dbk_active_user_id', 'staff-2');
  }
}

export const StorageService = {
  // --- USERS ---
  getUsers(): User[] {
    initializeDatabaseIfNeeded();
    const stored = getLocal<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    // Check if homeroom data, dept_head data, or Phan Van Tat position needs syncing
    const hrCount = stored.filter(u => u.isHomeroomTeacher).length;
    const deptHeadCount = stored.filter(u => u.role === 'dept_head').length;
    const isTatFixed = stored.some(u => u.name === 'Phan Văn Tặt' && u.role === 'teacher' && u.roleTitle.includes('Giáo viên'));
    if (hrCount < 50 || deptHeadCount < 7 || !isTatFixed) {
      setLocal(STORAGE_KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }
    return stored;
  },

  saveUser(user: User): User[] {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    let updated: User[];
    if (index >= 0) {
      updated = [...users];
      updated[index] = user;
    } else {
      updated = [user, ...users];
    }
    setLocal(STORAGE_KEYS.USERS, updated);
    
    // Background sync to Firestore if enabled
    const { db, isReady } = getFirebaseInstance();
    if (isReady && db) {
      try {
        const sanitized = cleanFirestorePayload(user);
        setDoc(doc(db, 'users', user.id), sanitized).catch(err => console.warn('Firestore user save err:', err));
      } catch (e) {
        console.warn('Sync user error:', e);
      }
    }
    return updated;
  },

  // --- DEPARTMENTS ---
  getDepartments(): Department[] {
    initializeDatabaseIfNeeded();
    const stored = getLocal<Department[]>(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    const isValid = stored.length === 7 && stored.every(d => VALID_DEPT_IDS.includes(d.id));
    if (!isValid) {
      setLocal(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
      return INITIAL_DEPARTMENTS;
    }
    return stored;
  },

  saveDepartment(dept: Department): Department[] {
    const depts = this.getDepartments();
    const index = depts.findIndex(d => d.id === dept.id);
    let updated: Department[];
    if (index >= 0) {
      updated = [...depts];
      updated[index] = dept;
    } else {
      updated = [...depts, dept];
    }
    setLocal(STORAGE_KEYS.DEPARTMENTS, updated);

    const { db, isReady } = getFirebaseInstance();
    if (isReady && db) {
      try {
        const sanitized = cleanFirestorePayload(dept);
        setDoc(doc(db, 'departments', dept.id), sanitized).catch(err => console.warn('Firestore dept save err:', err));
      } catch (e) {
        console.warn('Sync dept error:', e);
      }
    }
    return updated;
  },

  // --- PERIODS (CAMPAIGNS) ---
  getPeriods(): ReportPeriod[] {
    initializeDatabaseIfNeeded();
    return getLocal<ReportPeriod[]>(STORAGE_KEYS.PERIODS, []);
  },

  savePeriod(period: ReportPeriod): ReportPeriod[] {
    const periods = this.getPeriods();
    const index = periods.findIndex(p => p.id === period.id);
    let updated: ReportPeriod[];
    if (index >= 0) {
      updated = [...periods];
      updated[index] = period;
    } else {
      updated = [period, ...periods];
    }
    setLocal(STORAGE_KEYS.PERIODS, updated);

    const { db, isReady } = getFirebaseInstance();
    if (isReady && db) {
      try {
        const sanitized = cleanFirestorePayload(period);
        setDoc(doc(db, 'periods', period.id), sanitized).catch(err => console.warn('Firestore period save err:', err));
      } catch (e) {
        console.warn('Sync period error:', e);
      }
    }
    return updated;
  },

  deletePeriod(periodId: string): ReportPeriod[] {
    const periods = this.getPeriods().filter(p => p.id !== periodId);
    setLocal(STORAGE_KEYS.PERIODS, periods);

    const { db, isReady } = getFirebaseInstance();
    if (isReady && db) {
      deleteDoc(doc(db, 'periods', periodId)).catch(err => console.warn('Firestore period delete err:', err));
    }
    return periods;
  },

  clearAllPeriods(): ReportPeriod[] {
    setLocal(STORAGE_KEYS.PERIODS, []);
    localStorage.setItem('dbk_periods_cleared_by_user', 'true');
    const { db, isReady } = getFirebaseInstance();
    if (isReady && db) {
      getDocs(collection(db, 'periods')).then(snap => {
        snap.forEach(d => {
          deleteDoc(doc(db, 'periods', d.id)).catch(() => {});
        });
      }).catch(err => console.warn('Firestore clear periods err:', err));
    }
    return [];
  },

  // --- SUBMISSIONS ---
  getSubmissions(): ReportSubmission[] {
    initializeDatabaseIfNeeded();
    return getLocal<ReportSubmission[]>(STORAGE_KEYS.SUBMISSIONS, []);
  },

  saveSubmission(submission: ReportSubmission): ReportSubmission[] {
    const subs = this.getSubmissions();
    const index = subs.findIndex(s => s.id === submission.id);
    let updated: ReportSubmission[];
    if (index >= 0) {
      updated = [...subs];
      updated[index] = submission;
    } else {
      updated = [submission, ...subs];
    }
    setLocal(STORAGE_KEYS.SUBMISSIONS, updated);

    const { db, isReady } = getFirebaseInstance();
    if (isReady && db) {
      try {
        const sanitized = cleanFirestorePayload(submission);
        setDoc(doc(db, 'submissions', submission.id), sanitized).catch(err => console.warn('Firestore submission save err:', err));
      } catch (e) {
        console.warn('Sync submission error:', e);
      }
    }
    return updated;
  },

  deleteSubmission(submissionId: string): ReportSubmission[] {
    const subs = this.getSubmissions().filter(s => s.id !== submissionId);
    setLocal(STORAGE_KEYS.SUBMISSIONS, subs);

    const { db, isReady } = getFirebaseInstance();
    if (isReady && db) {
      deleteDoc(doc(db, 'submissions', submissionId)).catch(err => console.warn('Firestore submission delete err:', err));
    }
    return subs;
  },

  clearAllSubmissions(): ReportSubmission[] {
    setLocal(STORAGE_KEYS.SUBMISSIONS, []);
    localStorage.setItem('dbk_submissions_cleared_by_user', 'true');
    const { db, isReady } = getFirebaseInstance();
    if (isReady && db) {
      getDocs(collection(db, 'submissions')).then(snap => {
        snap.forEach(d => {
          deleteDoc(doc(db, 'submissions', d.id)).catch(() => {});
        });
      }).catch(err => console.warn('Firestore clear submissions err:', err));
    }
    return [];
  },

  // --- NOTIFICATIONS ---
  getNotifications(userId?: string): AppNotification[] {
    initializeDatabaseIfNeeded();
    const all = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    if (!userId) return all;
    return all.filter(n => n.userId === 'all' || n.userId === userId);
  },

  addNotification(notification: AppNotification): AppNotification[] {
    const all = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = [notification, ...all];
    setLocal(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  markNotificationAsRead(id: string): AppNotification[] {
    const all = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = all.map(n => n.id === id ? { ...n, isRead: true } : n);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  markAllNotificationsAsRead(userId: string): AppNotification[] {
    const all = getLocal<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = all.map(n => (n.userId === 'all' || n.userId === userId) ? { ...n, isRead: true } : n);
    setLocal(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  // --- EMAIL LOGS ---
  getEmailLogs(): EmailLog[] {
    return getLocal<EmailLog[]>(STORAGE_KEYS.EMAIL_LOGS, []);
  },

  logEmail(emailLog: EmailLog): EmailLog[] {
    const current = this.getEmailLogs();
    const updated = [emailLog, ...current];
    setLocal(STORAGE_KEYS.EMAIL_LOGS, updated);
    return updated;
  },

  // --- SCHOOL INFO ---
  getSchoolInfo(): SchoolInfo {
    return getLocal<SchoolInfo>(STORAGE_KEYS.SCHOOL_INFO, INITIAL_SCHOOL_INFO);
  },

  saveSchoolInfo(info: SchoolInfo): SchoolInfo {
    setLocal(STORAGE_KEYS.SCHOOL_INFO, info);
    return info;
  },

  // --- CLOUD FIRESTORE SYNC ALL ---
  async syncAllToFirebase(): Promise<{ success: boolean; count: number; message: string }> {
    const { db, isReady } = getFirebaseInstance();
    if (!isReady || !db) {
      return { success: false, count: 0, message: 'Firebase chưa được kích hoạt hoặc cấu hình không hợp lệ.' };
    }

    try {
      const users = this.getUsers();
      const depts = this.getDepartments();
      const periods = this.getPeriods();
      const submissions = this.getSubmissions();
      const schoolInfo = this.getSchoolInfo();

      // Batch or set individually
      for (const u of users) {
        await setDoc(doc(db, 'users', u.id), u);
      }
      for (const d of depts) {
        await setDoc(doc(db, 'departments', d.id), d);
      }
      for (const p of periods) {
        await setDoc(doc(db, 'periods', p.id), p);
      }
      for (const s of submissions) {
        await setDoc(doc(db, 'submissions', s.id), s);
      }
      await setDoc(doc(db, 'metadata', 'schoolInfo'), schoolInfo);

      const totalItems = users.length + depts.length + periods.length + submissions.length;
      return { 
        success: true, 
        count: totalItems, 
        message: `Đã đồng bộ thành công ${totalItems} bản ghi lên Firebase Firestore!` 
      };
    } catch (e: any) {
      console.error('Sync to Firebase error:', e);
      return { success: false, count: 0, message: `Lỗi đồng bộ: ${e.message || e}` };
    }
  },

  async syncAllFromFirebase(): Promise<{ success: boolean; count: number; message: string }> {
    const { db, isReady } = getFirebaseInstance();
    if (!isReady || !db) {
      return { success: false, count: 0, message: 'Firebase chưa được kích hoạt.' };
    }

    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const deptsSnap = await getDocs(collection(db, 'departments'));
      const periodsSnap = await getDocs(collection(db, 'periods'));
      const subsSnap = await getDocs(collection(db, 'submissions'));

      let importedCount = 0;

      if (!usersSnap.empty) {
        const users: User[] = usersSnap.docs.map(d => d.data() as User);
        setLocal(STORAGE_KEYS.USERS, users);
        importedCount += users.length;
      }
      if (!deptsSnap.empty) {
        const depts: Department[] = deptsSnap.docs.map(d => d.data() as Department);
        setLocal(STORAGE_KEYS.DEPARTMENTS, depts);
        importedCount += depts.length;
      }
      if (!periodsSnap.empty) {
        const periods: ReportPeriod[] = periodsSnap.docs.map(d => d.data() as ReportPeriod);
        setLocal(STORAGE_KEYS.PERIODS, periods);
        importedCount += periods.length;
      }
      if (!subsSnap.empty) {
        const subs: ReportSubmission[] = subsSnap.docs.map(d => d.data() as ReportSubmission);
        setLocal(STORAGE_KEYS.SUBMISSIONS, subs);
        importedCount += subs.length;
      }

      return { 
        success: true, 
        count: importedCount, 
        message: `Đã kéo về thành công ${importedCount} bản ghi từ Firebase Firestore!` 
      };
    } catch (e: any) {
      return { success: false, count: 0, message: `Lỗi tải dữ liệu từ Firebase: ${e.message || e}` };
    }
  },

  // Reset demo data to pristine state
  resetToInitialData(): void {
    localStorage.removeItem(STORAGE_KEYS.SEEDED);
    initializeDatabaseIfNeeded();
  }
};
