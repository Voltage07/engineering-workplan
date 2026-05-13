# Phase 1 — Project Setup

Follow these steps exactly, in order.

---

## Step 1: Create the Next.js project

Open your terminal and run this command.
(Replace `road-workplan` with whatever you want to call the folder)

```bash
npx create-next-app@latest road-workplan
```

It will ask you several questions. Answer exactly like this:

```
✔ Would you like to use TypeScript? → Yes
✔ Would you like to use ESLint? → Yes
✔ Would you like to use Tailwind CSS? → Yes
✔ Would you like to use `src/` directory? → Yes
✔ Would you like to use App Router? → Yes
✔ Would you like to customize the default import alias (@/*)? → No
```

Then go into the folder:

```bash
cd road-workplan
```

---

## Step 2: Install Supabase packages

Run this command to install the two Supabase libraries we need:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

**What these do:**
- `@supabase/supabase-js` — the main library to talk to Supabase (query DB, auth, etc.)
- `@supabase/ssr` — special helpers for using Supabase in Next.js server components

---

## Step 3: Install other useful packages

```bash
npm install jspdf date-fns
```

**What these do:**
- `jspdf` — generates PDF files in the browser (for reports)
- `date-fns` — makes formatting dates easy (e.g. "May 12, 2026")

---

## Step 4: Create your Supabase project

1. Go to https://supabase.com
2. Click **"New project"**
3. Fill in:
   - **Name:** Road WorkPlan (or anything)
   - **Database password:** choose a strong password — SAVE IT SOMEWHERE
   - **Region:** pick the closest to Nigeria (e.g. Europe West or US East)
4. Click **"Create new project"**
5. Wait ~2 minutes for it to set up

---

## Step 5: Get your Supabase keys

Once your project is ready:

1. In Supabase, click the **Settings** icon (gear) in the left sidebar
2. Click **"API"**
3. You will see two important values — copy them:
   - **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`

---

## Step 6: Create your environment file

In your project folder (`road-workplan`), create a file called `.env.local`

> ⚠️ This file is SECRET. It never gets uploaded to GitHub. It's already in .gitignore.

Paste this in, replacing the placeholder values with your real Supabase keys:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Why "NEXT_PUBLIC_"?**
Variables starting with `NEXT_PUBLIC_` are accessible in the browser.
Variables WITHOUT it are server-only (more secure). 
Supabase URL and anon key are safe to expose — the RLS rules protect your data.

---

## Step 7: Set up the database

1. In Supabase, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Open the file `supabase/schema.sql` from this project
4. Copy its entire contents
5. Paste into the SQL editor
6. Click **"Run"** (or Ctrl+Enter)
7. You should see "Success. No rows returned"

Then go to **Table Editor** — you should see 5 tables listed.

---

## Step 8: Make yourself an admin

After you first sign up in the app (once it's running), you'll need to
manually set your account role to 'admin' in the database.

1. Go to Supabase → **Table Editor** → **profiles**
2. Find your row
3. Click the `role` cell
4. Change it from `staff` to `admin`
5. Click the checkmark to save

---

## Step 9: Verify your folder structure

Your `src/` folder should look like this after we finish scaffolding:

```
src/
  app/
    (auth)/
      login/
        page.tsx
      signup/
        page.tsx
    (dashboard)/
      layout.tsx        ← shared sidebar + auth guard
      page.tsx          ← dashboard home
      projects/
        page.tsx
      workplan/
        page.tsx
      tasks/
        page.tsx
      reports/
        page.tsx
      inbox/
        page.tsx
    admin/
      layout.tsx
      page.tsx
    globals.css
    layout.tsx          ← root layout
  lib/
    supabase/
      client.ts         ← browser Supabase client
      server.ts         ← server Supabase client
    actions/
      projects.ts
      tasks.ts
      workplans.ts
      messages.ts
  components/
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
    layout/
      Sidebar.tsx
      TopBar.tsx
  types/
    index.ts            ← TypeScript types for all our data
  middleware.ts         ← auth protection (lives in src/, not app/)
```

---

## Step 10: Start the dev server

```bash
npm run dev
```

Open your browser to http://localhost:3000

You'll see the default Next.js starter page. That's fine — we'll replace it.

---

Next: copy the files from `02-SUPABASE-CLIENTS.md` →
