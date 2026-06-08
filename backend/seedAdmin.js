import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import Admin from './models/Admin.js';

dotenv.config();

const adminsFile = path.resolve('admins.json');

const seed = async () => {
  const name = 'CareMind Admin';
  const email = 'admin@caremind.ai';
  const password = 'Admin@123';

  console.log('Starting Admin Seeding...');

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 1. Seed to local JSON DB fallback (always do this to ensure offline works)
  try {
    let localAdmins = [];
    if (fs.existsSync(adminsFile)) {
      localAdmins = JSON.parse(fs.readFileSync(adminsFile, 'utf8'));
    }

    const existsLocally = localAdmins.some(a => a.email.toLowerCase() === email.toLowerCase());
    if (!existsLocally) {
      localAdmins.push({
        _id: 'admin_demo_seed',
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      fs.writeFileSync(adminsFile, JSON.stringify(localAdmins, null, 2), 'utf8');
      console.log('Seeded admin successfully to local JSON fallback database (admins.json).');
    } else {
      console.log('Admin already exists in local JSON fallback database.');
    }
  } catch (err) {
    console.error('Failed seeding to local JSON:', err.message);
  }

  // 2. Seed to MongoDB (if running/configured)
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/caremind-ai';
    console.log(`Connecting to MongoDB at: ${mongoUri}...`);
    
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log('MongoDB connected successfully for seeding.');

    const existsMongo = await Admin.findOne({ email });
    if (!existsMongo) {
      await Admin.create({
        name,
        email,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Seeded admin successfully to MongoDB.');
    } else {
      console.log('Admin already exists in MongoDB.');
    }
  } catch (err) {
    console.warn(`MongoDB seeding bypassed/failed (OK if using JSON fallback): ${err.message}`);
  } finally {
    await mongoose.disconnect();
    console.log('Seeding process complete.');
    process.exit(0);
  }
};

seed();
