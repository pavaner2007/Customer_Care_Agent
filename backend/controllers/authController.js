import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

const adminsFile = path.resolve('admins.json');

const loadLocalAdmins = () => {
  try {
    if (fs.existsSync(adminsFile)) {
      return JSON.parse(fs.readFileSync(adminsFile, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load local admins:', err.message);
  }
  return [];
};

const saveLocalAdmins = (admins) => {
  try {
    fs.writeFileSync(adminsFile, JSON.stringify(admins, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save local admins:', err.message);
  }
};

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'super_secret_key_for_hackathon_demo',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (mongoose.connection.readyState === 1) {
      // MongoDB Mode
      const exists = await Admin.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: 'Admin email already registered' });
      }

      const admin = await Admin.create({
        name,
        email,
        password: hashedPassword
      });

      res.status(201).json({
        token: generateToken(admin._id),
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role
        }
      });
    } else {
      // JSON Database Fallback Mode
      const admins = loadLocalAdmins();
      const exists = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ message: 'Admin email already registered' });
      }

      const newAdmin = {
        _id: 'admin_' + Math.random().toString(36).substring(2, 11),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      admins.push(newAdmin);
      saveLocalAdmins(admins);

      res.status(201).json({
        token: generateToken(newAdmin._id),
        admin: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role
        }
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server registration error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    let admin;
    if (mongoose.connection.readyState === 1) {
      admin = await Admin.findOne({ email });
    } else {
      const admins = loadLocalAdmins();
      admin = admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    }

    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(admin._id || admin.id),
      admin: {
        id: admin._id || admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role || 'admin'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server login error', error: error.message });
  }
};

export const me = async (req, res) => {
  try {
    res.json({ admin: req.admin });
  } catch (error) {
    res.status(500).json({ message: 'Server fetch profile error', error: error.message });
  }
};
