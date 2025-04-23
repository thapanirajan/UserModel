import { Router } from 'express';
import { validateLogin, validateSignup } from '../utils/zod.utils';
import {
    forgotPassword,
    getUserById,
    getUsers,
    login,
    resetPassword,
    sendVerificationToken,
    signup,
    updateEmail,
    updateUser,
    verifyToken,
    verifyEmailChangeController,
} from '../controllers/user.controller';
import passport from 'passport';
import { authMiddleware } from '../middlewares/auth.middleware';

const userRouter = Router();

// Get all users
userRouter.get('/user', getUsers);

// Signup
userRouter.post('/signup', validateSignup, signup);

// Send verification token via email
userRouter.post('/verify/resend', sendVerificationToken);

// Verify token -> email verification
userRouter.post('/verify', verifyToken);

// Login route
userRouter.post('/login', validateLogin, login);

// Google callback route
userRouter.get('/google', passport.authenticate('google', {
    scope: ['email', 'profile'],
}));

userRouter.get('/google/callback', passport.authenticate('google', {
    failureRedirect: '/login',
}), (_, res) => {
    res.send('Login successful');
});

// Facebook callback route
userRouter.get('/facebook', passport.authenticate('facebook', {
    scope: ['email'],
}));

userRouter.get('/facebook/callback', passport.authenticate('facebook', {
    failureRedirect: '/login',
}), (_, res) => {
    res.send('Login successful');
});

// Password reset
userRouter.post('/forgot/password', forgotPassword);

// Reset password
userRouter.post('/reset/password', resetPassword);

// Get user by id
userRouter.get('/user/:id', getUserById);

// Update user
userRouter.put('/user/:id', updateUser);

// Update email
userRouter.post('/update/email', authMiddleware, updateEmail);

// Verify email change
userRouter.post('/verify/email', authMiddleware, verifyEmailChangeController);

export default userRouter;