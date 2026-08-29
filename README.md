# HostelHub

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141.1-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![SQLModel](https://img.shields.io/badge/SQLModel-0.0.39-306998?logo=python)](https://sqlmodel.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-3.5_Flash-4285F4?logo=google)](https://ai.google.dev/)

An AI-powered hostel maintenance, complaint resolution, and campus broadcast management platform designed for universities and residential institutions. Built specifically for IIIT Bhubaneswar hostel operations.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
  - [AI Complaint Triage & Duplicate Detection](#ai-complaint-triage--duplicate-detection)
  - [Role-Based Workflows](#role-based-workflows)
  - [Complaint Lifecycle Management](#complaint-lifecycle-management)
  - [Campus Broadcasts & Announcements](#campus-broadcasts--announcements)
  - [Real-Time Notification Center](#real-time-notification-center)
- [Role & Navigation Architecture](#role--navigation-architecture)
- [Role Permission Matrix](#role-permission-matrix)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Installation & Setup](#local-installation--setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Database Setup & Seeding](#2-database-setup--seeding)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables](#environment-variables)
- [Google OAuth 2.0 Configuration](#google-oauth-20-configuration)
- [Running the Application Locally](#running-the-application-locally)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Production Deployment Guide](#production-deployment-guide)
  - [1. Recommended Hosting Architecture](#1-recommended-hosting-architecture)
  - [2. Database Deployment](#2-database-deployment)
  - [3. Backend Deployment (Render / Railway)](#3-backend-deployment-render--railway)
  - [4. Frontend Deployment (Vercel)](#4-frontend-deployment-vercel)
  - [5. Production Google OAuth 2.0 Setup](#5-production-google-oauth-20-setup)
  - [6. Post-Deployment Verification & Smoke Tests](#6-post-deployment-verification--smoke-tests)
- [Quality Gates & Verification](#quality-gates--verification)
- [Troubleshooting](#troubleshooting)
- [Security Considerations](#security-considerations)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Managing maintenance in residential campus hostels is often hindered by duplicate reports, manual dispatch delays, lack of transparency for residents, and fragmented notice boards.

**HostelHub** automates the entire lifecycle of campus facility management:
1. **Students** report issues with photos and description. Gemini AI checks for identical active complaints in that room/block to eliminate duplicate work.
2. **AI Classification** automatically infers category (`ELECTRICAL`, `PLUMBING`, `CARPENTRY`, `CLEANLINESS`, `NETWORK`, `OTHER`) and priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`).
3. **Smart Dispatch** auto-allocates tickets to the least-loaded technician and alerts university administrators if urgent.
4. **Audited Timelines** log every assignment, status change, and photo attachment.
5. **Targeted Announcements** allow administrators to broadcast notices with file attachments to specific hostel blocks.

---

## System Architecture

```mermaid
graph TD
    User["Student / Staff / Admin Browser"]
    
    subgraph Frontend ["Next.js 16 App Router (Port 3000)"]
        Pages["Role Dashboards & Views (/admin, /staff, /student)"]
        AuthHook["useCurrentUser Hook (Single Source of Truth)"]
        ReactQuery["TanStack React Query Cache"]
        AxiosClient["Axios HTTP Client (Bearer JWT)"]
    end
    
    subgraph Backend ["FastAPI REST API (Port 8000)"]
        AuthRouter["/api/v1/auth (OAuth & JWT)"]
        ComplaintRouter["/api/v1/complaints"]
        AdminRouter["/api/v1/admin"]
        DashboardRouter["/api/v1/dashboard"]
        AnnounceRouter["/api/v1/announcements"]
        NotifyRouter["/api/v1/notifications"]
        
        AIService["Gemini 3.5 Flash (Triage & Duplicate Detection)"]
        DispatchService["Staff Load Balancing Dispatcher"]
    end
    
    subgraph DataStore ["PostgreSQL Database"]
        DB[(HostelHub DB: Users, Rooms, Complaints, Announcements)]
        Uploads["Local Uploads (/uploads)"]
    end

    User --> Pages
    Pages --> AuthHook
    Pages --> ReactQuery
    ReactQuery --> AxiosClient
    AxiosClient -->|HTTP REST / Bearer Token| Backend
    
    ComplaintRouter --> AIService
    ComplaintRouter --> DispatchService
    Backend --> DB
    Backend --> Uploads
```

---

## Key Features

### AI Complaint Triage & Duplicate Detection
- **Semantic Duplicate Prevention**: Before filing a complaint, Google Gemini (`gemini-3.5-flash`) analyzes active complaints for that specific room and blocks duplicate submissions with an explanation.
- **Automated Classification**: Automatically extracts problem category and assigns priority with justification.
- **Priority Escalation**: High and urgent priority tickets immediately trigger alert notifications to university administrators.

### Role-Based Workflows

#### 🎓 Student
- **Personal Dashboard**: Summary counts of open, in-progress, and resolved complaints, unread notifications, and recent tickets.
- **Submit Complaint**: Form with image attachment upload (JPEG, PNG, WebP up to 5MB).
- **My Complaints Directory**: Server-paginated complaint feed with search and status tabs (`All`, `Open`, `Assigned`, `In Progress`, `Resolved`, `Closed`).
- **Ticket History & Discussion**: View complaint timeline, technician updates, and community upvotes/supporters.
- **Notice Board**: View campus announcements targeted to the student's hostel block.

#### 🔧 Maintenance Staff
- **Staff Dashboard**: Real-time workload overview (unassigned, assigned, in-progress, resolved, closed tickets).
- **Hostel Complaints Directory**: Comprehensive complaint table with server-side filters for status (`OPEN`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), priority, category, and text search.
- **Status Progression**: Move tickets through `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`.
- **Reassignment**: Allocate tickets to other active technicians.

#### 🛡️ Administrator
- **Admin Console**: Global statistics (total users, hostels, rooms, complaints breakdown, occupancy).
- **User Management**: Server-paginated directory of students, staff, and admins with instant role switching (`STUDENT` / `STAFF` / `ADMIN`), account status toggling, and room allocations.
- **Broadcast System**: Publish notices with file attachments targeted to all hostel blocks or specific residential wings.
- **Notice Management**: Deactivate expired announcements in real time.

### Complaint Lifecycle Management

```mermaid
stateDiagram-v2
    [*] --> OPEN: Created by Student
    OPEN --> ASSIGNED: Auto / Manual Staff Assignment
    ASSIGNED --> IN_PROGRESS: Technician Starts Work
    IN_PROGRESS --> RESOLVED: Repair Completed
    RESOLVED --> CLOSED: Verified & Closed
```

- **OPEN**: Complaint is registered and awaiting staff allocation.
- **ASSIGNED**: Ticket is assigned to a designated technician (`assigned_to_id` set).
- **IN_PROGRESS**: Technician is actively working on the maintenance task.
- **RESOLVED**: Work is completed by maintenance personnel.
- **CLOSED**: Ticket is formally completed and archived.

### Campus Broadcasts & Announcements
- Multi-block targeting (e.g. Block D, Block I, Girls Hostel, or Campus-wide).
- Direct file attachments (PDFs, images) with in-browser blob preview.
- In-place deactivation toggle for administrative control.

### Real-Time Notification Center
- Bell counter with live unread badge polling.
- Incremental "Load More" pagination with set-based de-duplication.
- Instant cache invalidation on "Mark as Read".

---

## Role & Navigation Architecture

HostelHub enforces **Single Source of Truth** role routing. Navigation destinations are strictly resolved from the authenticated user profile (`/api/v1/auth/me`):

| Role | Canonical Dashboard | Complaints View | Announcements View | Unauthorized Route Behavior |
|---|---|---|---|---|
| **ADMIN** | `/admin` | `/staff/complaints` | `/admin/announcements` | Direct access to `/staff` or `/student` redirects to `/admin` |
| **STAFF** | `/staff` | `/staff/complaints` | `/announcements` | Direct access to `/admin` redirects to `/staff` |
| **STUDENT** | `/student` | `/student/complaints` | `/announcements` | Direct access to `/admin` or `/staff` redirects to `/student` |

- **Generic `/dashboard`**: Performs deterministic role resolution via `getDashboardRoute(role)` and redirects to the appropriate role workspace.
- **Neutral Loading State**: While authentication state is loading, navigation bars render neutral skeleton placeholders, preventing role-guessing or navigation flashes.

---

## Role Permission Matrix

| Feature / Action | STUDENT | STAFF | ADMIN |
|---|:---:|:---:|:---:|
| View Student Dashboard (`/student`) | ✅ | ❌ | ❌ |
| View Staff Dashboard (`/staff`) | ❌ | ✅ | ❌ |
| View Admin Console (`/admin`) | ❌ | ❌ | ✅ |
| Submit New Complaint (`/student/complaints/new`) | ✅ | ❌ | ❌ |
| View Own Complaints (`/student/complaints`) | ✅ | ❌ | ❌ |
| Edit Own Open Complaint | ✅ | ❌ | ❌ |
| View Hostel Directory (`/staff/complaints`) | ❌ | ✅ | ✅ |
| Update Ticket Status (`ASSIGNED` / `IN_PROGRESS` / `RESOLVED` / `CLOSED`) | ❌ | ✅ | ✅ |
| Assign / Reassign Staff | ❌ | ✅ | ✅ |
| Publish Announcements (`/admin/announcements/create`) | ❌ | ❌ | ✅ |
| Deactivate Announcements | ❌ | ❌ | ✅ |
| Manage User Roles & Room Allocations (`/admin`) | ❌ | ❌ | ✅ |
| View Targeted Announcements (`/announcements`) | ✅ | ✅ | ✅ |
| Receive Notifications (`/notifications`) | ✅ | ✅ | ✅ |

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | [Next.js](https://nextjs.org/) (App Router, Turbopack) | `16.3.0` | React framework with server/client components |
| **UI Library** | [React](https://react.dev/) | `19.2.8` | Component library |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^4.0.0` | Utility-first styling |
| **Components & Icons** | [shadcn/ui](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/) | `1.28.0` | Accessible UI primitives and icons |
| **Data Fetching & Cache** | [TanStack React Query](https://tanstack.com/query) | `^5.101.4` | Server state management and caching |
| **HTTP Client** | [Axios](https://axios-http.com/) | `^1.19.0` | Client-side API requests with interceptors |
| **Backend Framework** | [FastAPI](https://fastapi.tiangolo.com/) | `0.141.1` | Asynchronous Python web API |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | `0.52.1` | High-performance ASGI server |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `15+` | Relational primary database |
| **ORM & Validation** | [SQLModel](https://sqlmodel.tiangolo.com/), [Pydantic](https://docs.pydantic.dev/) | `0.0.39` / `2.13.4` | Type-safe database models and validation |
| **Database Migrations** | [Alembic](https://alembic.sqlalchemy.org/) | `1.19.0` | Schema migration tracking |
| **Authentication** | [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2), [python-jose](https://python-jose.readthedocs.io/) | `3.5.0` | Institutional Google Sign-in and JWT tokens |
| **AI / LLM** | [Google GenAI SDK (`google-genai`)](https://pypi.org/project/google-genai/) | `2.17.0` | Gemini 3.5 Flash for triage and duplicate check |

---

## Project Structure

```text
HostelHub/
├── backend/
│   ├── .env.example                  # Backend environment variables template
│   ├── alembic.ini                   # Alembic database migration configuration
│   ├── Procfile                      # Web process command for cloud deployments
│   ├── requirements.txt              # Python package dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI app entry point, CORS, routers & static mounts
│   │   ├── api/
│   │   │   ├── dependencies.py       # Current user dependency and JWT verification
│   │   │   └── v1/                   # Version 1 API route handlers (39 endpoints)
│   │   │       ├── admin.py          # User management, role updates, room assignments
│   │   │       ├── announcements.py  # Notice publishing, block targeting, deactivation
│   │   │       ├── announcement_attachments.py # Notice file attachments
│   │   │       ├── attachments.py    # Complaint photo attachment upload & serving
│   │   │       ├── auth.py           # Google OAuth login, callback & token exchange
│   │   │       ├── complaints.py     # Complaint CRUD, lifecycle transitions, filtering
│   │   │       ├── dashboard.py      # Student, Staff, and Admin dashboard statistics
│   │   │       ├── hostels.py        # Hostel listings
│   │   │       ├── notifications.py  # User notifications and unread counts
│   │   │       └── rooms.py          # Room options and allocation queries
│   │   ├── auth/
│   │   │   └── roles.py              # Role-based endpoint guards (require_role)
│   │   ├── core/
│   │   │   ├── config.py             # Pydantic BaseSettings environment configuration
│   │   │   └── security.py           # JWT token generation, password hashing, OAuth helpers
│   │   ├── db/
│   │   │   └── database.py           # SQLAlchemy / SQLModel engine and session generator
│   │   ├── enums/                    # Application enum types (Roles, Status, Priority, etc.)
│   │   ├── models/                   # SQLModel table definitions (Complaint, User, Room, etc.)
│   │   ├── schemas/                  # Pydantic request/response validation schemas
│   │   └── services/                 # Business logic, AI triage, staff dispatch, notifications
│   ├── migrations/                   # Alembic migration revisions (21 versions)
│   ├── scripts/
│   │   └── seed_rooms.py             # Room and hostel initial database seeding script
│   └── uploads/                      # Uploaded complaint and notice attachments
├── frontend/
│   ├── .env.example                  # Frontend environment variables template
│   ├── package.json                  # Node.js dependencies and scripts
│   ├── next.config.ts                # Next.js configuration
│   ├── app/                          # Next.js 16 App Router pages
│   │   ├── layout.tsx                # Root layout with QueryClientProvider & Toaster
│   │   ├── page.tsx                  # Public landing page
│   │   ├── login/                    # Google Sign-In page
│   │   ├── auth/callback/            # OAuth exchange and role redirect handler
│   │   ├── dashboard/                # Generic role redirector
│   │   ├── admin/                    # Admin console, user directory, broadcasts
│   │   ├── staff/                    # Staff dashboard & complaints management
│   │   ├── student/                  # Student dashboard, my complaints, create complaint
│   │   ├── announcements/            # Notice board
│   │   └── notifications/            # Real-time notifications center
│   ├── components/                   # Shared UI components
│   │   ├── layout/                   # AppShell, Navbar
│   │   └── ui/                       # Badges, Buttons, Dialogs, StatCards, Pagination
│   ├── lib/                          # Axios API client, auth helpers, utility functions
│   └── src/
│       └── hooks/                    # useCurrentUser, useUnreadNotifications
├── docs/                             # Architecture diagrams and documentation
├── .gitignore                        # Root gitignore protecting secrets and environments
└── README.md                         # Project documentation
```

---

## Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Python**: `v3.11`, `v3.12`, or `v3.13`
- **PostgreSQL**: `v15.x` or higher (running locally or managed in the cloud)
- **Google Cloud Console Account**: With OAuth 2.0 Client Credentials configured
- **Google Gemini API Key**: For AI complaint classification and duplicate detection

---

## Local Installation & Setup

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory by copying `backend/.env.example`:
   ```bash
   cp .env.example .env
   ```

### 2. Database Setup & Seeding

1. **Create the PostgreSQL database**:
   ```sql
   CREATE DATABASE hostelhub;
   ```

2. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

3. **Seed hostels and rooms**:
   ```bash
   python scripts/seed_rooms.py
   ```

### 3. Frontend Setup

1. **Open a new terminal and navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env.local` file in the `frontend/` directory by copying `frontend/.env.example`:
   ```bash
   cp .env.example .env.local
   ```

---

## Environment Variables

### Backend Variables (`backend/.env`)

| Variable | Required | Description | Exposed to Browser? | Production Example |
|---|:---:|---|:---:|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | ❌ **No** | `postgresql://user:pass@host:5432/hostelhub` |
| `GOOGLE_CLIENT_ID` | **Yes** | Google Cloud OAuth 2.0 Client ID | ❌ **No** | `YOUR_CLIENT_ID.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | **Yes** | Google Cloud OAuth 2.0 Client Secret | ❌ **No** | `YOUR_GOOGLE_CLIENT_SECRET` |
| `GOOGLE_REDIRECT_URI` | **Yes** | Backend OAuth callback endpoint | ❌ **No** | `https://api.yourdomain.com/api/v1/auth/google/callback` |
| `GOOGLE_ALLOWED_DOMAIN` | **Yes** | Restricted email domain for login | ❌ **No** | `iiit-bh.ac.in` |
| `GEMINI_API_KEY` | **Yes** | Google Gemini API key | ❌ **No** | `AIzaSy...` |
| `AUTH_SESSION_SECRET` | **Yes** | Starlette session middleware secret | ❌ **No** | `random_64_char_secret_key` |
| `JWT_SECRET_KEY` | **Yes** | Secret for signing JWT access tokens | ❌ **No** | `random_64_char_jwt_secret` |
| `JWT_ALGORITHM` | No | JWT encryption algorithm (Default: `HS256`) | ❌ **No** | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token lifetime in minutes (Default: `60`) | ❌ **No** | `60` |
| `FRONTEND_URL` | **Yes** | Next.js client URL | ❌ **No** | `https://hostelhub.yourdomain.com` |
| `CORS_ORIGINS` | **Yes** | Comma-separated allowed origins (no wildcard `*`) | ❌ **No** | `https://hostelhub.yourdomain.com` |
| `SQL_ECHO` | No | Enable SQLAlchemy query logging | ❌ **No** | `False` |
| `UPLOAD_DIR` | No | Path to store uploaded attachments | ❌ **No** | `uploads` |
| `OAUTHLIB_INSECURE_TRANSPORT` | No | Allow HTTP OAuth (`1` dev, **MUST BE `0` IN PROD**) | ❌ **No** | `0` |
| `OAUTHLIB_RELAX_TOKEN_SCOPE` | No | OAuth scope relaxation | ❌ **No** | `0` |

### Frontend Variables (`frontend/.env.local` / Vercel Environment)

| Variable | Required | Description | Exposed to Browser? | Production Example |
|---|:---:|---|:---:|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | Base URL of the backend API | ✅ **Yes (Public)** | `https://api.yourdomain.com` |

---

## Google OAuth 2.0 Configuration

HostelHub uses Google Single Sign-On restricted to university email accounts.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services** → **OAuth consent screen**:
   - User Type: **Internal** (or External for public verification).
   - Scopes: `openid`, `email`, `profile`.
3. Navigate to **Credentials** → **Create Credentials** → **OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - Local: `http://localhost:3000`, `http://localhost:8000`
     - Production: `https://hostelhub.yourdomain.com`, `https://api.yourdomain.com`
   - **Authorized redirect URIs**:
     - Local: `http://localhost:8000/api/v1/auth/google/callback`
     - Production: `https://api.yourdomain.com/api/v1/auth/google/callback`
4. Copy the **Client ID** and **Client Secret** into your backend production environment.

---

## Running the Application Locally

### Start Backend API Server
In your backend terminal (with virtual environment activated):
```bash
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs (Swagger UI): `http://localhost:8000/docs`
- Alternative API Docs (ReDoc): `http://localhost:8000/redoc`

### Start Frontend Development Server
In your frontend terminal:
```bash
npm run dev
```
- Web Application: `http://localhost:3000`

---

## API Reference

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth / Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/auth/google/login` | Public | Initiates Google OAuth 2.0 redirect |
| `GET` | `/api/v1/auth/google/callback` | Public | Google OAuth callback handler |
| `POST` | `/api/v1/auth/exchange` | Public | Exchanges authorization code for JWT token |
| `GET` | `/api/v1/auth/me` | Bearer JWT | Returns current authenticated user profile |

### Dashboards (`/api/v1/dashboard`)
| Method | Endpoint | Auth / Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/student` | `STUDENT` | Returns student complaint counts & recent tickets |
| `GET` | `/api/v1/dashboard/staff` | `STAFF`, `ADMIN` | Returns staff metrics and assigned tickets |
| `GET` | `/api/v1/dashboard/admin` | `ADMIN` | Returns system-wide complaints, room occupancy, & metrics |

### Complaints (`/api/v1/complaints`)
| Method | Endpoint | Auth / Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/complaints` | `STUDENT` | Submits complaint with AI duplicate detection & classification |
| `GET` | `/api/v1/complaints` | `STUDENT` | Paginated personal complaints with status & search filters |
| `GET` | `/api/v1/complaints/all` | `STAFF`, `ADMIN` | Paginated complaints directory with status (`OPEN`/`ASSIGNED`/etc.), priority, category & search |
| `GET` | `/api/v1/complaints/{id}` | All Authenticated | Detailed complaint view with room and history |
| `PATCH` | `/api/v1/complaints/{id}/status` | `STAFF`, `ADMIN` | Updates complaint status through valid transition paths |
| `PATCH` | `/api/v1/complaints/{id}/assign` | `STAFF`, `ADMIN` | Reassigns complaint to another staff technician |
| `PATCH` | `/api/v1/complaints/{id}` | `STUDENT` | Edits own unresolved complaint |
| `GET` | `/api/v1/complaints/{id}/history` | All Authenticated | Returns audited action timeline for the ticket |
| `POST` | `/api/v1/complaints/{id}/supporters` | `STUDENT` | Adds community support/upvote to complaint |
| `DELETE`| `/api/v1/complaints/{id}/supporters` | `STUDENT` | Removes support from complaint |

### Announcements (`/api/v1/announcements`)
| Method | Endpoint | Auth / Role | Description |
|---|---|---|---|
| `POST` | `/api/v1/announcements` | `ADMIN` | Publishes notice with block targeting |
| `GET` | `/api/v1/announcements` | All Authenticated | Lists active announcements for user's block |
| `PATCH` | `/api/v1/announcements/{id}/deactivate` | `ADMIN` | Deactivates an active announcement |

### Admin Management (`/api/v1/admin`)
| Method | Endpoint | Auth / Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | `ADMIN` | Paginated user management list with role/status filters |
| `GET` | `/api/v1/admin/staff` | `ADMIN` | Active staff directory for task delegation |
| `PATCH` | `/api/v1/admin/users/{id}/role` | `ADMIN` | Promotes/demotes user role (`STUDENT`/`STAFF`/`ADMIN`) |
| `PATCH` | `/api/v1/admin/users/{id}/status` | `ADMIN` | Activates or deactivates user accounts |
| `PATCH` | `/api/v1/admin/users/{id}/room` | `ADMIN` | Assigns or changes student room allocation |

### Notifications & Attachments
| Method | Endpoint | Auth / Role | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | All Authenticated | Paginated user notifications feed |
| `GET` | `/api/v1/notifications/unread` | All Authenticated | Retrieves unread notification count |
| `PATCH` | `/api/v1/notifications/{id}/read` | All Authenticated | Marks notification as read |
| `POST` | `/api/v1/attachments/{complaint_id}/attachments` | All Authenticated | Uploads image attachment for complaint |
| `GET` | `/api/v1/attachments/file/{filename}` | All Authenticated | Retrieves complaint image file |
| `POST` | `/api/v1/announcement-attachments/{announcement_id}` | `ADMIN` | Uploads attachment for announcement |
| `GET` | `/api/v1/announcement-attachments/file/{filename}` | All Authenticated | Retrieves announcement attachment file |

---

## Database Schema

```mermaid
erDiagram
    HOSTELS ||--o{ ROOMS : contains
    ROOMS ||--o{ USERS : assigned_to
    USERS ||--o{ COMPLAINTS : reports
    USERS ||--o{ COMPLAINTS : assigned_to
    COMPLAINTS ||--o{ COMPLAINT_ATTACHMENTS : contains
    COMPLAINTS ||--o{ COMPLAINT_HISTORY : tracks
    COMPLAINTS ||--o{ COMPLAINT_SUPPORTERS : supported_by
    USERS ||--o{ COMPLAINT_SUPPORTERS : joins
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ ANNOUNCEMENTS : publishes
    ANNOUNCEMENTS ||--o{ ANNOUNCEMENT_BLOCKS : targets
    ANNOUNCEMENTS ||--o{ ANNOUNCEMENT_ATTACHMENTS : contains
```

---

## Production Deployment Guide

### 1. Recommended Hosting Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │                      Vercel CDN                        │
                    │               (Next.js 16 App Router)                 │
                    │         https://hostelhub.yourdomain.com               │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
                                 HTTPS REST    │ Bearer JWT
                                               ▼
                    ┌────────────────────────────────────────────────────────┐
                    │              Render / Railway Web Service              │
                    │                  (FastAPI + Uvicorn)                   │
                    │            https://api.yourdomain.com                  │
                    └──────────────┬──────────────────────────┬──────────────┘
                                   │                          │
                        Postgres   │                          │ S3 / Render Disk
                                   ▼                          ▼
                    ┌──────────────────────────┐  ┌──────────────────────────┐
                    │ Managed PostgreSQL (v15) │  │ Static / Persistent Disk │
                    │   (Render / Neon / AWS)  │  │        (/uploads)        │
                    └──────────────────────────┘  └──────────────────────────┘
```

**Why this architecture?**
- **Frontend on Vercel**: Zero-config deployment for Next.js 16 (App Router + Turbopack), automated edge CDN caching, instant branch previews, and automatic HTTPS.
- **Backend on Render / Railway**: Native Python 3.12 support, automatic SSL certificates, zero-config port binding via `$PORT`, integrated secrets management, and persistent disk support for `/uploads`.
- **Managed PostgreSQL**: Fully managed backups, connection pooling, and automated failover.

---

### 2. Database Deployment

1. Provision a PostgreSQL (v15+) database on **Render**, **Railway**, **Neon**, or **AWS RDS**.
2. Copy the external `DATABASE_URL` connection string (e.g. `postgresql://user:password@hostname:5432/hostelhub`).
3. Apply database migrations from your CI/CD pipeline or deployment terminal:
   ```bash
   alembic upgrade head
   ```
4. Run the initial room & hostel seeding script:
   ```bash
   python scripts/seed_rooms.py
   ```

---

### 3. Backend Deployment (Render / Railway)

1. **Connect Repository**: Link your GitHub repository to Render or Railway.
2. **Configure Web Service**:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}` (or use the provided `backend/Procfile`).
3. **Configure Environment Variables**:
   Set all variables from [Backend Variables](#backend-variables-backendenv).
   - Set `OAUTHLIB_INSECURE_TRANSPORT=0`.
   - Set `FRONTEND_URL=https://hostelhub.yourdomain.com`.
   - Set `CORS_ORIGINS=https://hostelhub.yourdomain.com`.
   - Set `GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/v1/auth/google/callback`.
4. **Deploy Service**: Trigger the build and verify the health check at `https://api.yourdomain.com/`.

---

### 4. Frontend Deployment (Vercel)

1. **Import Project**: In Vercel, click **"Add New Project"** and select the `HostelHub` repository.
2. **Configure Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. **Configure Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Set to your deployed backend URL (e.g. `https://api.yourdomain.com`).
4. **Deploy**: Click **Deploy**. Vercel will build and assign your production domain.

---

### 5. Production Google OAuth 2.0 Setup

Once both domains are active:
1. Open the [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Edit your OAuth 2.0 Web Client ID:
   - **Authorized JavaScript origins**:
     - `https://hostelhub.yourdomain.com`
     - `https://api.yourdomain.com`
   - **Authorized redirect URIs**:
     - `https://api.yourdomain.com/api/v1/auth/google/callback`
3. Save changes.

---

### 6. Post-Deployment Verification & Smoke Tests

Run through this complete checklist on your production environment:

#### 🌐 Core & Authentication
- [ ] Homepage (`/`) loads with valid assets and HTTPS.
- [ ] Login page (`/login`) loads with university domain badge.
- [ ] Google OAuth login redirects to Google authentication and returns to `/auth/callback`.
- [ ] Code exchange successfully sets `access_token` in `localStorage` and redirects to the canonical dashboard.
- [ ] Logout button clears `localStorage` and `sessionStorage` and returns to `/login`.

#### 🛡️ Role Workflows & Single Source of Truth
- [ ] **ADMIN**:
  - Directs to `/admin` upon login.
  - Metrics cards (Total Users, Hostels, Rooms, Complaints, Occupancy) load data.
  - User Directory allows switching roles (`STUDENT`/`STAFF`/`ADMIN`) and room allocation.
  - Broadcasts tab publishes an announcement with PDF/image attachment.
  - Navigate `/admin` $\to$ `/staff/complaints` $\to$ Click "Dashboard" $\to$ Returns to `/admin`.
- [ ] **STAFF**:
  - Directs to `/staff` upon login.
  - Complaints directory loads server-side paginated list.
  - Status filter dropdown filters by `ASSIGNED`, `OPEN`, `IN_PROGRESS`, `RESOLVED`, and `CLOSED`.
  - Reassigning a technician updates ticket and timeline.
  - Navigate `/staff` $\to$ `/staff/complaints` $\to$ Click "Dashboard" $\to$ Returns to `/staff`.
- [ ] **STUDENT**:
  - Directs to `/student` upon login.
  - Submit complaint form checks for duplicate issues with Gemini AI.
  - File photo attachment uploads and displays in complaint details.
  - Status filter tabs (`All`, `Open`, `Assigned`, `In Progress`, `Resolved`, `Closed`) filter tickets.
  - Navigate `/student` $\to$ `/student/complaints` $\to$ Click "Dashboard" $\to$ Returns to `/student`.

#### 🔒 Security & Route Guards
- [ ] Accessing `/admin` as a Student or Staff immediately redirects to `/student` or `/staff`.
- [ ] Accessing `/staff` as an Admin immediately redirects to `/admin`.
- [ ] Calling the backend from an unlisted domain is blocked by CORS.
- [ ] Backend API documents are protected or live at `/docs`.

---

## Quality Gates & Verification

The codebase has undergone a complete quality verification pass:

| Check | Tool | Status | Details |
|---|---|---|---|
| **Frontend Lint** | ESLint 9 | **PASS** | 0 errors across entire Next.js codebase |
| **Production Build** | Next.js 16 (Turbopack) | **PASS** | 17/17 static and dynamic routes compiled in 17.2s |
| **Backend Schemas & Validation** | Python 3.12 / Pydantic v2 | **PASS** | All 39 API sub-routes and models validated |
| **Role Navigation Audit** | Single Source of Truth | **PASS** | Verified deterministic routing across ADMIN, STAFF, and STUDENT |
| **Data & Pagination Audit** | Server Pagination & Filters | **PASS** | Accurate total counts, status filters (including `ASSIGNED`), and page resets |

---

## Troubleshooting

### 1. Google OAuth: "Token used too early"
- **Cause**: A slight clock drift between your server/local development machine and Google authentication servers.
- **Solution**: Synchronize your operating system clock:
  - **Windows**: Settings → Time & Language → Date & Time → Click **"Sync now"**.
  - **Linux / Cloud Servers**: Ensure NTP or systemd-timesyncd is active (`sudo timedatectl set-ntp on`).

### 2. CORS Error in Browser Console
- **Cause**: The production frontend domain is missing from `CORS_ORIGINS` in backend environment variables.
- **Solution**: Update `CORS_ORIGINS` on the backend to include the exact frontend domain without trailing slashes (e.g. `https://hostelhub.yourdomain.com,https://preview.yourdomain.com`).

### 3. Role Navigation Mismatch
- **Cause**: Stale in-memory cache or old localStorage token.
- **Solution**: Click **"Sign out"** in the top navigation bar. HostelHub clears all localStorage and sessionStorage and triggers a full cache reset.

### 4. Database Connection Errors
- **Cause**: PostgreSQL service is stopped or credentials in `.env` do not match.
- **Solution**: Ensure PostgreSQL is running (`sudo systemctl status postgresql` or cloud status dashboard) and verify `DATABASE_URL` in backend environment variables.

---

## Security Considerations

- **Secret Management**: Never commit `.env` or `.env.local` files containing secrets to version control.
- **Token Storage**: JWT access tokens are stored in `localStorage` and sent via standard `Authorization: Bearer <token>` headers.
- **Domain Whitelisting**: Google OAuth is restricted to the institutional domain configured in `GOOGLE_ALLOWED_DOMAIN` (e.g., `iiit-bh.ac.in`).
- **File Upload Protection**: Image uploads are validated against MIME type (`image/jpeg`, `image/png`, `image/webp`) and capped at a maximum of 5MB.
- **OAuth Transport Security**: Ensure `OAUTHLIB_INSECURE_TRANSPORT=0` in production environments so all OAuth exchanges require HTTPS.

---

## Contributing

1. **Fork the repository** and create a feature branch (`git checkout -b feature/amazing-feature`).
2. **Commit your changes** (`git commit -m 'Add amazing feature'`).
3. **Run code quality checks**:
   ```bash
   # In frontend/
   npm run lint
   npm run build
   ```
4. **Push to the branch** (`git push origin feature/amazing-feature`).
5. **Open a Pull Request**.

---

## License

This project is currently maintained for university hostel operations. No open-source license is currently specified.
