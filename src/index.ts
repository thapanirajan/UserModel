
import express from "express"
import passport from 'passport';
import { config } from "dotenv";
import cookieParser from 'cookie-parser';


import AppDataSource from "./config/db.config";
import userRouter from "./routes/user.routes";
import "./config/passport.config"
import { tokenCleanUp } from "./utils/cronjob.utils";
import categoryRoutes from "./routes/category.routes";
import { join } from "path";
import { mkdirSync } from "fs";

// this creates folder "uploads" if it doesnot exists
const uploadDir = join(__dirname, 'uploads');
mkdirSync(uploadDir, { recursive: true });

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
app.use('/api/categories', categoryRoutes);

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

