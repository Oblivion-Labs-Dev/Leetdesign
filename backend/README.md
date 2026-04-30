# Astra Backend

Dedicated backend service for Astra authentication and user identity.

## Responsibilities

- Credentials signup/login
- Google/GitHub OAuth callback handling
- Alias + work email generation
- JWT issuance and user identity APIs
- Onboarding completion state

## Run locally

```bash
npm install
npx prisma generate
npx prisma db push --accept-data-loss
npm run dev
```

Runs on `http://localhost:4000` by default.

## Core endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/github`
- `GET /api/auth/github/callback`
- `GET /api/users/me`
- `POST /api/users/complete-onboarding`
- `GET /api/auth/providers`

## OAuth config

Set in `.env`:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
- `FRONTEND_URL`, `BACKEND_URL`, `JWT_SECRET`
