import express from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import { protect } from '../middleware/authMiddleware.js';

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
    
    // Basic stats
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'Open').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
    const escalatedTickets = tickets.filter(t => t.escalationRequired).length;
    const escalatedTicketsReal = tickets.filter(t => t.status !== 'Resolved' && t.escalationRequired).length;
    // We will follow the format specified by the user
    const highPriorityTickets = tickets.filter(t => t.priority === 'High').length;
    const averageRiskScore = totalTickets
      ? Math.round(tickets.reduce((sum, t) => sum + (t.riskScore || 0), 0) / totalTickets)
      : 0;

    // 1. Sentiment Distribution
    let posCount = 0, neuCount = 0, negCount = 0;
    tickets.forEach(t => {
      const sentiment = t.sentiment || 'Neutral';
      if (sentiment === 'Positive') posCount++;
      else if (sentiment === 'Neutral') neuCount++;
      else negCount++; // Frustrated or Angry
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
      churnRiskDistribution
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load analytics summary', error: error.message });
  }
});

export default router;
