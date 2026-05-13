# Phase 2 — Enable Realtime + Email Confirmation Settings

Before testing the inbox, you need to turn on two things in Supabase.

---

## Step 1: Enable Realtime on the messages table

By default, Supabase tables don't broadcast changes.
You have to opt each table in explicitly.

1. Go to your Supabase project
2. Click **"Database"** in the left sidebar
3. Click **"Replication"**
4. Find the **messages** table in the list
5. Toggle it ON (the toggle should turn green)

That's it. The inbox will now receive new messages in real time.

---

## Step 2: Configure email confirmation (optional for dev)

By default Supabase requires email confirmation before login works.
During development this is annoying. You can turn it off:

1. Go to Supabase → **Authentication** → **Providers** → **Email**
2. Toggle **"Confirm email"** OFF
3. Click **Save**

> ⚠️ Turn this back ON before going live. Email confirmation
> prevents fake accounts and spam.

---

## Step 3: Set your site URL (needed for magic links later)

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to `http://localhost:3000` for local dev
3. Later, change it to your Vercel URL when deployed

---

## Step 4: Make yourself an admin

After you sign up for the first time:

1. Go to Supabase → **Table Editor** → **profiles**
2. Find your row (there'll be one row — yours)
3. Click the `role` cell → change `staff` to `admin`
4. Press Enter or click the checkmark to save

You'll now see the **Admin** link in the sidebar.

---

## Step 5: Test the full flow

Run the app:
```bash
npm run dev
```

Then:
1. Go to http://localhost:3000/signup → create an account
2. Go to http://localhost:3000/login → log in
3. You should land on the dashboard
4. Go to Supabase → set your role to admin
5. Refresh the page → Admin link appears in sidebar
6. Go to `/admin` → create a project, work plan, and task
7. Check `/projects`, `/workplan`, `/tasks` — data should appear
8. Create a second account and test the inbox between the two

---

Next: see `03-DEPLOYMENT.md` for going live on Vercel →
