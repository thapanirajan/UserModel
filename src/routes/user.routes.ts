import { Router } from "express";
import { validateLogin, validateSignup } from "../utils/zod.utils";
import { forgotPassword, getUserById, getUsers, login, resetPassword, sendVerificationToken, signup, updateUser, verifyToken } from "../controllers/user.controller";
import passport from "passport";

const userRouter = Router()

// Get all users
userRouter.get("/user", getUsers)

// Signup 
userRouter.post("/signup", validateSignup, signup)

// send verification token via email
userRouter.post("/verify/resend", sendVerificationToken);

// Verify token -> email verification 
userRouter.post("/verify", verifyToken)

// Login route
userRouter.post("/login", validateLogin, login)


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

// password reset 
userRouter.post("/forgot/password", forgotPassword);

// reset password
userRouter.post("/reset/password", resetPassword);

// Get user by id
userRouter.get("/user/:id", getUserById);

// update user
userRouter.put("/user/:id", updateUser);


export default userRouter;