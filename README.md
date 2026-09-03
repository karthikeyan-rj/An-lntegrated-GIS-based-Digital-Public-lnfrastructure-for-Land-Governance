# LandStack — Integrated GIS-Based Digital Public Infrastructure for Land Governance

> **One Parcel. One ULPIN. All Land Governance Information. All Departments. Citizen Services.**

LandStack is a production-style **full-stack prototype** for a Government of India
land-governance platform. It addresses **Problem Statement 26014 — "An Integrated GIS-based
Digital Public Infrastructure for Land Governance."**

A React/Vite frontend is paired with a Node/Express + MongoDB backend that provides real
user authentication (bcrypt hashed passwords + JWT) and a parcel-centric GIS API (GeoJSON),
wired to a **real Leaflet + OpenStreetMap map**.

It demonstrates how fragmented land-related systems can be unified around a **parcel-centric GIS
architecture**, where every parcel has a unique **ULPIN (Unique Land Parcel Identification Number)**
that acts as the central link between ownership, registration, planning, taxation, utilities,
restrictions, disputes, and citizen services.

> ⚠️ **DEMO / PROTOTYPE DATA** — All data is fictional mock data for demonstration purposes only.
> No real citizen information or government integration is claimed.

---

## ✨ Features

### Three "Hero Flows"
1. **Parcel Discovery** — Search → GIS Map → Select Parcel → Complete Parcel Profile
2. **Citizen Land Service** — Select Parcel → Apply for Service → Track Workflow → Notifications
3. **Government Intelligence** — Command Center → Parcel → Cross-department data → AI-assisted review → Workflow → Audit trail

### Major Areas (focused, consolidated route set)
- Public Landing Portal & Authentication (Citizen / Government Official / Administrator demo logins)
- **GIS Land Explorer** (centerpiece) with layer controls, base layers, parcel selection & deep-link focus
- **Complete Parcel Profile** — the central tabbed integration view: 14 thematic tabs (Overview, Ownership/RoR, Registration, Encumbrance, Land Use, Building Permissions, Property Tax, Utilities, Restrictions, Disputes, Documents, Applications, AI Insights, Activity Timeline); every governance record is surfaced here — no per-department pages
- Role-based dashboards (Citizen, Officer, Admin), Citizen Services marketplace, Applications & workflow tracking
- Land Records digest, Parcels, AI Insights, Satellite Change Detection, Integrations, Audit Logs
- Notifications, Profile, Users & Roles, Settings

### Design
- Modern GovTech / CivicTech aesthetic — deep navy + government blue, green/amber/red status system
- Light-theme primary, clean typography (Inter), rounded cards, soft shadows
- Recharts analytics, Lucide icons, real Leaflet + OpenStreetMap GIS map with OSM/Satellite base layers
- Fully responsive (mobile bottom-sheet parcel panels)

---

## 🧰 Tech Stack

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** (dev proxy `/api` → backend)
- **Tailwind CSS 4**
- **React Router 7**
- **Lucide Icons**
- **Recharts** — analytics & charts
- **Leaflet** — real interactive GIS map (OpenStreetMap + Esri satellite tiles)

### Backend (`backend/`)
- **Node.js** + **Express**
- **MongoDB** + **Mongoose** (land-governance collections + users)
- **bcryptjs** — password hashing
- **jsonwebtoken** — real-user session tokens (JWT)
- **cors + dotenv** — CORS whitelist & environment configuration

All parcel data shown on the map is **demo/prototype data** labeled as such. The backend serves a
demo GeoJSON parcel layer so the map works even before live cadastral data is connected.

---

## 🚀 Getting Started

### 1. Backend (MongoDB)
```bash
cd backend
cp .env.example .env     # then fill in real values (MongoDB URI, JWT secret)
npm install
npm run dev              # starts API on http://localhost:4000
```

Optional — seed all demo collections (users, parcels, records, applications, notifications):
```bash
npm run seed
```

