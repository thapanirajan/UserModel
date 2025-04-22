import { MoreThan } from 'typeorm';
import AppDataSource from '../config/db.config';
import { ISignupRequest, IUpdateUserBody } from '../interface/user.interface';
import { User } from '../models/user.model';
import bcrypt from "bcryptjs"
import { sendVerificationEmail } from '../utils/nodemailer.utils';

const userDB = AppDataSource.getRepository(User);

// get all user details
export const fetchAllUser = async () => {
    const users = await userDB.find();
    return users;
}

// register new user 
export const registerUser = async ({ username, email, password }: ISignupRequest) => {
    const existingUser = await userDB.findOneBy({ email });

    if (existingUser) {
        throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    const hashToken = await bcrypt.hash(verificationToken, 10);

    const expire = new Date(Date.now() + 2 * 60 * 1000); // 2 mins from now

    const user = userDB.create({
        username,
        email,
        password: hashedPassword,
        verificationCode: hashToken,
        verificationCodeExpire: expire,
    })
    await userDB.save(user)

    return { user, verificationToken }
}

export const findUserByEmailLogin = async (email: string) => {
    const user = await userDB.findOne({
        where: [
            { email }, { username: email }
        ]
    })
    console.log(user);

    return user;
}

export const handleVerificationResend = async (email: string) => {
    return await userDB.findOne({ where: { email } });
}

// export const findUserByToken = async (token: string) => {
//     return await userDB.findOneBy({ verificationCode: token });
// }

export const updateUserAfterVerification = async (user: User) => {
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    user.resendCount = null;
    user.resendBlockUntil = null;
    user.isVerified = true;

    await userDB.save(user);
};

export const findUserByEmail = async (email: string) => {
    return await userDB.findOneBy({ email });
};

export const setResetTokenForUser = async (user: User) => {
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpire = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    user.resetToken = token;
    user.resetTokenExpire = tokenExpire;

    await userDB.save(user);

    return token;
};

export const findUserByResetToken = async (token: string) => {
    return await userDB.findOne({
        where: {
            resetToken: token,
            resetTokenExpire: MoreThan(new Date()),
        },
    });
};

export const updatePassword = async (user: User, newPassword: string) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpire = null;
    await userDB.save(user);
};

export const getUserByIdService = async (id: number) => {
    return await userDB.findOneBy({ id });
};

export const updateUserService = async (id: number, data: IUpdateUserBody): Promise<boolean> => {
    const user = await userDB.findOneBy({ id });
    if (!user) return false;

    await userDB.update(id, data);
    return true;
};

// Resend verification token
export const resendVerificationToken = async (email: string): Promise<User> => {
    const user = await handleVerificationResend(email);
    if (!user) {
        throw new Error("User not found");
    }

    // Check rate limit using resendCount and resendBlockUntil
    const now = new Date();
    if (user.resendBlockUntil && user.resendBlockUntil > now) {
        const remainingSeconds = Math.ceil((user.resendBlockUntil.getTime() - now.getTime()) / 1000);
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        throw new Error(`Too many verification attempts. Please try again in ${remainingMinutes} minute(s).`);
    }

    if (user.resendCount >= 3) {
        user.resendCount = 0; // Reset count after cooldown
        user.resendBlockUntil = null;
    }

    // Generate 6-digit verification token
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const expire = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Hash verification code using bcrypt
    const hashedVerificationCode = await bcrypt.hash(verificationToken, 10); // salt rounds = 10

    // Update user with new token details and increment resendCount
    user.verificationCode = hashedVerificationCode;
    user.verificationCodeExpire = expire;
    user.resendCount += 1;
    if (user.resendCount >= 3) {
        user.resendBlockUntil = new Date(Date.now() + 10 * 60 * 1000); // 10-minute cooldown
    }
    await userDB.save(user);

    // Send verification email
    await sendVerificationEmail(user.email, "Email verification", verificationToken);

    return user;
};

