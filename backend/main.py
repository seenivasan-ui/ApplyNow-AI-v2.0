"""
ApplyNow - AI-Powered Job Hunter Backend
FastAPI + MongoDB + Claude AI + WhatsApp + Gmail
"""
import os, asyncio, json
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from pymongo import MongoClient, DESCENDING
from dotenv import load_dotenv

load_dotenv()

# ── STARTUP VALIDATION ───────────────────────────────
def _validate_env():
    """Log warnings for missing/optional config at startup."""
    required = {"ANTHROPIC_API_KEY": os.getenv("ANTHROPIC_API_KEY")}
    optional = {
        "MONGO_URI": os.getenv("MONGO_URI"),
        "WHATSAPP_TOKEN": os.getenv("WHATSAPP_TOKEN"),
        "WHATSAPP_PHONE_ID": os.getenv("WHATSAPP_PHONE_ID"),
        "YOUR_WHATSAPP": os.getenv("YOUR_WHATSAPP"),
    }
    for key, val in required.items():
        if not val:
            print(f"[WARN] Required env var {key!r} is not set — AI scoring will be skipped")
    for key, val in optional.items():
        if not val:
            print(f"[INFO] Optional env var {key!r} is not set — related feature disabled")

@asynccontextmanager
async def lifespan(app: FastAPI):
    _validate_env()
    print("[INFO] ApplyNow API started successfully")
    yield
    print("[INFO] ApplyNow API shutting down")

app = FastAPI(title="ApplyNow API", version="2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── HEALTH CHECK ─────────────────────────────────────
@app.get("/health")
def health_check():
    """Railway health check endpoint."""
    return JSONResponse({"status": "ok", "version": "2.0"})

# ── DB ──────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "")
_client = None

def get_db():
    global _client
    if not MONGO_URI:
        return None
    try:
        if not _client:
            _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # Verify connection is alive
            _client.admin.command("ping")
        return _client["applynow"]
    except Exception as e:
        print(f"[WARN] DB connection failed: {e}")
        _client = None
        return None

# ── AGENT STATE ─────────────────────────────────────
agent_state = {
    "running": False,
    "thread": None,
    "log": [],
    "last_run": None,
    "next_run": None,
    "applied_today": 0,
}

def log(msg: str, level: str = "info"):
    entry = {"time": datetime.now().isoformat(), "msg": msg, "level": level}
    agent_state["log"].append(entry)
    agent_state["log"] = agent_state["log"][-200:]  # keep last 200
    print(f"[{level.upper()}] {msg}")

# ── MODELS ──────────────────────────────────────────
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[list] = None
    experience: Optional[list] = None
    education: Optional[list] = None
    certifications: Optional[list] = None
    target_roles: Optional[list] = None
    target_locations: Optional[list] = None
    experience_level: Optional[str] = None
    expected_salary: Optional[str] = None
    # Credentials (stored encrypted ideally)
    naukri_email: Optional[str] = None
    naukri_password: Optional[str] = None
    linkedin_email: Optional[str] = None
    linkedin_password: Optional[str] = None
    aadhar_number: Optional[str] = None
    pan_number: Optional[str] = None
    whatsapp_number: Optional[str] = None

class JobStatusUpdate(BaseModel):
    status: str  # applied | rejected | shortlisted | pending | interview

# ── PROFILE ENDPOINTS ────────────────────────────────
@app.get("/api/profile")
def get_profile():
    db = get_db()
    if db:
        profile = db.profile.find_one({}, {"_id": 0})
        if profile:
            return profile
    # Return default from config
    from config import PROFILE
    return PROFILE

@app.put("/api/profile")
def update_profile(data: ProfileUpdate):
    db = get_db()
    if not db:
        raise HTTPException(500, "DB unavailable")
    update = {k: v for k, v in data.dict().items() if v is not None}
    db.profile.update_one({}, {"$set": update}, upsert=True)
    return {"success": True, "message": "Profile updated!"}

# ── JOBS ENDPOINTS ───────────────────────────────────
@app.get("/api/jobs")
def get_jobs(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None
):
    db = get_db()
    if not db:
        return {"jobs": [], "total": 0}

    query = {}
    if status and status != "all":
        query["status"] = status
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
        ]

    total = db.jobs.count_documents(query)
    jobs = list(
        db.jobs.find(query, {"_id": 0})
        .sort("created_at", DESCENDING)
        .skip((page - 1) * limit)
        .limit(limit)
    )
    # Convert dates
    for j in jobs:
        for field in ["created_at", "applied_at", "updated_at"]:
            if field in j and hasattr(j[field], "isoformat"):
                j[field] = j[field].isoformat()
    return {"jobs": jobs, "total": total, "page": page}

