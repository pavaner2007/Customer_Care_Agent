from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple
import re

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline


@dataclass
class ComplaintPrediction:
    sentiment: str
    category: str
    priority: str
    churnRisk: str
    riskScore: int
    mlConfidence: float
    slaHours: int
    escalationRequired: bool
    escalationReason: str
    recommendedAction: str
    modelVersion: str = "caremind-python-ml-v1"


TRAINING_DATA: List[Tuple[str, str, str]] = [
    ("refund not received for many days very disappointed", "Refund", "Frustrated"),
    ("i need my refund immediately this is the worst service", "Refund", "Angry"),
    ("money deducted but refund is still pending", "Refund", "Frustrated"),
    ("delivery delayed and no update from courier", "Delivery", "Frustrated"),
    ("order not delivered even after promised date", "Delivery", "Angry"),
    ("shipment tracking is not working", "Delivery", "Neutral"),
    ("payment failed but amount debited from bank", "Payment", "Frustrated"),
    ("transaction failed and money got deducted", "Payment", "Angry"),
    ("invoice payment issue please help", "Payment", "Neutral"),
    ("product arrived damaged and broken", "Product", "Angry"),
    ("product quality is poor and defective", "Product", "Frustrated"),
    ("item size is wrong need replacement", "Product", "Neutral"),
    ("app keeps crashing and login not working", "Technical", "Frustrated"),
    ("website error prevents me from booking", "Technical", "Neutral"),
    ("technical issue has not been fixed for weeks", "Technical", "Angry"),
    ("support team is rude and not responding", "Service", "Angry"),
    ("customer service did not call me back", "Service", "Frustrated"),
    ("need help with my account", "Service", "Neutral"),
    ("thank you for quick help", "General", "Positive"),
    ("service was good and issue resolved", "General", "Positive"),
    ("i have a small query about my plan", "General", "Neutral"),
    ("i will cancel my subscription if this is not fixed", "Service", "Angry"),
    ("i am switching to another company", "Service", "Angry"),
    ("nobody is helping me and i feel cheated", "Service", "Angry"),
]


CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Refund": ["refund", "cashback", "return money", "money back"],
    "Delivery": ["delivery", "delivered", "courier", "shipment", "tracking", "order not received"],
    "Payment": ["payment", "paid", "transaction", "debited", "deducted", "invoice", "billing"],
    "Product": ["damaged", "broken", "defective", "quality", "replacement", "wrong item", "product"],
    "Technical": ["app", "website", "login", "error", "bug", "crash", "technical", "server"],
    "Service": ["support", "agent", "rude", "service", "not responding", "call back", "ignored"],
}

ANGER_KEYWORDS = [
    "angry", "worst", "terrible", "ridiculous", "fraud", "cheated", "useless",
    "disappointed", "unacceptable", "cancel", "switching", "legal", "complaint",
    "never again", "poor service", "not responding", "ignored"
]

URGENCY_KEYWORDS = [
    "immediately", "urgent", "today", "right now", "asap", "deadline", "emergency",
    "many days", "weeks", "15 days", "20 days", "month"
]

POSITIVE_KEYWORDS = ["thank", "thanks", "good", "great", "resolved", "happy", "satisfied"]


class CareMindMLModel:
    def __init__(self) -> None:
        texts = [row[0] for row in TRAINING_DATA]
        categories = [row[1] for row in TRAINING_DATA]
        sentiments = [row[2] for row in TRAINING_DATA]

        self.category_model = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ])
        self.sentiment_model = Pipeline([
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
            ("clf", LogisticRegression(max_iter=1000, class_weight="balanced")),
        ])

        self.category_model.fit(texts, categories)
        self.sentiment_model.fit(texts, sentiments)

    @staticmethod
    def _clean(text: str) -> str:
        return re.sub(r"\s+", " ", text.strip().lower())

    @staticmethod
    def _keyword_count(text: str, keywords: List[str]) -> int:
        return sum(1 for keyword in keywords if keyword in text)

    def _keyword_category_override(self, text: str, predicted_category: str) -> str:
        scores = {
            category: self._keyword_count(text, keywords)
            for category, keywords in CATEGORY_KEYWORDS.items()
        }
        best_category, best_score = max(scores.items(), key=lambda item: item[1])
        return best_category if best_score > 0 else predicted_category

    @staticmethod
    def _confidence_from_pipeline(model: Pipeline, text: str) -> float:
        probabilities = model.predict_proba([text])[0]
        return float(np.max(probabilities))

    def predict(self, message: str) -> ComplaintPrediction:
        text = self._clean(message)
        if not text:
            text = "general customer support query"

        category_pred = str(self.category_model.predict([text])[0])
        sentiment_pred = str(self.sentiment_model.predict([text])[0])
        category = self._keyword_category_override(text, category_pred)

        anger_hits = self._keyword_count(text, ANGER_KEYWORDS)
        urgency_hits = self._keyword_count(text, URGENCY_KEYWORDS)
        positive_hits = self._keyword_count(text, POSITIVE_KEYWORDS)

        if anger_hits >= 2:
            sentiment = "Angry"
        elif anger_hits == 1 and sentiment_pred in {"Neutral", "Positive"}:
            sentiment = "Frustrated"
        elif positive_hits >= 1 and anger_hits == 0:
            sentiment = "Positive"
        else:
            sentiment = sentiment_pred

        base_risk = {
            "Positive": 15,
            "Neutral": 35,
            "Frustrated": 68,
            "Angry": 84,
        }.get(sentiment, 45)

        category_weight = {
            "Refund": 8,
            "Payment": 9,
            "Delivery": 6,
            "Product": 7,
            "Technical": 6,
            "Service": 10,
            "General": 0,
        }.get(category, 3)

        risk_score = base_risk + category_weight + min(urgency_hits * 5, 15) + min(anger_hits * 4, 12)
        risk_score = int(max(0, min(100, risk_score)))

        if risk_score >= 75:
            churn_risk = "High"
            priority = "High"
            sla_hours = 2
        elif risk_score >= 50:
            churn_risk = "Medium"
            priority = "Medium"
            sla_hours = 12
        else:
            churn_risk = "Low"
            priority = "Low"
            sla_hours = 24

        escalation_required = priority == "High" or sentiment == "Angry"
        if escalation_required:
            escalation_reason = "High churn risk detected due to negative emotion, urgent wording, or revenue-sensitive issue."
            recommended_action = "Escalate to senior support, acknowledge the issue empathetically, and offer a clear resolution timeline."
        elif priority == "Medium":
            escalation_reason = "Moderate risk complaint requiring timely follow-up."
            recommended_action = "Assign to support agent and update the customer within the SLA window."
        else:
            escalation_reason = "Low-risk query suitable for normal support workflow."
            recommended_action = "Respond with standard support guidance and monitor for follow-up dissatisfaction."

        confidence = round(
            (self._confidence_from_pipeline(self.category_model, text) + self._confidence_from_pipeline(self.sentiment_model, text)) / 2,
            3,
        )

        return ComplaintPrediction(
            sentiment=sentiment,
            category=category,
            priority=priority,
            churnRisk=churn_risk,
            riskScore=risk_score,
            mlConfidence=confidence,
            slaHours=sla_hours,
            escalationRequired=escalation_required,
            escalationReason=escalation_reason,
            recommendedAction=recommended_action,
        )


model = CareMindMLModel()
