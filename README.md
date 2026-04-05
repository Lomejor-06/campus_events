# 🏛️ LASUSTECH Campus Events Portal

A sophisticated, institutional-grade campus management system designed for **Lagos State University of Science and Technology**. This portal streamlines event organization, student registrations, and administrative oversight through a high-performance, secure architecture.

## 🚀 Technical Architecture

This application has been modernized from a Firebase architecture to a **Supabase + PostgreSQL** relational foundation, ensuring superior data integrity and institutional security standards.

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Supabase (Auth & PostgreSQL)
- **Styling**: Vanilla CSS (Institutional "Senior Dev" Design System)
- **Internationalization**: i18next (Multi-language support)
- **Scheduling**: FullCalendar Integration

## 🛡️ Security & Role System

The portal implements strict **Row Level Security (RLS)** at the database layer to enforce institutional roles:

- **Students**: Can view events, register for attendance, and manage their own profiles.
- **Staff**: Can publish, edit, and manage campus events they create.
- **Administrators**: Full system oversight, user record management, and analytics access.

## ⚙️ Project Setup

### 1. Environment Configuration
Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Migration
To set up the required relational schema and security policies:
1. Open your **Supabase Dashboard**.
2. Navigate to the **SQL Editor**.
3. Copy and run the contents of [supabase_migration.sql](./supabase_migration.sql).

### 3. Installation
```bash
npm install
npm run dev
```

## 📂 Project Structure

- `src/services/`: Core logic for Supabase Auth and PostgREST interactions.
- `src/contexts/`: Global state management for Authentication and Notifications.
- `src/pages/admin/`: Institutional oversight and record management interfaces.
- `src/locales/`: Multi-language string definitions.

---

> [!NOTE]
> This portal is designed with a "Portal-First" aesthetic, prioritizing high information density and professional legibility over consumer-grade visual flair.
