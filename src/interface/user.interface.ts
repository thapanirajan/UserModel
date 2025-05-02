import { User, UserRole } from "../entities/user.entity";


declare module 'express' {
    interface Request {
        user?: User;
    }
}
export interface ISignupRequest {
    username: string;
    email: string;
    password: string;
    role?: UserRole; // optional
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IVerificationTokenRequest {
    email: string;
}

export interface IVerifyTokenRequest {
    email: string;
    token: string;
}

export interface IUserIdParams {
    id: number;
}

export interface IUpdateUserRequest {
    id: number;
    username?: string;
    email?: string;
    role?: UserRole;
}

export interface IResetPasswordRequest {
    newPass: string;
    confirmPass: string;
    token: string;
}

export interface IChangeEmailRequest {
    newEmail: string;
}

export interface IVerifyEmailChangeRequest {
    token: string;
}