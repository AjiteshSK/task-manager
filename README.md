# Task Manager

## Overview

A full-stack task manager written in TypeScript end to end: a React client served by an Express + MongoDB API, deployed as a single app.

Users create an account and manage their own tasks:

- Create, edit and delete tasks, each with a title, description, priority and due date.
- Change a task's status from the list. The change shows immediately and is undone if the server rejects it.
- Filter by status and priority, search by title, sort, and page through results. The current view is kept in the URL.
- See overdue tasks highlighted.
- Update their name, change their password, or delete their account.

## Live URL

**https://YOUR-APP.onrender.com** _(placeholder: replace after deploying)_

The free hosting plan sleeps when idle, so the first request after a while can take about a minute.

## Demo login

| Email              | Password    |
| ------------------ | ----------- |
| `demo@example.com` | `Demo@1234` |

`npm run seed --prefix server` creates this account with 8 sample tasks. Running it again resets the account.

## Tech stack

| Area    | Tools                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------ |
| Client  | React 19, Vite 8, React Router 8, TanStack Query 5, React Hook Form 7 + Zod 4, Tailwind CSS 4, Sonner (toasts)     |
| Server  | Node.js 26, Express 5, MongoDB with Mongoose 9, Zod 4, JSON Web Tokens, Argon2id, Helmet, express-rate-limit, Pino |
| Testing | Vitest 5, React Testing Library, MSW 3 (client); Supertest, mongodb-memory-server (server)                         |
| Tooling | TypeScript 6 (strict), ESLint 10 + typescript-eslint, Prettier, GitHub Actions                                     |

TypeScript is on 6.0 rather than 7 because typescript-eslint doesn't support TypeScript 7 yet.

## Architecture overview

```
                 production: one Express app on one URL
Browser ───────► Express (server/)
                  ├── /api/*       routes → validation → controllers → services → MongoDB
                  └── other GETs   the React build in client/dist (index.html for client routes)

                 development
Browser ───────► Vite dev server :5173 ── proxies /api ──► Express :5000
```

### Server (`server/src`)

```
app.ts          Express app: middleware, routes, error handling (imported by the tests)
server.ts       Connects to MongoDB, starts listening, shuts down cleanly on SIGTERM
config/         Environment validation (Zod) and the database connection
models/         Mongoose schemas; TypeScript types inferred with InferSchemaType
schemas/        Zod schemas for request params, query strings and bodies
routes/         URL → middleware → controller
controllers/    Read the validated request, call a service, send the response
services/       Business logic and database access
middleware/     Auth, validation, rate limiting, 404 and error handlers
utils/          HttpError, JWT, password hashing, logger
scripts/seed.ts Demo data
```

- **Validation**:
  - Every request's params, query and body pass through a strict Zod schema. Unknown fields and wrong types get a 400, which also blocks NoSQL operator injection such as `{"$gt": ""}`.
  - The environment variables are validated the same way at startup.
- **Errors** go through one handler that returns `{ error: { message, details? } }`. Stack traces are logged, never sent.
- **Passwords** are hashed with Argon2id. A login with an unknown email still checks a dummy hash, so response times don't reveal which emails are registered.
- **Tokens** are HS256 JWTs. The auth middleware also checks that the user still exists, so a deleted account's token stops working.
- **Ownership**: every task query includes the logged-in user's id. Another user's task returns the same 404 as a missing one.
- **HTTP hardening**:
  - Helmet headers and a 20 KB JSON body limit.
  - Rate limiting (20 requests per 15 minutes per IP) on register, login and password change.
  - `Authorization` headers are redacted from the logs.
- **Priority sorting**: priorities are stored as text, which would sort alphabetically. The list endpoint sorts by each priority's position in `low`, `medium`, `high` instead.

### Client (`client/src`)

```
main.tsx        Providers: TanStack Query → React Router → AuthProvider, plus the toaster
lib/            Typed fetch client (ApiError), query client, shared API types, date helpers
components/     Shared UI: Button, form fields, Dialog, ConfirmDialog, skeletons, empty and error states
routes/         Route table, ProtectedRoute, GuestRoute, app layout, 404 page
features/auth/     AuthProvider, login and register pages
features/tasks/    Task list, filters, task form dialog, status select, pagination, queries
features/profile/  Name, password and account-deletion forms
test/           MSW handlers, test server and render helper
```

- **Server state** lives in TanStack Query; nothing is fetched in `useEffect`.
  - Task lists are cached per filter combination under `['tasks', params]`.
  - Each create, edit or delete refreshes them.
  - Status changes are optimistic: the cached lists change at once and are restored if the request fails.
