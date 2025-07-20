require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require('http'); // Import http module for the server instance
const { CopilotRuntime, GoogleGenerativeAIAdapter, copilotRuntimeNodeHttpEndpoint } = require("@copilotkit/runtime");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const pool = require("./config/db");
const userRoutes = require("./routes/user-route");
const HttpError = require("./models/http-error");
require("./config/passport")(passport);


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
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/users", userRoutes);


let serviceAdapter;
try {
    serviceAdapter = new GoogleGenerativeAIAdapter({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-1.5-flash"
    });
    console.log("CopilotKit service adapter initialized successfully.");
} catch (err) {
    console.error("Error initializing CopilotKit service adapter:", err);
    process.exit(1);
}

let runtime;
try {
    runtime = new CopilotRuntime({
        actions: [],
        chat: {
            serviceAdapter: serviceAdapter
        }
    });
    console.log("CopilotKit runtime initialized successfully.");
} catch (err) {
    console.error("Error initializing CopilotKit runtime:", err);
    process.exit(1);
}

const copilotHandler = copilotRuntimeNodeHttpEndpoint({
    endpoint: "/api",
    runtime,
    serviceAdapter,
});

app.post("/api", async (req, res) => {
    console.log("Received request for /api");
    try {
        await copilotHandler(req, res);
        console.log("Successfully processed CopilotKit response.");
    } catch (error) {
        console.error("Error during CopilotKit streamHttpServerResponse:", error);
        res.status(500).json({ error: "Internal Server Error during AI processing." });
    }
});

async function testDbConnection() {
    try {
        await pool.query("SELECT 1");
        console.log(" Database connection successfully established on startup!");
    } catch (err) {
        console.error(" Failed to establish database connection on startup:", err.message);
        process.exit(1);
    }
}

// Create an HTTP server from the Express app
const server = http.createServer(app);


server.listen(port, async () => {
    await testDbConnection();
    console.log(` Server running at http://localhost:${port}`);
});