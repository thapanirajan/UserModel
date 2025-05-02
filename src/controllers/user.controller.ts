import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validate } from 'class-validator';
import { sendVerificationEmail } from '../utils/nodemailer.utils';
import { fetchAllUser, createUser, findUserByEmail, findUserByEmailLogin, findUserByResetToken, getUserByIdService, updateUserService, saveUser } from '../service/user.service';
import { ISignupRequest, ILoginRequest, IVerificationTokenRequest, IVerifyTokenRequest, IResetPasswordRequest, IChangeEmailRequest, IVerifyEmailChangeRequest, IUpdateUserRequest } from '../interface/user.interface';
import { SignupDTO, LoginDTO, VerificationTokenDTO, VerifyTokenDTO, ResetPasswordDTO, ChangeEmailDTO, VerifyEmailChangeDTO } from '../dtos/user.dto';
import { APIError } from '../utils/ApiError.utils';

// Utility functions for token management
class TokenUtils {
    static generateToken(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    static async hashToken(token: string): Promise<string> {
        return await bcrypt.hash(token, 10);
    }
}

export class UserController {
    private readonly jwtSecret: string;

    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
    }

    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const users = await fetchAllUser();
            res.status(200).json({ success: true, data: users });
        } catch (error) {
            throw new APIError(503, 'Service temporarily unavailable');
        }
    }

    async signup(req: Request<{}, {}, ISignupRequest>, res: Response): Promise<void> {
        const dto = new SignupDTO();
        Object.assign(dto, req.body); // username, email, password

        // Validates given object.
        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        const { username, email, password, role } = dto;
        try {
            const existingUser = await findUserByEmail(email);
            if (existingUser) {
                throw new APIError(409, 'User already exists');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const verificationToken = TokenUtils.generateToken();
            const hashedToken = await TokenUtils.hashToken(verificationToken);
            const expire = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

            const user = await createUser({
                username,
                email,
                password: hashedPassword,
                verificationCode: hashedToken,
                verificationCodeExpire: expire,
                role: role
            });

            await sendVerificationEmail(email, 'Email Verification', verificationToken);

            const token = jwt.sign(
                { id: user.id, email: user.email, username: user.username },
                this.jwtSecret,
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
                user: { id: user.id, username: user.username, email: user.email },
                token,
            });
        } catch (error) {
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'Registration service temporarily unavailable');
            }
        }
    }

    async login(req: Request<{}, {}, ILoginRequest>, res: Response): Promise<void> {
        const dto = new LoginDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        const { email, password } = dto;
        try {
            const user = await findUserByEmailLogin(email);
            if (!user) {
                throw new APIError(401, 'User does not exist');
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new APIError(401, 'Invalid credentials');
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                this.jwtSecret,
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
                user: { id: user.id, email: user.email },
            });
        } catch (error) {
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'Authentication service temporarily unavailable');
            }
        }
    }

    async sendVerificationToken(req: Request<{}, {}, IVerificationTokenRequest>, res: Response): Promise<void> {
        const dto = new VerificationTokenDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        const { email } = dto;
        try {
            const user = await findUserByEmail(email);
            if (!user) {
                throw new APIError(404, 'User not found');
            }

            const now = new Date();
            if (user.resendBlockUntil && user.resendBlockUntil > now) {
                const remainingSeconds = Math.ceil((user.resendBlockUntil.getTime() - now.getTime()) / 1000);
                const remainingMinutes = Math.ceil(remainingSeconds / 60);
                throw new APIError(429, `Too many verification attempts. Please try again in ${remainingMinutes} minute(s).`);
            }

            if (user.resendCount >= 3) {
                user.resendCount = 0;
                user.resendBlockUntil = null;
            }

            const verificationToken = TokenUtils.generateToken();
            const hashedToken = await TokenUtils.hashToken(verificationToken);
            const expire = new Date(Date.now() + 15 * 60 * 1000);

            user.verificationCode = hashedToken;
            user.verificationCodeExpire = expire;
            user.resendCount += 1;
            if (user.resendCount >= 3) {
                user.resendBlockUntil = new Date(Date.now() + 10 * 60 * 1000);
            }

            await saveUser(user);
            await sendVerificationEmail(user.email, 'Email Verification', verificationToken);

            res.status(202).json({
                success: true,
                message: 'Verification token sent',
            });
        } catch (error) {
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'Verification service temporarily unavailable');
            }
        }
    }

    async verifyToken(req: Request<{}, {}, IVerifyTokenRequest>, res: Response): Promise<void> {
        const dto = new VerifyTokenDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        const { email, token } = dto;
        try {
            const user = await findUserByEmail(email);
            if (!user || !user.verificationCode || !user.verificationCodeExpire) {
                throw new APIError(410, 'Token no longer valid');
            }

            if (user.verificationCodeExpire < new Date()) {
                throw new APIError(410, 'Token expired');
            }

            const isMatch = await bcrypt.compare(token, user.verificationCode);
            if (!isMatch) {
                throw new APIError(400, 'Invalid token');
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
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'Verification service temporarily unavailable');
            }
        }
    }

    async forgotPassword(req: Request<{}, {}, IVerificationTokenRequest>, res: Response): Promise<void> {
        const dto = new VerificationTokenDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        const { email } = dto;
        try {
            const user = await findUserByEmail(email);
            if (!user) {
                throw new APIError(404, 'User not found');
            }

            const token = TokenUtils.generateToken();
            const tokenExpire = new Date(Date.now() + 15 * 60 * 1000);

            user.resetToken = token;
            user.resetTokenExpire = tokenExpire;
            await saveUser(user);

            await sendVerificationEmail(user.email, 'Reset Password', token);

            res.status(202).json({
                success: true,
                message: 'Password reset request sent',
            });
        } catch (error) {
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'Password reset service temporarily unavailable');
            }
        }
    }

    async resetPassword(req: Request<{}, {}, IResetPasswordRequest>, res: Response): Promise<void> {
        const dto = new ResetPasswordDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        const { newPass, confirmPass, token } = dto;
        try {
            if (newPass !== confirmPass) {
                throw new APIError(422, 'Passwords do not match');
            }

            const user = await findUserByResetToken(token);
            if (!user) {
                throw new APIError(410, 'Reset token no longer valid');
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
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'Password reset service temporarily unavailable');
            }
        }
    }

    async getUserById(req: Request<{ id: string }>, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                throw new APIError(400, 'Invalid user ID');
            }

            const user = await getUserByIdService(id);
            if (!user) {
                throw new APIError(404, 'User not found');
            }

            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (error) {
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'User service temporarily unavailable');
            }
        }
    }

    async updateUser(req: Request<{ id: string }, {}, IUpdateUserRequest>, res: Response): Promise<void> {
        try {
            const id = parseInt(req.params.id, 10);
            if (isNaN(id)) {
                throw new APIError(400, 'Invalid user ID');
            }

            // Restrict role changes to admins
            if (req.body.role && req.user?.role !== 'admin') {
                throw new APIError(403, 'Only admins can change roles');
            }

            const updateData = req.body;
            const user = await updateUserService(id, updateData);
            if (!user) {
                throw new APIError(404, 'User not found');
            }

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: { id: user.id, username: user.username, email: user.email, role: user.role },
            });
        } catch (error) {
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'User update service temporarily unavailable');
            }
        }
    }

    
    async updateEmail(req: Request<{}, {}, IChangeEmailRequest>, res: Response): Promise<void> {
        const dto = new ChangeEmailDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        const { newEmail } = dto;
        try {
            const user = req.user;
            if (!user) {
                throw new APIError(401, 'Unauthorized. Please log in.');
            }

            const existingUser = await findUserByEmail(newEmail);
            if (existingUser) {
                throw new APIError(409, 'Email already in use.');
            }

            const verificationToken = TokenUtils.generateToken();
            const hashedToken = await TokenUtils.hashToken(verificationToken);
            const expire = new Date(Date.now() + 15 * 60 * 1000);

            const emailChangeToken = jwt.sign(
                { userId: user.id, newEmail },
                this.jwtSecret,
                { expiresIn: '15m' }
            );

            user.verificationCode = hashedToken;
            user.verificationCodeExpire = expire;
            await saveUser(user);

            await sendVerificationEmail(newEmail, 'Verify New Email', verificationToken);

            res.status(202).json({
                success: true,
                message: 'Verification email sent to new email address.',
                emailChangeToken,
            });
        } catch (error) {
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'Email change service temporarily unavailable');
            }
        }
    }

    async verifyEmailChange(req: Request<{}, {}, IVerifyEmailChangeRequest & { emailChangeToken: string }>, res: Response): Promise<void> {
        const dto = new VerifyEmailChangeDTO();
        Object.assign(dto, req.body);

        const errors = await validate(dto);
        if (errors.length > 0) {
            res.status(400).json({ success: false, errors });
            return;
        }

        const { token, emailChangeToken } = dto;
        try {
            const user = req.user;
            if (!user) {
                throw new APIError(401, 'Unauthorized. Please log in.');
            }

            if (!user.verificationCode || !user.verificationCodeExpire) {
                throw new APIError(410, 'No email change request found.');
            }

            if (user.verificationCodeExpire < new Date()) {
                throw new APIError(410, 'Token expired.');
            }

            const isMatch = await bcrypt.compare(token, user.verificationCode);
            if (!isMatch) {
                throw new APIError(400, 'Invalid token.');
            }

            let decoded: { userId: number; newEmail: string };
            try {
                decoded = jwt.verify(emailChangeToken, this.jwtSecret) as {
                    userId: number;
                    newEmail: string;
                };
            } catch (error) {
                throw new APIError(400, 'Invalid or expired email change token.');
            }

            if (decoded.userId !== user.id) {
                throw new APIError(400, 'Invalid token: User mismatch.');
            }

            const existingUser = await findUserByEmail(decoded.newEmail);
            if (existingUser) {
                throw new APIError(409, 'Email already in use.');
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
            if (error instanceof APIError) {
                res.status(error.status).json({ success: false, message: error.message });
            } else {
                throw new APIError(503, 'Email verification service temporarily unavailable');
            }
        }
    }
}