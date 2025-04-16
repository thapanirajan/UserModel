import { Router } from "express";
import { validateSignup } from "../utils/zod.utils";
import { getUsers, login, sendVerificationToken, signup, verifyToken } from "../controllers/user.controller";
import passport from "passport";

const userRouter = Router()

userRouter.get("/user", getUsers)

userRouter.post("/signup", validateSignup, signup)

userRouter.post("/verify/resend", sendVerificationToken);

userRouter.post("/verify", verifyToken)


userRouter.post("/login", validateSignup, login)


// Google callback route
userRouter.get("/google", passport.authenticate("google", {
    scope: ["email", "profile"]
}))

userRouter.get("/google/callback", passport.authenticate("google", {
    failureRedirect: "/login",
}), (req, res) => {
    res.send("Login succesfull")
});


// Facebook callback route
userRouter.get("/facebook", passport.authenticate("facebook", {
    scope: ["email"]
}))

userRouter.get("/facebook/callback", passport.authenticate("facebook", {
    failureRedirect: "/login",
}), (req, res) => {
    res.send("Login succesfull")
})

export default userRouter;