

import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Strategy as JwtStrategy } from "passport-jwt";
import { User } from "../entities/user.entity";
import AppDataSource from "./db.config";
import jwt from "jsonwebtoken";

// Initialize repository for User model to interact with database
const userDB = AppDataSource.getRepository(User);


const cookieExtractor = (req) => {
    let token = null;
    if (req && req.cookies) {
        token = req.cookies["token"];
    }
    return token;
}

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: cookieExtractor,
            secretOrKey: process.env.JWT_SECRET || "jwt_secret_key123"
        },
        async (jwt_payload, done) => {
            try {
                const user = await userDB.findOneBy({ id: jwt_payload.id });
                if (user) {
                    return done(null, user);
                }
                return done(null, false);
            } catch (err) {
                return done(err, false);
            }
        }
    )
)

// config google strategy
passport.use(new GoogleStrategy(
    {
        // Check if user exists with the given Google ID
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await userDB.findOne({
                where: { googleId: profile.id }
            });
            if (!user) {
                // Create new user if not found
                const user = userDB.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    username: profile.displayName,
                    isVerified: true,
                })
                await userDB.save(user);
            }
            const token = jwt.sign(
                { id: user.id, email: user.email, username: user.username || profile.displayName },
                process.env.JWT_SECRET || "your_jwt_secret",
                { expiresIn: "2h" }
            );
            return done(null, { user, token });
        } catch (error) {
            return done(error, false)
        }
    }
))


// Configure Facebook OAuth strategy
passport.use(new FacebookStrategy(
    {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:5000/api/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'photos', 'email']  // Fields to retrieve from Facebook
    },
    async (accesToken, refreshToken, profile, done) => {
        try {
            // Check if user exists with the given Facebook ID
            const user = await userDB.findOne({
                where: { facebookId: profile.id }
            })

            if (!user) {
                const newUser = userDB.create({
                    facebookId: profile.id,
                    email: profile.emails[0].value,
                    username: profile.displayName,
                    isVerified: true
                })
                await userDB.save(newUser)
            }
            const token = jwt.sign(
                { id: user.id, email: user.email, username: user.username || profile.displayName },
                process.env.JWT_SECRET || "your_jwt_secret",
                { expiresIn: "2h" }
            );

            // Pass user and token to callback
            return done(null, { user, token });
            
        } catch (error) {
            return done(error, false)
        }
    }
))
