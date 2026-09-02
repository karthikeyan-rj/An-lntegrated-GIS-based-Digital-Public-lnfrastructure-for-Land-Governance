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
2. **Citizen Land Service** — Select Parcel → Verify Ownership → Check Encumbrance → Submit Service → Track Workflow
3. **Government Intelligence** — Command Center → Parcel → Cross-department data → AI anomaly → Workflow → Audit trail

### Major Areas (26+ pages)
- Public Landing Portal & Authentication (Citizen / Government Official / Administrator demo logins)
- **GIS Land Explorer** (centerpiece) with layer controls, base layers, parcel selection
- **Complete Parcel Profile** with 12 thematic tabs
- Land Records / RoR, Registration, Encumbrance & Mortgage
- Master Plans, Land Use & Zoning, Building Permissions, Restrictions & Environmental Zones
- Utilities & Infrastructure, Property Tax
- Disputes, Citizen Services marketplace, Service Request tracking with workflow timelines
- Government Command Center (Department Dashboard)
- Analytics, AI/ML Insights, Satellite Change Detection, AI Decision Support
- API & Interoperability Center, Data Standards, Audit & Security, RBAC/Users & Roles
- Technical Standards & System Architecture visualization

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

### Backend (`server/`)
- **Node.js** + **Express**
- **MongoDB** + **Mongoose** (11 land-governance collections + users)
- **bcryptjs** — password hashing
- **jsonwebtoken** — real-user session tokens (JWT)
- **cors + dotenv** — CORS whitelist & environment configuration

All parcel data shown on the map is **demo/prototype data** labeled as such. The backend serves a
demo GeoJSON parcel layer so the map works even before live cadastral data is connected.

---

## 🚀 Getting Started

### 1. Backend (MongoDB)
```bash
cd server
cp .env.example .env     # then fill in real values (MongoDB URI, JWT secret)
npm install
npm run dev              # starts API on http://localhost:4000
```

Optional — seed demo parcel geometries into MongoDB:
```bash
npm run seed
```

> **Note:** The Mongo connection string lives only in `server/.env`, which is git-ignored.
> If MongoDB is unreachable the API still boots and serves the demo GIS layer with a clear log.

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
├── server/                 # Node/Express/Mongo backend
│   ├── src/
│   │   ├── config/         # db.js (Mongo connect + startup log)
│   │   ├── models/         # User, Parcel, LandModels (11 collections)
│   │   ├── routes/         # auth.js, parcels.js (GIS API)
│   │   ├── middleware/     # auth.js (JWT protect/authorize)
│   │   ├── data/           # demo GeoJSON parcels
│   │   └── seed/           # demo parcel seeder
│   ├── index.js            # Express entry, mounts /api/*
│   ├── .env.example        # env template (committed)
│   └── .env                # secrets (git-ignored)
└── src/                    # React frontend
    ├── components/
    │   ├── layout/         # App shell (Sidebar, Topbar, AppLayout)
    │   └── ui/             # Button, Badge, Card, StatCard, States, etc.
    ├── context/            # AuthContext (demo + real login)
    ├── data/               # Local demo data + fallback
    ├── lib/                # utils, api.ts (backend client)
    ├── pages/              # 26+ route pages
    └── types/              # TypeScript domain types
```

## 🔌 Backend API

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create a real user (bcrypt-hashed) |
| `POST /api/auth/login` | Authenticate a real user → returns JWT |
| `GET /api/auth/me` | Current user from token |
| `GET /api/parcels` | GeoJSON FeatureCollection of parcels |
| `GET /api/parcels/:id` | Parcel detail + governance bundle |
| `GET /api/parcels/:id/governance` | Governance layers for a parcel |
| `GET /api/layers` | GIS layer catalog (base/governance/infrastructure) |

## 🗄 MongoDB Collections
`users`, `parcels`, `landRecords`, `registrations`, `encumbrances`, `buildingPermissions`,
`landUse`, `propertyTaxes`, `utilities`, `disputes`, `applications`, `auditLogs` — models defined
in `server/src/models/`; only the demo `parcels` layer is seeded with placeholder data.

