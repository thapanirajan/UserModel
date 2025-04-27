

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import AppDataSource from '../config/db.config';

interface AuthRequest extends Request {
    user?: User;
}

// Initialize user repository
const userDB = AppDataSource.getRepository(User);

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as {
            id: number;
            email: string;
            username?: string;
        };

        const user = await userDB.findOneBy({ id: decoded.id });
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found. Please log in again.' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ success: false, message: 'Invalid or expired token. Please log in.' });
    }
};

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'No token provided' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as { id: number; role: string };
        if (decoded.role !== 'admin') {
            res.status(403).json({ message: 'Admin access required' });
            return;
        }

        const user = await userDB.findOne({ where: { id: decoded.id } });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};