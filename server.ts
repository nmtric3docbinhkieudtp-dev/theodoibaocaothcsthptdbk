import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, deleteDoc } from 'firebase/firestore';
import appletConfig from './firebase-applet-config.json' with { type: 'json' };

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const PERIODS_FILE = path.join(DATA_DIR, 'periods.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory data store with file backing
function readSubmissions(): any[] {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const content = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (e) {
    console.warn('Error reading submissions.json:', e);
  }
  return [];
}

function saveSubmissions(data: any[]) {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving submissions.json:', e);
  }
}

function readPeriods(): any[] {
  try {
    if (fs.existsSync(PERIODS_FILE)) {
      const content = fs.readFileSync(PERIODS_FILE, 'utf-8');
      return JSON.parse(content) || [];
    }
  } catch (e) {
    console.warn('Error reading periods.json:', e);
  }
  return [];
}

function savePeriods(data: any[]) {
  try {
    fs.writeFileSync(PERIODS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving periods.json:', e);
  }
}

// Optional background Firestore sync
function trySyncToFirestore(collectionName: string, docId: string, data: any) {
  try {
    if (!appletConfig.apiKey || !appletConfig.projectId) return;
    const app = getApps().length ? getApp() : initializeApp({
      apiKey: appletConfig.apiKey,
      authDomain: appletConfig.authDomain,
      projectId: appletConfig.projectId,
      storageBucket: appletConfig.storageBucket,
      messagingSenderId: appletConfig.messagingSenderId,
      appId: appletConfig.appId,
    });
    const db = getFirestore(app, appletConfig.firestoreDatabaseId);
    setDoc(doc(db, collectionName, docId), data).catch(err => {
      // Ignored if quota exceeded
    });
  } catch {}
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Get all submissions
  app.get('/api/submissions', (req, res) => {
    const list = readSubmissions();
    res.json(list);
  });

  // Save or update single submission
  app.post('/api/submissions', (req, res) => {
    const submission = req.body;
    if (!submission || !submission.id) {
      return res.status(400).json({ error: 'Missing submission id' });
    }

    const list = readSubmissions();
    const index = list.findIndex(s => s.id === submission.id);
    if (index >= 0) {
      list[index] = { ...list[index], ...submission };
    } else {
      list.unshift(submission);
    }
    saveSubmissions(list);

    // Try background Firestore write
    trySyncToFirestore('submissions', submission.id, submission);

    res.json({ success: true, submission });
  });

  // Batch sync submissions (handles cross-device sync when clients connect)
  app.post('/api/submissions/batch-sync', (req, res) => {
    const clientSubs: any[] = req.body?.submissions || [];
    const serverSubs = readSubmissions();
    const subMap = new Map<string, any>();

    // Load server items first
    serverSubs.forEach(s => subMap.set(s.id, s));

    // Merge or add client items
    let newItemsCount = 0;
    clientSubs.forEach(cs => {
      if (!cs || !cs.id) return;
      if (!subMap.has(cs.id)) {
        subMap.set(cs.id, cs);
        newItemsCount++;
        trySyncToFirestore('submissions', cs.id, cs);
      } else {
        const existing = subMap.get(cs.id);
        const existingTime = new Date(existing.updatedAt || existing.submittedAt || 0).getTime();
        const clientTime = new Date(cs.updatedAt || cs.submittedAt || 0).getTime();
        if (clientTime > existingTime) {
          subMap.set(cs.id, cs);
          trySyncToFirestore('submissions', cs.id, cs);
        }
      }
    });

    const mergedList = Array.from(subMap.values());
    mergedList.sort((a, b) => new Date(b.updatedAt || b.submittedAt || 0).getTime() - new Date(a.updatedAt || a.submittedAt || 0).getTime());
    saveSubmissions(mergedList);

    res.json({ 
      success: true, 
      total: mergedList.length, 
      added: newItemsCount, 
      submissions: mergedList 
    });
  });

  // Delete submission
  app.delete('/api/submissions/:id', (req, res) => {
    const { id } = req.params;
    const list = readSubmissions().filter(s => s.id !== id);
    saveSubmissions(list);

    try {
      if (appletConfig.apiKey && appletConfig.projectId) {
        const app = getApps().length ? getApp() : initializeApp({
          apiKey: appletConfig.apiKey,
          authDomain: appletConfig.authDomain,
          projectId: appletConfig.projectId,
          storageBucket: appletConfig.storageBucket,
          messagingSenderId: appletConfig.messagingSenderId,
          appId: appletConfig.appId,
        });
        const db = getFirestore(app, appletConfig.firestoreDatabaseId);
        deleteDoc(doc(db, 'submissions', id)).catch(() => {});
      }
    } catch {}

    res.json({ success: true, id });
  });

  // Get periods
  app.get('/api/periods', (req, res) => {
    res.json(readPeriods());
  });

  // Save period
  app.post('/api/periods', (req, res) => {
    const period = req.body;
    if (!period || !period.id) {
      return res.status(400).json({ error: 'Missing period id' });
    }
    const list = readPeriods();
    const index = list.findIndex(p => p.id === period.id);
    if (index >= 0) {
      list[index] = period;
    } else {
      list.unshift(period);
    }
    savePeriods(list);
    trySyncToFirestore('periods', period.id, period);
    res.json({ success: true, period });
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