@app.get("/api/jobs/stats")
def get_stats():
    db = get_db()
    if not db:
        return {}

    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = today - timedelta(days=7)

    statuses = ["found", "applied", "pending", "shortlisted", "rejected", "interview"]
    counts = {}
    for s in statuses:
        counts[s] = db.jobs.count_documents({"status": s})

    today_applied = db.jobs.count_documents({
        "status": "applied",
        "applied_at": {"$gte": today}
    })
    week_applied = db.jobs.count_documents({
        "status": "applied",
        "applied_at": {"$gte": week_ago}
    })

    # ATS average
    pipeline = [
        {"$match": {"ats_score": {"$exists": True, "$gt": 0}}},
        {"$group": {"_id": None, "avg": {"$avg": "$ats_score"}}}
    ]
    avg_result = list(db.jobs.aggregate(pipeline))
    avg_ats = round(avg_result[0]["avg"]) if avg_result else 0

    # Daily trend (last 7 days)
    trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        next_day = day + timedelta(days=1)
        count = db.jobs.count_documents({
            "status": "applied",
            "applied_at": {"$gte": day, "$lt": next_day}
        })
        trend.append({"date": day.strftime("%b %d"), "applied": count})

    return {
        "counts": counts,
        "today_applied": today_applied,
        "week_applied": week_applied,
        "avg_ats": avg_ats,
        "total": sum(counts.values()),
        "trend": trend,
        "agent_running": agent_state["running"],
        "last_run": agent_state["last_run"],
        "next_run": agent_state["next_run"],
        "applied_today": agent_state["applied_today"],
    }

@app.patch("/api/jobs/{apply_url:path}")
def update_job(apply_url: str, data: JobStatusUpdate):
    db = get_db()
    if not db:
        raise HTTPException(500, "DB unavailable")
    db.jobs.update_one(
        {"apply_url": apply_url},
        {"$set": {"status": data.status, "updated_at": datetime.now()}}
    )
    return {"success": True}

# ── AGENT ENDPOINTS ──────────────────────────────────
@app.post("/api/agent/start")
def start_agent(background_tasks: BackgroundTasks):
    if agent_state["running"]:
        return {"message": "Agent already running"}
    agent_state["running"] = True
    background_tasks.add_task(run_agent_loop)
    return {"message": "Agent started! 🚀"}

@app.post("/api/agent/stop")
def stop_agent():
    agent_state["running"] = False
    agent_state["applied_today"] = 0
    log("⏹️ Agent stopped by user", "warn")
    return {"message": "Agent stopped"}

@app.get("/api/agent/status")
def agent_status():
    return {
        "running": agent_state["running"],
        "last_run": agent_state["last_run"],
        "next_run": agent_state["next_run"],
        "applied_today": agent_state["applied_today"],
        "log": agent_state["log"][-50:],
    }

@app.get("/api/agent/logs")
def get_logs():
    return {"logs": agent_state["log"]}

# ── NOTIFICATIONS ────────────────────────────────────
@app.get("/api/notifications")
def get_notifications():
    db = get_db()
    if not db:
        return {"notifications": []}
    notifs = list(
        db.notifications.find({}, {"_id": 0})
        .sort("created_at", DESCENDING)
        .limit(50)
    )
    for n in notifs:
        if "created_at" in n and hasattr(n["created_at"], "isoformat"):
            n["created_at"] = n["created_at"].isoformat()
    return {"notifications": notifs}

