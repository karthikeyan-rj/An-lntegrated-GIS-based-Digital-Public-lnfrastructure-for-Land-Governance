# LandStack — Integrated GIS-Based Digital Public Infrastructure for Land Governance

> **One Parcel. One ULPIN. All Land Governance Information. All Departments. Citizen Services.**

LandStack is a high-fidelity, production-style **frontend prototype** for a Government of India
land-governance platform. It addresses **Problem Statement 26014 — "An Integrated GIS-based
Digital Public Infrastructure for Land Governance."**

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
- Recharts analytics, Lucide icons, Leaflet-ready map infrastructure (mock GIS fallback)
- Fully responsive (mobile bottom-sheet parcel panels)

---

## 🧰 Tech Stack

- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS 4**
- **React Router 7**
- **Lucide Icons**
- **Recharts** — analytics & charts
- **Leaflet / react-leaflet** — GIS map support

All data comes from mock JSON services under `src/data/` so a real backend can be connected later.

---

## 🚀 Getting Started

```bash
npm install
npm run dev
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

## 🔑 Demo Login

Use the **Quick Demo Access** buttons on the login page:

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
src/
├── components/
│   ├── layout/      # App shell (Sidebar, Topbar, AppLayout)
│   └── ui/          # Button, Badge, Card, StatCard, States, etc.
├── context/         # AuthContext
├── data/            # Mock data services (parcels, registrations, etc.)
├── lib/             # Utilities (format, cn, etc.)
├── pages/           # 26+ route pages
└── types/           # TypeScript domain types
```
