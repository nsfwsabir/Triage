# AGENTS.md — Triage (Helpdesk & Issue Ticketing System)

## 1. Project Overview
**Project Name:** **Triage**  
Build a full-stack helpdesk and issue ticketing system that enables users to submit, track, and discuss support tickets, while allowing support agents/admins to triage, assign, prioritize, and resolve issues through structured state transitions.

### Core Tech Stack
* **Frontend:** React 18+ (Vite), TypeScript (recommended) or JavaScript, Tailwind CSS, Framer Motion (animations), React Router v6, Axios, Lucide React (icons).
* **Backend:** Java 17+, Spring Boot 3.x (Spring Web, Spring Data JPA, Spring Security, Bean Validation, Lombok).
* **Database:** MySQL 8.x.
* **Authentication:** Stateless JWT (JSON Web Tokens) with Role-Based Access Control (`USER`, `ADMIN`).

---

## 2. Repository & Directory Structure
Organize the workspace into a clean monorepo structure:

```text
triage/
├── backend/                  # Spring Boot Application (Maven)
│   ├── src/main/java/com/triage/
│   │   ├── config/           # SecurityConfig, CorsConfig, JwtAuthenticationFilter
│   │   ├── controller/       # AuthController, TicketController, CommentController, AdminController
│   │   ├── dto/              # Request & Response records/classes
│   │   ├── entity/           # User, Ticket, TicketComment, Enums
│   │   ├── exception/        # GlobalExceptionHandler, Custom exceptions
│   │   ├── repository/       # JpaRepository interfaces
│   │   ├── service/          # Business logic & state machine validation
│   │   └── util/             # JwtUtil
│   └── src/main/resources/
│       └── application.yml
└── frontend/                 # React + Vite Application
    ├── src/
    │   ├── api/              # Axios instance with JWT interceptor & API service modules
    │   ├── components/       # Navbar, StatusBadge, PriorityBadge, TicketRow, SlideOverModal, ProtectedRoute
    │   ├── context/          # AuthContext (user state, login, logout, role helpers)
    │   ├── pages/            # Login, Register, Dashboard, TicketDetail
    │   └── App.jsx
    └── package.json
```

---

## 3. Database Schema (MySQL 8.x)

### Database Name
`triage_db`

### Tables & Relationships

#### A. `users`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | |
| `email` | `VARCHAR(150)` | `NOT NULL, UNIQUE` | Used as login username |
| `password` | `VARCHAR(255)` | `NOT NULL` | BCrypt hashed |
| `role` | `VARCHAR(20)` | `NOT NULL` | Enum: `USER`, `ADMIN` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | |

#### B. `tickets`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | |
| `title` | `VARCHAR(200)` | `NOT NULL` | Short summary of issue |
| `description` | `TEXT` | `NOT NULL` | Detailed reproduction steps |
| `category` | `VARCHAR(50)` | `NOT NULL` | Enum: `BUG`, `HARDWARE`, `ACCESS`, `OTHER` |
| `priority` | `VARCHAR(20)` | `NOT NULL` | Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | `VARCHAR(20)` | `NOT NULL` | Enum: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `created_by_id` | `BIGINT` | `FOREIGN KEY -> users(id), NOT NULL` | Ticket author |
| `assigned_to_id` | `BIGINT` | `FOREIGN KEY -> users(id), NULL` | Admin handling the ticket |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | `ON UPDATE CURRENT_TIMESTAMP` | |
| `resolved_at` | `TIMESTAMP` | `NULL` | Populated when moved to `RESOLVED` |