# ── AGENT CORE LOOP ──────────────────────────────────
async def run_agent_loop():
    """Main agent loop - runs forever until stopped"""
    while agent_state["running"]:
        now = datetime.now()
        hour = now.hour

        # Run at 9 AM and 6 PM, or immediately if first run
        if hour in [9, 18] or agent_state["last_run"] is None:
            log("🤖 Starting agent run cycle...", "info")
            agent_state["last_run"] = now.isoformat()
            agent_state["applied_today"] = 0

            try:
                await asyncio.wait_for(run_full_cycle(), timeout=1800)  # 30-min hard cap
            except asyncio.TimeoutError:
                log("❌ Agent cycle timed out after 30 minutes", "error")
            except Exception as e:
                log(f"❌ Agent cycle error: {e}", "error")

            # Set next run
            if hour < 9:
                next_h = 9
            elif hour < 18:
                next_h = 18
            else:
                next_h = 9
            next_run = now.replace(hour=next_h, minute=0, second=0)
            if next_h <= hour:
                next_run += timedelta(days=1)
            agent_state["next_run"] = next_run.isoformat()
            log(f"⏰ Next run: {next_run.strftime('%Y-%m-%d %H:%M')}", "info")

        await asyncio.sleep(60)  # Check every minute

async def run_full_cycle():
    """Execute one full job hunting cycle"""
    db = get_db()

    log("🔍 Scraping job platforms...", "info")
    all_jobs = await scrape_all_platforms()
    log(f"📋 Found {len(all_jobs)} total jobs", "info")

    if not all_jobs:
        log("No jobs found this cycle", "warn")
        return

    # Save new jobs
    saved = save_new_jobs(all_jobs, db)
    log(f"💾 Saved {saved} new jobs to DB", "info")

    # ATS Score
    log("🧠 Scoring jobs with Claude AI...", "info")
    good_jobs = await score_jobs(all_jobs, db)
    log(f"✅ {len(good_jobs)} good matches found", "info")

    # Auto-apply
    if good_jobs:
        await auto_apply(good_jobs, db)

    # Check Gmail
    log("📧 Checking Gmail for shortlists...", "info")
    await check_gmail_notifications(db)

    # Send daily summary
    stats = get_quick_stats(db)
    await send_whatsapp_summary(stats)

    log("✅ Cycle complete!", "info")

async def scrape_all_platforms():
    """Scrape all job platforms"""
    jobs = []
    db = get_db()
    profile = db.profile.find_one({}, {"_id": 0}) if db else {}
    roles = profile.get("target_roles", ["Python Developer", "React Developer", "Full Stack Developer"])
    locations = profile.get("target_locations", ["Chennai", "Bangalore", "Remote"])

    platforms = [
        ("RemoteOK", scrape_remoteok),
        ("WeWorkRemotely", scrape_weworkremotely),
        ("Naukri", scrape_naukri),
        ("Indeed", scrape_indeed),
    ]

    for name, func in platforms:
        try:
            # Run blocking scrapers in a thread with a per-platform timeout
            platform_jobs = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(None, func, roles, locations),
                timeout=30,
            )
            jobs.extend(platform_jobs)
            log(f"  ✅ {name}: {len(platform_jobs)} jobs", "info")
        except asyncio.TimeoutError:
            log(f"  ❌ {name} timed out", "error")
        except Exception as e:
            log(f"  ❌ {name} failed: {e}", "error")

    # Deduplicate
    seen = set()
    unique = []
    for j in jobs:
        url = j.get("apply_url", "")
        if url and url not in seen:
            seen.add(url)
            unique.append(j)
    return unique

def scrape_remoteok(roles, locations):
    import requests
    from bs4 import BeautifulSoup
    jobs = []
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        r = requests.get("https://remoteok.com/api", headers=headers, timeout=10)
        data = r.json()
        for item in data[1:]:
            if not isinstance(item, dict):
                continue
            title = item.get("position", "")
            tags = " ".join(item.get("tags", []))
            desc = item.get("description", "")
            if any(role.lower() in (title + tags + desc).lower() for role in roles[:3]):
                jobs.append({
                    "title": title,
                    "company": item.get("company", ""),
                    "location": "Remote",
                    "apply_url": item.get("url", ""),
                    "description": desc[:500],
                    "platform": "RemoteOK",
                    "status": "found",
                    "ats_score": 0,
                })
    except Exception as e:
        pass
    return jobs[:10]

