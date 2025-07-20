const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error"); // Keep if used elsewhere
const User = require("../models/user"); // Keep if used elsewhere

const generateToken = (userId, email) => {
    return jwt.sign(
        { userId: userId, email: email },
        process.env.JWT_KEY,
        { expiresIn: "6h" }
    );
};

const handleOAuthCallback = (provider) => (req, res) => {
    if (!req.user) {
        // If authentication failed (e.g., failureRedirect was hit and then this somehow),
        // redirect back to login. Passport's failureRedirect should handle this though.
        return res.redirect('http://localhost:5173/login'); // Redirect to your frontend login page
    }

    const token = generateToken(req.user.id, req.user.email);

    // *** IMPORTANT CHANGE HERE ***
    // Redirect to your frontend application's home page,
    // passing user info and token as query parameters.
    // Ensure this URL matches your frontend's actual base URL and desired redirect path.
    const frontendRedirectUrl = `http://localhost:5173/home?token=${token}&userId=${req.user.id}&email=${req.user.email}&isVerified=true`;

    console.log(`Redirecting to: ${frontendRedirectUrl}`); // For debugging
    res.redirect(frontendRedirectUrl);
};


module.exports = {
    handleGoogleCallback: handleOAuthCallback('Google'),
};