- **Auth**:
  - `AuthProvider` keeps the JWT in localStorage and loads the user from `/api/auth/me` on startup.
  - Any 401 on a logged-in request clears the session and the query cache.
  - `ProtectedRoute` sends logged-out users to `/login` and remembers the page they wanted. `GuestRoute` sends logged-in users there once they log in.
- **Forms** use React Hook Form with Zod schemas that mirror the server's rules. Server errors appear inside the form.
- **The API client** is a small typed wrapper around `fetch`. It adds the token, parses JSON, and turns error responses into an `ApiError` carrying the server's message.
- **Accessibility**:
  - Every input has a label, with errors linked through `aria-describedby`.
  - Dialogs are native `<dialog>` elements, which trap focus and close on Esc.
  - Focus is visible on every control, and there's a skip link.
  - Overdue tasks are marked with text, not only color.

## Local setup

Requirements: Node.js 26 (`nvm use` reads `.nvmrc`) and a MongoDB database. A free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works, or a local MongoDB.

```bash
nvm use
npm install                          # root: concurrently
npm install --prefix server
npm install --prefix client

cp server/.env.example server/.env   # then set MONGODB_URI and JWT_SECRET
npm run seed --prefix server         # optional: the demo account

npm run dev                          # client: http://localhost:5173  API: http://localhost:5000
```

In development, Vite proxies `/api` to the Express server, so the browser only talks to one origin and no CORS setup is needed.

> On Linux kernels 6.19 and newer, the official `mongo:8` Docker image exits at startup ([SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)). Use Atlas or a native MongoDB install instead.

## Environment variables