def scrape_weworkremotely(roles, locations):
    import requests
    from bs4 import BeautifulSoup
    jobs = []
    try:
        r = requests.get("https://weworkremotely.com/categories/remote-programming-jobs.rss", timeout=10)
        soup = BeautifulSoup(r.text, "xml")
        for item in soup.find_all("item")[:15]:
            title = item.find("title").text if item.find("title") else ""
            link = item.find("link").text if item.find("link") else ""
            desc = item.find("description").text if item.find("description") else ""
            if any(role.lower() in (title + desc).lower() for role in roles[:3]):
                jobs.append({
                    "title": title,
                    "company": "Via WeWorkRemotely",
                    "location": "Remote",
                    "apply_url": link,
                    "description": desc[:500],
                    "platform": "WeWorkRemotely",
                    "status": "found",
                    "ats_score": 0,
                })
    except Exception as e:
        pass
    return jobs[:8]

def scrape_naukri(roles, locations):
    """Naukri scraper - uses requests first, Playwright for apply"""
    import requests
    jobs = []
    try:
        for role in roles[:2]:
            for loc in locations[:2]:
                url = f"https://www.naukri.com/{role.lower().replace(' ', '-')}-jobs-in-{loc.lower()}"
                headers = {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "text/html,application/xhtml+xml",
                }
                r = requests.get(url, headers=headers, timeout=15)
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(r.text, "html.parser")
                cards = soup.find_all("article", class_="jobTuple")
                for card in cards[:5]:
                    try:
                        title_el = card.find("a", class_="title")
                        comp_el = card.find("a", class_="subTitle")
                        jobs.append({
                            "title": title_el.text.strip() if title_el else role,
                            "company": comp_el.text.strip() if comp_el else "Unknown",
                            "location": loc,
                            "apply_url": title_el["href"] if title_el else url,
                            "description": f"{role} position in {loc}",
                            "platform": "Naukri",
                            "status": "found",
                            "ats_score": 0,
                        })
                    except:
                        pass
    except Exception as e:
        pass
    return jobs[:10]

def scrape_indeed(roles, locations):
    import requests
    from bs4 import BeautifulSoup
    jobs = []
    try:
        for role in roles[:2]:
            url = f"https://www.indeed.co.in/jobs?q={role.replace(' ', '+')}&l=India"
            headers = {"User-Agent": "Mozilla/5.0"}
            r = requests.get(url, headers=headers, timeout=15)
            soup = BeautifulSoup(r.text, "html.parser")
            cards = soup.find_all("div", class_="job_seen_beacon")
            for card in cards[:5]:
                try:
                    title_el = card.find("h2", class_="jobTitle")
                    comp_el = card.find("span", {"data-testid": "company-name"})
                    loc_el = card.find("div", {"data-testid": "text-location"})
                    link_el = card.find("a", class_="jcs-JobTitle")
                    jobs.append({
                        "title": title_el.text.strip() if title_el else role,
                        "company": comp_el.text.strip() if comp_el else "Unknown",
                        "location": loc_el.text.strip() if loc_el else "India",
                        "apply_url": "https://www.indeed.co.in" + (link_el["href"] if link_el else ""),
                        "description": f"{role} role",
                        "platform": "Indeed",
                        "status": "found",
                        "ats_score": 0,
                    })
                except:
                    pass
    except Exception as e:
        pass
    return jobs[:10]

def save_new_jobs(jobs, db):
    if not db:
        return 0
    saved = 0
    existing_urls = set(
        j["apply_url"] for j in db.jobs.find({}, {"apply_url": 1}) if "apply_url" in j
    )
    for job in jobs:
        if job.get("apply_url") and job["apply_url"] not in existing_urls:
            job["created_at"] = datetime.now()
            db.jobs.insert_one(job)
            saved += 1
    return saved

