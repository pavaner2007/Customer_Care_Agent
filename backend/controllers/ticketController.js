import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';
import { analyzeComplaint, generateReply } from '../services/groqService.js';
import { predictComplaintRisk, getMlInsights } from '../services/mlService.js';

// --- Local JSON DB Fallback for High Resilience ---
let localTickets = [];
const localTicketsFile = path.resolve('tickets.json');

const loadLocalTickets = () => {
  try {
    if (fs.existsSync(localTicketsFile)) {
      const data = fs.readFileSync(localTicketsFile, 'utf8');
      localTickets = JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load local tickets:', err.message);
  }
};

const saveLocalTickets = () => {
  try {
    fs.writeFileSync(localTicketsFile, JSON.stringify(localTickets, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local tickets:', err.message);
  }
};

loadLocalTickets();

export const createTicket = async (req, res) => {
  try {
    const { customerName, email, message } = req.body;
    if (!customerName || !email || !message) {
      return res.status(400).json({ message: 'customerName, email, and message are required' });
    }
    const [groqAnalysis, mlPrediction] = await Promise.all([
      analyzeComplaint({ customerName, message }),
      predictComplaintRisk({ customerName, email, message })
    ]);

    const analysis = {
      ...groqAnalysis,
      ...(mlPrediction || {}),
      // Keep Groq's natural language output while using Python for risk intelligence.
      summary: groqAnalysis.summary,
      suggestedReply: groqAnalysis.suggestedReply,
      recommendedAction: mlPrediction?.recommendedAction || groqAnalysis.recommendedAction,
      aiEngine: mlPrediction ? 'Groq LLM + Python FastAPI ML' : 'Groq LLM only'
    };

    let ticket;
    if (mongoose.connection.readyState === 1) {
      ticket = await Ticket.create({ customerName, email, message, ...analysis });
    } else {
      console.warn('MongoDB not connected. Saving ticket to local JSON fallback.');
      ticket = {
        _id: 'local_' + Math.random().toString(36).substring(2, 11),
        customerName,
        email,
        message,
        ...analysis,
        status: 'Open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localTickets.unshift(ticket);
      saveLocalTickets();
    }
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, priority } = req.query;
    let tickets;
    if (mongoose.connection.readyState === 1) {
      const filter = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      tickets = await Ticket.find(filter).sort({ createdAt: -1 });
    } else {
      tickets = [...localTickets];
      if (status) tickets = tickets.filter(t => t.status === status);
      if (priority) tickets = tickets.filter(t => t.priority === priority);
    }
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tickets', error: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    let tickets;
    if (mongoose.connection.readyState === 1) {
      tickets = await Ticket.find();
    } else {
      tickets = localTickets;
    }
    const mlInsights = await getMlInsights(tickets);
    const averageRiskScore = tickets.length
      ? Math.round(tickets.reduce((sum, t) => sum + (t.riskScore || 0), 0) / tickets.length)
      : 0;

    res.json({
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      highPriority: tickets.filter(t => t.priority === 'High').length,
      highChurnRisk: tickets.filter(t => t.churnRisk === 'High').length,
      angry: tickets.filter(t => t.sentiment === 'Angry').length,
      escalations: tickets.filter(t => t.escalationRequired).length,
      averageRiskScore,
      mlInsights
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    let ticket;
    if (mongoose.connection.readyState === 1) {
      ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    } else {
      const idx = localTickets.findIndex(t => t._id === req.params.id);
      if (idx !== -1) {
        localTickets[idx] = { ...localTickets[idx], ...req.body, updatedAt: new Date().toISOString() };
        ticket = localTickets[idx];
        saveLocalTickets();
      }
    }
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update ticket', error: error.message });
  }
};

export const refreshReply = async (req, res) => {
  try {
    let ticket;
    if (mongoose.connection.readyState === 1) {
      ticket = await Ticket.findById(req.params.id);
    } else {
      ticket = localTickets.find(t => t._id === req.params.id);
    }
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    
    const reply = await generateReply(ticket);

    if (mongoose.connection.readyState === 1) {
      ticket.suggestedReply = reply;
      await ticket.save();
    } else {
      ticket.suggestedReply = reply;
      saveLocalTickets();
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate reply', error: error.message });
  }
};

