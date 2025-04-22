
import cron from "node-cron";
import { User } from "../models/user.model"
import { LessThan, Not } from "typeorm"
import AppDataSource from "../config/db.config"

const userDB = AppDataSource.getRepository(User);

export const tokenCleanUp = () => {
    cron.schedule("*/2 * * * *", async () => {
        try {
            const expiredUsers = await userDB.find({
                where: {
                    verificationCodeExpire: LessThan(new Date()),
                    verificationCode: Not(null)
                }
            })
            console.log(expiredUsers);
            if (expiredUsers.length > 0) {
                for (const user of expiredUsers) {
                    user.verificationCode = null;
                    user.verificationCodeExpire = null;
                    user.resendBlockUntil = null;
                    user.resendCount = null;
                    await userDB.save(user);
                    console.log(" Token 🗑️✅")
                }
            }
            console.log("Cron job")
        } catch (err) {
            console.error("❌ Error in cron job:", err);
        }
    })
}