import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
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
  onSnapshot
} from 'firebase/firestore';
import { FirebaseConfig } from '../types';
import appletConfig from '../../firebase-applet-config.json';

const STORAGE_KEY_FIREBASE_CONFIG = 'dbk_firebase_config';

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

export async function testFirebaseConnection(customConfig?: Partial<FirebaseConfig>): Promise<{ success: boolean; message: string }> {
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

    // Write test document in a ping collection
    const pingRef = doc(collection(testDb, '_system_health'), 'ping');
    await setDoc(pingRef, { 
      timestamp: new Date().toISOString(), 
      school: 'THCS & THPT Đốc Binh Kiều',
      status: 'active' 
    });
    
    return { 
      success: true, 
      message: `Kết nối Firebase Cloud Firestore (${targetConfig.projectId}) thành công rực rỡ!` 
    };
  } catch (error: any) {
    console.error('Test connection error:', error);
    return { 
      success: false, 
      message: `Không thể kết nối Firestore: ${error?.message || 'Kiểm tra lại quyền truy cập Firestore Security Rules hoặc API Key'}` 
    };
  }
}
