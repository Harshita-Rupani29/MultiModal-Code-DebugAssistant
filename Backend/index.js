require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const { CopilotRuntime, GoogleGenerativeAIAdapter, copilotRuntimeNodeHttpEndpoint } = require("@copilotkit/runtime");
const { GoogleGenerativeAI } = require("@google/generative-ai"); // This import might not be strictly needed if you're only using GoogleGenerativeAIAdapter

// Local imports
const pool = require("./config/db");
const userRoutes = require("./routes/user-route");
const HttpError = require("./models/http-error");
require("./config/passport")(passport); // Passport strategy setup

// Create app
const app = express();
const port = 3000;

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

// --- CopilotKit Initialization (Moved Outside the Request Handler) ---
let serviceAdapter;
try {
    serviceAdapter = new GoogleGenerativeAIAdapter({
        apiKey: process.env.GOOGLE_API_KEY, // Ensure GOOGLE_API_KEY is correctly set in your .env
        // You can specify the model here if you want a specific one, e.g.:
        model: "gemini-1.5-flash"
    });
    console.log("CopilotKit service adapter initialized successfully.");
} catch (err) {
    console.error("Error initializing CopilotKit service adapter:", err);
    // Exit the process if the adapter can't be initialized, as AI functionality will fail.
    process.exit(1);
}

let runtime;
try {
    runtime = new CopilotRuntime({
        actions: [], // Your actions for CopilotKit
        // ... other configurations, if any
        chat: {
            serviceAdapter: serviceAdapter // Pass the initialized serviceAdapter here
        }
    });
    console.log("CopilotKit runtime initialized successfully.");
} catch (err) {
    console.error("Error initializing CopilotKit runtime:", err);
    // Exit the process if the runtime can't be initialized.
    process.exit(1);
}

// --- CopilotKit API Endpoint ---
// The `handler` and `endpoint` setup should also be outside the `app.post` for efficiency
const copilotHandler = copilotRuntimeNodeHttpEndpoint({
    endpoint: "/api", // This must match the path in your frontend's CopilotKitProvider
    runtime,
    serviceAdapter,
});

app.post("/api", async (req, res) => {
    console.log("Received request for /api"); // Confirm the route is hit
    try {
        await copilotHandler(req, res); // Use the pre-initialized handler
        console.log("Successfully processed CopilotKit response.");
    } catch (error) {
        // This catch block will now likely contain more specific errors from CopilotKit's internal processing
        console.error("Error during CopilotKit streamHttpServerResponse:", error);
        res.status(500).json({ error: "Internal Server Error during AI processing." });
    }
});

// --- Test DB connection on startup ---
async function testDbConnection() {
    try {
        await pool.query("SELECT 1");
        console.log(" Database connection successfully established on startup!");
    } catch (err) {
        console.error(" Failed to establish database connection on startup:", err.message);
        process.exit(1);
    }
}

// Start server
app.listen(port, async () => {
    await testDbConnection();
    console.log(` Server running at http://localhost:${port}`);
});