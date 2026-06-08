# CareMind AI — Emotion-Aware Customer Retention Platform

CareMind AI is a hackathon-ready Customer Care Bot project powered by **Groq API + Python FastAPI ML**. It converts customer complaints into intelligent support tickets with sentiment analysis, priority detection, churn-risk scoring, SLA prediction, AI summaries, suggested replies, escalation reasoning, and a manager dashboard.

## Why This Version Is Stronger

Most hackathon bots only do this:

```text
Customer asks question → LLM replies
```

This version does this:

```text
Customer complaint
  ↓
Groq LLM generates summary and professional reply
  ↓
Python ML service predicts category, sentiment, churn risk, SLA, and escalation
  ↓
Node backend creates intelligent ticket
  ↓
Manager dashboard shows business risk and support actions
```

This makes the project look like a real AI SaaS product, not just a simple chatbot.

## Features

- Customer complaint chatbot
- Groq-powered complaint summarization and reply generation
- Python FastAPI ML microservice
- Scikit-learn based complaint classification
- Sentiment detection: Positive, Neutral, Frustrated, Angry
- Complaint categorization: Refund, Delivery, Product, Payment, Service, Technical, General
- Priority detection: Low, Medium, High
- Churn-risk prediction and risk score
- SLA prediction in hours
- Escalation requirement detection
- AI-generated customer-care replies
- Auto ticket creation
- Admin dashboard with ticket stats
- Ticket status updates
- Python-powered dashboard insights
- Fallback demo mode if Groq key or Python service is missing

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Lucide Icons
- Backend: Node.js, Express.js
- Database: MongoDB / MongoDB Atlas
- LLM: Groq Chat Completions API
- ML Service: Python, FastAPI, Scikit-learn

## Folder Structure

```bash
caremind-ai/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   ├── groqService.js
│   │   └── mlService.js
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
│   ├── Dockerfile
│   └── .env.example
└── README.md
```

## Setup Instructions

### 1. Install Node dependencies

```bash
cd caremind-ai
npm install
npm run install:all
```

Or install separately:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Install Python ML service dependencies

```bash
cd python-ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configure backend environment

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/caremind-ai
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
CLIENT_URL=http://localhost:5173
ML_SERVICE_URL=http://localhost:8000

JWT_SECRET=super_secret_key_for_hackathon_demo
JWT_EXPIRES_IN=7d
```

For MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string.

### 4. Configure frontend environment

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Seed the Demo Admin Account

Make sure you run the seeding script to create the administrator account (supported in both MongoDB and local JSON database modes):

```bash
cd backend
node seedAdmin.js
```

**Demo Credentials:**
* **Email:** `admin@caremind.ai`
* **Password:** `Admin@123`

### 6. Run the Python ML service

```bash
cd python-ml-service
# Activate venv first: .\venv\Scripts\activate (Windows) or source venv/bin/activate (macOS/Linux)
uvicorn app.main:app --reload --port 8000
```

Open health check:

```bash
http://localhost:8000/health
```

### 7. Run backend

```bash
cd backend
npm run dev
```

### 8. Run frontend

```bash
cd frontend
npm run dev
```

Open Support Portal:

```bash
http://localhost:5173
```

Open Admin Portal Login:

```bash
http://localhost:5173/admin-login
```


## Run All Node Services Together

This starts frontend and backend together:

```bash
npm run dev
```

To run the full stack using the root script, make sure Python dependencies are installed first:

```bash
npm run dev:full
```

## Groq API Usage

The backend uses this endpoint:

```text
https://api.groq.com/openai/v1/chat/completions
```

Default model:

```text
llama-3.1-8b-instant
```

You can change it in `backend/.env`.

## Python ML API Usage

Prediction endpoint:

```text
POST http://localhost:8000/predict
```

Example request:

```json
{
  "customerName": "Rahul",
  "email": "rahul@example.com",
  "message": "My refund has not arrived for 20 days. This is terrible and I will cancel."
}
```

Example response:

```json
{
  "sentiment": "Angry",
  "category": "Refund",
  "priority": "High",
  "churnRisk": "High",
  "riskScore": 100,
  "mlConfidence": 0.72,
  "slaHours": 2,
  "escalationRequired": true,
  "escalationReason": "High churn risk detected due to negative emotion, urgent wording, or revenue-sensitive issue.",
  "recommendedAction": "Escalate to senior support, acknowledge the issue empathetically, and offer a clear resolution timeline.",
  "modelVersion": "caremind-python-ml-v1"
}
```

## Hackathon Problem Statement

Businesses lose customers because complaints are not prioritized, angry customers are not identified early, and support teams lack intelligent tools to predict churn risk. CareMind AI solves this by using Groq and Python ML to analyze complaints, detect emotions, predict churn risk, assign SLA, recommend resolution actions, and help managers resolve high-risk cases faster.

## Demo Flow

1. Customer submits a complaint.
2. Backend sends complaint to Groq API and Python ML service.
3. Groq returns summary and customer-care reply.
4. Python ML returns sentiment, category, priority, churn risk, risk score, SLA, and escalation requirement.
5. Ticket is saved in MongoDB.
6. Dashboard displays real-time ticket intelligence.
7. Manager can update status or regenerate AI reply.

## Deployment

Recommended:

- Frontend: Vercel
- Backend: Render
- Python ML Service: Render / Railway / Hugging Face Spaces
- Database: MongoDB Atlas

Backend environment variables during deployment:

```env
MONGO_URI=your_mongodb_atlas_uri
GROQ_API_KEY=your_groq_key
CLIENT_URL=your_vercel_frontend_url
ML_SERVICE_URL=your_python_ml_service_url
```

Frontend environment variable:

```env
VITE_API_URL=your_render_backend_url/api
```

## Winning-Level Add-ons To Build Later

- Admin authentication
- Charts for category-wise risk trends
- Email notification for high-risk tickets
- WhatsApp complaint intake
- Real trained model using historical support data
- Multi-language complaint handling for Indian users
- Exportable manager report PDF
