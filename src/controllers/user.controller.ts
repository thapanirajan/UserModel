import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../utils/nodemailer.utils';
import { fetchAllUser, createUser, findUserByEmail, findUserByEmailLogin, findUserByResetToken, getUserByIdService, updateUserService, saveUser } from '../service/user.service';
import { ISignupRequest, ILoginRequest, IVerificationTokenRequest, IVerifyTokenRequest, IUserIdParams, IUpdateUserRequest, IResetPasswordRequest, IChangeEmailRequest, IVerifyEmailChangeRequest } from '../interface/user.interface';

// Utility function to generate a 6-digit token
const generateToken = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Utility function to hash a token
const hashToken = async (token: string): Promise<string> => {
    return await bcrypt.hash(token, 10);
};

// Get all users from the database
export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const users = await fetchAllUser();
        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(503).json({
            success: false,
            message: 'Service temporarily unavailable',
        });
    }
};

// Handle user registration
export const signup = async (req: Request<{}, {}, ISignupRequest>, res: Response): Promise<void> => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User already exists',
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = generateToken();
        const hashedToken = await hashToken(verificationToken);
        const expire = new Date(Date.now() + 2 * 60 * 1000); // 2 mins

        const user = await createUser({
            username,
            email,
            password: hashedPassword,
            verificationCode: hashedToken,
            verificationCodeExpire: expire,
        });

        await sendVerificationEmail(email, 'Email verification', verificationToken);

        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '2h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000,
        });

        res.status(201).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            token
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(503).json({
            success: false,
            message: 'Registration service temporarily unavailable',
        });
    }
};

// Handle user login
export const login = async (req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
        const user = await findUserByEmailLogin(email);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User does not exist',
            });
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
            return;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '2h' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 2 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(503).json({
            success: false,
            message: 'Authentication service temporarily unavailable',
        });
    }
};

// Resend verification token
export const sendVerificationToken = async (req: Request<{}, {}, IVerificationTokenRequest>, res: Response): Promise<void> => {
    const { email } = req.body;
    try {
        const user = await findUserByEmail(email);
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }

        const now = new Date();
        if (user.resendBlockUntil && user.resendBlockUntil > now) {
            const remainingSeconds = Math.ceil((user.resendBlockUntil.getTime() - now.getTime()) / 1000);
            const remainingMinutes = Math.ceil(remainingSeconds / 60);
            res.status(429).json({
                success: false,
                message: `Too many verification attempts. Please try again in ${remainingMinutes} minute(s).`,
            });
            return;
        }

        if (user.resendCount >= 3) {
            user.resendCount = 0;
            user.resendBlockUntil = null;
        }

        const verificationToken = generateToken();
        const hashedToken = await hashToken(verificationToken);
        const expire = new Date(Date.now() + 2 * 60 * 1000);

        user.verificationCode = hashedToken;
        user.verificationCodeExpire = expire;
        user.resendCount += 1;
        if (user.resendCount >= 3) {
            user.resendBlockUntil = new Date(Date.now() + 10 * 60 * 1000);
        }

        await saveUser(user);
        await sendVerificationEmail(user.email, 'Email verification', verificationToken);

        res.status(202).json({
            success: true,
            message: 'Verification token processing',
        });
    } catch (error) {
        console.error('Verification token error:', error);
        res.status(503).json({
            success: false,
            message: 'Verification service temporarily unavailable',
        });
    }
};

// Verify email verification token
export const verifyToken = async (req: Request<{}, {}, IVerifyTokenRequest>, res: Response): Promise<void> => {
    const { email, token } = req.body;
    try {
        const user = await findUserByEmail(email);
        if (!user || !user.verificationCode || !user.verificationCodeExpire) {
            res.status(410).json({
                success: false,
                message: 'Token no longer valid',
            });
            return;
        }

        if (user.verificationCodeExpire < new Date()) {
            res.status(410).json({
                success: false,
                message: 'Token expired',
            });
            return;
        }

        const isMatch = await bcrypt.compare(token, user.verificationCode);
        if (!isMatch) {
            res.status(400).json({
                success: false,
                message: 'Invalid token',
            });
            return;
        }

        user.verificationCode = null;
        user.verificationCodeExpire = null;
        user.resendCount = 0;
        user.resendBlockUntil = null;
        user.isVerified = true;
        await saveUser(user);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully',
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(503).json({
            success: false,
            message: 'Verification service temporarily unavailable',
        });
    }
};