#### C. `ticket_comments`
| Column | Type | Constraints | Notes |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY, AUTO_INCREMENT` | |
| `ticket_id` | `BIGINT` | `FOREIGN KEY -> tickets(id) ON DELETE CASCADE` | |
| `author_id` | `BIGINT` | `FOREIGN KEY -> users(id), NOT NULL` | |
| `content` | `TEXT` | `NOT NULL` | Comment body |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | |

---

## 4. Business Logic & State Machine Rules

1. **Ticket Lifecycle (Status Transitions):**
   * New tickets always start as `OPEN`.
   * Valid transitions:
     * `OPEN` $\rightarrow$ `IN_PROGRESS` or `CLOSED`
     * `IN_PROGRESS` $\rightarrow$ `RESOLVED` or `OPEN`
     * `RESOLVED` $\rightarrow$ `CLOSED` or `IN_PROGRESS` (re-opened if issue persists)
     * `CLOSED` $\rightarrow$ `OPEN` (only by `ADMIN`)
   * When status changes to `RESOLVED`, automatically set `resolved_at = LocalDateTime.now()`.
   * When status moves out of `RESOLVED` back to `IN_PROGRESS` or `OPEN`, reset `resolved_at = null`.

2. **Access Control Rules:**
   * **`USER` Role:**
     * Can create tickets.
     * Can view **only** tickets they created (`created_by_id == currentUser.id`).
     * Can add comments to their own tickets.
     * Cannot change ticket priority, assignee, or move tickets to `IN_PROGRESS`/`RESOLVED` (can optionally mark their own resolved ticket as `CLOSED`).
   * **`ADMIN` Role:**
     * Can view **all** tickets across the system.
     * Can update status, priority, and assign tickets to any `ADMIN` user.
     * Can comment on any ticket.

---

## 5. REST API Specification (Spring Boot)

Base URL: `/api/v1`

### Authentication Endpoints (Public)
* `POST /auth/register`
  * **Body:** `{ "fullName": "...", "email": "...", "password": "..." }` (Defaults to `USER` role).
  * **Response (`201 Created`):** `{ "token": "...", "user": { "id": 1, "fullName": "...", "email": "...", "role": "USER" } }`
* `POST /auth/login`
  * **Body:** `{ "email": "...", "password": "..." }`
  * **Response (`200 OK`):** `{ "token": "...", "user": { ... } }`

### Ticket Endpoints (Authenticated: `Bearer <token>`)
* `GET /tickets`
  * **Query Params (Optional):** `?status=OPEN&priority=HIGH&category=BUG&search=login`
  * **Behavior:** Returns all matching tickets if `ADMIN`; returns only user's own matching tickets if `USER`. Ordered by `createdAt DESC`.
* `GET /tickets/stats`
  * **Behavior:** Returns summary counts (`total`, `open`, `inProgress`, `resolved`, `highPriority`) scoped by role.
* `POST /tickets`
  * **Body:** `{ "title": "...", "description": "...", "category": "BUG", "priority": "MEDIUM" }`
  * **Response (`201 Created`):** Created `TicketResponse` DTO.
* `GET /tickets/{id}`
  * **Behavior:** Returns ticket details + list of comments. Throw `403 Forbidden` if `USER` does not own the ticket.
* `PATCH /tickets/{id}` (`ADMIN` only)
  * **Body:** `{ "status": "IN_PROGRESS", "priority": "HIGH", "assignedToId": 2 }` (Partial updates supported).
  * **Behavior:** Validates state transition and updates fields.
* `DELETE /tickets/{id}` (`ADMIN` or Ticket Owner while status is `OPEN`)
  * **Response (`204 No Content`)**

### Comment Endpoints (Authenticated)
* `POST /tickets/{ticketId}/comments`
  * **Body:** `{ "content": "Have you tried clearing browser cache?" }`
  * **Behavior:** Validates user owns ticket or is `ADMIN`. Returns `201 Created` with `CommentResponse`.

### Admin Helper Endpoints (`ADMIN` only)
* `GET /users/admins`
  * **Behavior:** Returns list of users with `role == ADMIN` to populate the "Assign To" dropdown in the UI.

---

## 6. Backend Implementation Requirements

1. **DTO Pattern:** Never expose JPA `@Entity` classes directly in controllers. Create clean request/response DTOs (`TicketRequest`, `TicketResponse`, `TicketDetailResponse`, `CommentResponse`, `AuthResponse`).
2. **Global Exception Handling (`@RestControllerAdvice`):**
   * Return consistent error payloads: `{ "timestamp": "...", "status": 400, "error": "Bad Request", "message": "..." }`.
   * Handle `ResourceNotFoundException` (`404`), `AccessDeniedException` (`403`), `InvalidStateTransitionException` (`400`), and `MethodArgumentNotValidException` (`400` with field validation errors).
3. **CORS Configuration:** Allow `http://localhost:5173` with methods `GET, POST, PUT, PATCH, DELETE, OPTIONS` and headers `Authorization, Content-Type`.
4. **Database Seeding (`DataSeeder.java`):**
   * On application startup, if `users` table is empty, create:
     * Admin user: `admin@triage.dev` / `admin123` (`ADMIN`)
     * Regular user: `student@triage.dev` / `student123` (`USER`)
     * 4 realistic, domain-authentic sample tickets across different statuses and priorities (never use "Test Ticket 1" or "Lorem ipsum").

