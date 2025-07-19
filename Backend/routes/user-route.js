const express = require("express");
const router = express.Router();
const passport = require("passport");



const {
    handleGoogleCallback,
} = require("../controllers/user");

router.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    handleGoogleCallback
);


module.exports = router;