import { Router, Request, Response } from 'express';
import { validate } from 'class-validator';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import { UserController } from '../controllers/user.controller';
import { authMiddleware, isAdmin } from '../middlewares/auth.middleware';
import { ResetPasswordDTO, ChangeEmailDTO, VerifyEmailChangeDTO, SignupDTO, VerificationTokenDTO, VerifyTokenDTO, LoginDTO } from '../dtos/user.dto';


const userRouter = Router();
const controller = new UserController();

// Rate limiter for sensitive endpoints
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per window
    message: 'Too many requests, please try again later.',
});

// Validation middleware
const validateDTO = (dtoClass: any) => async (req: Request, res: Response, next: Function) => {
    const dto = new dtoClass();
    Object.assign(dto, req.body);
    const errors = await validate(dto);
    if (errors.length > 0) {
        res.status(400).json({ success: false, errors });
        return;
    }
    next();
};

/**
 * @route GET /api/auth/users
 * @desc Get all users (admin only)
 * @access Private (Admin)
 */
     
// userRouter.get('/users', authMiddleware, isAdmin, controller.getUsers.bind(controller));
userRouter.get('/users', authMiddleware, controller.getUsers.bind(controller));

/**
 * @route POST /api/auth/signup
 * @desc Register a new user
 * @access Public
 */
userRouter.post('/signup', validateDTO(SignupDTO), controller.signup.bind(controller));

/**
 * @route POST /api/auth/verify/resend
 * @desc Resend email verification token
 * @access Public
 */
userRouter.post('/verify/resend', authRateLimiter, validateDTO(VerificationTokenDTO), controller.sendVerificationToken.bind(controller));

/**
 * @route POST /api/auth/verify
 * @desc Verify email verification token
 * @access Public
 */
userRouter.post('/verify', validateDTO(VerifyTokenDTO), controller.verifyToken.bind(controller));

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT
 * @access Public
 */
userRouter.post('/login', validateDTO(LoginDTO), controller.login.bind(controller));

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
userRouter.post('/forgot-password', authRateLimiter, validateDTO(VerificationTokenDTO), controller.forgotPassword.bind(controller));

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
userRouter.post('/reset-password', authRateLimiter, validateDTO(ResetPasswordDTO), controller.resetPassword.bind(controller));

/**
 * @route GET /api/auth/users/:id
 * @desc Get user by ID
 * @access Private
 */
userRouter.get('/users/:id', authMiddleware, controller.getUserById.bind(controller));

/**
 * @route PUT /api/auth/users/:id
 * @desc Update user information
 * @access Private
 */
userRouter.put('/users/:id', authMiddleware, controller.updateUser.bind(controller));

/**
 * @route PATCH /api/auth/change-email
 * @desc Request email change
 * @access Private
 */
userRouter.patch('/change-email', authMiddleware, validateDTO(ChangeEmailDTO), controller.updateEmail.bind(controller));

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email change
 * @access Private
 */
userRouter.post('/verify-email', authMiddleware, validateDTO(VerifyEmailChangeDTO), controller.verifyEmailChange.bind(controller));

export default userRouter;