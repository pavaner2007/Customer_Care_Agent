import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    category: { type: String, default: 'General' },
    sentiment: { type: String, default: 'Neutral' },
    priority: { type: String, default: 'Medium' },
    churnRisk: { type: String, default: 'Medium' },
    riskScore: { type: Number, default: 50 },
    summary: { type: String, default: '' },
    suggestedReply: { type: String, default: '' },
    recommendedAction: { type: String, default: '' },
    mlConfidence: { type: Number, default: 0 },
    slaHours: { type: Number, default: 24 },
    escalationRequired: { type: Boolean, default: false },
    escalationReason: { type: String, default: '' },
    modelVersion: { type: String, default: '' },
    aiEngine: { type: String, default: 'Groq LLM' },
    detectedLanguage: { type: String, default: 'English' },
    translatedMessage: { type: String, default: '' },
    csatRating: { type: Number, default: null },
    csatFeedback: { type: String, default: '' },
    status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' }
  },
  { timestamps: true }
);

export default mongoose.model('Ticket', ticketSchema);
