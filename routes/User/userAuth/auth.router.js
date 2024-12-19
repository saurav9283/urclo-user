const express = require('express');
const session = require('express-session');
const {
    register,
    verifyEmailOtp,
    resendEmailOtp,
    verifyPhoneOtp,
    resendPhoneOtp,
    login,
    forgotPassword,
    resetPassword,
    LogoutController
} = require('../userAuth/auth.controller');
const router = express.Router();
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const passport = require('passport');
require('dotenv').config();
const path = require('path');
const { saveUser } = require('./auth.service');

// Configure session middleware
router.use(session({
    secret: 'crclo',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

router.use(passport.initialize());
router.use(passport.session());

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            passReqToCallback: true
        },
        (request, accessToken, refreshToken, profile, done) => {
            console.log('Google Profile:');
            const newUser = {
                name: profile.displayName,
                email: profile.emails[0].value,
                provider: 'Google',
                googleId: profile.id
            };
            console.log('Google User:', newUser);
            saveUser(newUser, (err, user) => {
                return done(err, user);
            });
        }

    )
);

// Serialize and deserialize user (required for persistent login sessions)
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    findUserById(id, (err, user) => {
        if (err) {
            console.error('Error finding user by ID:', err);
            return done(err, null);
        }
        done(null, user);
    });
});

// Route to initiate Google OAuth and temporarily store user info
router.get('/auth/google/:name/:email', (req, res, next) => {
    const { name, email } = req.params;

    // Temporarily store name and email in session
    req.session.userData = { name, email };

    // Initiate Google OAuth
    passport.authenticate('google', { scope: ['email', 'profile'] })(req, res, next);
});

// Google OAuth callback
router.get(
    '/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/failure'
    }),
    (req, res) => {
        // Retrieve stored session data
        const { userData } = req.session;

        if (userData) {
            const { name, email } = userData;

            // Update database with session data (if needed)
            console.log(`Additional User Data: Name=${name}, Email=${email}`);

            // Clear session data
            req.session.userData = null;
        }

        // Redirect to success page or respond with success
        res.redirect('/success');
    }
);

router.post('/register', register)
    .post('/verify/email', verifyEmailOtp)
    .post('/verify/phone', verifyPhoneOtp)
    .post('/phone/resend', resendPhoneOtp)
    .post('/email/resend', resendEmailOtp)
    .post('/login', login) // here from login content
    .post('/password/forgot', forgotPassword)
    .post('/password/reset', resetPassword)
    .delete('/logout', LogoutController);



module.exports = router;
