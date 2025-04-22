import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AppDataSource from "../config/db.config";
import { User } from "../models/user.model";

// Extend Request interface to include user
interface AuthRequest extends Request {
    user?: User;
}

// Initialize user repository
const userDB = AppDataSource.getRepository(User);

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Extract token from cookie or Authorization header
        const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);

        // Check if token exists
        if (!token) {
            res.status(401).json({ success: false, message: "No token provided. Please log in." });
            return;
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret") as {
            id: number;
            email: string;
            username?: string;
        };

        // Find user in database
        const user = await userDB.findOneBy({ id: decoded.id });
        if (!user) {
            res.status(401).json({ success: false, message: "User not found. Please log in again." });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ success: false, message: "Invalid or expired token. Please log in." });
    }
};