# NatureFold — Protein Visualizer

> Look at some cool proteins in 3D, then fold your own.

NatureFold is a small full-stack playground for exploring protein structures. The
landing page renders famous proteins (insulin, hemoglobin, ferritin) as
interactive 3D models, and a signed-in workspace lets you submit an amino acid
sequence as a **folding job** and visualize the predicted structure.

The folding itself is powered by NVIDIA's hosted **ESMFold** model. Jobs are
created instantly as `pending` and are designed to be folded asynchronously by a
background worker, so the UI never blocks on a long-running prediction.

---

## Highlights

- **Interactive 3D viewer** — real PDB structures rendered with [Mol*](https://molstar.org/),
  framed automatically on the polymer fold.
- **Folding jobs** — submit a sequence, pick a model (ESMFold for now), and track
  its status (`pending → running → completed / failed`).
- **Google sign-in** — Google Identity verified server-side; the API issues its
  own JWT session token. Jobs are private to your account.
- **Clean separation** — a Flask JSON API and a Next.js frontend talk over a
  same-origin proxy, so there is no CORS to wrangle.

---

## Architecture

```
Browser ──▶ Next.js (web, :3000)
               │  rewrites /api/* ──▶ Flask (api, :5000)
               │                          ├─ auth blueprint   (/auth/*)
               │                          └─ jobs blueprint   (/visualization_job*)
               │                                   │
               ▼                                   ▼
         Mol* 3D viewer                    SQLite (instance/jobs.db)
                                                   │
                                          (future) Temporal worker ──▶ NVIDIA ESMFold
```

- The browser only ever talks to the Next.js origin. `next.config.ts` rewrites
  `"/api/:path*"` to the Flask server, so the API stays same-origin.
- Auth is a Bearer-token flow: Google ID token → verified by Flask → app JWT
  stored client-side and sent on every request.
- Folding is intentionally decoupled from the request path. `POST` just records a
  `pending` job; `app/folding.py` holds the ESMFold client a worker will call.

---

## Tech stack

| Layer     | Tech                                                             |
| --------- | ---------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Mol* |
| Auth (FE) | `@react-oauth/google`                                            |
| Backend   | Flask 3 (app factory + blueprints), SQLAlchemy 2, SQLite         |
| Auth (BE) | `google-auth` (ID token verify) + `PyJWT` (session tokens)       |
| Tooling   | `uv` (Python), `npm` (Node)                                      |

---

## Project structure

```
.
├── api/                     # Flask JSON API
│   ├── app/
│   │   ├── __init__.py      # create_app() factory, config, blueprint registration
│   │   ├── db.py            # SQLAlchemy models: User, VisualizationJob
│   │   ├── auth.py          # /auth/* blueprint + login_required + JWT helpers
│   │   ├── jobs.py          # /visualization_job* blueprint (per-user scoped)
│   │   └── folding.py       # NVIDIA ESMFold client (for the async worker)
│   ├── instance/            # gitignored: jobs.db + config.py (secrets)
│   └── main.py              # entry point: app = create_app()
└── web/                     # Next.js frontend
    ├── app/
    │   ├── page.tsx                 # landing page (showcase proteins)
    │   └── visualize-proteins/      # the NatureFold workspace
    ├── components/                  # Hero, ProteinViewer, JobsSidebar, CreateJobModal, ...
    └── lib/                         # API clients (jobs.ts, auth.ts)
```

---

## Getting started

### Prerequisites

- Python 3.14+ and [`uv`](https://docs.astral.sh/uv/)
- Node.js 18+ and npm
- A Google OAuth **Web** client ID (see below)

### 1. Configure Google OAuth

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project and configure the OAuth consent screen (External, add yourself as a
   test user).
2. Create an **OAuth client ID** of type **Web application** with
   `http://localhost:3000` as an authorized JavaScript origin.
3. Copy the Client ID (ends in `.apps.googleusercontent.com`).

### 2. Backend

```bash
cd api
uv sync
```

Create `api/instance/config.py` (gitignored) with your secrets:

```python
JWT_SECRET = "*************************************"
GOOGLE_CLIENT_SECRET = "your-google-client-secret"
GOOGLE_CLIENT_ID = "your-client-id.apps.googleusercontent.com"
NVIDIA_TOKEN = "your-nvidia-api-key"
```

> Generate a key with: `uv run python -c "import secrets; print(secrets.token_hex(32))"`

Run it:

```bash
uv run python main.py        # http://127.0.0.1:5000
```

The SQLite database is created automatically at `api/instance/jobs.db`.

### 3. Frontend

```bash
cd web
npm install
```

Create `web/.env.local` (template in `.env.local.example`):

```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Run it:

```bash
npm run dev                  # http://localhost:3000
```

Open **http://localhost:3000** for the showcase, or
**http://localhost:3000/visualize-proteins** to sign in and submit a fold.

---

## API reference

All `/visualization_job*` routes require an `Authorization: Bearer <token>` header.

| Method | Endpoint                    | Description                                   |
| ------ | --------------------------- | --------------------------------------------- |
| `POST` | `/auth/google`              | Verify a Google ID token, return app JWT+user |
| `GET`  | `/auth/me`                  | Current user profile (auth required)          |
| `POST` | `/visualization_job`        | Create a folding job (`pending`)              |
| `GET`  | `/visualization_jobs`       | List the current user's jobs                  |
| `GET`  | `/visualization_job/<id>`   | Fetch one of the current user's jobs          |

**Create a job**

```json
POST /visualization_job
{
  "name": "My insulin variant",
  "model": "esmfold",
  "sequence": "MKTAYIAKQR..."
}
```

Sequences are validated against the 20 standard amino acids
(`ACDEFGHIKLMNPQRSTVWY`).

---

## Folding pipeline

`POST /visualization_job` stores the job as `pending` and returns immediately.
A background worker (planned via [Temporal](https://temporal.io/)) is intended to:

1. Pick up `pending` jobs.
2. Call NVIDIA's ESMFold NIM through `app/folding.py` (`fold_sequence`), which
   needs `NVIDIA_API_KEY` in the environment.
3. Store the returned PDB on the job and flip its status to `completed` (or
   `failed` with an error).

Once a job is `completed`, the workspace renders its predicted structure in the
Mol* viewer.

---

## Roadmap

- [ ] Temporal worker to actually fold `pending` jobs
- [ ] Live status updates (polling or websockets) in the workspace
- [ ] Anonymous/browser-session jobs (fold without signing in)
- [ ] More models beyond ESMFold

---

*A fun little project to see some cool proteins. :)*
