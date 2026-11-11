# NJX — New Joiner Experience AI Platform

**An AI-powered employee onboarding platform designed to simplify onboarding, centralize organizational knowledge, and help new employees become productive faster.**

NJX is a full-stack application inspired by enterprise employee onboarding systems. It brings onboarding tasks, company documentation, role-based access control, and an AI-powered knowledge assistant into one platform.

The project explores how modern web development and AI engineering can work together to improve the employee onboarding experience.

> **Project status:** In Development  
> **Project type:** Full Stack Development + AI Engineering  
> **Target environment:** Enterprise employee onboarding

---

## Overview

Joining a new organization often means navigating multiple documents, completing onboarding tasks, understanding company policies, and figuring out internal processes.

NJX aims to simplify this experience through a centralized platform where employees can track their onboarding progress, access authorized company documents, and eventually get contextual answers through an AI assistant.

The platform is designed around three primary user roles:

- **Employee:** Access onboarding tasks, track progress, browse permitted documents, and interact with the AI assistant.
- **HR Admin:** Manage employee onboarding content, upload company policies, and organize onboarding resources.
- **IT Admin:** Manage IT onboarding instructions and support approved access-request workflows.

The long-term goal is to evolve NJX from a conventional onboarding application into an intelligent, context-aware employee experience platform.

## Key Features

### 1. Authentication and Authorization
- JWT-based access-token authentication.
- Refresh-token rotation and session revocation.
- Secure password hashing.
- Role-Based Access Control (RBAC).
- Protected backend routes.
- Separate permissions for employees, HR administrators, and IT administrators.

### 2. Employee Onboarding
- Personalized employee dashboard.
- Assigned onboarding tasks.
- Task status tracking.
- Onboarding progress monitoring.
- Department-specific onboarding workflows.

### 3. Document Management
- Centralized company document library.
- Document metadata and categorization.
- Document upload and storage references.
- Document publication status.
- Department-based document organization.
- Access restrictions for sensitive documents.

### 4. AI-Powered Knowledge Assistant — Planned
- Retrieval-Augmented Generation (RAG).
- Document ingestion and text extraction.
- Text chunking and embedding generation.
- Semantic search over authorized documents.
- Context-grounded answers.
- Source citations for generated answers.
- Persistent conversation history.
- Evaluation of retrieval quality and answer correctness.

### 5. Enterprise-Ready Architecture
- Modular frontend, backend, and AI service.
- PostgreSQL relational data model.
- Dedicated Python service for AI processing.
- Clear separation between business logic and AI functionality.
- Extensible architecture for future onboarding workflows.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, Refresh Tokens, RBAC |
| AI Service | Python, FastAPI |
| AI / LLM | Planned RAG pipeline and LLM integration |
| Vector Search | Planned Qdrant integration |
| Version Control | Git, GitHub |

*The technology list describes the intended architecture; individual integrations will be marked complete as they are implemented.*

---

## Project Architecture

NJX is organized into three primary modules.

```text
NJX/
│
├── AI/
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── app.js
│   ├── package.json
│   └── .env.example
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

*The tree illustrates the intended organization. Adjust individual filenames and directories to match the actual implementation.*

### `client/` — Frontend Application

Responsible for the user interface and employee experience.

Responsibilities:
- Authentication screens.
- Employee dashboard.
- Onboarding task management.
- Document library.
- HR and IT administration interfaces.
- AI assistant interface.
- API communication with the backend.

### `backend/` — Core Application Backend

Responsible for business logic, authentication, authorization, and database operations.

Responsibilities:
- User registration and login.
- JWT access-token validation.
- Refresh-token rotation and revocation.
- Role-based authorization.
- Employee and department management.
- Onboarding task assignments.
- Document metadata and access control.
- Chat history persistence.
- Communication with the AI service.

### `AI/` — AI Engineering Service

Responsible for AI-related processing, independently of the main application backend.

Planned responsibilities:
- Document ingestion.
- Text extraction and preprocessing.
- Chunking and embedding generation.
- Semantic retrieval.
- Context preparation.
- LLM-based response generation.
- Source attribution.
- Retrieval and response evaluation.

The Node.js backend will communicate with the Python AI service through internal HTTP APIs.

---

## System Architecture

```mermaid
flowchart TD
    U[Employee / HR Admin / IT Admin]

    U --> C[React Frontend]

    C --> B[Node.js + Express Backend]

    B --> AUTH[Authentication and RBAC]
    B --> DB[(PostgreSQL)]
    B --> DOC[Document Management]
    B --> TASK[Onboarding Tasks]
    B --> AI[Python AI Service]

    AI --> ING[Document Ingestion]
    ING --> EMB[Embedding Generation]
    EMB --> VDB[(Vector Database)]

    AI --> RET[Authorized Document Retrieval]
    VDB --> RET
    RET --> LLM[LLM Response Generation]

    LLM --> B
    B --> C
