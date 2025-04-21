
import express from "express"
import passport from 'passport';
import { config } from "dotenv";
import session from "express-session";
import cookieParser from 'cookie-parser';


import AppDataSource from "./config/db.config";
import userRouter from "./routes/user.routes";
import "./config/passport.config"
import { tokenCleanUp } from "./utils/cronjob.utils";

const app = express()


config()

// middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());


app.use(passport.initialize());

tokenCleanUp()

// routes
app.use("/api/auth", userRouter);

const port = process.env.PORT || 5000

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log("Databse connected");
        app.listen(port, () => {
            console.log(`Server running at: http://localhost:${port}/api/auth`)
        })
    })

    .catch((err) => {
        console.error("Error during Data source initialization", err)
        process.exit(1); // Exit process on connection failure
    })

