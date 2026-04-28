## Deploy JobMate (Render + Vercel)

### 1) Deploy backend to Render
- Push this repo to GitHub.
- In Render, create a **Web Service** from this repo.
- Render will detect `render.yaml` automatically.
- Set environment variables in Render service:
  - `MONGODB_URI`
  - `JWT_SECRET`
  - `NODE_ENV=production`
  - `PORT=5000`
- Deploy and copy backend URL, e.g. `https://jobmate-backend.onrender.com`.

### 2) Deploy frontend to Vercel
- In Vercel, import the same repo.
- Set **Root Directory** to `frontend`.
- Framework: Vite (auto-detected).
- Add environment variables:
  - `VITE_API_URL=https://your-backend-url.onrender.com`
  - `VITE_SOCKET_URL=https://your-backend-url.onrender.com`
- Deploy.

### 3) Verify
- Open frontend URL.
- Register/login should call backend API correctly.
- Nearby jobs/workers and notifications should work.

