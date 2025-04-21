import { Request, Response } from "express";
import AppDataSource from "../config/db.config";
import { User } from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendVerificationEmail } from '../utils/nodemailer.utils';
import { IGetUserByIdParams, ILoginRequest, ISignupRequest, IUpdateUserParams, IVerificationToken, IVerifyToken, IUpdateUserBody, IResetPasswordRequest } from '../interface/user.interface';
import { fetchAllUser, findUserByEmail, findUserByEmailLogin, findUserByResetToken, findUserByToken, getUserByIdService, handleVerificationResend, registerUser, setResetTokenForUser, updatePassword, updateUserAfterVerification, updateUserService, } from "../service/user.service";

// Initialize repository for User model to interact with database
const userDB = AppDataSource.getRepository(User);


// Get all users from the database
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch all users using service layer
        const users = await fetchAllUser();

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {

        console.error('Get users error:', error);
        res.status(503).json({
            success: false,
            message: "Service temporarily unavailable"
        });
    }
};

// Handle user registration
export const signup = async (req: Request<{}, {}, ISignupRequest>, res: Response): Promise<void> => {
    // Extract user details from request body
    const { username, email, password } = req.body;
    try {
        // Register user using service layer, returns user and verification token
        const { user, verificationToken } = await registerUser({ username, email, password });

        // Send verification email to user
        await sendVerificationEmail(email, "Email verification", verificationToken);

        // Create JWT token for authentication
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: "2h" }
        );

        // Set JWT token in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000 // (2 hours)
        });

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        // Log error and return service unavailable response
        console.error('Signup error:', error);
        res.status(503).json({
            success: false,
            message: "Registration service temporarily unavailable"
        });
    }
};

// Handle user login
export const login = async (req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> => {
    // Extract login credentials from request body
    const { email, password } = req.body;
    try {
        // Attempt to find user with provided credentials
        const user = await findUserByEmailLogin(email);

        // Check if user exists
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User does not exists"
            });
            return;
        }

        // Verify password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
            return;
        }

        // Create JWT token for authenticated user
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: "2h" }
        );

        // Set JWT token in HTTP-only cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        // Log error and return service unavailable response
        console.error('Login error:', error);
        res.status(503).json({
            success: false,
            message: "Authentication service temporarily unavailable"
        });
    }
};

// Resend verification token to user
export const sendVerificationToken = async (req: Request<{}, {}, IVerificationToken>, res: Response): Promise<void> => {
    // Extract email from request body
    const { email } = req.body;
    try {
        // Check if user exists and can resend verification
        const user = await handleVerificationResend(email);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Check if user is blocked from resending
        if (user.resendBlockUntil && user.resendBlockUntil > new Date()) {
            res.status(429).json({
                success: false,
                message: `Too many verification attempts. Please try again after ${user.resendBlockUntil.toLocaleTimeString()}`
            });
            return;
        }

        // Generate 6-digit verification token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const expire = new Date(Date.now() + 2 * 60 * 1000);// 2 min

        // Implement resend limit logic
        if (user.resendCount >= 3) {
            user.resendBlockUntil = new Date(Date.now() + 10 * 60 * 1000);
            user.resendCount = 0;
        }

        // Update user with new token details
        user.verificationCode = verificationToken;
        user.verificationCodeExpire = expire;
        user.resendCount += 1;

        // Save updated user to database
        await userDB.save(user);

        // Send verification email
        await sendVerificationEmail(user.email, "Email verification", verificationToken);

        res.status(202).json({
            success: true,
            message: "Verification token processing"
        });
    } catch (error) {
        console.error('Verification token error:', error);
        res.status(503).json({
            success: false,
            message: "Verification service temporarily unavailable"
        });
    }
};

