# KYRA CRM — Production-Ready Internal Employee Operations Portal

[![Next.js](https://img.shields.io/badge/Next.js-14.2.24-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Automated%20Tests-10%2F10%20Passed-brightgreen)](scripts/test-runner.js)

An enterprise-grade internal CRM and operations web portal for **KYRA**, designed for managing promotional campaigns, incoming customer leads, telecalling workflows, and on-site real estate project visits.

This is an **employee-only business portal** built with strict Role-Based Access Control (RBAC), end-to-end relational data persistence, live database analytics, immutable audit logs, and verified workflows.

---

## 🔑 Quick-Start Seed Credentials

The portal is seeded with active accounts for all five enterprise roles.
All seed accounts use the default development password: **`Password123!`**

| Role | Employee Name | Work Email | Access & Primary Scope |
| :--- | :--- | :--- | :--- |
| **General Manager** | Rajesh Menon | `gm@kyra.com` | Full organizational oversight, live conversion funnel, audit trail, employee admin, reports |
| **Digital Head** | Anita Sharma | `digital@kyra.com` | Promotional campaigns, lead acquisition sources, media attribution, work delegation |
| **CRM Executive** | Karthik Verma | `crm@kyra.com` | Lead intake, CSV bulk import, telecaller workload assignment, callback coordination |
| **Site Manager** | Suresh Pillai | `site@kyra.com` | Site visits schedule, field arrivals, visit completion/rescheduling/cancellation, property ops |
| **Telecaller 1** | Priya Nair | `telecaller1@kyra.com` | Assigned calling queue, `tel:` dialer, controlled feedback, site-visit fixing, callbacks |
| **Telecaller 2** | Rahul Krishnan | `telecaller2@kyra.com` | Assigned calling queue, customer feedback logging, follow-up scheduling |

> 💡 **Tip:** On the `/login` screen, use the **Quick-Fill Seed Account** buttons to immediately test any role with 1-click.

---

## 🏛️ System Architecture

```
                                  +-----------------------+
                                  |    KYRA CRM Portal    |
                                  | (Next.js 14 App Router)|
                                  +-----------+-----------+
                                              |
                     +------------------------+-----------------------+
                     |                        |                       |
           [Auth Middleware]         [Role-Based Dashboards]    [Core API Routes]
         JWT in HttpOnly Cookie       GM / DH / CRM / SM / TC     /api/leads, /api/calls,
                                                                 /api/site-visits, etc.
                                              |
                                     [Prisma ORM Layer]
                               (Typed Relational Transactions)
                                              |
                                    +---------+---------+
                                    |                   |
                           [SQLite Database]    [PostgreSQL Option]
                           (Zero-config dev)    (Docker production)
```

### Tech Stack
* **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
* **Backend:** Next.js Server Route Handlers, Prisma ORM 5.22, JSON Web Tokens (JWT), `bcryptjs`.
* **Data Processing:** PapaParse (CSV streaming with validation), Date-fns.
* **Security:** Server-side RBAC validation, HttpOnly sameSite cookies, password hashing with salt rounds, SQL injection immunity via parameterized ORM queries, immutable audit logs.

---

## 📋 Role & Permission Matrix

| Feature / Action | General Manager | Digital Head | CRM Executive | Site Manager | Telecaller |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Role-Specific Dashboard** | ✅ Org Overview | ✅ Marketing Hub | ✅ Intake & Callers | ✅ Field Schedule | ✅ Calling Queue |
| **View All Company Leads** | ✅ | ✅ | ✅ | Assigned Sites Only | Assigned Leads Only |
| **Create Single Lead** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **CSV Bulk Import** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assign / Reassign Leads** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Telephone Action (`tel:`)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Log Call Report & Feedback** | ✅ | ❌ | ✅ | ❌ | ✅ (Assigned only) |
| **Site Visit Fixed Workflow** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Update Site Visit Status** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Assign Work Tasks** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Manage Campaigns** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **View Audit Logs** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Manage Employees & Roles**| ✅ | ❌ | ❌ | ❌ | ❌ |
| **Export Reports to CSV** | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 🔄 End-to-End Business Workflows

### 1. Lead Intake & Duplicate Phone Detection
* Navigate to **Leads -> Add Lead** (`/leads/new`).
* As you type a phone number, the system automatically runs real-time duplicate checks (`/api/leads/check-phone`).
* If an existing customer profile exists, the form alerts the user and links the new inquiry to the unified **Customer 360** profile without destroying past call records.

### 2. CSV Bulk Import with Row Validation
* Navigate to **Leads -> CSV Import** (`/leads?action=import`).
* Upload a CSV file (a downloadable template is provided in the UI).
* The parser previews rows, allows visual column mapping (Name, Phone, Location, Email, Notes, Priority), detects duplicates, verifies row validity, and allows setting batch assignment defaults (site, source, telecaller).
* Shows a detailed summary report (total rows, imported, attached to existing customers, row-level errors).

### 3. Telecaller Call Workflow & Controlled Feedback
* Telecallers see only leads assigned to them in **My Leads** (`/leads`) and **Telecaller Workspace** (`/`).
* Click **Call Customer & Log Report**:
  * Clicking **Call Customer** triggers a browser `tel:` action and automatically records a call attempt in the database.
  * Telecaller selects from the controlled feedback options:
    1. **Not interested** &rarr; allows selecting reason (e.g. Budget mismatch) and closes inquiry.
    2. **Not connected** &rarr; allows retry date/time and notes.
    3. **Call back** &rarr; requires mandatory date & time commitment; surfaces in priority callback queue.
    4. **Interested** &rarr; opens interactive site-visit branching question:
       * **Fixed:** Requires inspection date, time slot, project site, and assigned Site Manager. Automatically creates a `SiteVisit` record with status `SCHEDULED`, marks lead as `SITE_VISIT_SCHEDULED`, and sends notifications to the Site Manager and CRM Executive.
       * **Not fixed:** Saves prospect as Interested, marks lead as `QUALIFIED`, and schedules a follow-up date to fix the visit later.

### 4. Site Visits Management & Rescheduling
* Navigate to **Site Visits** (`/site-visits`).
* Switch between **List View** and **Interactive Calendar View**.
* Site Managers can update visit progress:
  * **Confirm:** Flags visit as confirmed with customer.
  * **Reschedule:** Prompts for new date/time and reason. Preserves complete reschedule history in `rescheduleHistory` JSON.
  * **Complete:** Records field completion notes and updates lead lifecycle status to `SITE_VISIT_COMPLETED`.
  * **Cancel / No Show:** Records cancellation reason.

### 5. Work & Task Delegation
* Managers (GM, Digital Head, CRM Exec) can create tasks with priority ratings, due dates, categories, and assigned employees.
* In-app notifications are instantly dispatched to the assigned employee.
* Employees mark tasks **In Progress** or **Completed** with completion remarks.

### 6. Reports & CSV Export
* Database-backed live reports on `/reports`.
* Filter by date range (From / To), Project Site, or Telecaller.
* Visual feedback breakdown and telecaller outreach tables.
* Click **Export Filtered CSV** to download a spreadsheet with all filtered records.

---

## 💻 Local Setup & Development

### Prerequisites
* Node.js v18+ or v20+
* npm v9+

### 1. Clone & Install
```bash
git clone <repo-url>
cd Kyra-CRM
npm install
```

### 2. Environment Configuration
Create or inspect `.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="kyra-enterprise-crm-super-secure-jwt-secret-key-production-2026"
NEXT_PUBLIC_APP_NAME="KYRA CRM"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 3. Database Migration & Seeding
```bash
# Push schema to SQLite database
npm run prisma:push

# Seed database with employees, sites, campaigns, leads, calls, visits, and tasks
npm run db:seed
```

### 4. Run Automated Test Suite
```bash
npm test
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Production Deployment

### Option A: Standard Node.js / PM2 Build
```bash
# Compile optimized production bundle
npm run build

# Start production server
npm start
```

### Option B: Docker Container Deployment
```bash
# Build and run containerized service
docker-compose up -d --build
```
The application will be live at `http://localhost:3000`.

---

## 💾 Backup & Restore Procedures

### SQLite (Default)
To back up the live database:
```bash
# Create timestamped snapshot
cp dev.db "dev_backup_$(date +%Y%m%d_%H%M%S).db"
```
To restore:
```bash
cp <backup_file>.db dev.db
npx prisma generate
```

### PostgreSQL (Production Alternative)
To switch to PostgreSQL, update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```
And set `DATABASE_URL="postgresql://user:password@localhost:5432/kyra_crm?schema=public"` in `.env`.
Then run `npx prisma db push && npm run db:seed`.

---

## 🔒 Security & Privacy Practices
* **No plaintext credentials:** Passwords salted and hashed with `bcryptjs`.
* **Session protection:** JWT tokens stored exclusively in `httpOnly`, `SameSite=Lax` cookies.
* **Server-side RBAC:** Authorization checks enforced on both UI routing and API endpoints.
* **Audit trail:** Sensitive operations (`LOGIN`, `LEAD_ASSIGNED`, `CALL_LOGGED`, `SITE_VISIT_SCHEDULED`, `PASSWORD_RESET`) write timestamped, IP-tagged records to the `AuditLog` table.
* **Scoped customer data:** Telecallers only see leads assigned to their queue; Site Managers only see site visits in their assigned locations.
