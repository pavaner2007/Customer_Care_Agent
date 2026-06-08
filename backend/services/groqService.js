import axios from 'axios';

const fallbackAnalysis = (message) => {
  const text = message.toLowerCase();
  const angry = ['angry', 'terrible', 'worst', 'ridiculous', 'fraud', 'cheated', 'disappointed'].some(w => text.includes(w));
  const refund = text.includes('refund');
  const delivery = ['delivery', 'delivered', 'shipment', 'order'].some(w => text.includes(w));
  const payment = ['payment', 'paid', 'transaction'].some(w => text.includes(w));
  const category = refund ? 'Refund' : delivery ? 'Delivery' : payment ? 'Payment' : 'Service';
  return {
    sentiment: angry ? 'Angry' : 'Neutral',
    category,
    priority: angry ? 'High' : 'Medium',
    churnRisk: angry ? 'High' : 'Medium',
    riskScore: angry ? 86 : 48,
    summary: message.length > 120 ? `${message.slice(0, 117)}...` : message,
    suggestedReply: 'We sincerely apologize for the inconvenience. Your concern has been prioritized and our team will resolve it as quickly as possible.',
    recommendedAction: angry ? 'Escalate to senior support manager and offer compensation if valid.' : 'Assign to support agent and update customer within 24 hours.'
  };
};

const extractJson = (content) => {
  try { return JSON.parse(content); } catch (_) {}
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in model response');
  return JSON.parse(match[0]);
};

export const analyzeComplaint = async ({ customerName, message }) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_')) {
    return fallbackAnalysis(message);
  }

  const prompt = `You are CareMind AI, a customer retention intelligence engine. Analyze this customer complaint and return ONLY valid JSON with these exact keys: sentiment, category, priority, churnRisk, riskScore, summary, suggestedReply, recommendedAction. Use sentiment as Positive, Neutral, Frustrated, or Angry. Use category as Refund, Delivery, Product, Payment, Service, Technical, or General. Use priority and churnRisk as Low, Medium, or High. riskScore must be a number from 0 to 100. Customer name: ${customerName}. Complaint: ${message}`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'Return only strict JSON. Do not include markdown.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 700
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const content = response.data.choices?.[0]?.message?.content || '{}';
    return { ...fallbackAnalysis(message), ...extractJson(content) };
  } catch (error) {
    console.error('Groq analysis failed:', error.response?.data || error.message);
    return fallbackAnalysis(message);
  }
};

export const generateReply = async (ticket) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.includes('your_')) {
    return fallbackAnalysis(ticket.message).suggestedReply;
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You write empathetic, professional customer care replies.' },
          { role: 'user', content: `Write a concise reply for this ${ticket.priority} priority ${ticket.category} complaint. Sentiment: ${ticket.sentiment}. Complaint: ${ticket.message}` }
        ],
        temperature: 0.35,
        max_tokens: 300
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    return response.data.choices?.[0]?.message?.content?.trim() || ticket.suggestedReply;
  } catch (error) {
    console.error('Groq reply failed:', error.response?.data || error.message);
    return ticket.suggestedReply || fallbackAnalysis(ticket.message).suggestedReply;
  }
};