// Handle password reset request
export const forgotPassword = async (req: Request<{}, {}, IVerificationTokenRequest>, res: Response): Promise<void> => {
    const { email } = req.body;
    try {
        if (!email) {
            res.status(422).json({
                success: false,
                message: 'Email is required',
            });
            return;
        }

        const user = await findUserByEmail(email);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        const token = generateToken();
        const tokenExpire = new Date(Date.now() + 2 * 60 * 1000);

        user.resetToken = token;
        user.resetTokenExpire = tokenExpire;
        await saveUser(user);

        await sendVerificationEmail(user.email, 'Reset Password', token);

        res.status(202).json({
            success: true,
            message: 'Password reset request processing',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(503).json({
            success: false,
            message: 'Password reset service temporarily unavailable',
        });
    }
};

// Handle password reset with token
export const resetPassword = async (req: Request<{}, {}, IResetPasswordRequest>, res: Response): Promise<void> => {
    const { newPass, confirmPass, token } = req.body;
    try {
        if (!newPass || !confirmPass || !token) {
            res.status(422).json({
                success: false,
                message: 'All fields are required',
            });
            return;
        }

        if (newPass !== confirmPass) {
            res.status(422).json({
                success: false,
                message: 'Passwords do not match',
            });
            return;
        }

        const user = await findUserByResetToken(token);
        if (!user) {
            res.status(410).json({
                success: false,
                message: 'Reset token no longer valid',
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPass, 10);
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpire = null;
        await saveUser(user);

        res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(503).json({
            success: false,
            message: 'Password reset service temporarily unavailable',
        });
    }
};

// Get user by ID
export const getUserById = async (req: Request<IUserIdParams>, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = await getUserByIdService(id);

        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(503).json({
            success: false,
            message: 'User service temporarily unavailable',
        });
    }
};

// Update user information
export const updateUser = async (req: Request<IUserIdParams, {}, IUpdateUserRequest>, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const user = await updateUserService(id, updateData);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user,
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(503).json({
            success: false,
            message: 'User update service temporarily unavailable',
        });
    }
};


// Change email
export const updateEmail = async (req: Request<{}, {}, IChangeEmailRequest>, res: Response): Promise<void> => {
    try {
        const { newEmail } = req.body;
        const user = req.user;
        console.log(user);

        if (!user) {
            res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
            return;
        }

        if (!newEmail) {
            res.status(422).json({ success: false, message: 'New email is required.' });
            return;
        }

        const existingUser = await findUserByEmail(newEmail);
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Email already in use.' });
            return;
        }

        const verificationToken = generateToken();
        const hashedToken = await hashToken(verificationToken);
        const expire = new Date(Date.now() + 2 * 60 * 1000);

        const emailChangeToken = jwt.sign(
            { userId: user.id, newEmail },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '2m' }
        );

        user.verificationCode = hashedToken;
        user.verificationCodeExpire = expire;
        await saveUser(user);

        await sendVerificationEmail(newEmail, 'Verify new email', verificationToken);

        res.status(202).json({
            success: true,
            message: 'Verification email sent to new email address.',
            emailChangeToken,
        });
    } catch (error) {
        console.error('Change email error:', error);
        res.status(503).json({
            success: false,
            message: 'Email change service temporarily unavailable.',
        });
    }
};

// Verify email change
export const verifyEmailChangeController = async (req: Request<{}, {}, IVerifyEmailChangeRequest & { emailChangeToken: string }>, res: Response): Promise<void> => {
    try {
        const { token, emailChangeToken } = req.body;
        const user = req.user;

        if (!user) {
            res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
            return;
        }

        if (!token || !emailChangeToken) {
            res.status(422).json({ success: false, message: 'Token and email change token are required.' });
            return;
        }

        if (!user.verificationCode || !user.verificationCodeExpire) {
            res.status(410).json({ success: false, message: 'No email change request found.' });
            return;
        }

        if (user.verificationCodeExpire < new Date()) {
            res.status(410).json({ success: false, message: 'Token expired.' });
            return;
        }

        const isMatch = await bcrypt.compare(token, user.verificationCode);
        if (!isMatch) {
            res.status(400).json({ success: false, message: 'Invalid token.' });
            return;
        }

        let decoded: { userId: number; newEmail: string };
        try {
            decoded = jwt.verify(emailChangeToken, process.env.JWT_SECRET || 'your_jwt_secret') as {
                userId: number;
                newEmail: string;
            };
        } catch (error) {
            res.status(400).json({ success: false, message: 'Invalid or expired email change token.' });
            return;
        }

        if (decoded.userId !== user.id) {
            res.status(400).json({ success: false, message: 'Invalid token: User mismatch.' });
            return;
        }

        const existingUser = await findUserByEmail(decoded.newEmail);
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Email already in use.' });
            return;
        }

        user.email = decoded.newEmail;
        user.verificationCode = null;
        user.verificationCodeExpire = null;
        await saveUser(user);

        res.status(200).json({
            success: true,
            message: 'Email updated successfully.',
        });
    } catch (error) {
        console.error('Verify email change error:', error);
        res.status(503).json({
            success: false,
            message: 'Email verification service temporarily unavailable.',
        });
    }
};