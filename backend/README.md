# Study Matcher Backend (Express + PostgreSQL)

This backend is the cleaned, finalized version based on your uploaded backend document.

## Run with Docker (recommended)
1. Copy `.env.example` to `.env` and fill SMTP creds if you want emails.
2. Start:
   ```bash
   docker compose up --build
   ```

API: http://localhost:8080  
Health: `GET /health`

> If you add new migration files and want Postgres to re-run init SQL, reset volume:
> ```bash
> docker compose down -v
> docker compose up --build
> ```

## Core endpoints
- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Profile: `GET /api/profile/me`, `PUT /api/profile/me`
- Units: `GET /api/units` (admin: `POST /api/units`)
- Enrollments: `GET /api/enrollments/me`, `POST /api/enrollments/me`, `DELETE /api/enrollments/me/:unitId`
- Availability: `GET /api/availability/me`, `PUT /api/availability/me`
- Matching: `GET /api/matching/for-unit/:unitId`
- Requests: `GET /api/requests/inbox`, `GET /api/requests/sent`, `POST /api/requests`, `POST /api/requests/:id/accept`, `POST /api/requests/:id/decline`
- Matches: `GET /api/matches/me`, `GET /api/matches/:id/contact`
- Sessions: `GET /api/sessions/me`, `POST /api/sessions`, `DELETE /api/sessions/:id`
- Blocks: `POST /api/blocks`, `DELETE /api/blocks/:blockedUserId`
- Feedback: `POST /api/feedback`
- Notifications: `GET /api/notifications/me`

## Seed data
A simple unit seed is included in `src/db/migrations/003_seed_units.sql`.


## Admin endpoints
- GET /api/admin/analytics/summary
- GET /api/admin/users?limit=&offset=&q=
- POST /api/admin/users/:id/active   { is_active: boolean }
- GET /api/admin/events?limit=
- GET /api/admin/moderation/feedback?limit=&offset=
- GET /api/admin/moderation/requests?limit=&offset=
- GET /api/admin/moderation/blocks?limit=&offset=
