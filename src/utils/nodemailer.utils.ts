import nodemailer from "nodemailer"
import { config } from "dotenv";
config()

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASS_EMAIL
    }
})

export const sendVerificationEmail = async (to: string, sub: string, token: string) => {
    const mailOptions = {
        from: `Leaflet <${process.env.USER_EMAIL}>`,
        to,
        Subject: sub,
        html:
            `
            <div>
                <h2>Email Verification</h2>
                <p>Your 6- digit verification code is: </p>
                <h3>${token}</h3>
                <p>This code will expire in 2 minutes</p>
            </div>
        `
    }

    await transporter.sendMail(mailOptions);
}