// Verify email verification token
export const verifyToken = async (req: Request<{}, {}, IVerifyToken>, res: Response): Promise<void> => {
    // Extract token from request body
    const { token } = req.body;
    try {
        // Find user by verification token
        const user = await findUserByToken(token);
        if (!user || !user.verificationCode || !user.verificationCodeExpire) {
            res.status(410).json({
                success: false,
                message: "Token no longer valid"
            });
            return;
        }

        // Validate token and its expiry
        if (user.verificationCode !== token || user.verificationCodeExpire < new Date()) {
            res.status(410).json({
                success: false,
                message: "Token no longer valid"
            });
            return;
        }

        // Update user verification status
        await updateUserAfterVerification(user);

        // Return success response
        res.status(200).json({
            success: true,
            message: "Email verified successfully"
        });
    } catch (error) {
        // Log error and return service unavailable response
        console.error('Token verification error:', error);
        res.status(503).json({
            success: false,
            message: "Verification service temporarily unavailable"
        });
    }
};

// Handle password reset request
export const forgotPassword = async (req: Request<{}, {}, IVerificationToken>, res: Response): Promise<void> => {
    // Extract email from request body
    const { email } = req.body;
    try {
        // Validate email 
        if (!email) {
            res.status(422).json({
                success: false,
                message: "Email is required"
            });
            return;
        }

        // Find user by email
        const user = await findUserByEmail(email);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Generate and set reset token
        const token = await setResetTokenForUser(user);

        // Send password reset email // 
        await sendVerificationEmail(user.email, "Reset Password", token);

        // Return accepted response for async processing
        res.status(202).json({
            success: true,
            message: "Password reset request processing",

        });
    } catch (error) {
        // Log error and return service unavailable response
        console.error('Forgot password error:', error);
        res.status(503).json({
            success: false,
            message: "Password reset service temporarily unavailable"
        });
    }
};

// Handle password reset with token
export const resetPassword = async (req: Request<{}, {}, IResetPasswordRequest>, res: Response): Promise<void> => {
    // Extract password details and token from request body
    const { newPass, confirmPass, token } = req.body;
    try {
        // Validate all required fields
        if (!newPass || !confirmPass || !token) {
            res.status(422).json({
                success: false,
                message: "All fields are required"
            });
            return;
        }

        // Verify passwords match
        if (newPass !== confirmPass) {
            res.status(422).json({
                success: false,
                message: "Passwords do not match"
            });
            return;
        }

        // Find user by reset token
        const user = await findUserByResetToken(token);
        if (!user) {
            res.status(410).json({
                success: false,
                message: "Reset token no longer valid"
            });
            return;
        }

        // Update user password
        await updatePassword(user, newPass);

        // Return success response
        res.status(200).json({
            success: true,
            message: "Password reset successfully"
        });
    } catch (error) {
        // Log error and return service unavailable response
        console.error('Reset password error:', error);
        res.status(503).json({
            success: false,
            message: "Password reset service temporarily unavailable"
        });
    }
};

// Get user by ID
export const getUserById = async (req: Request<IGetUserByIdParams>, res: Response): Promise<void> => {
    try {
        // Extract user ID from request parameters
        const { id } = req.params;

        // Fetch user using service layer
        const user = await getUserByIdService(id);

        // Check if user exists
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Return success response with user data
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        // Log error and return service unavailable response
        console.error('Get user by ID error:', error);
        res.status(503).json({
            success: false,
            message: "User service temporarily unavailable"
        });
    }
};

// Update user information
export const updateUser = async (req: Request<IUpdateUserParams, {}, IUpdateUserBody>, res: Response): Promise<void> => {
    try {
        // Extract user ID and update data from request
        const { id } = req.params;
        const updateData = req.body;

        // Update user using service layer
        const user = await updateUserService(id, updateData);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found"
            });
            return;
        }

        // Return success response with updated user data
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        // Log error and return service unavailable response
        console.error('Update user error:', error);
        res.status(503).json({
            success: false,
            message: "User update service temporarily unavailable"
        });
    }
};