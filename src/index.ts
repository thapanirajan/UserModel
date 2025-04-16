
import express from "express"
import passport from 'passport';
import { config } from "dotenv";
import session from "express-session";


import AppDataSource from "./config/db.config";
import userRouter from "./routes/user.routes";
import "./config/passport.config"

const app = express()


config()

// middlewares
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || "qwertyasfdghcvxb",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hrs
    }
}))
// Initialize Passport and use session
app.use(passport.initialize());
app.use(passport.session());


// routes
app.use("/api/auth", userRouter);

const port = process.env.PORT || 5000

AppDataSource.initialize()
    .then(() => {
        console.log("Databse connected");
        app.listen(port, () => {
            console.log(`Server running at: http://localhost:${port}/api/auth`)
        })
    })

    .catch((err) => {
        console.error("Error during Data source initialization", err)
    })

