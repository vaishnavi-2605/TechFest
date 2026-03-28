# TechFest (React + Express + MongoDB)

This project uses a full-stack setup:

- Frontend: React + Vite (`client`)
- Backend: Express (`server`)
- Database: MongoDB (via `MONGODB_URI`)

## 1) Install dependencies

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## 2) Configure backend env

Copy `server/.env.example` to `server/.env` and update values.

For the frontend, create `client/.env` if you want to override the API base URL.

## 3) Run in development

```bash
npm run dev
```

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`

If `client/.env` does not set `VITE_API_BASE_URL`, the Vite dev server proxies `/api/*` requests to `http://localhost:5000`.

## Deployment

Set these environment variables before deploying:

Backend:

```bash
DB_MODE=atlas
MONGODB_URI=<your-atlas-uri>
JWT_SECRET=<strong-random-secret>
CLIENT_ORIGIN=https://your-frontend-domain.com
PUBLIC_API_BASE_URL=https://your-backend-domain.com
```

Frontend:

```bash
VITE_API_BASE_URL=https://your-backend-domain.com
```

Notes:

- New coordinator photos, event posters, and payment QR images are stored in MongoDB.
- Image URLs are served by the backend through `/api/images/...`.
- `PUBLIC_API_BASE_URL` should be your public backend URL in production so stored image links always resolve correctly.

## API endpoints (public)

- `GET /api/health`
- `GET /api/events`
- `GET /api/events/:eventId`
- `POST /api/registrations`
- `POST /api/contact`

## API endpoints (admin)

- `GET /api/admin/coordinators`
- `GET /api/admin/coordinators/:id`
- `PATCH /api/admin/events/:id/status`
- `DELETE /api/admin/events/:id`
- `GET /api/admin/messages`
- `GET /api/admin/messages/unread-count`
- `PATCH /api/admin/messages/:id/read`
- `DELETE /api/admin/messages/:id`
- `DELETE /api/admin/coordinators/:id`

## API endpoints (coordinator)

- `GET /api/coordinator/me`
- `GET /api/coordinator/participants`
- `POST /api/coordinator/events`
- `GET /api/coordinator/events/:id`
- `PUT /api/coordinator/events/:id`
- `DELETE /api/coordinator/events/:id`
- `PUT /api/coordinator/me`
- `PATCH /api/coordinator/notifications/read`

## Notes

- Dummy event seeding is disabled by default. If you enable seeding, use `ENABLE_EVENT_SEED=true` in `server/.env`.