> **Note:** The Mongo connection string lives only in `backend/.env`, which is git-ignored.
> If MongoDB is unreachable the API still boots and serves the demo GIS layer with a clear log.
> Seed demo users log in with password `demo1234`.

### 2. Frontend
```bash
# from project root
npm install
npm run dev              # starts on http://localhost:5173 (proxies /api → :4000)
```

Then open **http://localhost:5173**.

### Build
```bash
npm run build
npm run preview
```

### Lint
```bash
npm run lint
```

---

## 🔑 Authentication

Two modes are supported on the login screen:

1. **Real account** — "Sign In" / "Create Account" registers and authenticates real users stored
   in MongoDB. Passwords are **bcrypt-hashed**; tokens are **JWTs**. A failed real sign-in is
   rejected outright with **no demo fallback**.
2. **Quick Demo Access** — one-click demo role login (no backend required):

| Role               | Access |
|--------------------|--------|
| Citizen            | Citizen portal & services |
| Revenue Officer    | Records, mutation, ownership |
| Registration Officer | Transactions, encumbrance |
| Planning Officer   | Zoning, master plan, permits |
| Administrator      | Full platform access |

---

## 🗂 Structure

```
├── backend/                # Node/Express/Mongo backend
│   ├── src/
│   │   ├── config/         # db.js (Mongo connect + startup log)
│   │   ├── models/         # User, Parcel, LandModels (all collections)
│   │   ├── controllers/    # auth, parcel, application, records (factory), analytics, ai, system
│   │   ├── routes/         # auth, parcels, applications, recordsRouter, analytics, ai, system
│   │   ├── services/       # audit, notification, workflow, ai
│   │   ├── middleware/     # auth.js (JWT protect/authorize)
│   │   ├── data/demo/      # demo GeoJSON parcels
│   │   └── seed/           # full-table demo seeder
│   ├── app.js / server.js  # Express entry, mounts /api/*
│   ├── .env.example        # env template (committed)
│   └── .env                # secrets (git-ignored)
└── frontend/               # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── layout/     # App shell (Sidebar, Topbar, AppLayout)
    │   │   └── ui/         # Button, Badge, Card, StatCard, States, etc.
    │   ├── context/        # AuthContext (demo + real login)
    │   ├── data/           # Local demo data + fallback
    │   ├── lib/            # utils, api.ts (backend client)
    │   ├── pages/          # consolidated route pages
    │   └── types/          # TypeScript domain types
```

## 🔌 Backend API

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create a real user (bcrypt-hashed) |
| `POST /api/auth/login` | Authenticate a real user → returns JWT |
| `GET /api/auth/me` | Current user from token |
| `GET /api/parcels` | GeoJSON FeatureCollection of parcels |
| `GET /api/parcels/:id` | Parcel detail + governance bundle |
| `GET /api/layers` | GIS layer catalog (base/governance/infrastructure) |
| `GET /api/registrations/:ulpin` | Records per governance module (registrations, encumbrances, building-permissions, land-use, property-tax, utilities, restrictions, disputes, land-records) |
| `GET/POST /api/applications` | Citizen service applications + workflow (approve/reject/status) |
| `GET /api/analytics/dashboard` | Dashboard KPIs |
| `POST /api/ai/*` | AI-assisted services (change-detection, anomaly-detection, document-extraction, chat) |
| `GET /api/notifications` · `GET /api/audit` · `GET /api/departments` · `GET/POST /api/integrations` | System resources |

## 🗄 MongoDB Collections
`users`, `parcels`, `landrecords`, `registrations`, `encumbrances`, `buildingpermissions`,
`landuse`, `propertytaxes`, `utilities`, `disputes`, `restrictions`, `applications`,
`departments`, `notifications` — models defined in `backend/src/models/`; the demo seeder populates
all of them with clearly-labeled mock data.

