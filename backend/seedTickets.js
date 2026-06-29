import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Ticket from './models/Ticket.js';

dotenv.config();

const ticketsFile = path.resolve('tickets.json');

const demoTickets = [
  {
    customerName: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    message: 'I bought your premium software subscription but it is charging me twice. I need a refund immediately. This is ridiculous, if I don\'t get my money back today I am reporting you to my bank and cancelling my account.',
    category: 'Refund',
    sentiment: 'Angry',
    priority: 'High',
    churnRisk: 'High',
    riskScore: 92,
    summary: 'Customer charged twice for premium software subscription and demands immediate refund under threat of bank report and account cancellation.',
    suggestedReply: 'Dear Sarah, we sincerely apologize for the double charge error. We have processed a full refund for the duplicate transaction, which should reflect in your account within 3 days. Your account remains active with premium status as a gesture of goodwill.',
    recommendedAction: 'Issue immediate refund, call customer to apologize, and flag account for priority service.',
    mlConfidence: 0.94,
    slaHours: 4,
    escalationRequired: true,
    escalationReason: 'High churn risk angry customer demanding refund and threatening escalation.',
    status: 'Open',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
  },
  {
    customerName: 'Michael Chen',
    email: 'michael.chen@example.com',
    message: 'Hi, I ordered the product five days ago and the tracking code says it hasn\'t shipped yet. Can you check on my delivery status?',
    category: 'Delivery',
    sentiment: 'Neutral',
    priority: 'Medium',
    churnRisk: 'Medium',
    riskScore: 45,
    summary: 'Customer inquiring about tracking status of product ordered five days ago.',
    suggestedReply: 'Dear Michael, thank you for reaching out. We had a minor delay in our shipping hub, but your order has now been dispatched. Here is your tracking link: https://tracking.example.com/12345.',
    recommendedAction: 'Check dispatch status and provide tracking link.',
    mlConfidence: 0.88,
    slaHours: 24,
    escalationRequired: false,
    status: 'Open',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString() // 12 hours ago
  },
  {
    customerName: 'Amira Patel',
    email: 'amira.patel@example.com',
    message: 'My credit card transaction failed three times during checkout, but my bank statement shows the funds are pending. Please let me know why this keeps failing.',
    category: 'Payment',
    sentiment: 'Frustrated',
    priority: 'High',
    churnRisk: 'Medium',
    riskScore: 60,
    summary: 'Customer experiencing payment failures on checkout with pending charges on bank statement.',
    suggestedReply: 'Dear Amira, we apologize for the checkout issues. The pending charges are temporary hold authorizations and will be dropped automatically by your bank. Please try checkout using another card or PayPal.',
    recommendedAction: 'Validate transaction logs on payment gateway and assist with alternative payment options.',
    mlConfidence: 0.91,
    slaHours: 12,
    escalationRequired: false,
    status: 'Open',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString() // 6 hours ago
  },
  {
    customerName: 'John Doe',
    email: 'john.doe@example.com',
    message: 'The item arrived completely shattered inside the box. The packaging was horrible. I paid full price for a broken item. Refund my money or send a new one right now!',
    category: 'Product',
    sentiment: 'Angry',
    priority: 'High',
    churnRisk: 'High',
    riskScore: 88,
    summary: 'Customer received a broken item due to poor packaging and demands a refund or replacement.',
    suggestedReply: 'Dear John, we are extremely sorry for the damaged product. We have processed a free replacement order shipping today via express courier. You do not need to return the broken item.',
    recommendedAction: 'Process replacement shipment and send express tracking info to customer.',
    mlConfidence: 0.93,
    slaHours: 4,
    escalationRequired: true,
    escalationReason: 'Damaged physical item and angry customer demanding replacement.',
    status: 'Open',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString() // 1 hour ago
  },
  {
    customerName: 'Liam Gallagher',
    email: 'liam.g@example.com',
    message: 'I tried calling support this morning but was on hold for over 30 minutes. Just wanted to let you know.',
    category: 'Service',
    sentiment: 'Neutral',
    priority: 'Low',
    churnRisk: 'Low',
    riskScore: 25,
    summary: 'Customer feedback concerning long support phone queue wait times.',
    suggestedReply: 'Dear Liam, thank you for sharing your feedback. We are currently experiencing higher call volumes than usual and are adding more agents to reduce wait times.',
    recommendedAction: 'Log wait time feedback and send follow up email.',
    mlConfidence: 0.85,
    slaHours: 48,
    escalationRequired: false,
    status: 'Open',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString() // 1 day ago
  },
  {
    customerName: 'Elena Rostova',
    email: 'elena.r@example.com',
    message: 'The main login portal is returning a 500 error every time I try to access my business dashboard. This is blocking our daily operations. Please escalate this and resolve it asap.',
    category: 'Technical',
    sentiment: 'Frustrated',
    priority: 'High',
    churnRisk: 'High',
    riskScore: 85,
    summary: 'Customer encountering 500 internal server errors on dashboard login blocking operations.',
    suggestedReply: 'Dear Elena, we apologize for this technical block. Our dev operations team has resolved the underlying server issue. Please clear your cache and try logging in again.',
    recommendedAction: 'Verify backend logs for dashboard route and escalate to engineering team.',
    mlConfidence: 0.95,
    slaHours: 2,
    escalationRequired: true,
    escalationReason: 'Technical portal outage blocking business operations.',
    status: 'In Progress',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
  },
  {
    customerName: 'David Miller',
    email: 'david.miller@example.com',
    message: 'Thank you for the quick response. I just wanted to verify my billing cycle start date. Great service!',
    category: 'General',
    sentiment: 'Positive',
    priority: 'Low',
    churnRisk: 'Low',
    riskScore: 10,
    summary: 'Customer checking billing cycle start date with positive feedback.',
    suggestedReply: 'Dear David, we are glad to help! Your billing cycle starts on the 1st of every month. Let us know if you need anything else.',
    recommendedAction: 'Provide billing cycle info and close ticket.',
    mlConfidence: 0.96,
    slaHours: 24,
    escalationRequired: false,
    status: 'Resolved',
    csatRating: 5,
    csatFeedback: 'Excellent and very fast support!',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString() // 2 days ago
  },
  {
    customerName: 'Sophia Wang',
    email: 'sophia.w@example.com',
    message: 'Hello, do you support international shipping to Singapore? I couldn\'t find the list of countries on your FAQ page.',
    category: 'General',
    sentiment: 'Neutral',
    priority: 'Low',
    churnRisk: 'Low',
    riskScore: 15,
    summary: 'Customer inquiring about international shipping support to Singapore.',
    suggestedReply: 'Dear Sophia, yes, we ship internationally to Singapore! Average delivery takes 5-7 business days. You can select your country during checkout.',
    recommendedAction: 'Confirm international shipping support and close ticket.',
    mlConfidence: 0.90,
    slaHours: 24,
    escalationRequired: false,
    status: 'Resolved',
    csatRating: 4,
    csatFeedback: 'Simple request handled correctly.',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString() // 3 days ago
  }
];

