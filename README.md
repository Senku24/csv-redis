# CSV Redis

Turn a CSV link into clean, usable data. Paste a public CSV URL, and it's fetched, queued, parsed, and stored — with live progress tracking.

<img width="2336" height="1654" alt="image" src="https://github.com/user-attachments/assets/29c269e2-732e-43a5-b977-20f9cd6755cf" />

## How it works

1. **Frontend** (React + Vite) — submit a CSV URL, poll for job status
2. **API** (Express + Bun) — accepts the request, enqueues a job in Redis
3. **Worker** (Bun) — dequeues jobs, spawns a processor per job
4. **Processor** (Bun) — streams the CSV, batch-inserts rows into Postgres, reports progress
5. **Database** (Postgres via Prisma 8) — stores job metadata and parsed rows

Redis handles the queue and live progress; Postgres is the source of truth for job history and data.

## Stack

Turborepo · Bun · Express · React · Redis · Postgres · Prisma 8

## Getting started

```bash
# start Postgres + Redis
docker compose up -d

# install dependencies
bun install

# apply the database contract
cd packages/db
bunx prisma contract emit
bunx prisma db init
cd ../..

# run everything
bun run turbo dev
```

Then open the frontend, paste a public CSV URL, and hit **Process CSV**.

## Project structure

```
apps/
  web/      React frontend
  api/      Express/Bun API
  worker/   Job queue consumer + CSV processor
packages/
  db/       Shared Prisma contract + client
```
