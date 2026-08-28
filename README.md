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
- [Installation & Setup](#installation--setup)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Database Setup & Seeding](#2-database-setup--seeding)
  - [3. Frontend Setup](#3-frontend-setup)
- [Environment Variables](#environment-variables)
- [Google OAuth 2.0 Configuration](#google-oauth-20-configuration)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Quality Gates & Verification](#quality-gates--verification)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)
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
- **Hostel Complaints Directory**: Comprehensive complaint table with server-side filters for status, priority, category, and text search.
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
│   ├── alembic.ini                   # Alembic database migration configuration
│   ├── requirements.txt              # Python package dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI app entry point, CORS, routers & static mounts
│   │   ├── api/
│   │   │   ├── dependencies.py       # Current user dependency and JWT verification
│   │   │   └── v1/                   # Version 1 API route handlers
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
│   ├── migrations/                   # Alembic migration revisions
│   ├── scripts/
│   │   └── seed_rooms.py             # Room and hostel initial database seeding script
│   └── uploads/                      # Uploaded complaint and notice attachments
├── frontend/
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
└── README.md                         # Project documentation
```

---

## Prerequisites

Ensure you have the following installed on your development machine:

- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Python**: `v3.11`, `v3.12`, or `v3.13`
- **PostgreSQL**: `v15.x` or higher (running locally or in the cloud)
- **Google Cloud Console Account**: With OAuth 2.0 Client Credentials configured
- **Google Gemini API Key**: For AI complaint classification and duplicate detection

---

## Installation & Setup

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
   Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables)).

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
   Create a `.env.local` file in the `frontend/` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

---

## Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Description | Example |
|---|:---:|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/hostelhub` |
| `GOOGLE_CLIENT_ID` | Yes | Google Cloud OAuth 2.0 Client ID | `YOUR_CLIENT_ID.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes | Google Cloud OAuth 2.0 Client Secret | `YOUR_GOOGLE_CLIENT_SECRET` |
| `GOOGLE_REDIRECT_URI` | Yes | Backend OAuth callback endpoint | `http://localhost:8000/api/v1/auth/google/callback` |
| `GOOGLE_ALLOWED_DOMAIN` | Yes | Restricted email domain for login | `iiit-bh.ac.in` |
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `YOUR_GEMINI_API_KEY` |
| `AUTH_SESSION_SECRET` | Yes | Starlette session middleware secret | `YOUR_LONG_RANDOM_SESSION_SECRET` |
| `JWT_SECRET_KEY` | Yes | Secret for signing JWT access tokens | `YOUR_LONG_RANDOM_JWT_SECRET` |
| `JWT_ALGORITHM` | No | JWT encryption algorithm (Default: `HS256`) | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token lifetime in minutes (Default: `60`) | `60` |
| `FRONTEND_URL` | Yes | Next.js client URL | `http://localhost:3000` |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins | `http://localhost:3000,http://127.0.0.1:3000` |
| `SQL_ECHO` | No | Enable SQLAlchemy query logging | `False` |
| `UPLOAD_DIR` | No | Path to store uploaded attachments | `uploads` |
| `OAUTHLIB_INSECURE_TRANSPORT` | No | Allow HTTP OAuth locally (`1` dev, `0` prod) | `1` |
| `OAUTHLIB_RELAX_TOKEN_SCOPE` | No | OAuth scope relaxation | `0` |

### Frontend Configuration (`frontend/.env.local`)

| Variable | Required | Description | Example |
|---|:---:|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Base URL of the backend API | `http://localhost:8000` |

---

## Google OAuth 2.0 Configuration

HostelHub uses Google Single Sign-On restricted to university email accounts.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services** → **OAuth consent screen**:
   - User Type: **Internal** (or External for testing).
   - Scopes: `openid`, `email`, `profile`.
4. Navigate to **Credentials** → **Create Credentials** → **OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
     - `http://localhost:8000`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/v1/auth/google/callback`
5. Copy the generated **Client ID** and **Client Secret** into your `backend/.env`.

---

## Running the Application

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
| `GET` | `/api/v1/complaints/all` | `STAFF`, `ADMIN` | Paginated complaints directory with status, priority, category & search |
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
| `POST` | `/api/v1/attachments/complaint/{id}` | All Authenticated | Uploads image attachment for complaint |
| `GET` | `/api/v1/attachments/file/{filename}` | All Authenticated | Retrieves complaint image file |
| `POST` | `/api/v1/announcement-attachments/announcement/{id}` | `ADMIN` | Uploads attachment for announcement |
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

## Quality Gates & Verification

The codebase has undergone a complete quality verification pass:

| Check | Tool | Status | Details |
|---|---|---|---|
| **Frontend Lint** | ESLint 9 | **PASS** | 0 errors across entire Next.js codebase |
| **Production Build** | Next.js 16 (Turbopack) | **PASS** | 17/17 static and dynamic routes compiled in 3.8s |
| **Backend Schemas & Validation** | Python 3.12 / Pydantic v2 | **PASS** | All response models and query routers validated |
| **Role Navigation Audit** | Single Source of Truth | **PASS** | Verified deterministic routing across ADMIN, STAFF, and STUDENT |
| **Data & Pagination Audit** | Server Pagination & Filters | **PASS** | Accurate total counts, status filters (including `ASSIGNED`), and page resets |

---

## Troubleshooting

### 1. Google OAuth: "Token used too early"
- **Cause**: A slight clock drift between your local development machine and Google authentication servers.
- **Solution**: Synchronize your operating system clock:
  - **Windows**: Settings → Time & Language → Date & Time → Click **"Sync now"**.
  - **Linux/macOS**: Run `sudo ntpdate -s time.nist.gov` or `sudo sntp -sS pool.ntp.org`.

### 2. Role Navigation Mismatch
- **Cause**: Stale in-memory cache or old localStorage token.
- **Solution**: Click **"Sign out"** in the top navigation bar. HostelHub clears all localStorage and sessionStorage and triggers a full cache reset.

### 3. Database Connection Errors
- **Cause**: PostgreSQL service is stopped or credentials in `.env` do not match.
- **Solution**: Ensure PostgreSQL is running (`sudo systemctl status postgresql` or Windows Services) and verify `DATABASE_URL` in `backend/.env`.

---

## Deployment

> [!NOTE]
> Containerized Docker or one-click cloud deployment configurations (e.g. Dockerfile / docker-compose) are not currently included in this repository. 
> 
> To deploy in production:
> - **Backend**: Run FastAPI with Uvicorn/Gunicorn behind an Nginx reverse proxy or deploy via a cloud platform (e.g. Render, Railway, AWS ECS). Set `OAUTHLIB_INSECURE_TRANSPORT=0`.
> - **Frontend**: Deploy the Next.js application to [Vercel](https://vercel.com) or build a standalone Node.js server (`npm run build && npm run start`).

---

## Security Considerations

- **Secret Management**: Never commit `.env` or `.env.local` files containing secrets to version control.
- **Token Storage**: JWT access tokens are stored in `localStorage` and sent via standard `Authorization: Bearer <token>` headers.
- **Domain Whitelisting**: Google OAuth is restricted to the institutional domain configured in `GOOGLE_ALLOWED_DOMAIN` (e.g., `iiit-bh.ac.in`).
- **File Upload Protection**: Image uploads are validated against MIME type (`image/jpeg`, `image/png`, `image/webp`) and capped at a maximum of 5MB.

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