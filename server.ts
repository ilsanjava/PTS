import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_ROSTER } from './src/data/initialRoster';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Directories and data files
const DATA_DIR = path.join(process.cwd(), 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const ROSTER_FILE = path.join(DATA_DIR, 'roster.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers to read/write JSON files safely
function readSubmissions(): any[] {
  try {
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const content = fs.readFileSync(SUBMISSIONS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error('Error reading submissions file:', err);
  }
  return [];
}

function writeSubmissions(data: any[]): void {
  try {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing submissions file:', err);
  }
}

function readRoster(): any[] {
  try {
    if (fs.existsSync(ROSTER_FILE)) {
      const content = fs.readFileSync(ROSTER_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Pre-seed with default INITIAL_ROSTER
    writeRoster(INITIAL_ROSTER);
    return INITIAL_ROSTER;
  } catch (err) {
    console.error('Error reading roster file:', err);
  }
  return INITIAL_ROSTER;
}

function writeRoster(data: any[]): void {
  try {
    fs.writeFileSync(ROSTER_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing roster file:', err);
  }
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET all submissions
app.get('/api/submissions', (_req, res) => {
  const list = readSubmissions();
  res.json({
    success: true,
    total: list.length,
    submissions: list,
  });
});

// POST new single submission
app.post('/api/submissions', (req, res) => {
  try {
    const submission = req.body;
    if (!submission || !submission.nama || !submission.kelas) {
      return res.status(400).json({ success: false, message: 'Data submission tidak lengkap.' });
    }

    const item = {
      id: submission.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: submission.timestamp || new Date().toLocaleString('id-ID'),
      nama: String(submission.nama).trim(),
      kelas: String(submission.kelas).trim(),
      nilai: String(submission.nilai || '0'),
      rincian: String(submission.rincian || ''),
      answers: submission.answers || {},
      syncedToGoogleSheets: !!submission.syncedToGoogleSheets,
      serverReceivedAt: new Date().toISOString(),
    };

    const current = readSubmissions();
    // Prepend newest submission
    current.unshift(item);
    writeSubmissions(current);

    console.log(`[API] Saved submission: ${item.nama} (${item.kelas}) - Nilai: ${item.nilai}`);
    return res.status(201).json({ success: true, submission: item });
  } catch (err: any) {
    console.error('Failed to save submission:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST batch sync submissions (merging client items into server)
app.post('/api/submissions/sync', (req, res) => {
  try {
    const { submissions } = req.body;
    if (!Array.isArray(submissions)) {
      return res.status(400).json({ success: false, message: 'Format batch submissions harus array.' });
    }

    const current = readSubmissions();
    const existingIds = new Set(current.map((s) => s.id));
    // Also track composite key (nama + kelas + nilai + timestamp)
    const existingKeys = new Set(
      current.map((s) => `${s.nama.toLowerCase()}|${s.kelas.toLowerCase()}|${s.timestamp}`)
    );

    let addedCount = 0;
    for (const item of submissions) {
      if (!item.nama || !item.kelas) continue;
      const key = `${String(item.nama).toLowerCase()}|${String(item.kelas).toLowerCase()}|${item.timestamp}`;
      if (!existingIds.has(item.id) && !existingKeys.has(key)) {
        current.push({
          id: item.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          timestamp: item.timestamp || new Date().toLocaleString('id-ID'),
          nama: String(item.nama).trim(),
          kelas: String(item.kelas).trim(),
          nilai: String(item.nilai || '0'),
          rincian: String(item.rincian || ''),
          answers: item.answers || {},
          syncedToGoogleSheets: !!item.syncedToGoogleSheets,
          serverReceivedAt: new Date().toISOString(),
        });
        existingIds.add(item.id);
        existingKeys.add(key);
        addedCount++;
      }
    }

    // Sort by serverReceivedAt or timestamp desc
    writeSubmissions(current);
    console.log(`[API] Synced ${addedCount} new submissions. Total: ${current.length}`);
    return res.json({ success: true, added: addedCount, total: current.length, submissions: current });
  } catch (err: any) {
    console.error('Failed to sync submissions:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE all submissions
app.delete('/api/submissions', (_req, res) => {
  try {
    writeSubmissions([]);
    console.log('[API] Cleared all submissions on server.');
    res.json({ success: true, message: 'Semua rekap berhasil dihapus.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET roster
app.get('/api/roster', (_req, res) => {
  const roster = readRoster();
  res.json({ success: true, roster });
});

// POST roster
app.post('/api/roster', (req, res) => {
  try {
    const { roster } = req.body;
    if (!Array.isArray(roster)) {
      return res.status(400).json({ success: false, message: 'Roster harus berupa array.' });
    }
    writeRoster(roster);
    console.log(`[API] Updated roster on server (${roster.length} students).`);
    res.json({ success: true, count: roster.length });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// VITE MIDDLEWARE / PRODUCTION STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Portal Ujian HOTS server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