async def score_jobs(jobs, db):
    """Score jobs using Claude AI"""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        log("⚠️ ANTHROPIC_API_KEY not set — skipping AI scoring, passing all jobs through", "warn")
        for job in jobs:
            job["ats_score"] = 50
            job["verdict"] = "Unscored"
        return jobs[:20]

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
    except Exception as e:
        log(f"⚠️ Failed to init Anthropic client: {e}", "warn")
        return jobs[:20]

    profile = db.profile.find_one({}, {"_id": 0}) if db else {}
    skills = profile.get("skills", [])
    roles = profile.get("target_roles", [])
    good = []

    for job in jobs[:20]:
        try:
            desc = job.get("description", "") or job.get("title", "")
            msg = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: client.messages.create(
                        model="claude-sonnet-4-20250514",
                        max_tokens=200,
                        messages=[{
                            "role": "user",
                            "content": f"""Score this job for candidate with skills: {', '.join(skills[:10])}.
Target roles: {', '.join(roles[:3])}.
Job: {job['title']} at {job['company']}.
Description: {desc[:300]}

Reply ONLY with JSON: {{"score": 75, "verdict": "Good Match", "matched": ["React", "Python"], "missing": ["Docker"]}}"""
                        }]
                    )
                ),
                timeout=30,
            )
            text = msg.content[0].text
            text = text[text.find("{"):text.rfind("}")+1]
            result = json.loads(text)
            job["ats_score"] = result.get("score", 50)
            job["verdict"] = result.get("verdict", "")
            job["matched_skills"] = result.get("matched", [])
            job["missing_skills"] = result.get("missing", [])

            if db:
                db.jobs.update_one(
                    {"apply_url": job["apply_url"]},
                    {"$set": {
                        "ats_score": job["ats_score"],
                        "verdict": job["verdict"],
                        "matched_skills": job.get("matched_skills", []),
                        "missing_skills": job.get("missing_skills", []),
                    }}
                )

            min_score = int(os.getenv("MIN_ATS_SCORE", 60))
            if job["ats_score"] >= min_score:
                good.append(job)

        except asyncio.TimeoutError:
            log(f"⚠️ Claude timed out scoring {job.get('title', '?')}", "warn")
            job["ats_score"] = 50
            good.append(job)
        except Exception as e:
            log(f"⚠️ Scoring error for {job.get('title', '?')}: {e}", "warn")
            job["ats_score"] = 50
            good.append(job)

    return good

async def auto_apply(jobs, db):
    """Mark good-match jobs as pending and log apply URLs for manual review.

    Playwright-based auto-apply is disabled: headless browsers are unreliable
    in containerised environments and can hang indefinitely. Jobs are queued as
    'pending' so the user can review and apply manually via the dashboard.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    limit = int(os.getenv("APPLY_LIMIT_PER_DAY", 15))
    profile = db.profile.find_one({}, {"_id": 0}) if db else {}

    # Optionally generate a tailored resume summary when Claude is available
    client = None
    if api_key:
        try:
            import anthropic
            client = anthropic.Anthropic(api_key=api_key)
        except Exception:
            pass

    for job in jobs[:limit]:
        if agent_state["applied_today"] >= limit:
            break
        try:
            resume_snippet = ""
            if client:
                try:
                    resume_snippet = await asyncio.wait_for(
                        generate_tailored_resume(client, job, profile),
                        timeout=30,
                    )
                except Exception as e:
                    log(f"⚠️ Resume generation skipped for {job.get('title','?')}: {e}", "warn")

            if db:
                db.jobs.update_one(
                    {"apply_url": job["apply_url"]},
                    {"$set": {
                        "status": "pending",
                        "generated_resume": resume_snippet[:500] if resume_snippet else "",
                        "updated_at": datetime.now(),
                    }}
                )

            log(
                f"⏳ Queued for manual apply: {job['title']} at {job['company']} "
                f"— {job.get('apply_url', 'no URL')}",
                "info",
            )
            agent_state["applied_today"] += 1
            await send_whatsapp_alert(
                f"⏳ Ready to apply: {job['title']} at {job['company']} "
                f"({job.get('ats_score', 0)}% match)\n{job.get('apply_url', '')}"
            )

        except Exception as e:
            log(f"❌ Queue failed for {job.get('title','?')}: {e}", "error")

async def generate_tailored_resume(client, job, profile):
    """Generate a tailored resume summary via Claude (runs in executor to stay non-blocking)."""
    def _call():
        return client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[{
                "role": "user",
                "content": f"""Create a tailored resume summary for this job application.

