

export interface IAuthRequest {
    email: string;
    password: string
}

export interface IVerificationToken {
    email: string
}

export interface IVerifyToken {
    token: string
}