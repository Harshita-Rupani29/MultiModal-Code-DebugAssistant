require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { CopilotRuntime, GoogleGenerativeAIAdapter, copilotRuntimeNodeHttpEndpoint } = require("@copilotkit/runtime");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Local imports
const pool = require("./config/db");
const userRoutes = require("./routes/user-route");
const HttpError = require("./models/http-error");
require("./config/passport")(passport); // Passport strategy setup

// Create app
const app = express();
const port =3000;

// Middleware
app.use(cors());
app.use(express.json());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/users", userRoutes);

// --- CopilotKit + Gemini AI Endpoint ---
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const serviceAdapter = new GoogleGenerativeAIAdapter({
    model: genAI.getGenerativeModel({ model: "gemini-2.5-pro" }),
});
const runtime = new CopilotRuntime();

const copilotHandler = copilotRuntimeNodeHttpEndpoint({
    endpoint: "/api/copilot",
    runtime,
    serviceAdapter,
});

// Register Copilot API route
app.post("/api/copilot", copilotHandler);

// --- Test DB connection on startup ---
async function testDbConnection() {
    try {
        await pool.query("SELECT 1");
        console.log("✅ Database connection successfully established on startup!");
    } catch (err) {
        console.error("❌ Failed to establish database connection on startup:", err.message);
        process.exit(1);
    }
}

// Start server
app.listen(port, async () => {
    await testDbConnection();
    console.log(`🚀 Server running at http://localhost:${port}`);
});
