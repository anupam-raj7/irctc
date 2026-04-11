================================================================
    IRCTC Rail Connect — Complete Deployment Guide
    Stack: React (Vercel) + Node.js (Render) + PostgreSQL (Supabase)
    All platforms have FREE tiers — no credit card needed
================================================================

STEP 1 ─── SET UP SUPABASE (Database)
──────────────────────────────────────
1. Go to https://supabase.com and click "Start for free"
2. Sign up with GitHub or email
3. Click "New Project"
   - Name: irctc-railconnect
   - Database Password: (save this somewhere safe)
   - Region: Southeast Asia (Singapore) — closest to India
4. Wait ~2 minutes for project to be ready
5. Click "SQL Editor" in left sidebar → "New Query"
6. Open the file: supabase_schema.sql (in the root of this project)
7. Paste ALL the contents and click "Run" (green button)
   ✅ This creates all tables, seeds 10 trains, sets up RLS
8. Go to Project Settings → API
9. Copy these two values (you'll need them soon):
   - Project URL:  https://xxxxxxxx.supabase.co
   - service_role key (under "Project API keys", click reveal)
   ⚠️  NEVER share your service_role key publicly!

────────────────────────────────────────────────────────────────

STEP 2 ─── DEPLOY BACKEND TO RENDER
──────────────────────────────────────
1. Push your code to GitHub:
   git init
   git add .
   git commit -m "Initial commit"
   # Create a new repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/irctc.git
   git push -u origin main

2. Go to https://render.com → Sign up (free, use GitHub)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - Name:          irctc-backend
   - Root Directory: backend
   - Runtime:       Node
   - Build Command: npm install
   - Start Command: npm start
   - Plan:          Free
6. Click "Advanced" → "Add Environment Variables" — add ALL of these:

   Key                        Value
   ─────────────────────────────────────────────────────────────
   SUPABASE_URL               https://xxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY  eyJhbGciOi... (your service_role key)
   JWT_SECRET                 (generate: openssl rand -hex 32)
   NODE_ENV                   production
   FRONTEND_URL               https://your-app.vercel.app  ← update after step 3
   EMAIL_USER                 your-gmail@gmail.com
   EMAIL_PASS                 your-gmail-app-password
   ─────────────────────────────────────────────────────────────

   HOW TO GET GMAIL APP PASSWORD:
   → myaccount.google.com → Security → 2-Step Verification (enable it)
   → Then search "App Passwords" → Select app: Mail → Generate
   → Copy the 16-character password

7. Click "Create Web Service"
8. Wait ~3-5 minutes for deploy. You'll get a URL like:
   https://irctc-backend.onrender.com
9. Test it: open https://irctc-backend.onrender.com/api/health
   You should see: {"status":"ok","service":"IRCTC Rail Connect API"}
   ⚠️  FREE Render services sleep after 15min inactivity — first request takes ~30s

────────────────────────────────────────────────────────────────

STEP 3 ─── DEPLOY FRONTEND TO VERCEL
──────────────────────────────────────
(You already have a Vercel account!)

1. Go to https://vercel.com → "Add New Project"
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Create React App
   - Root Directory:   frontend
   - Build Command:    npm run build  (auto-detected)
   - Output Directory: build          (auto-detected)
4. Environment Variables — add this one:

   Key                    Value
   ──────────────────────────────────────────────────────────────
   REACT_APP_API_URL      https://irctc-backend.onrender.com
   ──────────────────────────────────────────────────────────────
   (use your actual Render backend URL from Step 2)

5. Click "Deploy"
6. In ~2 minutes your site is live at:
   https://irctc-railconnect.vercel.app  (or similar)
7. Copy this URL and go back to Render → your irctc-backend service
   → Environment → Update FRONTEND_URL to this Vercel URL
   → Click "Save Changes" (Render will redeploy)

────────────────────────────────────────────────────────────────

STEP 4 ─── VERIFY EVERYTHING WORKS
──────────────────────────────────────
1. Open your Vercel URL
2. Register a new account with your email
3. Check your email for OTP (check spam if not received)
4. Enter OTP → you're logged in!
5. Search for a train: New Delhi → Howrah Junction
6. Select seats, fill passenger details
7. Complete payment (mock UPI/QR)
8. View confirmed ticket in "My Tickets"
9. Test cancellation — refund policy auto-calculates

────────────────────────────────────────────────────────────────

STEP 5 ─── DOWNLOAD ACCOUNTS.TXT LOG
──────────────────────────────────────
Once logged in, click the ↓ (download) button in the navbar.
This downloads irctc_accounts.txt with:
- All registered users (name, email, phone, verified status)
- All activity logs (login, register, OTP verify events)

────────────────────────────────────────────────────────────────

PROJECT STRUCTURE
──────────────────────────────────────
irctc/
├── supabase_schema.sql     ← Run this in Supabase SQL Editor
├── .gitignore
├── DEPLOY.md               ← This file
│
├── backend/                ← Deploy to Render
│   ├── server.js           ← Express app entry
│   ├── supabase.js         ← DB client
│   ├── package.json
│   ├── render.yaml         ← Render config
│   ├── .env.example        ← Copy to .env for local dev
│   ├── middleware/
│   │   └── auth.js         ← JWT verification
│   └── routes/
│       ├── auth.js         ← Register, Login, OTP, Download logs
│       ├── trains.js       ← Search, seat availability
│       ├── bookings.js     ← Book, list, cancel (SQL transactions)
│       └── payments.js     ← Mock payment gateway
│
└── frontend/               ← Deploy to Vercel
    ├── vercel.json         ← SPA routing fix
    ├── package.json
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js          ← Router + auth wrapper
        ├── index.js
        ├── index.css       ← Global styles + animations
        ├── context/
        │   └── AuthContext.js
        ├── utils/
        │   └── api.js      ← Axios with JWT interceptor
        ├── components/
        │   └── Navbar.js
        └── pages/
            ├── HomePage.js       ← Landing + search form
            ├── LoginPage.js      ← Login
            ├── RegisterPage.js   ← Registration
            ├── OtpPage.js        ← OTP verification (6 boxes)
            ├── SearchPage.js     ← Train search results
            ├── SeatSelectPage.js ← Seat map + passengers
            ├── PaymentPage.js    ← UPI QR + Card + NetBanking
            └── BookingsPage.js   ← My tickets + cancellation

────────────────────────────────────────────────────────────────

SQL TRANSACTIONS USED
──────────────────────────────────────
The database uses PostgreSQL stored functions (in supabase_schema.sql)
that act like full ACID transactions:

book_ticket():
  1. Locks all requested seat rows with FOR UPDATE
  2. Checks no seat is already booked
  3. If any seat is taken → returns error, NOTHING is written
  4. Creates booking record
  5. Marks all seats as booked
  6. Creates payment record
  All steps succeed or ALL roll back automatically ✅

cancel_ticket():
  1. Locks booking row with FOR UPDATE
  2. Validates ownership and status
  3. Calculates refund (90%/75%/50%/0% based on time)
  4. Updates booking to CANCELLED
  5. Frees all seats back to available
  6. Updates payment to REFUNDED
  All steps succeed or ALL roll back automatically ✅

────────────────────────────────────────────────────────────────

LOCAL DEVELOPMENT (optional)
──────────────────────────────────────
# Terminal 1 — Backend
cd backend
cp .env.example .env
# Fill in your values in .env
npm install
node server.js
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
echo "REACT_APP_API_URL=http://localhost:5000" > .env
npm install
npm start
# Opens http://localhost:3000

────────────────────────────────────────────────────────────────

TROUBLESHOOTING
──────────────────────────────────────
❌ "CORS error" in browser
   → Check FRONTEND_URL in Render matches your Vercel URL exactly

❌ "Invalid API key" from Supabase
   → Make sure you're using the service_role key, NOT the anon key

❌ OTP email not received
   → Check Gmail App Password is correct; check spam folder
   → Make sure 2FA is enabled on your Google account first

❌ Render backend times out
   → Free tier sleeps after 15min; first request takes ~30s, then it's fast

❌ "relation does not exist" error
   → The SQL schema wasn't run — go back to Step 1

================================================================
   Made with ❤️ for India — Book smarter, travel better 🚂
================================================================
