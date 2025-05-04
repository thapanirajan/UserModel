import { Router, Request, Response } from 'express';
import { validate } from 'class-validator';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, isAdmin, validateZod } from '../middlewares/auth.middleware';
import { changeEmailSchema, loginSchema, resetPasswordSchema, signupSchema, verificationTokenSchema, verifyEmailChangeSchema, verifyTokenSchema } from '../utils/zod_validations/user.zod';


const userRouter = Router();
const userController = new UserController();

// Rate limiter for sensitive endpoints
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: 'Too many requests, please try again later.',
});



/**
 * @route GET /api/auth/users
 * @desc Get all users (admin only)
 * @access Private (Admin)
 */

// userRouter.get('/users', authMiddleware, isAdmin, controller.getUsers.bind(controller));
userRouter.get('/users', isAdmin, authMiddleware, userController.getUsers.bind(userController));

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
userRouter.post('/signup', validateZod(signupSchema), userController.signup.bind(userController));

/**
 * @route POST /api/auth/verify/resend
 * @desc Resend email verification token
 * @access Public
 */
userRouter.post('/verify/resend', authRateLimiter, validateZod(verificationTokenSchema), userController.sendVerificationToken.bind(userController));

/**
 * @route POST /api/auth/verify
 * @desc Verify email verification token
 * @access Public
 */
userRouter.post('/verify', validateZod(verifyTokenSchema), userController.verifyToken.bind(userController));

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT
 * @access Public
 */
userRouter.post('/login', validateZod(loginSchema), userController.login.bind(userController));

/**
 * @route GET /api/auth/google
 * @desc Initiate Google OAuth login
 * @access Public
 */
userRouter.get('/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

/**
 * @route GET /api/auth/google/callback
 * @desc Google OAuth callback
 * @access Public
 */
userRouter.get('/google/callback', passport.authenticate('google', { session: false }), (req: any, res: Response) => {
    const { token } = req.user;
    // Redirect to frontend with token or return token in response
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

/**
 * @route GET /api/auth/facebook
 * @desc Initiate Facebook OAuth login
 * @access Public
 */
userRouter.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'] }));

/**
 * @route GET /api/auth/facebook/callback
 * @desc Facebook OAuth callback
 * @access Public
 */
userRouter.get('/facebook/callback', passport.authenticate('facebook', { session: false }), (req: any, res: Response) => {
    const { token } = req.user;
    // Redirect to frontend with token or return token in response
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
userRouter.post('/forgot-password', authRateLimiter, validateZod(verificationTokenSchema), userController.forgotPassword.bind(userController));

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
userRouter.post('/reset-password', authRateLimiter, validateZod(resetPasswordSchema), userController.resetPassword.bind(userController));

/**
 * @route GET /api/auth/users/:id
 * @desc Get user by ID
 * @access Private
 */
userRouter.get('/users/:id', authMiddleware, userController.getUserById.bind(userController));

/**
 * @route PUT /api/auth/users/:id
 * @desc Update user information
 * @access Private
 */
userRouter.put('/users/:id', authMiddleware, userController.updateUser.bind(userController));

/**
 * @route PATCH /api/auth/change-email
 * @desc Request email change
 * @access Private
 */
userRouter.patch('/change-email', authMiddleware, validateZod(changeEmailSchema), userController.updateEmail.bind(userController));

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email change
 * @access Private
 */
userRouter.post('/verify-email', authMiddleware, validateZod(verifyEmailChangeSchema), userController.verifyEmailChange.bind(userController));

export default userRouter;