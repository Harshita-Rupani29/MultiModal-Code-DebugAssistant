const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const generateToken = (userId, email) => {
    return jwt.sign(
        { userId: userId, email: email },
        process.env.JWT_KEY,
        { expiresIn: "6h" }
    );
};

const handleOAuthCallback = (provider) => (req, res) => {

    if (!req.user) {
        return res.redirect('/login');
    }

    const token = generateToken(req.user.id, req.user.email);

    res.json({
        userId: req.user.id,
        email: req.user.email,
        isVerified: true,
        token: token,
        message: `Logged in with ${provider} successfully!`
    });
};


module.exports = {
    handleGoogleCallback: handleOAuthCallback('Google'),
};
