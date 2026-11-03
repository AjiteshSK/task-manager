# Task Manager

A MERN task manager written in TypeScript. Users sign up, log in, and manage their own tasks, which they can filter, search, sort and page through.

- `server/`: REST API (Express 5, MongoDB with Mongoose, Zod, JWT)
- `client/`: React app (in progress)

## Getting started

Requirements: Node.js 26 (see `.nvmrc`) and a MongoDB database, either local or [MongoDB Atlas](https://www.mongodb.com/atlas).

```bash
nvm use                 # Node 26
cd server
npm install
cp .env.example .env    # then set MONGODB_URI and JWT_SECRET
npm run seed            # optional: demo@example.com / Demo@1234 with sample tasks
npm run dev             # http://localhost:5000/api/health
```

> On Linux kernels 6.19 and newer, the official `mongo:8` Docker image exits at startup ([SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)). Use Atlas or a newer MongoDB build instead.

### Environment variables

| Variable         | Required | Default       | Notes                                 |
| ---------------- | -------- | ------------- | ------------------------------------- |
| `MONGODB_URI`    | yes      |               | `mongodb://` or `mongodb+srv://` URI  |
| `JWT_SECRET`     | yes      |               | At least 32 characters                |
| `JWT_EXPIRES_IN` | no       | `1d`          | e.g. `15m`, `12h`, `7d`               |
| `PORT`           | no       | `5000`        |                                       |
| `NODE_ENV`       | no       | `development` | `development`, `production` or `test` |

The server checks these with Zod at startup. If any is missing or invalid, it prints what's wrong and exits.

### Scripts (in `server/`)

| Script              | What it does                                             |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Start with auto-reload (tsx) and readable logs           |
| `npm run build`     | Compile TypeScript to `dist/`                            |
| `npm start`         | Run the compiled server                                  |
| `npm test`          | Integration tests (Vitest, Supertest, in-memory MongoDB) |
| `npm run lint`      | ESLint, plus a Prettier formatting check                 |
| `npm run format`    | Format with Prettier                                     |
| `npm run typecheck` | Type-check without emitting                              |
| `npm run seed`      | Create the demo user and sample tasks again              |

## API

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
- `sort`: one of `createdAt`, `dueDate` or `priority`. Prefix it with `-` for descending order. Defaults to `-createdAt`.
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

## How it works

```
server/src/
├── app.ts          Express app: middleware, routes, error handling (imported by tests)
├── server.ts       Connects to MongoDB, starts listening, shuts down cleanly on SIGTERM
├── config/         Environment validation and database connection
├── models/         Mongoose schemas; TypeScript types inferred with InferSchemaType
├── schemas/        Zod schemas for request params, query strings and bodies
├── routes/         URL → middleware → controller
├── controllers/    Read the validated request, call a service, send the response
├── services/       Business logic and database access
├── middleware/     Auth, validation, rate limiting, 404 and error handlers
├── utils/          HttpError, JWT, password hashing, logger
└── scripts/seed.ts Demo data
```

**Security:**

- **Passwords** are hashed with Argon2id. For an unknown email, login still checks a dummy hash, so response time doesn't reveal which emails are registered.
- **JWTs** are signed with HS256, and verification accepts only HS256. The auth middleware also checks that the user still exists, so a deleted account's token stops working.
- **Task ownership:** every task query includes the logged-in user's id. Another user's task returns the same 404 as a missing one.
- **Validation:** strict Zod schemas reject unknown fields and wrong types, which blocks NoSQL operator injection such as `{"$gt": ""}`. Search input is escaped with `RegExp.escape`.
- **HTTP hardening:** Helmet headers, a 20 KB JSON body limit, and rate limiting (20 requests per 15 minutes per IP) on register, login and password change.
- **Errors** go through one handler. Stack traces are logged, never sent, and `Authorization` headers are redacted from logs.

**Sorting by priority:** priorities are stored as text, which would sort alphabetically. The list endpoint uses an aggregation that sorts by each priority's position in `low`, `medium`, `high`.

**Known limitations:**

- Tokens can't be revoked before they expire. Changing the password doesn't log out other sessions.
- Tasks without a due date come first when sorting by `dueDate` ascending.

## Deployment (Render)

In production (`NODE_ENV=production`) the server also serves the built client from `client/dist`. Any GET outside `/api` returns `index.html`, so client-side routes work.

- **Build command:** `cd server && npm ci --include=dev && npm run build`. `--include=dev` is needed because `NODE_ENV=production` would otherwise skip installing TypeScript.
- **Start command:** `cd server && npm start`
- **Environment:** set `MONGODB_URI`, `JWT_SECRET` and `NODE_ENV=production`. Render provides `PORT`.

The app trusts one proxy hop (`trust proxy = 1`), so `req.ip` and the rate limiter use the real client IP. After the first deploy, confirm this as described in the [express-rate-limit guide](https://github.com/express-rate-limit/express-rate-limit/wiki/Troubleshooting-Proxy-Issues).