const seedTickets = async () => {
  console.log('Starting Ticket Seeding...');

  // 1. Seed to local JSON DB fallback (always do this to ensure offline works)
  try {
    const demoTicketsWithId = demoTickets.map(t => ({
      _id: 'local_' + Math.random().toString(36).substring(2, 11),
      ...t
    }));
    // Clear and overwrite to avoid duplicates on re-seeding
    fs.writeFileSync(ticketsFile, JSON.stringify(demoTicketsWithId, null, 2), 'utf8');
    console.log('Seeded 8 tickets successfully to local JSON fallback database (tickets.json).');
  } catch (err) {
    console.error('Failed seeding to local JSON:', err.message);
  }

  // 2. Seed to MongoDB (if running/configured)
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/caremind-ai';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected successfully for ticket seeding.');

    // Clear existing tickets and seed fresh ones
    await Ticket.deleteMany({});
    await Ticket.insertMany(demoTickets);
    console.log('Seeded 8 tickets successfully to MongoDB.');
  } catch (err) {
    console.warn(`MongoDB ticket seeding bypassed/failed (OK if using JSON fallback): ${err.message}`);
  } finally {
    await mongoose.disconnect();
    console.log('Ticket seeding complete.');
    process.exit(0);
  }
};

seedTickets();
