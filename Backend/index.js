require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require('http'); // Keep this
const { CopilotRuntime, GoogleGenerativeAIAdapter, copilotRuntimeNodeHttpEndpoint } = require("@copilotkit/runtime");

const pool = require("./config/db");
const userRoutes = require("./routes/user-route");
const HttpError = require("./models/http-error");
require("./config/passport")(passport);

const app = express();
const port = 3000;

const rooms = new Map();
const roomRoutes = require("./routes/room-route")(rooms);

// Middleware
app.use(cors());
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);

// CopilotKit AI Runtime setup
let serviceAdapter;
try {
    serviceAdapter = new GoogleGenerativeAIAdapter({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini pro"
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
    try {
        await copilotHandler(req, res);
    } catch (error) {
        console.error("Error during CopilotKit response:", error);
        res.status(500).json({ error: "Internal Server Error during AI processing." });
    }
});

async function testDbConnection() {
    try {
        await pool.query("SELECT 1");
        console.log("Database connection successfully established on startup!");
    } catch (err) {
        console.error("Failed to establish database connection:", err.message);
        process.exit(1);
    }
}

// *** IMPORTANT FIXES START HERE ***

// 1. Create the HTTP server instance using your Express app
const server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server, { // Now 'server' is defined
    cors: {
        origin: "http://localhost:5173", // Ensure this matches your client's origin
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const setupSocket = require("./socket");
setupSocket(io, rooms);

// 2. Listen on the created HTTP server instance
server.listen(port, async () => {
    await testDbConnection();
    console.log(`Server running at http://localhost:${port}`);
});

// *** IMPORTANT FIXES END HERE ***