import { z } from 'zod';
import { UserRole } from '../../entities/user.entity';

export const signupSchema = z.object({
    username: z
        .string()
        .min(1, 'Username is required'),
    email: z
        .string()
        .email('Invalid email format'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long'),
    role: z
        .nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) })
        .optional(),
});

export const loginSchema = z.object({
    email: z
        .string()
        .email('Invalid email format'),
    password: z
        .string()
        .min(1, 'Password is required'),
});

export const verificationTokenSchema = z.object({
    email: z
        .string()
        .email('Invalid email format'),
});

export const verifyTokenSchema = z.object({
    email: z
        .string()
        .email('Invalid email format'),
    token: z
        .string()
        .min(1, 'Token is required'),
});

export const updateUserSchema = z.object({
    id: z.number().int().positive('ID must be a positive integer'),
    username: z.string().min(1, 'Username is required').optional(),
    email: z.string().email('Invalid email format').optional(),
    role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid role' }) }).optional(),
});

export const resetPasswordSchema = z.object({
    newPass: z
        .string()
        .min(8, 'New password must be at least 8 characters long'),
    confirmPass: z
        .string()
        .min(1, 'Confirm password is required'),
    token: z
        .string()
        .min(1, 'Token is required'),
})
    .refine(data => data.newPass === data.confirmPass, {
        message: 'Passwords do not match',
        path: ['confirmPass'],
    });

export const changeEmailSchema = z.object({
    newEmail: z
        .string()
        .email('Invalid email format'),
});

export const verifyEmailChangeSchema = z.object({
    token: z
        .string()
        .min(1, 'Token is required'),
    emailChangeToken: z
        .string()
        .min(1, 'Email change token is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerificationTokenInput = z.infer<typeof verificationTokenSchema>;
export type VerifyTokenInput = z.infer<typeof verifyTokenSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type VerifyEmailChangeInput = z.infer<typeof verifyEmailChangeSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;