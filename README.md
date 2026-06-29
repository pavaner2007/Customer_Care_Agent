# CareMind AI — Emotion-Aware Customer Retention Platform

CareMind AI is a hackathon-ready Customer Care Bot project powered by **Groq API + Python FastAPI ML**. It converts customer complaints into intelligent support tickets with sentiment analysis, priority detection, churn-risk scoring, SLA prediction, AI summaries, suggested replies, escalation reasoning, and a manager dashboard.

---

## 🚀 Intelligent Support Architecture

Most hackathon bots only do this:
```text
Customer asks question → LLM replies
```

CareMind AI does this:
```text
Customer complaint
  ↓
Groq LLM: Detects complaint language, generates summary, translates to English, and drafts localized reply
  ↓
Python ML Service: Categorizes complaint, scores churn risk, predicts SLA duration, and outputs escalation necessity
  ↓
Node.js Express Backend: Creates an intelligent ticket under MongoDB (or local JSON fallback)
  ↓
React Dashboard: Live polling refresh, toast notifications, interactive CSAT loop, templated email replies
```

This architecture represents a production-grade AI SaaS product.

---

## ✨ Features

- **Complaint Chatbot Interface:** Rich conversational gateway with Emotion-Aware chat logic.
- **Multilingual Support:** Auto-detects input language (Hindi, Spanish, French, etc.), responds back in the same language, and translates complaints to English for the admin registry.
- **Python FastAPI ML Microservice:** Serves churn-risk analysis, category classification, SLA forecasting, and escalation reasoning.
- **Interactive CSAT Loop:** Star rating and text feedback widget at the end of the customer session (accessible publicly without authentication).
- **Live Admin Dashboard:** Real-time metrics visualization (using Recharts), live ticket queue polling, and sliding slide-in Toast alerts for critical tickets.
- **Admin Email Dispatch Simulator:** Send responses directly from the dashboard using Nodemailer (falls back to a safe mock demo mode if SMTP credentials are not configured).
- **Secure Register & Login:** Admin password hashing via `bcryptjs`, JWT auth protection, and registration secured with an `x-setup-secret` header.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Node.js, Express.js, Mongoose, Nodemailer
- **Database:** MongoDB / local JSON database fallback
- **ML Service:** Python, FastAPI, Scikit-learn
- **AI Integrations:** Groq Chat Completions API

---

## 📂 Folder Structure

```bash
caremind-ai/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   │   ├── groqService.js
│   │   └── mlService.js
│   ├── seedAdmin.js
│   ├── seedTickets.js
│   ├── server.js
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── index.html
│   └── .env.example
├── python-ml-service/
│   ├── app/
│   │   ├── main.py
│   │   └── model.py
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

---

## 🚀 Setup & Installation Instructions

### 1. Install Node Dependencies

Install dependencies for both backend and frontend:
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Files

Create configuration files from the `.env.example` templates:

**Backend (`backend/.env`):**
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/caremind-ai
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000

JWT_SECRET=super_secret_key_for_hackathon_demo
JWT_EXPIRES_IN=7d
ADMIN_SETUP_SECRET=change_this_setup_secret
DISABLE_ADMIN_REGISTER=false

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@example.com
SMTP_PASS=your_app_password
SMTP_FROM=CareMind AI <your_email@example.com>
ALERT_EMAIL_FROM=alerts@caremind.ai
ALERT_EMAIL_TO=manager@caremind.ai
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Run the Database Seed Scripts

Initialize the application database with demo accounts and dummy complaints:

```bash
cd backend

# Seed the administrator account
npm run seed:admin

# Seed 8 diverse customer tickets
npm run seed:tickets
```

**Admin Demo Credentials:**
* **URL:** `http://localhost:5173/admin-login`
* **Email:** `admin@caremind.ai`
* **Password:** `Admin@123`

---

### 4. Setup Python ML Service

Activate the virtual environment and install service dependencies:

```bash
cd python-ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

## 🏃 Running the Application

### Option A: Run Services Individually (Recommended for debugging)

1. **Python ML Service:**
   ```bash
   cd python-ml-service
   # Activate venv first
   uvicorn app.main:app --reload --port 8000
   ```
2. **Backend Server:**
   ```bash
   cd backend
   npm run dev
   ```
3. **Frontend Client:**
   ```bash
   cd frontend
   npm run dev
   ```

### Option B: Run Stack with Root Scripts (Vite + Express)

```bash
# From root directory
npm run dev
```

---

## 🧪 API Validation & Endpoints

### Public Endpoints

* **Register Complaint Ticket:** `POST /api/tickets`
* **CSAT Rating:** `PATCH /api/tickets/:id/csat`
  ```json
  {
    "csatRating": 5,
    "csatFeedback": "Good support experience"
  }
  ```

### Protected Endpoints (Requires `Authorization: Bearer <token>`)

* **Get Tickets:** `GET /api/tickets`
* **Get Analytics Summary:** `GET /api/analytics/summary`
* **Send Email Response:** `POST /api/tickets/:id/send-response`
  ```json
  {
    "message": "Final response details here..."
  }
  ```