---

## 7. Anti-AI Slop Law & Minimalist UI/Motion Architecture

The coding agent **MUST** strictly obey the **Anti-AI Slop Law** across both UI/UX and codebase quality:

### A. Anti-AI Slop Law (Banned Patterns)
1. **NO Generic AI Color Palettes:** Strictly forbid default indigo/purple/violet gradients (`bg-gradient-to-r from-indigo-500 to-purple-600`), neon glows, or heavy drop shadows (`shadow-xl`, `shadow-2xl`).
2. **NO Fluff Copy or Fake Marketing:** Never add "Welcome back! Here's what's happening today ✨", emojis in UI headers/buttons, or bloated hero sections. Every label must be crisp and functional.
3. **NO Heavy Card-in-Card Nesting:** Do not wrap every table row or KPI metric in thick shadowed cards. Rely on **1px hairline borders** (`border-zinc-200`), whitespace, and subtle background contrast (`#FAFAFA` canvas vs `#FFFFFF` surface).
4. **NO Dead/Placeholder Code:** Every button, filter, and dropdown rendered in the UI must be wired to a real backend endpoint. No `// TODO` comments or dummy handlers.

### B. Minimalist Visual Design System (Linear / Vercel Aesthetic)
* **Color Palette:**
  * App Canvas: `#FAFAFA` (`bg-zinc-50`)
  * Elevated Surface: `#FFFFFF` (`bg-white`)
  * Hairline Borders: `#E4E4E7` (`border-zinc-200`)
  * Primary Text: `#09090B` (`text-zinc-950`)
  * Muted Text: `#71717A` (`text-zinc-500`)
  * Primary Action Accent: Crisp Obsidian (`#18181B` / `bg-zinc-900 hover:bg-zinc-800 text-white`)
  * Semantic Status/Priority Indicators: Muted, low-saturation pills with a `6px` status dot (e.g., `bg-emerald-50 text-emerald-700 border-emerald-200` for Resolved; `bg-amber-50 text-amber-700 border-amber-200` for In Progress; `bg-rose-50 text-rose-700 border-rose-200` for Critical).
* **Typography:** Use `Inter` (or system sans-serif) with `tabular-nums` on ticket IDs (`#104`), timestamps, and KPI counters. Tight tracking (`tracking-tight`) on page titles.

### C. Purposeful Motion & Micro-Animations (`framer-motion`)
Keep animations fast, damped, and non-intrusive (`duration: 0.18` to `0.25`, `ease: [0.16, 1, 0.3, 1]`):
1. **Page & View Transitions:** Subtle vertical fade-in (`initial={{ opacity: 0, y: 6 }}`, `animate={{ opacity: 1, y: 0 }}`) when switching routes.
2. **Staggered Ticket Rows:** Use Framer Motion `staggerChildren: 0.03` when rendering the filtered ticket list so items settle smoothly without bouncy/cartoonish springs.
3. **Interactive Filter Tabs (`layoutId`):** Use Framer Motion's shared `layoutId="activeFilterPill"` for quick status tabs (`All`, `Open`, `In Progress`, `Resolved`) so the active highlight glides smoothly between tabs.
4. **Slide-Over Drawer / Modal (`AnimatePresence`):** Open the **"New Ticket"** form in a clean right-side slide-over drawer or centered modal with backdrop blur (`backdrop-blur-[2px]`) and smooth scale/slide exit animations.
5. **Tactile Feedback:** Subtle `whileTap={{ scale: 0.98 }}` on primary submit buttons and smooth skeleton shimmer loaders while fetching API data.

---

## 8. Frontend Pages & Layout Specifications

