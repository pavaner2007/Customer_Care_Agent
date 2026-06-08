# CareMind Python ML Service

This FastAPI service adds a real Python AI/ML layer to CareMind AI.

It predicts:

- Complaint category
- Customer sentiment
- Churn risk
- Risk score
- Priority
- SLA hours
- Escalation requirement
- Recommended action

## Run Locally

```bash
cd python-ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check:

```bash
http://localhost:8000/health
```

Prediction endpoint:

```bash
POST http://localhost:8000/predict
```

Request body:

```json
{
  "customerName": "Rahul",
  "email": "rahul@example.com",
  "message": "My refund has not arrived for 20 days. This is terrible and I will cancel."
}
```

## Connect With Node Backend

In `backend/.env`, add:

```env
ML_SERVICE_URL=http://localhost:8000
```

Then run both services:

```bash
cd python-ml-service
uvicorn app.main:app --reload --port 8000

cd ../backend
npm run dev
```

The Node backend will automatically call this Python service during ticket creation.
