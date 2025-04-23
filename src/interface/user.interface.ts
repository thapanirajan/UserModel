import { User } from "../models/user.model";


declare module 'express' {
    interface Request {
        user?: User;
    }
}
export interface ISignupRequest {
    username: string;
    email: string;
    password: string;
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