1. **Auth Pages (`/login`, `/register`):**
   * Ultra-clean single-column form (`max-w-sm`) centered on `#FAFAFA` canvas with a minimal monochrome geometric mark, crisp inputs (`h-9`, `border-zinc-200`, `focus:ring-1 focus:ring-zinc-900`), and inline validation feedback.
2. **Top Navigation Bar:**
   * `56px` height (`h-14`), sticky top, `bg-white/80 backdrop-blur-md border-b border-zinc-200`.
   * Left: App wordmark (`Triage`) + subtle role pill (`ADMIN` or `USER`).
   * Right: User full name + minimal Logout icon button.
3. **Dashboard (`/dashboard`):**
   * **Inline Metric Strip:** A unified 4-column horizontal bar divided by `divide-x divide-zinc-200` on `bg-white border border-zinc-200 rounded-lg` showing `Total`, `Open`, `In Progress`, and `Resolved` counts (`tabular-nums`).
   * **Filter & Action Toolbar:** Animated status pill tabs (`All`, `Open`, `In Progress`, `Resolved`), compact search input (`⌘K` style aesthetic), Priority dropdown, and primary `bg-zinc-900` **"+ New Ticket"** button.
   * **Minimalist Ticket List:** Clean bordered container (`bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-100`). Each row displays:
     * Priority icon/dot + Monospace Ticket ID (`#101`)
     * Ticket Title (medium weight) + Category tag
     * Status pill with dot + Assignee avatar initials (or `Unassigned` in muted text) + relative timestamp.
     * Hover state: `hover:bg-zinc-50/80 transition-colors`.
4. **Create Ticket Slide-Over Drawer:**
   * Triggered by **"+ New Ticket"** without leaving the dashboard context. Includes `Title`, `Category`, `Priority`, and `Description`. Optimistically or immediately prepends the new ticket to the list with an `AnimatePresence` entry animation.
5. **Ticket Detail & Discussion View (`/tickets/:id`):**
   * Breadcrumb back link (`← Back to tickets`).
   * **Two-Column Split:**
     * **Left Column (68%):** Ticket Title (`text-xl font-semibold tracking-tight`), creator metadata, clean description block, and a chronological **Discussion Thread** with subtle timeline connectors and a minimalist comment composer.
     * **Right Column (32%):** Hairline-bordered metadata panel (`Status`, `Priority`, `Category`, `Assignee`, `Created`, `Resolved`). For `ADMIN` users, fields render as clean interactive selectors that trigger `PATCH /tickets/{id}` with subtle inline "Saved" confirmation feedback.

---

## 9. Step-by-Step Execution Plan for Agent

Execute the build in the following sequence, verifying each layer before moving to the next:

1. **Step 1 — Backend Setup:** Initialize Spring Boot project with dependencies (`web`, `data-jpa`, `security`, `mysql`, `validation`, `lombok`, `jjwt`). Configure `application.yml` with MySQL connection and `spring.jpa.hibernate.ddl-auto=update`.
2. **Step 2 — Domain & Persistence:** Implement Enums (`Role`, `TicketStatus`, `TicketPriority`, `TicketCategory`), Entities (`User`, `Ticket`, `TicketComment`), and Repositories.
3. **Step 3 — Security & Auth:** Implement `JwtUtil`, `JwtAuthenticationFilter`, `SecurityConfig`, `AuthService`, `AuthController`, and `DataSeeder` (with realistic support tickets).
4. **Step 4 — Ticket & Comment APIs:** Implement `TicketService` (including state transition checks), `TicketController`, `CommentController`, and `GlobalExceptionHandler`.
5. **Step 5 — Frontend Scaffold:** Initialize Vite React app, install `tailwindcss`, `framer-motion`, `axios`, `react-router-dom`, and `lucide-react`. Configure `Inter` font and Axios JWT interceptor.
6. **Step 6 — Frontend Views & Motion:** Build `AuthContext`, Login/Register pages, Dashboard with inline metric strip, animated filter tabs (`layoutId`), staggered ticket rows, Create Ticket slide-over drawer, and Ticket Detail view with Admin controls.
7. **Step 7 — End-to-End & Design Audit:** Verify CORS, `USER` vs `ADMIN` permission boundaries, full ticket lifecycle (`OPEN` $\rightarrow$ `RESOLVED`), and confirm zero violations of the Anti-AI Slop Law.