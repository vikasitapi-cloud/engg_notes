const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

const app = require('../api/app');
const DB_PATH = path.resolve(__dirname, '..', 'db.json');

describe('API basic flows', () => {
  beforeEach(async () => {
    // reset db
    await fs.writeFile(DB_PATH, JSON.stringify({ subjects: [], notes: [] }, null, 2), 'utf8');
  });

  test('GET /api/subjects returns empty array initially', async () => {
    const res = await request(app).get('/api/subjects');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('POST /api/subjects then GET subjects', async () => {
    const create = await request(app).post('/api/subjects').send({ name: 'Physics' });
    expect(create.statusCode).toBe(201);
    expect(create.body.name).toBe('Physics');

    const list = await request(app).get('/api/subjects');
    expect(list.statusCode).toBe(200);
    expect(list.body.length).toBe(1);
  });

  test('Create note and fetch by subject', async () => {
    const s = await request(app).post('/api/subjects').send({ name: 'Math' });
    const subjectId = s.body.id;

    const n = await request(app).post('/api/notes').send({ title: 'Note1', content: 'Content', subject_id: subjectId });
    expect(n.statusCode).toBe(201);

    const notes = await request(app).get(`/api/subjects/${subjectId}/notes`);
    expect(notes.statusCode).toBe(200);
    expect(notes.body.length).toBe(1);
    expect(notes.body[0].title).toBe('Note1');
  });
});
