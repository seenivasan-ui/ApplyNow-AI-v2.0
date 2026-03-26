# 🚀 ApplyNow — AI-Powered Job Hunter v2.0

> Fully automated job hunting agent with killer dashboard UI.
> Built with React + FastAPI + MongoDB + Claude AI + WhatsApp + Gmail

---

## 📁 Project Structure

```
applynow/
├── backend/
│   ├── main.py              ← FastAPI backend + Agent logic
│   ├── config.py            ← Profile defaults
│   ├── database.py          ← MongoDB helpers
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← Sidebar + routing
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    ← Stats + charts
│   │   │   ├── Jobs.jsx         ← Applied/Pending/Shortlisted tabs
│   │   │   ├── Profile.jsx      ← Edit your details
│   │   │   ├── Notifications.jsx← Email alerts
│   │   │   └── Logs.jsx         ← Live agent terminal
│   │   └── utils/api.js
│   ├── package.json
│   └── vite.config.js
├── nixpacks.toml            ← Railway build config
├── Procfile
└── SETUP.md                 ← This file
```

---

## ⚙️ Step 1 — Set Up Environment

```bash
cd backend
cp .env.example .env
# Fill in your keys (see below)
```

**Required .env values:**
```env
ANTHROPIC_API_KEY=sk-ant-...
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/applynow
WHATSAPP_TOKEN=your-meta-token
WHATSAPP_PHONE_ID=your-phone-id
YOUR_WHATSAPP=+918056394029
NAUKRI_EMAIL=your@email.com
NAUKRI_PASSWORD=yourpassword
LINKEDIN_EMAIL=your@email.com
LINKEDIN_PASSWORD=yourpassword
```

---

## 📦 Step 2 — Install & Run Locally

```bash
# Backend
cd backend
pip install -r requirements.txt
playwright install chromium
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## 📧 Step 3 — Gmail API Setup

1. Go to https://console.cloud.google.com
2. Create project → "ApplyNow"
3. Enable **Gmail API**
4. Create **OAuth 2.0 credentials** → Desktop app → Download `credentials.json`
5. Place `credentials.json` in `backend/` folder
6. Run once locally → browser opens → login → Allow access
7. A `token.pickle` file is created → keep this

---

## 📱 Step 4 — WhatsApp Business API

1. Go to https://developers.facebook.com
2. Create App → Business
3. Add WhatsApp product
4. Get **Phone Number ID** and **Token**
5. Add to `.env`

---

## 🚂 Step 5 — Deploy to Railway

1. Push your project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "ApplyNow v2.0"
   git remote add origin https://github.com/yourusername/applynow.git
   git push -u origin main
   ```

2. Go to https://railway.app
3. New Project → Deploy from GitHub → Select your repo
4. Add Environment Variables (copy from .env)
5. Railway detects `nixpacks.toml` and builds automatically
6. Your app is live 24/7 at `https://applynow-xxx.up.railway.app`

---

## 🎮 How to Use the Dashboard

| Page | What it does |
|------|-------------|
| **Dashboard** | Stats, charts, recent activity |
| **Jobs** | Browse all jobs by status — Applied / Shortlisted / Pending / Rejected |
| **Alerts** | Gmail recruiter emails, WhatsApp notifications |
| **My Profile** | Edit all your details, skills, experience, credentials |
| **Live Logs** | Real-time terminal view of the agent's activity |

**Start/Stop Agent**: Big button in the sidebar — click once to start, click again to stop.

---

## 🤖 Agent Flow (runs at 9 AM + 6 PM daily)

```
START AGENT CLICK
      ↓
Scrape: RemoteOK, WeWorkRemotely, Indeed, Naukri
      ↓
Save new jobs to MongoDB
      ↓
Claude AI scores each job (ATS %)
      ↓
Filter jobs ≥ 60% match
      ↓
For each good job:
  → Generate tailored resume (Claude)
  → Auto-apply with Playwright
  → If CAPTCHA → mark as Pending
  → If success → mark as Applied
  → Send WhatsApp alert
      ↓
Check Gmail for shortlist/interview emails
      ↓
Send daily WhatsApp summary
      ↓
Wait for next scheduled run
```

---

## 🔧 Troubleshoot

| Issue | Fix |
|-------|-----|
| LinkedIn blocked | Set `headless=False` to debug |
| Naukri CAPTCHA | Job marked Pending, apply manually from Jobs tab |
| Gmail not working | Check `credentials.json` is in `backend/` |
| WhatsApp failed | Token expires every 60 days — refresh in Meta dashboard |
| MongoDB connection error | Check your Atlas IP whitelist (allow 0.0.0.0/0 for Railway) |

---

## ➕ Adding More Job Portals

In `backend/main.py`, add a new scraper function and include it in `scrape_all_platforms()`.
Platforms you can add next: Shine, Apna, AngelList, Internshala, LinkedIn Jobs API.
