import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Global server process error guards to ensure 100% server uptime
process.on('uncaughtException', (err) => {
  console.warn('[Server Handled Exception]:', err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.warn('[Server Handled Rejection]:', reason);
});

const DATA_DIR = path.join(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const PERIODS_FILE = path.join(DATA_DIR, 'periods.json');
const DELETED_FILE = path.join(DATA_DIR, 'deleted_submissions.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure data and uploads directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function readDeletedIds(): Set<string> {
  try {
    if (fs.existsSync(DELETED_FILE)) {
      const arr = JSON.parse(fs.readFileSync(DELETED_FILE, 'utf-8'));
      return new Set(arr);
    }
  } catch (e) {
    console.warn('Error reading deleted_submissions.json:', e);
  }
  return new Set();
}

function saveDeletedIds(set: Set<string>) {
  try {
    fs.writeFileSync(DELETED_FILE, JSON.stringify(Array.from(set)), 'utf-8');
  } catch (e) {
    console.error('Error saving deleted_submissions.json:', e);
  }
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
    const serialized = JSON.stringify(data, null, 2);
    if (fs.existsSync(SUBMISSIONS_FILE) && fs.readFileSync(SUBMISSIONS_FILE, 'utf-8') === serialized) {
      return;
    }
    fs.writeFileSync(SUBMISSIONS_FILE, serialized, 'utf-8');
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

// Note: Client-side React app handles direct Firestore sync via Web SDK.
// The Node backend acts as a high-performance local persistent store and API cache.

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

  // Upload report attachment endpoint (supports up to 15MB file uploads safely on server)
  app.post('/api/upload', (req, res) => {
    try {
      const { name, size, type, data } = req.body || {};
      if (!name || !data) {
        return res.status(400).json({ error: 'Thiếu tên tệp hoặc dữ liệu tệp' });
      }

      const fileId = 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      const safeName = (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
      const filename = `${fileId}_${safeName}`;
      const filePath = path.join(UPLOADS_DIR, filename);

      // Extract base64 content
      const base64Data = data.includes(';base64,') ? data.split(';base64,')[1] : data;
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);

      const fileMeta = {
        id: fileId,
        name: name,
        size: size || buffer.length,
        type: type || 'application/octet-stream',
        url: `/api/files/${fileId}`,
        uploadedAt: new Date().toISOString()
      };

      res.json({ success: true, file: fileMeta });
    } catch (e: any) {
      console.error('File upload error:', e);
      res.status(500).json({ error: e.message || 'Lỗi lưu tệp lên máy chủ' });
    }
  });

  // Serve uploaded report attachment file
  app.get('/api/files/:fileId', (req, res) => {
    try {
      const { fileId } = req.params;
      if (!fileId || !fs.existsSync(UPLOADS_DIR)) {
        return res.status(404).send('Không tìm thấy tệp đính kèm');
      }

      const files = fs.readdirSync(UPLOADS_DIR);
      const matched = files.find(f => f.startsWith(fileId));
      if (!matched) {
        return res.status(404).send('Không tìm thấy tệp đính kèm');
      }

      const fullPath = path.join(UPLOADS_DIR, matched);
      const originalName = matched.includes('_') ? matched.split('_').slice(1).join('_') : matched;
      res.download(fullPath, originalName);
    } catch (e: any) {
      console.error('File serve error:', e);
      res.status(500).send('Lỗi tải tệp đính kèm');
    }
  });

  // Get all submissions
  app.get('/api/submissions', (req, res) => {
    const deletedIds = readDeletedIds();
    const list = readSubmissions().filter(s => !deletedIds.has(s.id));
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

    res.json({ success: true, submission });
  });

  // Batch sync submissions (handles cross-device sync when clients connect)
  app.post('/api/submissions/batch-sync', (req, res) => {
    const clientSubs: any[] = req.body?.submissions || [];
    const serverSubs = readSubmissions();
    const deletedIds = readDeletedIds();
    const subMap = new Map<string, any>();

    // Load server items first (skipping deleted ones)
    serverSubs.forEach(s => {
      if (!deletedIds.has(s.id)) {
        subMap.set(s.id, s);
      }
    });

    // Merge or add client items (ignore deleted)
    let newItemsCount = 0;
    clientSubs.forEach(cs => {
      if (!cs || !cs.id || deletedIds.has(cs.id)) return;
      if (!subMap.has(cs.id)) {
        subMap.set(cs.id, cs);
        newItemsCount++;
      } else {
        const existing = subMap.get(cs.id);
        const existingTime = new Date(existing.updatedAt || existing.submittedAt || 0).getTime();
        const clientTime = new Date(cs.updatedAt || cs.submittedAt || 0).getTime();
        if (clientTime > existingTime) {
          subMap.set(cs.id, cs);
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
    const deletedIds = readDeletedIds();
    deletedIds.add(id);
    saveDeletedIds(deletedIds);

    const list = readSubmissions().filter(s => s.id !== id);
    saveSubmissions(list);

    res.json({ success: true, id, remainingCount: list.length });
  });

  // Batch delete submissions
  app.post('/api/submissions/batch-delete', (req, res) => {
    const ids: string[] = req.body?.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const deletedIds = readDeletedIds();
    ids.forEach(id => deletedIds.add(id));
    saveDeletedIds(deletedIds);

    const set = new Set(ids);
    const list = readSubmissions().filter(s => !set.has(s.id));
    saveSubmissions(list);

    res.json({ success: true, deletedCount: ids.length, remainingCount: list.length });
  });

  // Deduplicate submissions (auto-clean duplicate submissions for same user in same period)
  app.post('/api/submissions/deduplicate', (req, res) => {
    const list = readSubmissions();
    const deletedIds = readDeletedIds();
    const periodsList = readPeriods();
    const multiplePeriodIds = new Set(
      periodsList.filter(p => p.allowMultipleSubmissions || p.title?.toLowerCase().includes('nghỉ phép') || p.title?.toLowerCase().includes('xin phép')).map(p => p.id)
    );
    
    // Group submissions by periodId + authorId
    const groups = new Map<string, any[]>();
    for (const sub of list) {
      const isMulti = multiplePeriodIds.has(sub.periodId) || 
        sub.submissionSequence !== undefined ||
        (sub.periodTitle && (sub.periodTitle.toLowerCase().includes('nghỉ phép') || sub.periodTitle.toLowerCase().includes('xin phép')));
      
      // If period allows multiple submissions, each submission has its own group key so it is never merged or removed
      const key = isMulti ? sub.id : `${sub.periodId || 'default'}_${sub.authorId || sub.authorEmail || sub.authorName}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(sub);
    }

    const cleaned: any[] = [];
    let removedCount = 0;

    for (const [, subs] of groups.entries()) {
      if (subs.length === 1) {
        cleaned.push(subs[0]);
      } else {
        // Sort: prefer status === 'submitted' > 'principal_approved' > latest submittedAt / updatedAt
        subs.sort((a, b) => {
          // If one is draft and one is submitted, pick submitted
          if (a.status !== 'draft' && b.status === 'draft') return -1;
          if (a.status === 'draft' && b.status !== 'draft') return 1;

          const timeA = new Date(a.submittedAt || a.updatedAt || 0).getTime();
          const timeB = new Date(b.submittedAt || b.updatedAt || 0).getTime();
          return timeB - timeA;
        });

        // Keep the first (best/latest)
        cleaned.push(subs[0]);

        // Mark the remaining older duplicates as deleted
        for (let i = 1; i < subs.length; i++) {
          deletedIds.add(subs[i].id);
          removedCount++;
        }
      }
    }

    saveDeletedIds(deletedIds);
    saveSubmissions(cleaned);

    res.json({
      success: true,
      removedCount,
      totalRemaining: cleaned.length,
      submissions: cleaned
    });
  });

  // Waive late submission status (Miễn trừ nộp trễ do sự cố hệ thống/mạng)
  app.post('/api/submissions/waive-late', (req, res) => {
    const { submissionId, periodId } = req.body || {};
    const list = readSubmissions();
    let waivedCount = 0;
    const updated = list.map(s => {
      const match = submissionId ? s.id === submissionId : periodId ? s.periodId === periodId : true;
      if (match && s.isLate) {
        waivedCount++;
        const fixed = {
          ...s,
          isLate: false,
          lateDurationMinutes: 0,
          lateWaived: true,
          lateWaivedBy: 'Ban Giám Hiệu (Miễn trừ do sự cố kỹ thuật hệ thống)',
          updatedAt: new Date().toISOString()
        };
        return fixed;
      }
      return s;
    });

    if (waivedCount > 0) {
      saveSubmissions(updated);
    }

    res.json({
      success: true,
      waivedCount,
      submissions: updated
    });
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
    res.json({ success: true, period });
  });

  // Batch sync periods
  app.post('/api/periods/batch-sync', (req, res) => {
    const clientPeriods: any[] = req.body?.periods || [];
    const serverPeriods = readPeriods();
    const periodMap = new Map<string, any>();
    
    serverPeriods.forEach(p => {
      if (p && p.id) periodMap.set(p.id, p);
    });
    
    clientPeriods.forEach(cp => {
      if (!cp || !cp.id) return;
      if (!periodMap.has(cp.id)) {
        periodMap.set(cp.id, cp);
      } else {
        const existing = periodMap.get(cp.id);
        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
        const clientTime = new Date(cp.updatedAt || cp.createdAt || 0).getTime();
        if (clientTime >= existingTime) {
          periodMap.set(cp.id, cp);
        }
      }
    });

    const merged = Array.from(periodMap.values());
    merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    savePeriods(merged);
    res.json({ success: true, total: merged.length, periods: merged });
  });

  // Delete period
  app.delete('/api/periods/:id', (req, res) => {
    const { id } = req.params;
    const list = readPeriods().filter(p => p.id !== id);
    savePeriods(list);
    res.json({ success: true, id, remainingCount: list.length });
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
