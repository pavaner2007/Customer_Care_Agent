from __future__ import annotations

import os
from typing import List, Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.model import model


class ComplaintRequest(BaseModel):
    customerName: Optional[str] = Field(default="Customer", min_length=1)
    email: Optional[str] = None
    message: str = Field(..., min_length=3)


class TicketForInsights(BaseModel):
    customerName: Optional[str] = None
    email: Optional[str] = None
    message: str
    category: Optional[str] = None
    sentiment: Optional[str] = None
    priority: Optional[str] = None
    churnRisk: Optional[str] = None
    riskScore: Optional[int] = 0
    status: Optional[str] = "Open"


class BatchInsightsRequest(BaseModel):
    tickets: List[TicketForInsights]


app = FastAPI(
    title="CareMind Python ML Service",
    description="ML microservice for churn-risk scoring, complaint classification, SLA prediction, and escalation reasoning.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "CareMind Python ML Service is running",
        "endpoints": ["/health", "/predict", "/insights"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "python-ml-service", "modelVersion": "caremind-python-ml-v1"}


@app.post("/predict")
def predict_complaint(payload: ComplaintRequest):
    prediction = model.predict(payload.message)
    return prediction.__dict__


@app.post("/insights")
def generate_insights(payload: BatchInsightsRequest):
    tickets = payload.tickets
    total = len(tickets)
    if total == 0:
        return {
            "total": 0,
            "averageRiskScore": 0,
            "topRiskCategory": "None",
            "escalationRate": 0,
            "recommendation": "No tickets available for analysis.",
        }

    category_risk = {}
    high_risk_count = 0
    open_high_risk_count = 0
    total_risk = 0

    for ticket in tickets:
        risk = int(ticket.riskScore or 0)
        total_risk += risk
        category = ticket.category or "General"
        category_risk.setdefault(category, []).append(risk)
        if risk >= 75 or ticket.churnRisk == "High":
            high_risk_count += 1
            if ticket.status != "Resolved":
                open_high_risk_count += 1

    avg_risk_by_category = {
        category: sum(scores) / len(scores)
        for category, scores in category_risk.items()
    }
    top_risk_category = max(avg_risk_by_category.items(), key=lambda item: item[1])[0]
    average_risk = round(total_risk / total, 2)
    escalation_rate = round((high_risk_count / total) * 100, 2)

    if open_high_risk_count > 0:
        recommendation = f"Immediately resolve {open_high_risk_count} open high-risk ticket(s), especially in {top_risk_category}."
    elif escalation_rate >= 40:
        recommendation = f"High escalation trend detected. Improve root-cause handling for {top_risk_category} complaints."
    else:
        recommendation = "Risk trend is manageable. Continue monitoring unresolved medium-risk tickets."

    return {
        "total": total,
        "averageRiskScore": average_risk,
        "topRiskCategory": top_risk_category,
        "escalationRate": escalation_rate,
        "openHighRiskTickets": open_high_risk_count,
        "recommendation": recommendation,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)
