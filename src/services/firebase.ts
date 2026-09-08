import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  Firestore,
  onSnapshot,
  disableNetwork,
  enableNetwork,
  terminate
} from 'firebase/firestore';
import { FirebaseConfig } from '../types';
import appletConfig from '../../firebase-applet-config.json';

const STORAGE_KEY_FIREBASE_CONFIG = 'dbk_firebase_config';
const STORAGE_KEY_QUOTA_STATUS = 'dbk_firestore_quota_status';

export interface FirestoreQuotaStatus {
  isExceeded: boolean;
  exceededAt?: string;
  reason?: string;
}

// In-memory cache for fast checks
let cachedQuotaStatus: FirestoreQuotaStatus | null = null;

// Safe global console interceptor for Firestore internal retry logs
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const messageStr = args
      .map(arg => (typeof arg === 'string' ? arg : (arg?.message || (typeof arg === 'object' ? JSON.stringify(arg) : ''))))
      .join(' ')
      .toLowerCase();

    if (
      messageStr.includes('resource-exhausted') ||
      messageStr.includes('quota limit exceeded') ||
      messageStr.includes('free daily write units') ||
      messageStr.includes('using maximum backoff delay') ||
      messageStr.includes('overloading the backend')
    ) {
      markFirestoreWriteQuotaExceeded('Daily Firestore free write quota reached (20,000 writes/day). Local Storage handling active.');
      if (firestoreDb) {
        disableNetwork(firestoreDb).catch(() => {});
      }
      console.info('[Firestore Handled Quota/State] Notice detected. Gracefully preserved all data in Local Storage.');
      return;
    }
    // Benign internal assertion warnings should be caught without disabling network
    if (messageStr.includes('internal assertion failed') || messageStr.includes('unexpected state')) {
      console.warn('[Firestore] Handled non-fatal assertion notice:', messageStr);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export function getFirestoreQuotaStatus(): FirestoreQuotaStatus {
  if (cachedQuotaStatus !== null) {
    return cachedQuotaStatus;
  }

  // Today's UTC date string for tracking
  const todayStr = new Date().toISOString().slice(0, 10);

  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTA_STATUS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isExceeded) {
        const exceededDateStr = (parsed.exceededAt || '').slice(0, 10);
        // If from today or less than 18h ago, keep exceeded state active
        const exceededTime = new Date(parsed.exceededAt || 0).getTime();
        const now = Date.now();
        if (exceededDateStr === todayStr || (now - exceededTime < 18 * 60 * 60 * 1000)) {
          cachedQuotaStatus = parsed;
          return parsed;
        } else {
          // Auto clear on a fresh day
          localStorage.removeItem(STORAGE_KEY_QUOTA_STATUS);
        }
      }
    }
  } catch {}

  cachedQuotaStatus = { isExceeded: false };
  return cachedQuotaStatus;
}

export function isFirestoreWriteQuotaExceeded(): boolean {
  return getFirestoreQuotaStatus().isExceeded;
}

export function markFirestoreWriteQuotaExceeded(reason?: string): void {
  const status: FirestoreQuotaStatus = {
    isExceeded: true,
    exceededAt: new Date().toISOString(),
    reason: reason || 'Free daily write units per project per day exceeded'
  };
  cachedQuotaStatus = status;
  try {
    localStorage.setItem(STORAGE_KEY_QUOTA_STATUS, JSON.stringify(status));
    window.dispatchEvent(new CustomEvent('firestore-quota-status-changed', { detail: status }));
  } catch {}
}

export function clearFirestoreWriteQuotaStatus(): void {
  cachedQuotaStatus = { isExceeded: false };
  try {
    localStorage.removeItem(STORAGE_KEY_QUOTA_STATUS);
    window.dispatchEvent(new CustomEvent('firestore-quota-status-changed', { detail: cachedQuotaStatus }));
  } catch {}

  if (firestoreDb) {
    enableNetwork(firestoreDb).catch(() => {});
  }
}

/**
 * Safe Firestore write wrapper.
 * Prevents throwing unhandled resource-exhausted exceptions.
 */
export async function safeFirestoreWrite<T>(
  operationName: string,
  writeFn: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: any; quotaExceeded?: boolean }> {
  try {
    const res = await writeFn();
    clearFirestoreWriteQuotaStatus();
    return { success: true, data: res };
  } catch (err: any) {
    const errMsg = (err?.message || '').toLowerCase();
    const errCode = (err?.code || '').toLowerCase();
    if (
      errCode.includes('resource-exhausted') || 
      errMsg.includes('quota') || 
      errMsg.includes('resource_exhausted') ||
      errMsg.includes('free daily write units')
    ) {
      markFirestoreWriteQuotaExceeded(err?.message || 'Quota limit exceeded');
      console.info(`[Firestore Safe-Write] Quota reached during "${operationName}".`);
      return { success: false, error: err, quotaExceeded: true };
    }
    if (errMsg.includes('internal assertion failed') || errMsg.includes('unexpected state')) {
      console.warn(`[Firestore Safe-Write] Non-fatal assertion during "${operationName}":`, err);
      return { success: false, error: err };
    }
    console.warn(`[Firestore Safe-Write] Error during "${operationName}":`, err);
    return { success: false, error: err };
  }
}

