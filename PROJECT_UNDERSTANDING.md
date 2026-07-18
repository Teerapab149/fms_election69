# FMS Election System — Project Understanding Guide

> This document is written for anyone who is new to this project and wants to understand how everything works — from the big picture down to individual files and features. No deep prior knowledge is required.

---

## Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Technology Stack](#2-technology-stack)
3. [Project Folder Structure](#3-project-folder-structure)
4. [Database Design](#4-database-design)
5. [How Authentication Works](#5-how-authentication-works)
6. [Pages & Routes](#6-pages--routes)
7. [Admin System](#7-admin-system)
8. [Election System Logic](#8-election-system-logic)
9. [Environment Variables](#9-environment-variables)
10. [How to Run the Project](#10-how-to-run-the-project)
11. [Key Files Quick Reference](#11-key-files-quick-reference)
12. [Security Overview](#12-security-overview)

---

## 1. What Is This Project?

**FMS Election System** is a web-based **online voting system** for the **Faculty of Management Sciences (FMS)** at **Prince of Songkla University (PSU)**.

It is used during **student council elections** to allow eligible students (Year 1–4) to cast their votes digitally instead of physically, and for administrators to manage the election process in real time.

### What the system does:

| Who | What they can do |
|-----|-----------------|
| **Students** | Log in via PSU account → view candidates → cast one vote |
| **Admins** | Open/close voting → manage candidates → view live results → reset/configure system |
| **Public** | View candidate information before election |

### Key concepts:
- **Candidate / Party** — A group running for student council (like a political party). Each has a number, name, slogan, policies, and team members.
- **Member** — An individual person in a candidate group.
- **isVoted** — A flag stored in the database that prevents double-voting.
- **System Mode** — The current state of the election (open, paused, ended, etc.)

---

## 2. Technology Stack

You do not need to know all of these deeply, but this tells you what tools are used:

### Frontend (What users see)
- **Next.js 14** — React framework that handles both the UI and server-side logic
- **Tailwind CSS** — Utility-first CSS for styling
- **Framer Motion** — Animations and transitions
- **Recharts** — Charts for vote results
- **Lucide React** — Icon library

### Backend (Server-side logic)
- **Next.js API Routes** — REST API endpoints built into Next.js (no separate backend server)
- **Prisma** — Database ORM (makes SQL queries easier and safer)
- **NextAuth.js** — Handles user login sessions

### Database
- **PostgreSQL 15** — Relational database for storing students, candidates, and votes

### Authentication
- **Authentik (PSU SSO)** — Students log in using their PSU university account (OpenID Connect / OAuth 2.0)
- **JWT (JSON Web Tokens)** — Used for admin sessions
- **bcryptjs** — Password hashing for admin accounts
- **RSA-2048 Encryption** — Used to protect admin API calls

### DevOps
- **Docker + Docker Compose** — Containerized deployment (runs consistently on any server)
- **Node.js 18** (Alpine Linux) — Runtime environment inside Docker

---

## 3. Project Folder Structure

```
fms_election69/
│
├── src/                          # All source code lives here
│   ├── app/                      # Next.js pages and API routes
│   │   ├── page.js               # Home page (/)
│   │   ├── layout.js             # Root HTML layout (shared across all pages)
│   │   ├── login/                # Login page (/login)
│   │   ├── vote/                 # Voting interface (/vote)
│   │   ├── results/              # Election results (/results)
│   │   ├── candidates/           # Candidate showcase (/candidates)
│   │   ├── party/                # Party detail page (/party)
│   │   ├── success/              # After voting confirmation (/success)
│   │   ├── closed/               # Election closed notice (/closed)
│   │   ├── admin/                # Admin-only pages
│   │   │   ├── page.js           # Admin dashboard (/admin)
│   │   │   ├── login/page.js     # Admin login (/admin/login)
│   │   │   └── logout/page.js    # Admin logout (/admin/logout)
│   │   └── api/                  # Backend API endpoints
│   │       ├── auth/             # Authentication handlers
│   │       ├── vote/             # Submit a vote
│   │       ├── party/            # Get all candidates and their members
│   │       ├── results/          # Get vote results
│   │       ├── check-status/     # Check if voting is open and if user voted
│   │       ├── home-info/        # Data for the home page
│   │       ├── gallery/          # Image gallery data
│   │       └── admin/            # Admin-only API endpoints
│   │
│   ├── components/               # Reusable UI building blocks (React components)
│   │   ├── vote/                 # Components specific to the voting page
│   │   ├── PartyCard.js          # Card showing a candidate group
│   │   ├── PartyChart.js         # Chart showing vote results
│   │   ├── VoteConfirmationModal.js  # Popup before confirming vote
│   │   ├── MembersManager.js     # Admin: manage candidate members
│   │   ├── Navbar.js             # Navigation bar
│   │   └── ...                   # ~36 total components
│   │
│   ├── lib/
│   │   ├── auth.js               # NextAuth configuration (SSO setup)
│   │   ├── db.js                 # Prisma database client (singleton)
│   │   └── prisma.js             # Prisma client instance
│   │
│   ├── hooks/
│   │   └── useVoteSystem.js      # Core voting logic (loads candidates, submits vote)
│   │
│   ├── utils/
│   │   ├── electionConfig.js     # Election schedule (dates/times) — EDIT THIS for new elections
│   │   ├── auth.js               # RSA encryption helpers
│   │   ├── basePath.js           # URL path resolution for deployment
│   │   ├── imagePreloader.js     # Preloads images for smooth UI
│   │   ├── PartyTheme.js         # Color themes per candidate
│   │   └── studentHelper.js      # Helper functions for student data
│   │
│   ├── middleware.js             # Protects /admin routes (redirect if not logged in)
│   └── globals.css               # Global CSS styles
│
├── prisma/
│   ├── schema.prisma             # Database table definitions (THE source of truth)
│   ├── migrations/               # History of database changes
│   ├── seed.js                   # Script to populate database with initial data
│   └── seed_2000_voters.js       # Script to create 2000 test voters
│
├── scripts/
│   ├── import-students.js        # Import student list from CSV/Excel file
│   └── compress-images.js        # Compress images before uploading
│
├── public/
│   └── images/                   # Static images (logos, candidate photos)
│
├── .env                          # Environment variables (secrets — never commit this)
├── docker-compose.yml            # Docker setup for production
├── docker-compose.local.yml      # Docker setup for local development
├── Dockerfile                    # Instructions to build the Docker image
├── next.config.mjs               # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
└── package.json                  # Project dependencies and scripts
```

---

## 4. Database Design

The database has **4 main tables** (called "models" in Prisma):

### `User` — Students and admins
Stores everyone who can log in. Key fields:

| Field | Type | Description |
|-------|------|-------------|
| `studentId` | String (unique) | PSU student ID |
| `name` | String | Full name |
| `year` | String | Year 1–4 (only these can vote) |
| `isVoted` | Boolean | Has this person already voted? |
| `votedAt` | DateTime | When they cast their ballot (their own, non-secret data) |
| `isAdmin` | Boolean | Is this person an admin? |

> ⚠️ **v2-SEC (2026-07-16):** `User.candidateId` was **removed** — there is no
> longer any column linking a voter to their choice. Ballots live in a separate
> anonymous, encrypted, hash-chained `Ballot` table (no `userId`). See the
> `Ballot` / `ChainHead` models and `src/lib/ballotCrypto.js` / `ballotChain.js`.

### `Candidate` — Election groups (parties)
Each candidate group has:

| Field | Type | Description |
|-------|------|-------------|
| `number` | Int (unique) | Party number (0 = abstain, -1 = disapprove) |
| `name` | String | Party name |
| `slogan` | String | Campaign slogan |
| `policies` | JSON | Array of policy points |
| `missions` | JSON | Array of mission statements |
| `score` | Int | Current vote count |
| `logoUrl` | String | Logo image path |

### `Member` — Individual people in each candidate group

| Field | Type | Description |
|-------|------|-------------|
| `studentId` | String (unique) | Member's student ID |
| `name` | String | Full name |
| `position` | String | Role in the group |
| `number` | Int | Display order |
| `candidateId` | Int (FK) | Which group they belong to |

### `SystemConfig` — Global switch (always 1 row)

| Field | Type | Description |
|-------|------|-------------|
| `systemMode` | String | Current mode: `AUTO`, `MANUAL_OPEN`, `PAUSE`, `ENDED` |
| `showResult` | Boolean | Whether public can see results |
| `googleFormUrl` | String | URL to the post-election feedback form |

### Relationships
```
Candidate ──< Member        (one party has many members)
Candidate ──< User          (one party received votes from many users)
User >── Candidate          (each user voted for one party)
```

---

## 5. How Authentication Works

There are **two separate login systems** in this project:

### 5.1 Student Login (PSU SSO)

Students log in using their **PSU university account** (same account used for PSU email, PSU WiFi, etc.)

**Flow:**
1. Student clicks "Login" on the site
2. They are redirected to `psusso.psu.ac.th` (PSU's central login)
3. They enter their PSU credentials there
4. PSU sends back a token to our app
5. Our app creates/updates the student's record in the database
6. A session cookie is set — the student is now logged in

**Key file:** `src/lib/auth.js`

### 5.2 Admin Login (Username + Password)

Admins log in at `/admin/login` using a **username and password** stored in the database.

**Flow:**
1. Admin enters studentId/email + password
2. Server checks password hash using `bcryptjs`
3. If correct, a JWT token is created (valid for 2 hours)
4. Token is stored in an `HttpOnly` cookie (`admin_token`)
5. All admin pages check for this cookie via middleware

**Key file:** `src/app/api/admin/login/route.js`

### 5.3 Admin API Security (RSA Encryption)

When the admin dashboard calls sensitive APIs, the request includes a specially encrypted token:
- The browser encrypts `secret|timestamp` using the **RSA public key**
- The server decrypts it with the **RSA private key**
- Server validates: Is the secret correct? Is it less than 1 hour old?

This prevents unauthorized users from calling admin APIs even if they know the URL.

**Key files:** `src/utils/auth.js`, `NEXT_PUBLIC_ADMIN_PUBLIC_KEY` in `.env`

---

## 6. Pages & Routes

### Public Pages (No login needed)
| URL | File | Description |
|-----|------|-------------|
| `/` | `src/app/page.js` | Home — shows election info and countdown |
| `/candidates` | `src/app/candidates/page.js` | Shows all candidate groups |
| `/party` | `src/app/party/page.js` | Detailed view of each party |
| `/closed` | `src/app/closed/page.js` | Shown when voting is closed |

### Logged-in Student Pages
| URL | File | Description |
|-----|------|-------------|
| `/login` | `src/app/login/page.js` | Triggers PSU SSO login |
| `/vote` | `src/app/vote/page.js` | The main voting interface |
| `/results` | `src/app/results/page.js` | Live vote results (if enabled) |
| `/success` | `src/app/success/page.js` | Confirmation after voting |

### Admin Pages (Requires admin login)
| URL | File | Description |
|-----|------|-------------|
| `/admin` | `src/app/admin/page.js` | Dashboard: stats, controls, candidate management |
| `/admin/login` | `src/app/admin/login/page.js` | Admin login form |

### API Endpoints
| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/api/party` | Returns all candidates with members |
| `GET` | `/api/results` | Returns vote counts per candidate |
| `GET` | `/api/check-status` | Is voting open? Has this user voted? |
| `POST` | `/api/vote` | Submit the user's vote |
| `GET` | `/api/home-info` | Stats for home page |
| `GET` | `/api/admin/dashboard` | Admin stats + configuration |
| `POST` | `/api/admin/dashboard` | Perform admin actions (mode change, reset, etc.) |
| `GET/POST` | `/api/admin/candidates` | Manage candidate data |
| `GET/POST` | `/api/admin/members` | Manage member data |

---

## 7. Admin System

The admin dashboard (`/admin`) is the control center of the election. Here is what admins can do:

### System Mode Control
The `systemMode` in `SystemConfig` table controls what students see:

| Mode | What happens |
|------|-------------|
| `AUTO` | System follows the election schedule in `electionConfig.js` |
| `MANUAL_OPEN` | Force voting open regardless of date/time |
| `PAUSE` | Lock the system — nobody can vote (maintenance mode) |
| `ENDED` | Election over — only results are visible |

### Admin Actions
- **Toggle Result Visibility** — Show or hide results from students
- **Set Google Form URL** — Link a feedback/survey form
- **Reset Votes** — Clear all votes (keeps candidate data, resets `score` and `isVoted`)
- **Reset Candidates** — Wipe all candidate and member data entirely

### Candidate Management
Admins can:
- Edit candidate name, slogan, logo, policies, missions
- Upload candidate photos and group images
- Add/edit/remove members within each candidate group

---

## 8. Election System Logic

### How a Student Votes (Step by Step)

1. Student visits the site and clicks "Login"
2. Redirected to PSU SSO → authenticated → session created
3. System checks via `/api/check-status`:
   - Is voting open? (based on `systemMode` + `electionConfig`)
   - Has the student already voted? (`isVoted`)
   - Is the student eligible? (Year 1–4 only)
4. If all checks pass, the voting interface loads
5. Student selects a candidate or chooses "abstain" / "disapprove"
6. A confirmation popup appears
7. Student confirms → POST to `/api/vote`
8. Server (in a database **transaction**, v2-SEC):
   - Compare-and-set `user.isVoted = true` + stamps `user.votedAt` (one-shot guard)
   - Appends one **anonymous encrypted ballot** to the `Ballot` hash-chain
     (no `userId`; choice is RSA-encrypted with the election public key)
   - Increments `candidate.score += 1` (the tally results are served from)
9. Student is redirected to `/success`

> The old `user.candidateId = selectedId` link no longer exists — the choice is
> only ever stored encrypted in `Ballot.payload`, unreadable without the offline
> private key. `/api/vote` **fails closed** if `ELECTION_BALLOT_PUBLIC_KEY` /
> `BALLOT_CHAIN_SECRET` are unset (never stores a plaintext choice).

### Special Candidate Numbers
- `number = 0` → Abstain (no confidence vote)
- `number = -1` → Disapprove (vote against all candidates)
- `number >= 1` → Actual candidate groups

### Election Schedule
Edit **`src/utils/electionConfig.js`** to change dates for a new election year:

```javascript
ELECTION_CONFIG = {
  CAMPAIGN_START: new Date('2026-01-29T08:30:00'), // Candidates revealed
  ELECTION_START: new Date('2026-02-06T08:30:00'), // Voting opens
  ELECTION_END:   new Date('2026-02-06T17:00:00'), // Voting closes
}
```

This only matters when `systemMode = 'AUTO'`. In other modes, the admin controls timing manually.

---

## 9. Environment Variables

The `.env` file contains all secrets and configuration. **Never commit this file to Git.**

### Required Variables

| Variable | What it's for |
|----------|--------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Encrypts user sessions |
| `NEXTAUTH_URL` | Full URL of the app (e.g., `https://cvs.fms.psu.ac.th/fms-ovs`) |
| `AUTHENTIK_CLIENT_ID` | PSU SSO app ID (from PSU IT team) |
| `AUTHENTIK_CLIENT_SECRET` | PSU SSO app secret (from PSU IT team) |
| `AUTHENTIK_BASE_URL` | PSU SSO base URL |
| `AUTHENTIK_ISSUER` | PSU SSO OpenID discovery URL |
| `AUTHENTIK_REDIRECT_URI` | Callback URL after PSU login |
| `ADMIN_PRIVATE_KEY` | RSA private key for decrypting admin tokens |
| `NEXT_PUBLIC_ADMIN_PUBLIC_KEY` | RSA public key used in the browser |
| `ADMIN_AUTH_SECRET` | Secret used in encrypted admin tokens |
| `NEXT_PUBLIC_ADMIN_AUTH_SECRET` | Same value, exposed to browser |
| `ADMIN_JWT_SECRET` | Signs JWT tokens for admin sessions |
| `ADMIN_PASSWORD_AUTH_EXTRA` | Seed value for the first admin account |

### Optional Variables

| Variable | What it's for | Default |
|----------|--------------|---------|
| `BASE_PATH` | URL subpath (e.g., `/fms-ovs`) | `/fms-ovs` |
| `ASSET_PREFIX` | CDN or asset prefix | Same as BASE_PATH |
| `NODE_ENV` | `development` or `production` | `development` |

---

## 10. How to Run the Project

### Option A: Local Development (without Docker)

**Prerequisites:** Node.js 18+, PostgreSQL 15+

```bash
# 1. Install dependencies
npm install

# 2. Set up .env file (copy from example and fill in values)
cp .env.example .env

# 3. Create database tables
npx prisma migrate deploy

# 4. (Optional) Seed with test data
npx prisma db seed

# 5. Start the development server
npm run dev
# Open http://localhost:3000
```

### Option B: Docker (recommended for production-like setup)

**Prerequisites:** Docker + Docker Compose

```bash
# Start all services (app + database)
docker-compose up

# Or for local development config
docker-compose -f docker-compose.local.yml up

# The app will be available at http://localhost:3000
```

### Option C: Production Build

```bash
# Build the optimized app
npm run build

# Start the production server
npm start
```

### Importing Student Data

Before the election, student data must be imported from a university-provided CSV/Excel file:

```bash
node scripts/import-students.js path/to/students.csv
```

Expected columns: `studentId`, `titleName`, `studNameThai`, `studSnameThai`, `yearStatus`, `gender`, `subKeyid`, `subMajorId`, `subMajorNameThai`

---

## 11. Key Files Quick Reference

| What you want to change | File to edit |
|------------------------|-------------|
| Election dates/schedule | `src/utils/electionConfig.js` |
| Student login (SSO config) | `src/lib/auth.js` |
| Database schema | `prisma/schema.prisma` |
| Home page content | `src/app/page.js` + `src/components/HomeContent.js` |
| Voting interface | `src/app/vote/page.js` + `src/hooks/useVoteSystem.js` |
| Admin dashboard | `src/app/admin/page.js` |
| Admin login | `src/app/api/admin/login/route.js` |
| Vote submission logic | `src/app/api/vote/route.js` |
| System mode / results control | `src/app/api/admin/dashboard/route.js` |
| Candidate data API | `src/app/api/party/route.js` |
| Candidate/party colors | `src/utils/PartyTheme.js` |
| Admin route protection | `src/middleware.js` |
| Docker setup | `docker-compose.yml`, `Dockerfile` |
| All secrets and config | `.env` |

---

## 12. Security Overview

| Concern | How it's handled |
|---------|-----------------|
| Double voting | `isVoted` flag + database transaction (atomic) |
| Vote manipulation | Student ID comes from verified session, not from request |
| Admin impersonation | RSA-encrypted tokens with timestamp expiry |
| SQL injection | Prisma ORM (parameterized queries) |
| Admin session hijacking | HttpOnly cookies (no JS access), 2-hour expiry |
| Password storage | bcryptjs hashing (no plain-text passwords) |
| Unauthorized admin access | Next.js middleware checks cookie on every `/admin` request |
| Voter eligibility | Only Year 1–4 students can vote |

---

## Glossary

| Term | Meaning |
|------|---------|
| **SSO** | Single Sign-On — one login for multiple systems (PSU uses Authentik) |
| **JWT** | JSON Web Token — a secure token format used for sessions |
| **RSA** | An encryption algorithm using a public/private key pair |
| **ORM** | Object-Relational Mapper — Prisma translates JS code to SQL queries |
| **Prisma** | The ORM used in this project to interact with PostgreSQL |
| **API Route** | A Next.js server-side endpoint that handles HTTP requests |
| **Middleware** | Code that runs before a page loads — used here to check admin login |
| **SystemMode** | The current operating state of the election (AUTO/PAUSE/ENDED/MANUAL_OPEN) |
| **isVoted** | A database field that becomes `true` once a student has voted |
| **Candidate** | A group running for student council (not an individual person) |
| **Member** | An individual person within a candidate group |
| **seed** | Populating the database with initial/test data using a script |
| **Docker** | A tool to run the app in an isolated, reproducible container |

---

*Last updated: April 2026 — based on branch `new-version`*
