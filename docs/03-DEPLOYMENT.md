# Phase 3 — Deploy to Vercel

This makes your app live on the internet with a real URL.
Both Vercel and Supabase have free tiers that cover this app.

---

## Step 1: Push your code to GitHub

First, create a new repo on GitHub (https://github.com/new).
Then push your code:

```bash
# Inside your project folder
git init
git add .
git commit -m "Initial scaffold"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/road-workplan.git
git push -u origin main
```

> Your `.env.local` file is in `.gitignore` so it will NOT be
> pushed. Your Supabase keys stay safe on your machine.

---

## Step 2: Deploy on Vercel

1. Go to https://vercel.com
2. Click **"Add New Project"**
3. Click **"Import"** next to your GitHub repo
4. Vercel auto-detects Next.js — don't change the framework setting
5. **IMPORTANT:** Before clicking Deploy, add your environment variables:
   - Click **"Environment Variables"**
   - Add: `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - Add: `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
6. Click **"Deploy"**
7. Wait ~2 minutes

Vercel gives you a URL like: `https://road-workplan-abc123.vercel.app`

---

## Step 3: Update Supabase URL settings

Now that you have a real URL, tell Supabase about it:

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. `https://road-workplan.vercel.app`)
3. Under **Redirect URLs**, add: `https://road-workplan.vercel.app/**`
4. Click **Save**

This is needed for auth redirects to work correctly in production.

---

## Step 4: Re-enable email confirmation

Now that it's live, protect your app:

1. Supabase → Authentication → Providers → Email
2. Toggle **"Confirm email"** back ON
3. Click Save

---

## Step 5: Future deployments

Every time you push to the `main` branch on GitHub,
Vercel automatically re-deploys. No manual steps needed.

```bash
git add .
git commit -m "Add feature X"
git push
# → Vercel detects the push and redeploys automatically
```

---

## Troubleshooting common issues

**"Invalid API key" error**
→ Check your `.env.local` values match exactly what's in Supabase Settings → API

**Redirected to /login on every page**
→ Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  are set in Vercel's Environment Variables (not just your local .env.local)

**Admin page shows "Access denied" even after setting role**
→ Make sure you refreshed the page after changing the role in Supabase.
  The role is read on every page load from the database.

**Inbox messages not appearing in real time**
→ Make sure you enabled Realtime for the messages table in Supabase → Database → Replication

**Build fails on Vercel with TypeScript errors**
→ Run `npm run build` locally first to see the same errors.
  Fix them before pushing.

---

## Your app is live! 🎉

Share the Vercel URL with your team. They can sign up,
and you (as admin) can assign tasks and create projects.
