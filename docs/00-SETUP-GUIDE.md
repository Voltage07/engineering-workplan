# Road WorkPlan — Full Setup Guide

Welcome. This guide walks you through every step to get this app running.
We build it in phases. Each phase has its own doc.

---

## What we are building

A full-stack web app for road construction project management.

| Feature | Tech used |
|---|---|
| Frontend (UI) | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (Postgres) |
| Auth (login/signup) | Supabase Auth |
| Realtime (inbox) | Supabase Realtime |
| PDF Reports | jsPDF |
| Hosting | Vercel (free) |

---

## Phase overview

| Phase | What you build |
|---|---|
| **Phase 1** | Create project, connect Supabase, set up database tables |
| **Phase 2** | Authentication (login, signup, logout, roles) |
| **Phase 3** | Dashboard page |
| **Phase 4** | Projects CRUD |
| **Phase 5** | Work Plan CRUD |
| **Phase 6** | Tasks CRUD |
| **Phase 7** | Reports + PDF |
| **Phase 8** | Real inbox (Supabase Realtime) |
| **Phase 9** | Admin panel |
| **Phase 10** | Deploy to Vercel |

---

## Prerequisites — install these first

Before touching any code, make sure these are on your computer:

1. **Node.js** (v18 or higher)
   - Check: open terminal, type `node -v`
   - If missing: https://nodejs.org → download LTS version

2. **Git**
   - Check: `git -v`
   - If missing: https://git-scm.com

3. **A Supabase account** (free)
   - Sign up at https://supabase.com

4. **A Vercel account** (free, for deployment later)
   - Sign up at https://vercel.com

5. **VS Code** (recommended editor)
   - https://code.visualstudio.com

---

## Recommended VS Code extensions

Install these in VS Code for a better experience:
- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **Prettier – Code formatter**
- **GitLens**

---

Start with `01-DATABASE-SCHEMA.md` →
