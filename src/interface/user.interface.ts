

export interface ISignupRequest {
    username: string;
    email: string;
    password: string
}

export interface ILoginRequest {
    email: string;
    password: string
}

export interface IVerificationToken {
    email: string
}

export interface IVerifyToken {
    token: string
}

export interface IGetUserByIdParams {
    id: number;
}

export interface IUpdateUserParams {
    id: number;
}

export interface IUpdateUserBody {
    username?: string;
    email?: string;
}

export interface IResetPasswordRequest {
    newPass: string;
    confirmPass: string;
    token: string;
}

export interface IVerificationToken {
    email: string;
}