```

This architecture separates application responsibilities from AI processing.

The backend remains responsible for determining what an authenticated user is allowed to access. The AI service retrieves relevant content only after the applicable authorization rules have been enforced.

---

## Database Design

The initial relational database is built around the following entities.

| Table | Responsibility |
|---|---|
| `departments` | Stores department identifiers and names. |
| `users` | Stores employee and administrator accounts. |
| `documents` | Stores document metadata, access scope, and publication status. |
| `onboarding_tasks` | Stores reusable onboarding task definitions. |
| `employee_tasks` | Tracks task assignments and individual progress. |
| `chat_sessions` | Stores AI conversation sessions. |
| `chat_messages` | Stores messages within conversations. |
| `refresh_sessions` | Stores refresh-token hashes, expiration, and revocation information. |
| `audit_logs` | Records important administrative and security events. |

Additional tables, such as `document_versions` and `document_permissions`, can be introduced when document history and fine-grained access policies require them.

### Important Relationships

- A department can contain multiple employees.
- A department can organize multiple documents and onboarding tasks.
- An employee can have multiple assigned onboarding tasks.
- An employee can have multiple chat sessions.
- A chat session can contain multiple messages.
- A user can have multiple refresh sessions.
- A document can have multiple versions when version history is introduced.

---

## Authentication Flow

NJX uses a JWT access-token and refresh-token architecture.

```text
User Login
    |
    v
Verify Credentials
    |
    v
Issue Access JWT
    +
Issue Refresh Token
    |
    v
Store Refresh Token Hash
in PostgreSQL
    |
    v
Access Protected APIs
    |
    v
Access Token Expires
    |
    v
Refresh Token Validation
    |
    v
Rotate Refresh Token
    |
    v
Issue New Access JWT
```

### Security Principles

- Passwords are stored as secure hashes.
- Access tokens have short expiration times.
- Refresh tokens are stored as hashes in the database.
- Refresh tokens are rotated and can be revoked.
- Browser refresh tokens use secure HTTP-only cookies.
- Protected API routes validate authentication and authorization.
- Users cannot grant themselves administrative privileges.
- Document access is enforced by the backend rather than delegated to the LLM.

---

## Getting Started

### Prerequisites

Install the following tools before setting up the application:

- Node.js and npm.
- Python 3.11 or a compatible version.
- PostgreSQL, or a hosted PostgreSQL database.
- Git.

Additional dependencies will be required when the AI service and vector database are integrated.

### 1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd NJX
```

Replace the placeholder with your repository's actual Git URL.

### 2. Set Up the Backend

```bash
cd backend
npm install
```

Configure your environment variables in a `.env` file.

Employee invitation emails use SMTP settings from `backend/.env` (`EMAIL_USER` and `EMAIL_PASS`; Gmail app passwords are recommended). Passwords are never emailed: each employee receives their profile details and a one-time password setup link that expires after one hour. Before using this flow, apply `backend/supabase/migrations/202611120001_employee_password_setup.sql` to your Supabase database. If email delivery fails, the account is still created and an administrator can resend the invite with `POST /api/auth/employees/{employeeId}/password-setup`.

Example:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_ACCESS_SECRET="replace-with-a-strong-random-secret"
JWT_ACCESS_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_DAYS=7
CLIENT_URL="http://localhost:5173"
```

Use strong, randomly generated secrets and never commit your `.env` file.

After configuring Prisma, apply your database migrations:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

Start the backend using the development script configured in `package.json`:

```bash
npm run dev
```

Open the interactive backend API reference at `http://localhost:3000/api-docs` by default (OpenAPI JSON: `http://localhost:3000/api-docs.json`); replace `3000` with the configured `PORT` if needed. The Python AI service exposes its own Swagger UI at `http://localhost:8000/docs` when it is running.

### 3. Set Up the Frontend

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

Configure the frontend to send credentials when required by your HTTP-only cookie authentication flow, and configure the backend's CORS settings for the frontend origin.

### 4. Set Up the AI Service

Open another terminal:

```bash
cd AI
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
source .venv/bin/activate
```

Install the AI service dependencies when `requirements.txt` is available:

```bash
pip install -r requirements.txt
```

Configure the required AI provider credentials and service settings in the AI service's environment file.