Candidate: {profile.get('name', 'Candidate')}
Skills: {', '.join(profile.get('skills', [])[:15])}
Experience: {json.dumps(profile.get('experience', [])[:2])}

Target Job: {job.get('title')} at {job.get('company')}
Job Description: {job.get('description', '')[:400]}

Write a 3-paragraph tailored resume summary highlighting most relevant skills. Be specific and ATS-optimized."""
            }]
        )

    msg = await asyncio.get_event_loop().run_in_executor(None, _call)
    return msg.content[0].text

async def check_gmail_notifications(db):
    """Check Gmail for recruiter emails — skipped gracefully if credentials are absent."""
    creds_file = "token.pickle"
    if not os.path.exists(creds_file):
        log("Gmail token.pickle not found, skipping email check", "info")
        return

    try:
        import pickle
        from googleapiclient.discovery import build

        with open(creds_file, "rb") as f:
            creds = pickle.load(f)

        def _fetch():
            service = build("gmail", "v1", credentials=creds)
            results = service.users().messages().list(
                userId="me",
                q="subject:(shortlisted OR interview OR selected OR assessment OR screening) newer_than:1d",
                maxResults=10,
            ).execute()
            messages = results.get("messages", [])
            items = []
            for msg_ref in messages:
                msg = service.users().messages().get(userId="me", id=msg_ref["id"]).execute()
                headers = {h["name"]: h["value"] for h in msg["payload"].get("headers", [])}
                items.append({
                    "subject": headers.get("Subject", ""),
                    "from": headers.get("From", ""),
                    "snippet": msg.get("snippet", ""),
                })
            return items

        items = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(None, _fetch),
            timeout=30,
        )

        for item in items:
            notif = {
                "type": "email",
                "subject": item["subject"],
                "from": item["from"],
                "snippet": item["snippet"],
                "created_at": datetime.now(),
                "read": False,
            }
            if db:
                exists = db.notifications.find_one({"subject": item["subject"], "from": item["from"]})
                if not exists:
                    db.notifications.insert_one(notif)
                    log(f"📧 New email: {item['subject'][:50]}", "info")
                    await send_whatsapp_alert(
                        f"📧 Recruiter Email!\nFrom: {item['from']}\n"
                        f"Subject: {item['subject']}\n{item['snippet'][:100]}"
                    )

    except asyncio.TimeoutError:
        log("Gmail check timed out", "warn")
    except Exception as e:
        log(f"Gmail check error: {e}", "warn")

async def send_whatsapp_alert(message: str):
    """Send WhatsApp notification via Meta API"""
    try:
        import requests
        token = os.getenv("WHATSAPP_TOKEN")
        phone_id = os.getenv("WHATSAPP_PHONE_ID")
        to = os.getenv("YOUR_WHATSAPP", "")

        if not all([token, phone_id, to]):
            return

        url = f"https://graph.facebook.com/v18.0/{phone_id}/messages"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        payload = {
            "messaging_product": "whatsapp",
            "to": to.replace("+", "").replace("-", "").replace(" ", ""),
            "type": "text",
            "text": {"body": f"🤖 ApplyNow Alert\n\n{message}"}
        }
        requests.post(url, headers=headers, json=payload, timeout=10)
    except Exception as e:
        log(f"WhatsApp error: {e}", "warn")

async def send_whatsapp_summary(stats):
    msg = f"""📊 Daily Summary
Applied: {stats.get('applied_today', 0)} jobs
Total Applied: {stats.get('total_applied', 0)}
Shortlisted: {stats.get('shortlisted', 0)}
Pending: {stats.get('pending', 0)}
Agent: {'🟢 Running' if agent_state['running'] else '🔴 Stopped'}"""
    await send_whatsapp_alert(msg)

def get_quick_stats(db):
    if not db:
        return {}
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    return {
        "applied_today": db.jobs.count_documents({"status": "applied", "applied_at": {"$gte": today}}),
        "total_applied": db.jobs.count_documents({"status": "applied"}),
        "shortlisted": db.jobs.count_documents({"status": "shortlisted"}),
        "pending": db.jobs.count_documents({"status": "pending"}),
    }

# ── SERVE FRONTEND ───────────────────────────────────
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        return FileResponse("frontend/dist/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=False)
