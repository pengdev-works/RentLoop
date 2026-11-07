# RentLoop: Production Deployment Guide

This guide details how to deploy RentLoop to **Render** (Backend API), **Vercel** (Frontend SPA), and **PostgreSQL** (Managed Database).

---

## 1. Managed PostgreSQL Database Setup (Render / Supabase / Neon)

1. Create a free PostgreSQL database on [Render](https://render.com), [Neon.tech](https://neon.tech), or [Supabase](https://supabase.com).
2. Copy the database connection URI:
   ```text
   postgres://username:password@ep-host.region.provider.com:5432/rentloop_db?sslmode=require
   ```
3. Run the schema migrations using the provided script:
   ```bash
   DATABASE_URL="<YOUR_CONNECTION_STRING>" npm run migrate
   ```
   *The DDL file `server/src/database/schema.sql` creates all 15 relational tables, unique constraints, foreign keys, and indexes.*

---

## 2. Deploying Backend API to Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the build & start settings:
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Set the following **Environment Variables**:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `CLIENT_URL`: `https://your-rentloop-frontend.vercel.app`
   - `JWT_SECRET`: `your_random_secure_64_char_secret_key`
   - `JWT_EXPIRES_IN`: `7d`
   - `DATABASE_URL`: `postgres://...` (your PostgreSQL connection string)
5. Deploy service and note your backend URL (e.g., `https://rentloop-api.onrender.com`).

---

## 3. Deploying Frontend to Vercel

1. Create a new project on [Vercel](https://vercel.com).
2. Connect your Git repository.
3. Configure the project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add rewrites to `client/vercel.json` if needed for SPA fallback:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://rentloop-api.onrender.com/api/$1" },
       { "source": "/uploads/(.*)", "destination": "https://rentloop-api.onrender.com/uploads/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
5. Click **Deploy**. Your RentLoop platform is live!
