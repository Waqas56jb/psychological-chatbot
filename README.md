# CheckMyThoughts

Repo layout (only these at the root):

- **`client/`** — React (Vite) frontend  
- **`server/`** — Node/Express API + OpenAI + prompt logic in `server/lib/`  
- **`.gitignore`**  
- **`README.md`**

---

## 1. Frontend on Vercel (root directory = `client`)

1. Create a Vercel project and set **Root Directory** to **`client`** (so Vercel only sees the frontend).
2. **Environment variables** (Vercel → Project → Settings → Environment Variables):

   | Name            | Value |
   |-----------------|--------|
   | `VITE_API_URL`  | Your live API base URL, **no trailing slash** (e.g. `https://your-app.onrender.com`) |

3. Deploy. Vite bakes `VITE_API_URL` into the build, so the browser calls your backend at `{VITE_API_URL}/api/analyze`.

4. Optional: `client/vercel.json` keeps SPA routes on refresh. `client/env.example` documents the variable.

**Local UI:** from `client/` run `npm install` then `npm run dev`. Leave `VITE_API_URL` unset so requests go to `/api/analyze` and Vite **proxies** them to `http://127.0.0.1:3000` (see `client/vite.config.js`). Run the server in parallel (step 2).

---

## 2. Backend (deploy the `server` folder)

Use **Render**, **Railway**, **Fly.io**, or any Node host. Point the service at the **`server`** directory (or repo with **root** = `server` if the host supports it).

**Environment variables on the host:**

| Name              | Required | Description |
|-------------------|----------|-------------|
| `OPENAI_API_KEY`  | Yes      | OpenAI secret key |
| `OPENAI_MODEL`    | No       | Default `gpt-4o` |
| `PORT`            | No       | Host often sets this automatically |
| `CORS_ORIGINS`    | Yes (prod) | Comma-separated **exact** origins allowed to call the API. Include your Vercel URL(s), e.g. `https://your-site.vercel.app,http://localhost:5173` |

Copy `server/env.example` to `.env` locally only (never commit `.env`).

**Local API:** from `server/` run `npm install`, add `.env`, then `npm start`.

---

## Summary

| Where        | What to set |
|--------------|-------------|
| **Vercel** (`client`) | `VITE_API_URL` = backend base URL |
| **API host** (`server`) | `OPENAI_API_KEY`, `CORS_ORIGINS` (+ optional `OPENAI_MODEL`) |

After deploy, open your Vercel URL; analyse should hit your hosted API.
