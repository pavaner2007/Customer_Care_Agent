import express from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import { protect } from '../middleware/authMiddleware.js';
import { getMlInsights } from '../services/mlService.js';

const router = express.Router();
const ticketsFile = path.resolve('tickets.json');

const getTickets = async () => {
  if (mongoose.connection.readyState === 1) {
    return await Ticket.find();
  } else {
    try {
      if (fs.existsSync(ticketsFile)) {
        return JSON.parse(fs.readFileSync(ticketsFile, 'utf8'));
      }
    } catch (err) {
      console.error('Failed to load tickets for analytics:', err.message);
    }
  }
  return [];
};

router.get('/summary', protect, async (req, res) => {
  try {
    const tickets = await getTickets();
    const totalTickets = tickets.length;

    if (totalTickets === 0) {
      return res.json({
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        escalatedTickets: 0,
        highPriorityTickets: 0,
        averageRiskScore: 0,
        sentimentDistribution: [],
        categoryDistribution: [],
        priorityDistribution: [],
        dailyTickets: [],
        churnRiskDistribution: [],
        averageCsat: 0,
        csatDistribution: [],
        mlInsights: null
      });
    }
    
    // Basic stats
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
    const escalatedTickets = tickets.filter(t => t.escalationRequired).length;
    const highPriorityTickets = tickets.filter(t => t.priority === 'High').length;
    const averageRiskScore = totalTickets
      ? Math.round(tickets.reduce((sum, t) => sum + (t.riskScore || 0), 0) / totalTickets)
      : 0;

    // CSAT Calculations
    const ratedTickets = tickets.filter(t => t.csatRating !== undefined && t.csatRating !== null);
    const averageCsat = ratedTickets.length
      ? Number((ratedTickets.reduce((sum, t) => sum + t.csatRating, 0) / ratedTickets.length).toFixed(1))
      : 0;

    let csat1 = 0, csat2 = 0, csat3 = 0, csat4 = 0, csat5 = 0;
    ratedTickets.forEach(t => {
      const r = Math.round(t.csatRating);
      if (r === 1) csat1++;
      else if (r === 2) csat2++;
      else if (r === 3) csat3++;
      else if (r === 4) csat4++;
      else if (r === 5) csat5++;
    });

    const csatDistribution = [
      { name: '1 Star', value: csat1 },
      { name: '2 Stars', value: csat2 },
      { name: '3 Stars', value: csat3 },
      { name: '4 Stars', value: csat4 },
      { name: '5 Stars', value: csat5 }
    ];

    // 1. Sentiment Distribution
    // Groq returns: Positive, Neutral, Frustrated, Angry
    // Normalize Frustrated/Angry → Negative for the pie chart
    let posCount = 0, neuCount = 0, negCount = 0;
    tickets.forEach(t => {
      const sentiment = (t.sentiment || 'Neutral');
      if (sentiment === 'Positive') posCount++;
      else if (sentiment === 'Neutral') neuCount++;
      else negCount++; // Angry or Frustrated → Negative
    });
    const sentimentDistribution = [
      { name: 'Positive', value: posCount },
      { name: 'Neutral', value: neuCount },
      { name: 'Negative', value: negCount }
    ];

    // 2. Category Distribution
    const categories = ['Refund', 'Delivery', 'Payment', 'Product', 'Technical', 'Service', 'General'];
    const categoryDistribution = categories.map(cat => {
      const value = tickets.filter(t => (t.category || 'General').toLowerCase() === cat.toLowerCase()).length;
      return { name: cat, value };
    });

    // 3. Priority Distribution
    const priorities = ['Low', 'Medium', 'High'];
    const priorityDistribution = priorities.map(pri => {
      const value = tickets.filter(t => (t.priority || 'Medium').toLowerCase() === pri.toLowerCase()).length;
      return { name: pri, value };
    });

    // 4. Churn Risk Distribution
    const risks = ['Low', 'Medium', 'High'];
    const churnRiskDistribution = risks.map(risk => {
      const value = tickets.filter(t => (t.churnRisk || 'Medium').toLowerCase() === risk.toLowerCase()).length;
      return { name: risk, value };
    });

    // 5. Daily Ticket Trends (Last 7 Days)
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyTicketsList = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysOfWeek[d.getDay()];
      dailyTicketsList.push({
        date: dayName,
        tickets: 0,
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate()
      });
    }

    tickets.forEach(ticket => {
      if (!ticket.createdAt) return;
      const tDate = new Date(ticket.createdAt);
      const year = tDate.getFullYear();
      const month = tDate.getMonth();
      const day = tDate.getDate();

      const matchedDay = dailyTicketsList.find(d => d.year === year && d.month === month && d.day === day);
      if (matchedDay) {
        matchedDay.tickets++;
      }
    });

    const dailyTickets = dailyTicketsList.map(d => ({
      date: d.date,
      tickets: d.tickets
    }));

    // ML Insights from Python service
    const mlInsights = await getMlInsights(tickets);

    res.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      escalatedTickets,
      highPriorityTickets,
      averageRiskScore,
      sentimentDistribution,
      categoryDistribution,
      priorityDistribution,
      dailyTickets,
      churnRiskDistribution,
      averageCsat,
      csatDistribution,
      mlInsights: mlInsights || null
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load analytics summary', error: error.message });
  }
});

export default router;
