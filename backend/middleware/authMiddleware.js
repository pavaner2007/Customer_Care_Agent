import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

const adminsFile = path.resolve('admins.json');

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_key_for_hackathon_demo');

      // Get user from active database (MongoDB or local JSON fallback)
      if (mongoose.connection.readyState === 1) {
        req.admin = await Admin.findById(decoded.id).select('-password');
      } else {
        if (fs.existsSync(adminsFile)) {
          const admins = JSON.parse(fs.readFileSync(adminsFile, 'utf8'));
          const found = admins.find(a => a._id === decoded.id);
          if (found) {
            const { password, ...adminWithoutPassword } = found;
            req.admin = adminWithoutPassword;
          }
        }
      }

      if (!req.admin) {
        return res.status(401).json({ message: 'Not authorized, admin not found' });
      }

      next();
    } catch (error) {
      console.error('Auth verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};
