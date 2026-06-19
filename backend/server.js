import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ticketRoutes from './routes/ticketRoutes.js';
import authRoutes from './routes/authRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_URL || '*').split(',').map(s => s.trim());
    if (allowed.includes('*') || !origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ message: 'CareMind AI backend is running' }));
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/caremind-ai', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.warn('MongoDB connection failed (falling back to local JSON database):', error.message);
  }
};

connectDB();
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

