import { MoreThan } from 'typeorm';
import AppDataSource from '../config/db.config';
import { ISignupRequest, ILoginRequest, IUpdateUserBody } from '../interface/user.interface';
import { User } from '../models/user.model';
import bcrypt from "bcryptjs"

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
        createdAt: new Date(),
        resendCount: 0,
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
    const user = await userDB.findOneBy({ email });
    return user;
}

export const findUserByToken = async (token: string) => {
    return await userDB.findOneBy({ verificationCode: token });
}

export const updateUserAfterVerification = async (user: User) => {
    user.verificationCode = null;
    user.verificationCodeExpire = null;
    user.resendBlockUntil = null;
    user.resendCount = null;
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

