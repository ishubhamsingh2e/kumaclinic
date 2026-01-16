# Kumacare Clinic

Kumacare Clinic is a comprehensive clinic management solution designed to streamline healthcare operations. It features a robust multi-tenancy architecture with a granular Role-Based Access Control (RBAC) system, allowing for secure and efficient management of clinics, patients, and staff.

## Features

- **Authentication**: Secure login and signup using NextAuth.js (supporting Credentials and OAuth).
- **Patient Management**: Register and manage patient records with detailed demographics and medical history.
- **Multi-Tenancy**: Support for multiple clinics operating independently on the same platform.
- **RBAC (Role-Based Access Control)**: flexible permission system to control access to features.
- **Modern UI**: Built with Next.js, Tailwind CSS, and Shadcn UI for a responsive and accessible user experience.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: [Prisma](https://www.prisma.io/)
- **Authentication**: [NextAuth.js (v5)](https://authjs.dev/)
- **Styling**: Tailwind CSS
- **Components**: [Shadcn UI](https://ui.shadcn.com/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (Local installation or Docker container)
- npm, yarn, pnpm, or bun

### Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd kumacare-clinic
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    # or
    bun install
    ```

3.  **Environment Setup:**
    Copy the example environment file and update it with your credentials.

    ```bash
    cp .env.example .env
    ```

    Update `DATABASE_URL`, `NEXTAUTH_SECRET`, and other variables in `.env`.

4.  **Database Setup:**
    Run the migrations to set up your database schema.

    ```bash
    npx prisma migrate dev
    ```

5.  **Seed the Database:**
    Populate the database with initial roles and the Super Admin user.

    ```bash
    npx prisma db seed
    ```

6.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Developer Documentation

### Permission Structure & RBAC

This project implements a multi-level permission system designed to model a real-world hierarchy of clinic administration. The system uses a **Role-Based Access Control (RBAC)** model where permissions are assigned to Roles, and Roles are assigned to Users.

#### Hierarchy Levels

The application is structured around four primary levels of authority:

1.  **Super Admin (Platform Owner)**
    - **Role**: Top-level administrator.
    - **Responsibilities**: Manages the entire SaaS platform, configuration, and global settings.
    - **Permissions**: Has unrestricted access to all system modules and permissions.

2.  **Clinic Enroller**
    - **Role**: Specialized administrative role (e.g., Sales Manager or Regional Manager).
    - **Responsibilities**: Responsible for onboarding new **Clinic Owners**. They can create new clinic entities and assign the initial owner accounts.
    - **Key Permissions**: `clinic_owner:manage`.

3.  **Clinic Owner**
    - **Role**: The primary administrator for a specific clinic (Tenant).
    - **Responsibilities**: Manages their specific clinic's operations, settings, and staff.
    - **Permissions**: Can manage employees (Users), view all clinic data, and configure clinic-specific settings. Usually assigned the `CLINIC_MANAGER` role.
    - **Key Permissions**: `user:manage`, `settings:edit`, `patient:view:all`.

4.  **Clinic User (Employee)**
    - **Role**: Staff members such as Doctors, Receptionists, or Nurses.
    - **Responsibilities**: Perform day-to-day operational tasks like registering patients or updating records.
    - **Permissions**: Access is strictly limited based on their assigned role (e.g., `DOCTOR` vs. `RECEPTIONIST`).
    - **Key Permissions**: `patient:create`, `patient:view:all` (subset).

#### Technical Implementation

- **Models**:
  - `User`: Represents an account. Belongs to a single `Clinic` and has a single `Role`.
  - `Role`: A collection of `Permissions` (e.g., "DOCTOR", "CLINIC_MANAGER").
  - `Permission`: A granular action flag (e.g., `patient:create`).
  - `Clinic`: The tenant entity.

- **Verification**:
  Permissions are checked both client-side (for UI visibility) and server-side (in API routes and Server Actions) using the `hasPermission` helper and middleware checks.

### Key Commands

- `npx prisma studio`: Open a web interface to view and edit database data.
- `npx prisma migrate dev`: Create and apply a new database migration.
- `npx prisma generate`: Regenerate the Prisma client (run after schema changes).
