# RentLoop: A Secure Peer-to-Peer Item Rental and Trust Management Platform

<p align="center">
  <img src="client/public/rentloop-logo.png" width="140" alt="RentLoop Logo" />
</p>

> **RentLoop** is a production-ready, full-stack peer-to-peer item rental platform engineered for accountability, transparency, and trust throughout the entire rental lifecycle. Unlike simple classified boards, RentLoop governs transactions through verified government identities, double-booking prevention, tamper-evident pre- and post-rental condition inspection reports with photographic evidence, mutual reviews, and an administrative dispute resolution desk.

---

## 🚀 Key System Highlights

- **Complete Trust Governance:** Pre-rental and post-rental condition documentation with photo evidence, notes, and counterpart signoffs to eliminate condition fraud.
- **Conflict-Free Booking Engine:** Automatic date collision detection that blocks overlapping confirmed bookings for any item.
- **Role-Based Access Control (RBAC):** Strict permissions separating Guest, Registered User, Item Owner, Renter, and System Administrator.
- **Live Database-Driven Admin Control Room:** Non-hardcoded real-time metrics, user suspension/activation, identity document inspection desk, item moderation, dispute resolution, and security audit logs.
- **Dual Database Architecture:** Native PostgreSQL DDL schema & migrations for production deployment on Render/Supabase/Neon, paired with an embedded storage engine that runs locally with zero external setup.
- **Modern Responsive Design:** Crafted with React 18, Vite, and Tailwind CSS using RentLoop's Deep Navy Blue (`#0F172A`), Teal (`#0D9488`), and Slate design tokens.

---

## 🛠️ Technology Stack

| Layer                  | Technologies                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| **Frontend**           | React 18, Vite, Tailwind CSS, Lucide Icons, React Router 6                                         |
| **Backend**            | Node.js, Express.js REST API                                                                       |
| **Database**           | PostgreSQL (`pg` pool) + Embedded relational fallback                                              |
| **Security & Auth**    | JSON Web Tokens (JWT), bcrypt password hashing, Helmet, CORS, Multer upload filters, Rate limiting |
| **Deployment Targets** | Frontend on Vercel, Backend on Render, Database on PostgreSQL (Neon / Supabase / Render Postgres)  |

---

## 🔑 System Administrator Credentials

The platform is initialized with a single pre-configured administrative account:

| Role                     | Email Address        | Password       | Permissions & Highlights                                                                            |
| ------------------------ | -------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| **System Administrator** | `admin@rentloop.com` | `Password123!` | Full control room: user moderation, identity document verification, dispute resolution, audit trail |

> **Note:** To test the platform as an **Item Owner** or **Renter**, register new accounts via the public **Get Started / Register** page. Owners can submit identity verification in their profile and list items, while Renters can search, request rentals, acknowledge pre-rental inspections, and post reviews.

---

## 🏁 Quickstart Guide

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Seed Database

```bash
npm run seed
```

_(Populates categories, demo users, verified IDs, item listings, active rentals, condition reports, and reviews)._

### 4. Run the Full-Stack Application

You can run the full-stack server directly (serving both the Express API and compiled frontend):

```bash
npm start
```

Visit: **http://localhost:5000**

Or run the client with Vite Hot-Module-Replacement for development:

```bash
# Terminal 1: Backend API
npm run server

# Terminal 2: Frontend Vite Dev Server
npm run client
```

Visit Vite Dev: **http://localhost:5173**

---

## 🧪 Automated End-to-End Test Suite

Run the comprehensive test suite verifying all 7 modules:

```bash
npm test
```

The test suite validates:

1. **Module 1:** User registration, password hashing, JWT sessions, privilege escalation guards.
2. **Module 2 & 3:** Category listing, item publishing, keyword search, price/condition filtering.
3. **Module 4:** Rental request submission, owner approval, and **double-booking overlap rejection**.
4. **Module 5:** Pre-rental condition photo inspection, counterpart signoff, handover state machine, return inspection, and mutual 5-star review submission.
5. **Module 6:** Real-time notification center triggers.
6. **Module 7:** Admin live database metrics calculation, dispute ticket resolution, and tamper-evident audit logs.

---

## 📁 Project Structure

```text
RentLoop/
├── client/                     # Frontend Single Page Application (React + Vite + Tailwind)
│   ├── public/
│   │   └── rentloop-logo.png  # Official uploaded brand logo
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/        # ItemCard, StatusPill, TrustBadge, Modal
│   │   │   └── layout/        # Navbar (with notifications dropdown), Footer
│   │   ├── context/           # AuthContext (JWT), NotificationContext (polling)
│   │   ├── pages/             # Home, Catalog, Detail, Login, Register, Profile,
│   │   │                      # RenterDashboard, OwnerDashboard, RentalHub, AdminDashboard
│   │   ├── services/          # api.js (unified client)
│   │   ├── App.jsx            # Routing with ProtectedRoute & AdminRoute guards
│   │   └── index.css          # Tailwind CSS layer definitions
├── server/                     # Backend API & Database Layer (Node.js + Express)
│   ├── data/                  # Embedded JSON/Relational storage file (rentloop.db.json)
│   ├── src/
│   │   ├── config/            # Environment variable configuration
│   │   ├── controllers/       # Modular controllers (auth, items, rentals, conditions, admin...)
│   │   ├── database/          # db.js (PostgreSQL/Embedded adapter), schema.sql, migrate.js, seed.js
│   │   ├── middleware/        # auth.js (JWT & RBAC), upload.js (Multer), errorHandler.js
│   │   ├── routes/            # REST API route endpoints
│   │   ├── utils/             # logger.js (audit trail writer)
│   │   ├── app.js             # Express application assembly & static file routes
│   │   └── index.js           # Server startup script
├── uploads/                   # Stored item photos, verification IDs, and condition images
├── test-suite.js              # Comprehensive E2E automated test suite
├── package.json               # Root scripts
└── README.md
```

---

## 🔒 Security & Privacy Standards

- **Password Hashing:** Passwords hashed with `bcryptjs` using 10 salt rounds. Plaintext passwords are never stored or logged.
- **Privilege Escalation Prevention:** User self-registration endpoints hardcode the role to `user`, preventing malicious payload escalation to `admin`.
- **Private Identity Verification:** Government ID numbers and identity document images are strictly excluded from public user endpoints and accessible only by administrators.
- **SQL Parameterization:** Queries use parameterized arguments to eliminate SQL injection vulnerabilities.
- **Audit Logging:** Administrative actions, dispute resolutions, and status modifications write tamper-evident entries to the `audit_logs` table.
