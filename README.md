# Study Notes API (minimal)

This is a small demo API implementing the POST /api/notes endpoint compatible with the provided PostgreSQL schema (`dabase_schema.sql`).

Quick start

1. Install dependencies:

```powershell
cd "c:\Users\Vikas\Desktop\engg notes"
npm install
```

2. Ensure your PostgreSQL is running and the schema in `dabase_schema.sql` has been applied to your database.

3. Start the server (set `DATABASE_URL` or PG_* environment variables):

```powershell
# Example (PowerShell):
$env:DATABASE_URL = "postgresql://user:password@localhost:5432/yourdb"
npm start
```

4. Example request (requires `X-User-Id` header with a user UUID present in `users` table):

```http
POST /api/notes HTTP/1.1
Host: localhost:3000
Content-Type: application/json
X-User-Id: <user-uuid>

{
  "title": "First Law of Thermodynamics",
  "content": "# First law\nEnergy is conserved...",
  "subject_id": null,
  "tags": ["thermo", "laws"]
}
```

Response: 201 Created with the created note JSON including `tags` array.

Notes
- The server uses a simple header `X-User-Id` middleware for demo authentication. Replace with real auth in production.
- Tag lookup is case-insensitive (uses lower(name) comparison) and will create missing tags for the user.
- The code renders markdown to HTML using `marked` and stores it in `rendered_html`.

---

Deployment to Vercel
---------------------

This repository is prepared to deploy to Vercel. The configuration does the following:

- Builds the serverless API from `api/index.js` (Express app wrapped with `serverless-http`).
- Builds the frontend from `web` using Vite and serves the static `web/dist` directory.

Steps to deploy:

1. Commit all files and push to GitHub:

```powershell
cd "c:\Users\Vikas\Desktop\engg notes"
git init
git add .
git commit -m "Initial EnggNotes full-stack app"
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

2. Import project on Vercel:

- Go to https://vercel.com/new and import your GitHub repository.
- Vercel will use `vercel.json` to:
  - Build `api/index.js` with `@vercel/node` (serverless function)
  - Run `npm install` and `npm run build` inside `web`, producing `web/dist` for static files

3. Environment variables (optional):

- If you add a real database or secrets later, set them in Vercel Dashboard → Settings → Environment Variables.

4. After a successful deployment, your site will be live and API routes will be available under `/api/*`.

Local dev notes
---------------

- Start API locally:

```powershell
npm install
npm run start:api
# API is available at http://localhost:3001/api/...
```

- Start frontend dev server (Vite proxies `/api` to http://localhost:3001):

```powershell
cd web
npm install
npm run dev
# Open http://localhost:5173
```

CI (optional)
--------------

I added a sample GitHub Actions workflow (`.github/workflows/ci.yml`) which builds the web and runs `npm run build` on push to `main` — this helps catch build failures early.

