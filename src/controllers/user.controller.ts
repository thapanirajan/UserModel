
import { Request, Response } from "express"
import AppDataSource from "../config/db.config"
import { User } from "../models/user.model"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { sendVerificationEmail } from '../utils/nodemailer.utils';
import { IAuthRequest, IVerificationToken, IVerifyToken } from '../interface/user.interface';

const userDB = AppDataSource.getRepository(User);

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await userDB.find();
        console.log(users)
        res.status(200).json({
            sucess: true,
            data: users
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            msg: "Internal server error"
        })
    }
}

export const signup = async (req: Request<{}, {}, IAuthRequest>, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
        const exisingUser = await userDB.findOneBy({ email });

        if (exisingUser) {
            res.status(400).json({ message: "User already exists" })
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const expire = new Date(Date.now() + 2 * 60 * 1000); // 2 mins from now

        const user = userDB.create({
            email,
            password: hashedPassword,
            token: verificationToken,
            tokenExpire: expire,
            createdAt: new Date(),
            resendCount: 0,
        })
        await userDB.save(user)
        console.log(user)

        await sendVerificationEmail(email, "Email verification", verificationToken);


        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "2h" })

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 2 * 60 * 60 * 1000
        })

        res.status(200).json({
            success: true,
            user: user
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req: Request<{}, {}, IAuthRequest>, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
        const user = await userDB.findOneBy({ email })
        if (!user) {
            res.status(401).json({ msg: "Invalid email or password" })
            return;
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: "2h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 2 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// resend token and manage resend limit
export const sendVerificationToken = async (req: Request<{}, {}, IVerificationToken>, res: Response): Promise<void> => {
    const { email } = req.body;
    try {
        const user = await userDB.findOneBy({ email });
        if (!user) {
            res.status(404).json({ msg: "User not found" })
            return;
        }

        // block resend if within block period
        if (user.resendBlockUntil && user.resendBlockUntil > new Date()) {
            res.status(400).json({
                msg: `Too many attempts. Please try agian after ${user.resendBlockUntil.toLocaleTimeString()}`
            })
            return;
        }

        // generate token
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const expire = new Date(Date.now() + 2 * 60 * 1000); // 2 mins from now

        if (user.resendCount >= 3) {
            user.resendBlockUntil = new Date(Date.now() + 10 * 60 * 1000); // block for 10min
            user.resendCount = 0;
        }

        user.token = verificationToken
        user.tokenExpire = expire
        user.resendCount += 1;

        await userDB.save(user)

        await sendVerificationEmail(user.email, "Email verifcation", user.token)// send verification mail

        res.status(200).json({ msg: "Verification token resent" })

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Error sending  verification email" });
    }
}

// verify token
export const verifyToken = async (req: Request<{}, {}, IVerifyToken>, res: Response): Promise<void> => {
    const { token } = req.body;
    try {
        const user = await userDB.findOneBy({ token })
        if (!user || !user.token || !user.tokenExpire) {
            res.status(400).json({ message: "Invalid or expired token" });
            return;
        }

        if (user.token !== token || user.tokenExpire < new Date()) {
            res.status(400).json({ message: "Token expired or invalid" });
            return;
        }

        user.token = null;
        user.tokenExpire = null;
        user.resendBlockUntil = null;
        user.resendCount = null;
        user.isVerified = true

        // save to db
        await userDB.save(user);

        res.status(200).json({ msg: "Token verified ✅ " })

    } catch (error) {
        console.log("Error verifying token ");
        console.log(error)
        res.status(500).json({ msg: "Server error ❌ ", error })
    }
}