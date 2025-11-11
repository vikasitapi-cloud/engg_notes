// Minimal Express API implementing POST /api/notes
// Reads DB connection from environment (DATABASE_URL) or PG_* vars.

const express = require('express');
const { Pool } = require('pg');
const { marked } = require('marked');

const app = express();
app.use(express.json());

// Pool will pick up PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT or DATABASE_URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Demo auth middleware: expects X-User-Id header (UUID) and sets req.user.id
// In a real app replace this with proper JWT/session middleware
app.use((req, res, next) => {
	const userId = req.header('x-user-id');
	if (!userId) {
		return res.status(401).json({ error: 'Missing X-User-Id header for demo auth' });
	}
	req.user = { id: userId };
	next();
});

// POST /api/notes
// Request JSON: { title, content, subject_id?, tags?: ['a','b'] }
// Response: 201 with created note and tags
app.post('/api/notes', async (req, res) => {
	const { title, content, subject_id, tags } = req.body || {};
	if (!title || !content) {
		return res.status(400).json({ error: 'title and content are required' });
	}

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		// Optionally render markdown to HTML; keep simple and safe (marked default)
		let rendered_html = null;
		try {
			rendered_html = marked.parse(content || '');
		} catch (e) {
			// If rendering fails, fall back to null and continue
			rendered_html = null;
		}

		const insertNoteSql = `
			INSERT INTO notes (user_id, subject_id, title, content, rendered_html)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id, user_id, subject_id, title, content, version, favorite, archived, created_at, updated_at
		`;

		const noteResult = await client.query(insertNoteSql, [
			req.user.id,
			subject_id || null,
			title,
			content,
			rendered_html,
		]);

		const note = noteResult.rows[0];

		// Handle tags: ensure tag rows exist for this user, then link in note_tags
		if (Array.isArray(tags) && tags.length > 0) {
			for (const rawName of tags) {
				const name = String(rawName || '').trim();
				if (!name) continue;

				// Try to find existing tag by lower(name)
				const selectTag = await client.query(
					'SELECT id, name FROM tags WHERE user_id = $1 AND lower(name) = lower($2) LIMIT 1',
					[req.user.id, name]
				);

				let tagId;
				if (selectTag.rows.length > 0) {
					tagId = selectTag.rows[0].id;
				} else {
					// Insert new tag
					const insertTag = await client.query(
						'INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING id, name',
						[req.user.id, name]
					);
					tagId = insertTag.rows[0].id;
				}

				// Link note <-> tag (ignore conflict if already linked)
				await client.query(
					`INSERT INTO note_tags (note_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
					[note.id, tagId]
				);
			}
		}

		await client.query('COMMIT');

		// Retrieve attached tags to include in response
		const tagsRes = await pool.query(
			'SELECT t.id, t.name FROM tags t JOIN note_tags nt ON nt.tag_id = t.id WHERE nt.note_id = $1',
			[note.id]
		);

		note.tags = tagsRes.rows;

		return res.status(201).json(note);
	} catch (err) {
		await client.query('ROLLBACK');
		console.error('Error creating note:', err);
		return res.status(500).json({ error: 'Failed to create note' });
	} finally {
		client.release();
	}
});

// Simple health route
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`API server listening on port ${PORT}`);
});

module.exports = app;
