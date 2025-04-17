
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
                    tokenExpire: LessThan(new Date()),
                    token: Not(null)
                }
            })

            if (expiredUsers.length > 0) {
                for (const user of expiredUsers) {
                    user.token = null;
                    user.tokenExpire = null;
                    user.resendCount = null;
                    user.resendBlockUntil = null;
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