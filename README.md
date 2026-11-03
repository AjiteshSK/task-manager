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

`npm run seed --prefix server` creates this account with 8 sample tasks. With Docker, run `docker compose run --rm app node dist/scripts/seed.js` instead. Running the seed again resets the account.

## Tech stack

| Area    | Tools                                                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------ |
| Client  | React 19, Vite 8, React Router 8, TanStack Query 5, React Hook Form 7 + Zod 4, Tailwind CSS 4, Sonner (toasts)     |
| Server  | Node.js 26, Express 5, MongoDB with Mongoose 9, Zod 4, JSON Web Tokens, Argon2id, Helmet, express-rate-limit, Pino |
| Testing | Vitest 5, React Testing Library, MSW 3 (client); Supertest, mongodb-memory-server (server)                         |
| Tooling | TypeScript 6 (strict), ESLint 10 + typescript-eslint, Prettier, GitHub Actions, Docker + Docker Compose            |

TypeScript is on 6.0 rather than 7 because typescript-eslint doesn't support TypeScript 7 yet.

## Architecture overview

```
                 production: one Docker image, one Express app, one URL
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

## Running with Docker

The `Dockerfile` builds one production image in which Express serves both the API and the built React app. `docker-compose.yml` runs that image with a local MongoDB, so the production build runs with one command. Requirements: Docker with Compose v2.

```bash
cp server/.env.example server/.env                      # then set JWT_SECRET
docker compose up --build -d                            # builds the image, starts MongoDB, then the app
docker compose run --rm app node dist/scripts/seed.js   # optional: the demo account
```

Open http://localhost:5000 and log in with the [demo account](#demo-login). `docker compose down` stops everything; add `-v` to also delete the database. To build only the image, run `docker build -t task-manager .`.

**The image:**

- **Multi-stage build**: the client and the server each install their dependencies and build in their own stage. The final stage contains only the server's production dependencies and the two `dist` folders, with no TypeScript sources or dev tools.
- **Layer caching**: dependencies are installed from the lockfiles before the source code is copied, so a code-only change reuses the cached `npm ci` layers.
- **Runtime**:
  - Runs as the non-root `node` user with `NODE_ENV=production`.
  - Starts with `node dist/server.js` rather than `npm start`, so SIGTERM reaches the app and it shuts down cleanly.
  - A `HEALTHCHECK` calls `/api/health`.
- **No secrets** are built in. All configuration comes from environment variables when the container starts.

**Compose:**

- **Configuration**: the app reads `JWT_SECRET` and `JWT_EXPIRES_IN` from `server/.env`, the same file `npm run dev` uses. Compose sets `MONGODB_URI` (the `mongo` service), `NODE_ENV=production` and `PORT=5000` itself.
- **Startup order**: the app starts only after MongoDB's healthcheck passes.
- **Ports**: the app is published on `127.0.0.1:5000` only, and MongoDB's port isn't published at all.
- **Data**: MongoDB keeps its data in the `mongo-data` volume, so it survives restarts.
- **Compose vs `npm run dev`**: Compose is for running the production build locally; `npm run dev` is still the development workflow. Both use port 5000, so stop one before starting the other.
- **MongoDB version**: Compose uses `mongo:9`. The `mongo:8` images refuse to start on Linux kernels 6.19 to 7.0.13 ([SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)); MongoDB 9 starts normally on them.

## Environment variables

These belong to the server (`server/.env` locally, which Docker Compose also reads, or the host's settings in production). The client needs none.

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
| `npm run build`     | Installs and builds the client, then the server                           |
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
- **CI**: on every push and pull request, GitHub Actions runs lint, typecheck and tests for both apps and builds the Docker image.

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

## Deployment (Render + Docker + MongoDB Atlas)

The whole app deploys as one Render web service built from the `Dockerfile`, the same image that runs locally. Express serves both the API and the React build.

1. **Create the database on MongoDB Atlas.**
   1. Create a free cluster.
   2. Add a database user.
   3. Under **Network Access**, allow `0.0.0.0/0`. Render's free plan has no fixed outbound IP addresses.
   4. Copy the connection string and add a database name, e.g. `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/task-manager`.
2. **Create a Web Service on Render** from this repository:
   - **Language**: Docker.
   - **Root directory**: leave empty (the repo root).
   - **Dockerfile path**: `./Dockerfile` (the default).
   - **Build and start commands**: none. Render builds the image and runs its `CMD`.
   - **Health check path**: `/api/health`
   - **Instance type**: Free.
3. **Set the environment variables**: `MONGODB_URI` and `JWT_SECRET` (at least 32 characters). The image already sets `NODE_ENV=production`, and Render sets `PORT`, which the server listens on.
   - These are read only when the container starts. Render passes environment variables into a Docker build only for build arguments the Dockerfile declares with `ARG`, and this Dockerfile declares none, so secrets never end up in the image.
4. **Seed the demo account (optional).** Render's free plan has no shell, so run the seed from your machine against Atlas, using the image:

   ```bash
   docker build -t task-manager .
   docker run --rm -e MONGODB_URI="<atlas connection string>" -e JWT_SECRET="<any 32+ characters>" task-manager node dist/scripts/seed.js
   ```

   Without Docker: `MONGODB_URI="<atlas connection string>" JWT_SECRET="<any 32+ characters>" npm run seed --prefix server`.

5. **Open the service URL** and update [Live URL](#live-url) above.

**Without Docker**, Render's Node runtime also works:

- **Build command**: `npm run build`
- **Start command**: `npm start`
- **Environment**: also set `NODE_ENV=production`. Render picks Node 26 from `.nvmrc` and `engines`.

The build script installs devDependencies explicitly (`npm ci --include=dev`). With `NODE_ENV=production`, npm would otherwise skip Vite and TypeScript, and the build would fail.

**Notes:**

- **Free plans sleep when idle.** Render's free web services spin down after about 15 minutes without traffic, so the next visit waits about a minute while the service starts. Atlas's free cluster also pauses after a long period without activity.
- **Proxy setting**: the server trusts one proxy hop (`trust proxy = 1`), so the rate limiter sees each visitor's real IP. After the first deploy, confirm this with the [express-rate-limit guide](https://github.com/express-rate-limit/express-rate-limit/wiki/Troubleshooting-Proxy-Issues).

## Key decisions

1. TypeScript end to end, with Zod validating every request and the environment at runtime. Types are checked at compile time, and bad input is rejected as soon as it reaches the server.
2. Stateless JWT auth with ownership enforced on the server. Every task query is scoped to the user, and other users' tasks return 404.
3. One repo, one container: a multi-stage Docker build packages the API and the React app together, so there's a single URL, no CORS configuration, and the same image runs locally and in production.

## What I chose not to implement

1. **Sharing tasks between users.** Every task has exactly one owner, so authorization is a single rule: a query only ever sees the logged-in user's tasks. Sharing would add roles, invitations and per-task permissions, which is security-sensitive work I didn't want to rush.
2. **Real-time updates (WebSockets).** Each user manages their own tasks, and the client already refetches after every change. A WebSocket server would add infrastructure and connection handling for little benefit.
3. **Reminders and notifications.** These need a background job scheduler and an email or push provider, and they aren't needed to create and manage tasks.

## Known limitation

Authentication is built in-house: email and password, with an HS256 JWT that the client keeps in localStorage.

- Any script running on the page could read the token if an XSS bug ever got in.
- A token stays valid until it expires, even after the user logs out or changes their password. Deleting the account does stop it, because the auth middleware checks that the user still exists.
- There's no password reset, email verification or multi-factor authentication.

With one more day, I'd fix this in two steps:

1. **OAuth 2.0 / OpenID Connect with an identity provider** such as Auth0 or Keycloak. The provider handles sign-up, login, password reset, email verification, MFA and brute-force protection, so the app no longer stores passwords at all.
2. **A backend-for-frontend (BFF).** Express runs the authorization code flow with PKCE and keeps the tokens on the server. The browser only gets an httpOnly, Secure, SameSite session cookie, with CSRF protection on requests that change data. No token is reachable from JavaScript, and sessions can be revoked on the server. Because Express already serves the React app from the same origin, the cookie works without any CORS changes.