Start the service using the FastAPI entry point configured in the project.

*The exact startup command depends on the Python module and FastAPI application name used in your implementation.*

---

## Environment Variables

Keep credentials and environment-specific settings outside source code.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. |
| `JWT_ACCESS_SECRET` | Secret used to sign access JWTs. |
| `JWT_ACCESS_EXPIRES_IN` | Access-token expiration duration. |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh-session lifetime. |
| `CLIENT_URL` | Frontend origin used for CORS configuration. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS` | SMTP server and sender credentials for employee invitation emails. |
| `REDIS_URL` or `REDIS_HOST` / `REDIS_PORT` | Optional Redis cache connection; host/port defaults to `127.0.0.1:6379`. The API continues without cache when Redis is unavailable. |
| `VITE_API_URL` | Backend API URL used by the frontend. |
| AI provider credentials | Authentication for the selected LLM provider. |
| Vector database configuration | Connection settings for the selected vector database. |

Use `.env.example` files to document the required configuration without exposing actual credentials.

---

## Development Roadmap

### Phase 1 — Core Full-Stack Application
- [ ] Establish the PostgreSQL schema.
- [ ] Configure Prisma and database migrations.
- [ ] Implement authentication and refresh-token rotation.
- [ ] Implement RBAC middleware.
- [ ] Build the employee dashboard.
- [ ] Implement onboarding task assignment and tracking.
- [ ] Build document browsing and administration interfaces.

### Phase 2 — Document Management
- [ ] Implement document uploads.
- [ ] Integrate document storage.
- [ ] Implement document publication workflows.
- [ ] Enforce document-level access restrictions.
- [ ] Add document version history when required.

### Phase 3 — RAG-Based AI Assistant
- [ ] Implement document ingestion.
- [ ] Extract and clean document text.
- [ ] Implement recursive text chunking.
- [ ] Generate embeddings.
- [ ] Integrate vector search.
- [ ] Implement authorization-aware retrieval.
- [ ] Generate grounded responses with citations.
- [ ] Persist conversation history.

### Phase 4 — AI Evaluation and Reliability
- [ ] Create a representative evaluation dataset.
- [ ] Evaluate retrieval relevance.
- [ ] Measure answer correctness and groundedness.
- [ ] Test access-control enforcement.
- [ ] Evaluate hallucination and failure cases.
- [ ] Add logging, monitoring, and error handling.

### Phase 5 — Advanced Enterprise Features
- [ ] Personalized onboarding workflows.
- [ ] Department-specific learning paths.
- [ ] Automated onboarding reminders.
- [ ] Administrative analytics.
- [ ] Improved document lifecycle management.
- [ ] Deployment and production monitoring.

---

## Security Considerations

NJX is intended to demonstrate enterprise-oriented development practices.

The implementation should account for:

- Authentication and authorization on protected routes.
- Refresh-token rotation and reuse detection.
- Secure cookie configuration and CSRF protection.
- Input validation and safe error handling.
- Database query safety through Prisma.
- Least-privilege document access.
- Protection against unauthorized document retrieval.
- Rate limiting on authentication and AI endpoints.
- Avoiding sensitive information in logs.
- Secure management of API keys and environment variables.

AI-generated responses must not be treated as an authorization mechanism. The backend must enforce access restrictions before restricted content is passed to the model.

---

## Learning Objectives

This project explores practical concepts across full-stack development and AI engineering:

**Full Stack Development**
- REST API design.
- React application architecture.
- Relational database design.
- Prisma ORM and database migrations.
- Authentication and authorization.
- Session lifecycle management.

**AI Engineering**
- Retrieval-Augmented Generation.
- Embedding models and semantic search.
- Vector databases.
- Context construction and source attribution.
- LLM integration.
- Retrieval and answer evaluation.
- Security in AI-powered applications.

**System Design**
- Modular service architecture.
- Separation of concerns.
- Document lifecycle management.
- Access-control design.
- Reliability and observability.

---

## Project Motivation

NJX is being developed as an independent portfolio project inspired by enterprise employee onboarding challenges, with an emphasis on combining full-stack engineering with practical AI capabilities.

The objective is to demonstrate how an AI-powered application can help employees navigate organizational knowledge while preserving document access boundaries.

This is a portfolio project and is not an official ISS product or an authorized representation of ISS internal systems.

---

## Author

**Fahad Bhati**

Full Stack Development | AI Engineering | Generative AI

GitHub: Add your GitHub profile URL here.

LinkedIn: Add your LinkedIn profile URL here.

---

*Built to explore the intersection of enterprise software engineering and AI-powered employee experiences.*