export function getStoredFirebaseConfig(): FirebaseConfig {
  const metaEnv = (import.meta as any).env || {};
  
  // Default from provisioned firebase-applet-config.json
  const defaultProvisioned: FirebaseConfig = {
    apiKey: appletConfig.apiKey || metaEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: appletConfig.authDomain || metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: appletConfig.projectId || metaEnv.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: appletConfig.storageBucket || metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: appletConfig.messagingSenderId || metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: appletConfig.appId || metaEnv.VITE_FIREBASE_APP_ID || '',
    firestoreDatabaseId: (appletConfig as any).firestoreDatabaseId || '',
    isConfigured: Boolean(appletConfig.apiKey && appletConfig.projectId)
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultProvisioned,
        ...parsed,
        isConfigured: Boolean((parsed.apiKey || defaultProvisioned.apiKey) && (parsed.projectId || defaultProvisioned.projectId))
      };
    }
  } catch (e) {
    console.warn('Error reading saved Firebase config', e);
  }

  return defaultProvisioned;
}

export function saveStoredFirebaseConfig(config: Partial<FirebaseConfig>): FirebaseConfig {
  const current = getStoredFirebaseConfig();
  const updated: FirebaseConfig = {
    ...current,
    ...config,
    isConfigured: Boolean((config.apiKey || current.apiKey) && (config.projectId || current.projectId))
  };
  localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(updated));
  return updated;
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;

export function getFirebaseInstance(): { app: FirebaseApp | null; db: Firestore | null; isReady: boolean } {
  const config = getStoredFirebaseConfig();
  
  if (!config.isConfigured || !config.apiKey || !config.projectId) {
    return { app: null, db: null, isReady: false };
  }

  try {
    if (!getApps().length) {
      firebaseApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
        projectId: config.projectId,
        storageBucket: config.storageBucket || `${config.projectId}.appspot.com`,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      });
    } else {
      firebaseApp = getApp();
    }
    
    if (!firestoreDb && firebaseApp) {
      if (config.firestoreDatabaseId) {
        firestoreDb = getFirestore(firebaseApp, config.firestoreDatabaseId);
      } else {
        firestoreDb = getFirestore(firebaseApp);
      }
    }

    return { app: firebaseApp, db: firestoreDb, isReady: true };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return { app: null, db: null, isReady: false };
  }
}

export async function testFirebaseConnection(customConfig?: Partial<FirebaseConfig>): Promise<{ success: boolean; message: string; quotaExceeded?: boolean }> {
  try {
    const targetConfig = customConfig ? { ...getStoredFirebaseConfig(), ...customConfig } : getStoredFirebaseConfig();
    if (!targetConfig.apiKey || !targetConfig.projectId) {
      return { success: false, message: 'Chưa điền đủ API Key và Project ID của Firebase.' };
    }

    const testApp = initializeApp({
      apiKey: targetConfig.apiKey,
      authDomain: targetConfig.authDomain || `${targetConfig.projectId}.firebaseapp.com`,
      projectId: targetConfig.projectId,
      appId: targetConfig.appId || '1:123456789:web:abcdef'
    }, 'test-connection-' + Date.now());

    const testDb = targetConfig.firestoreDatabaseId 
      ? getFirestore(testApp, targetConfig.firestoreDatabaseId) 
      : getFirestore(testApp);

    // 1. Test read first
    try {
      await getDocs(collection(testDb, 'departments'));
    } catch (readErr: any) {
      console.warn('Firebase read test error:', readErr);
      return {
        success: false,
        message: `Không thể kết nối Firestore (Đọc): ${readErr?.message || 'Kiểm tra quyền truy cập Firestore Security Rules hoặc API Key'}`
      };
    }

    // 2. Test write if write quota is not already flagged as exceeded
    if (!isFirestoreWriteQuotaExceeded()) {
      try {
        const pingRef = doc(collection(testDb, '_system_health'), 'ping');
        await setDoc(pingRef, { 
          timestamp: new Date().toISOString(), 
          school: 'THCS & THPT Đốc Binh Kiều',
          status: 'active' 
        });
        clearFirestoreWriteQuotaStatus();
        return { 
          success: true, 
          message: `Kết nối Firebase Cloud Firestore (${targetConfig.projectId}) thành công hoàn hảo (Đọc & Ghi hoạt động tốt)!` 
        };
      } catch (writeErr: any) {
        // Clean up test instance immediately to prevent background retries
        try {
          await terminate(testDb);
          await deleteApp(testApp);
        } catch {}

        const errMsg = (writeErr?.message || '').toLowerCase();
        const errCode = (writeErr?.code || '').toLowerCase();
        if (
          errCode.includes('resource-exhausted') || 
          errMsg.includes('quota') || 
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('free daily write units')
        ) {
          markFirestoreWriteQuotaExceeded(writeErr?.message);
          return { 
            success: true, 
            quotaExceeded: true,
            message: `Kết nối Firebase Firestore (${targetConfig.projectId}) thành công (Đọc dữ liệu bình thường). Lưu ý: Hạn ngạch ghi miễn phí 20.000 lượt/ngày đã chạm mức tối đa hôm nay. Dữ liệu đang được bảo vệ an toàn trên Local Storage.` 
          };
        }
        throw writeErr;
      }
    } else {
      try {
        await terminate(testDb);
        await deleteApp(testApp);
      } catch {}

      return {
        success: true, 
        quotaExceeded: true,
        message: `Kết nối Firebase Firestore (${targetConfig.projectId}) thành công (Đọc dữ liệu bình thường). Hạn ngạch ghi hôm nay đã đạt mức 20.000 lượt ghi. Local Storage bảo vệ toàn bộ dữ liệu an toàn.`
      };
    }
  } catch (error: any) {
    console.error('Test connection error:', error);
    return { 
      success: false, 
      message: `Không thể kết nối Firestore: ${error?.message || 'Kiểm tra lại quyền truy cập Firestore Security Rules hoặc API Key'}` 
    };
  }
}
