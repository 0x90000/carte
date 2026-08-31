# Carte

Carte is an AI-assisted digital invitation studio. The MVP is built with Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma, PostgreSQL, Redis, Auth.js, and shadcn-style UI primitives.

## Local development

The code and browser UI can be developed locally. Real PostgreSQL/Redis integration is provided through Docker Compose and is intended to run on the test server.

1. Install Node.js 24 and npm.
2. Copy `.env.example` to `.env.local` and set `AUTH_SECRET`.
3. Install dependencies with `npm install`.
4. Generate the Prisma client with `npx prisma generate`.
5. Start the web app with `npm run dev`.

The development server uses port `3000` by default. Docker Compose exposes the application on port `3010` and PostgreSQL/Redis only on loopback ports `55432`/`56379`; port 80 is not used.

## Test-server deployment

On the Ubuntu test server, copy `.env.example` to `.env`, fill in provider secrets, then run:

```bash
docker compose up -d --build postgres redis
docker compose --profile tools run --rm migrate
docker compose up -d --build app
```

The app is available at `http://<server>:3010`.

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Docker-based database/Redis checks should be executed on the test server, not on the development workstation.
