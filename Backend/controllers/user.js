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
        return res.redirect('http://localhost:5173/login'); 
    }

    const token = generateToken(req.user.id, req.user.email);

    const frontendRedirectUrl = `http://localhost:5173/home?token=${token}&userId=${req.user.id}&email=${req.user.email}&isVerified=true`;

    console.log(`Redirecting to: ${frontendRedirectUrl}`);
    res.redirect(frontendRedirectUrl);
};


module.exports = {
    handleGoogleCallback: handleOAuthCallback('Google'),
};