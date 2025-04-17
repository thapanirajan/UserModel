import { NextFunction, Request, Response } from "express";
import { z } from "zod";

export const signupSchema = z.object({
    email: z.
        string().
        email({ message: "Invalid email format" }),
    password: z
        .string()
        .min(5, { message: "Password must be at least 5 characters long" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" }),
});

export const validateSignup = (req: Request, res: Response, next: NextFunction) => {
    try {
        signupSchema.parse(req.body);
        next();
    } catch (error) {
        res.status(400).json({
            message: "Validation failed",
            errors: error.errors
        })
    }
}

export const loginSchema = z.object({
    loginInput: z.
        string(), // email or username 
    password: z
        .string()
        .min(5, { message: "Password must be at least 5 characters long" })
        .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
        .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
        .regex(/[0-9]/, { message: "Password must contain at least one number" })
        .regex(/[!@#$%^&*(),.?":{}|<>]/, { message: "Password must contain at least one special character" }),
})

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    try {
        loginSchema.parse(req.body);
        next();
    } catch (error) {
        res.status(400).json({
            message: "Validation failed",
            errors: error.errors
        })
    }
}