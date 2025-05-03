

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../entities/user.entity';
import AppDataSource from '../config/db.config';
import { Product } from '../entities/product.entity';

export interface AuthRequest<P = {}, ResBody = {}, ReqBody = {}, ReqQuery = {}> extends Request<P, ResBody, ReqBody, ReqQuery> {
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


export const isVendor = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user?.role !== UserRole.VENDOR) {
        res.status(403).json({ success: true, message: 'Vendor access required' })
        return;
    }
    next();
}

export const restrictToVendorOrAdmin = async (req: AuthRequest<{ id: number }>, res: Response, next: Function): Promise<void> => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }

    if (user.role === UserRole.ADMIN) {
        return next(); // Admins can delete any product/image
    }

    if (user.role !== UserRole.VENDOR) {
        res.status(403).json({ success: false, message: 'Vendor or admin access required' });
        return;
    }

    // For vendors, check if they own the product
    const productId = req.params.id;
    const product = await AppDataSource.getRepository(Product).findOne({
        where: { id: productId, vendor: { id: user.id } },
    });

    if (!product) {
        res.status(403).json({ success: false, message: 'You can only delete your own products' });
        return;
    }

    next();
};