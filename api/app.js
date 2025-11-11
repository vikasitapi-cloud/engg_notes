const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const DB_PATH = path.resolve(__dirname, '..', 'db.json');

// Toggle: if DB_JSON env var is set to 'false', the file DB operations will error
const USE_JSON_DB = process.env.DB_JSON !== 'false';

// Simple write-serialization queue to avoid concurrent writes to db.json
let writeLock = Promise.resolve();

async function loadDB() {
  if (!USE_JSON_DB) throw new Error('JSON DB disabled (DB_JSON=false)');
  try {
    const txt = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    return { subjects: [], notes: [] };
  }
}

async function saveDB(db) {
  if (!USE_JSON_DB) throw new Error('JSON DB disabled (DB_JSON=false)');
  // Serialize writes by chaining them on writeLock
  writeLock = writeLock.then(async () => {
    const tmp = DB_PATH + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8');
    await fs.rename(tmp, DB_PATH);
  }).catch(err => {
    console.error('Error writing DB:', err);
    // swallow so queue continues
  });
  return writeLock;
}

const app = express();
app.use(express.json());

// Simple helper to generate IDs (Node >=14.17)
function genId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// GET /api/subjects
router.get('/subjects', async (req, res) => {
  try {
    const db = await loadDB();
    res.json(db.subjects || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB disabled or unavailable' });
  }
});

// GET /api/subjects/:id/notes
router.get('/subjects/:id/notes', async (req, res) => {
  const { id } = req.params;
  try {
    const db = await loadDB();
    const notes = (db.notes || []).filter(n => n.subject_id === id);
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB disabled or unavailable' });
  }
});

// POST /api/subjects
// body: { name }
router.post('/subjects', async (req, res) => {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) return res.status(400).json({ error: 'name is required' });

  try {
    const db = await loadDB();
    const id = genId();
    const subject = { id, name: String(name).trim(), created_at: new Date().toISOString() };
    db.subjects.push(subject);
    await saveDB(db);
    res.status(201).json(subject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB disabled or unavailable' });
  }
});

// POST /api/notes
// body: { title, content, subject_id }
router.post('/notes', async (req, res) => {
  const { title, content, subject_id } = req.body || {};
  if (!title || !content) return res.status(400).json({ error: 'title and content are required' });

  try {
    const db = await loadDB();
    const id = genId();
    const note = {
      id,
      title: String(title),
      content: String(content),
      subject_id: subject_id || null,
      created_at: new Date().toISOString()
    };
    db.notes.push(note);
    await saveDB(db);
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB disabled or unavailable' });
  }
});

// Mount router under /api
app.use('/api', router);

// Health
app.get('/health', (req, res) => res.json({ ok: true }));

module.exports = app;
