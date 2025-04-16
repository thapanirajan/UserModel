

import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { User } from "../models/user.model";
import AppDataSource from "./db.config";


const userDB = AppDataSource.getRepository(User);
// config google strategy
passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await userDB.findOne({
                where: { googleId: profile.id }
            });
            console.log(profile)
            if (!user) {
                const user = userDB.create({
                    googleId: profile.id,
                    email: profile.emails[0].value,
                    isVerified: true,
                })
                await userDB.save(user);
            }

            return done(null, user)
        } catch (error) {
            return done(error, false)
        }
    }
))

passport.use(new FacebookStrategy(
    {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:5000/api/auth/facebook/callback",
        profileFields: ['id', 'displayName', 'photos', 'email']
    },
    async (accesToken, refreshToken, profile, cb) => {
        try {
            const user = await userDB.findOne({
                where: { facebookId: profile.id }
            })

            if (!user) {
                const newUser = userDB.create({
                    facebookId: profile.id,
                    email: profile.emails[0].value,
                    isVerified: true
                })
                await userDB.save(newUser)
            }

            return cb(null, user);

        } catch (error) {
            return cb(error, false)
        }
    }
))

passport.serializeUser((user: User, done) => {
    done(null, user.id)
})
// passport.serializeUser(({ id }: User, done) => {
//     done(null, id);
// });


passport.deserializeUser(async (id: number, done) => {
    try {
        const user = await userDB.findOneBy({ id })
        done(null, user)
    } catch (err) {
        done(err, false)
    }
})