# BMSx — Boarding Management System

A full-stack app for managing a boarding house / PG: rooms, boarders, and rent payments.

## Stack

- **Server**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- **Client**: React, TypeScript, Vite, React Router

## Project structure

```
server/   Express API (rooms, boarders, payments, dashboard)
client/   React SPA
```

## Getting started

### 1. Database

Start a local Postgres instance:

```bash
docker compose up -d
```

### 2. Server

```bash
cd server
cp .env.example .env
npm install
npm run prisma:migrate   # creates tables
npm run seed             # optional sample data
npm run dev              # http://localhost:4000
```

### 3. Client

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

The client dev server proxies `/api/*` requests to the server on port 4000.

## API overview

| Method | Path                         | Description                  |
|--------|------------------------------|-------------------------------|
| GET    | /api/rooms                   | List rooms with occupants     |
| POST   | /api/rooms                   | Create a room                 |
| GET    | /api/boarders                | List boarders                 |
| POST   | /api/boarders                | Create a boarder              |
| POST   | /api/boarders/:id/checkout   | Check a boarder out            |
| GET    | /api/payments                | List payments                 |
| POST   | /api/payments                | Create a payment (rent due)   |
| POST   | /api/payments/:id/mark-paid  | Mark a payment as paid        |
| GET    | /api/dashboard/summary       | Occupancy & payment summary   |

## Data model

- **Room** — number, floor, capacity, monthly rent, status (available/full/maintenance)
- **Boarder** — name, contact info, assigned room, check-in/out dates, status
- **Payment** — amount, due date, paid date, status (pending/paid/overdue), linked to a boarder