These belong to the server (`server/.env` locally, or the host's settings in production). The client needs none.

| Variable         | Required | Default       | Notes                                                    |
| ---------------- | -------- | ------------- | -------------------------------------------------------- |
| `MONGODB_URI`    | yes      |               | `mongodb://` or `mongodb+srv://` connection string       |
| `JWT_SECRET`     | yes      |               | At least 32 characters                                   |
| `JWT_EXPIRES_IN` | no       | `1d`          | How long a login lasts, e.g. `15m`, `12h`, `7d`          |
| `PORT`           | no       | `5000`        | Render sets this automatically                           |
| `NODE_ENV`       | no       | `development` | `production` also serves the client and trusts the proxy |

The server validates these with Zod at startup. If any is missing or invalid, it prints what's wrong and exits.

Generate a secret with:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

## Scripts

From the repo root:

| Script              | What it does                                                              |
| ------------------- | ------------------------------------------------------------------------- |
| `npm run dev`       | Runs the server and the client together (concurrently)                    |
| `npm run build`     | Installs and builds the client, then the server (also used by Render)     |
| `npm start`         | Starts the built server, which also serves the built client in production |
| `npm test`          | Runs the server's and the client's tests                                  |
| `npm run lint`      | ESLint and a Prettier formatting check, for both apps                     |
| `npm run typecheck` | TypeScript checks for both apps                                           |

Each app also has its own scripts:

- **Server**: `dev`, `build`, `start`, `test`, `lint`, `format`, `typecheck`, `seed`.
- **Client**: `dev`, `build`, `preview`, `test`, `lint`, `format`, `typecheck`.

Run them with `--prefix server` or `--prefix client`.

**Tests**:

- **Server**: 72 integration tests against an in-memory MongoDB. They cover auth, validation, protected routes, the full task CRUD flow, filtering, sorting and pagination, profile changes, and that users can't read, change or delete each other's tasks.
- **Client**: tests with React Testing Library and MSW. They cover login validation and server errors, route guards (including logout on a 401), creating a task, and rolling back a failed optimistic status change.
- **CI**: GitHub Actions runs lint, typecheck and tests for both apps on every push and pull request.

## API reference

All endpoints are under `/api` and use JSON. Endpoints marked 🔒 need an `Authorization: Bearer <token>` header.

| Method | Path                 | Description                                          |
| ------ | -------------------- | ---------------------------------------------------- |
| GET    | `/api/health`        | Health check                                         |
| POST   | `/api/auth/register` | `{ name, email, password }` → `201 { token, user }`  |
| POST   | `/api/auth/login`    | `{ email, password }` → `{ token, user }`            |
| GET    | `/api/auth/me` 🔒    | The current user                                     |
| PATCH  | `/api/users/me` 🔒   | `{ name }` and/or `{ currentPassword, newPassword }` |
| DELETE | `/api/users/me` 🔒   | Delete the account and all of its tasks → `204`      |
| GET    | `/api/tasks` 🔒      | List tasks → `{ items, page, limit, total }`         |
| POST   | `/api/tasks` 🔒      | Create a task → `201`                                |
| GET    | `/api/tasks/:id` 🔒  | Get a task                                           |
| PATCH  | `/api/tasks/:id` 🔒  | Update some or all fields of a task                  |
| DELETE | `/api/tasks/:id` 🔒  | Delete a task → `204`                                |

**Task fields:**

- `title`: 1–200 characters.
- `description`: up to 2000 characters.
- `status`: `todo` | `in_progress` | `done`; defaults to `todo`.
- `priority`: `low` | `medium` | `high`; defaults to `medium`.
- `dueDate`: an ISO 8601 date or date-time. Send `null` to clear it.

**List query parameters** for `GET /api/tasks`:

- `status`, `priority`: exact match.
- `search`: case-insensitive match on the title.
- `sort`: one of `createdAt`, `dueDate` or `priority`. Prefix it with `-` for descending order. Defaults to `-createdAt`. Tasks without a due date come first when sorting by `dueDate` ascending.
- `page`: defaults to 1.
- `limit`: defaults to 20, maximum 100.

**Errors** always have this shape:

```json
{
  "error": {
    "message": "Validation failed",
    "details": [{ "path": "title", "message": "Title is required" }]
  }
}
```

| Status | When                                                       |
| ------ | ---------------------------------------------------------- |
| 400    | Invalid body, query or id, or unknown fields               |
| 401    | Missing, invalid or expired token; wrong email or password |
| 404    | Not found, including tasks that belong to another user     |
| 409    | Email already registered                                   |
| 413    | Request body over 20 KB                                    |
| 429    | Too many login, register or password-change attempts       |

## Deployment (Render + MongoDB Atlas)

The whole app deploys as one Render web service. Express serves both the API and the React build.

1. **Create the database on MongoDB Atlas.**
   1. Create a free cluster.
   2. Add a database user.
   3. Under **Network Access**, allow `0.0.0.0/0`. Render's free plan has no fixed outbound IP addresses.
   4. Copy the connection string and add a database name, e.g. `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/task-manager`.
2. **Create a Web Service on Render** from this repository:
   - **Runtime**: Node. Render picks Node 26 from `.nvmrc` and `engines`.
   - **Root directory**: leave empty (the repo root).
   - **Build command**: `npm run build`
   - **Start command**: `npm start`
   - **Health check path**: `/api/health`
   - **Instance type**: Free.
3. **Set the environment variables**: `MONGODB_URI`, `JWT_SECRET` (at least 32 characters) and `NODE_ENV=production`. Render sets `PORT`.
   - The build script installs devDependencies explicitly (`npm ci --include=dev`). With `NODE_ENV=production`, npm would otherwise skip Vite and TypeScript, and the build would fail.
4. **Seed the demo account (optional)** by running the seed locally against Atlas:

   ```bash
   MONGODB_URI="<atlas connection string>" JWT_SECRET="<any 32+ characters>" npm run seed --prefix server
   ```

5. **Open the service URL** and update [Live URL](#live-url) above.

**Notes:**

- **Free plans sleep when idle.** Render's free web services spin down after about 15 minutes without traffic, so the next visit waits about a minute while the service starts. Atlas's free cluster also pauses after a long period without activity.
- **Proxy setting**: the server trusts one proxy hop (`trust proxy = 1`), so the rate limiter sees each visitor's real IP. After the first deploy, confirm this with the [express-rate-limit guide](https://github.com/express-rate-limit/express-rate-limit/wiki/Troubleshooting-Proxy-Issues).

## Key decisions

1. TypeScript end to end, with Zod validating every request and the environment at runtime. Types are checked at compile time, and bad input is rejected as soon as it reaches the server.
2. Stateless JWT auth with ownership enforced on the server. Every task query is scoped to the user, and other users' tasks return 404.
3. One repo and one deployment. Express serves the React build, so there's a single URL and no CORS configuration.

## What I chose not to implement

1. Password reset and email verification: these need an email provider and secure token flows.
2. Google/social login: email and password meet the requirement, and OAuth adds provider setup and callback handling.
3. Sharing tasks between users: this would turn single-owner data into a permissions system.

## Known limitation

The JWT is stored in localStorage, so any script on the page could read it if an XSS bug existed, and a token can't be revoked before it expires. Next step: httpOnly, SameSite cookies with short-lived access tokens and rotating refresh tokens.
