// index.js

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require('http');
const { CopilotRuntime, GoogleGenerativeAIAdapter, copilotRuntimeNodeHttpEndpoint } = require("@copilotkit/runtime");
const fs = require('fs').promises; 
const pool = require("./config/db");
const userRoutes = require("./routes/user-route");
const HttpError = require("./models/http-error");
const aiRoutes = require("./routes/ai-route");
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
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/ai", aiRoutes); 

// CopilotKit AI Runtime setup
let serviceAdapter;
try {
    serviceAdapter = new GoogleGenerativeAIAdapter({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "Gemini 1.5 Flash"
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

const server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

const setupSocket = require("./socket");
setupSocket(io, rooms);

server.listen(port, async () => {
    await testDbConnection();
    console.log(`Server running at http://localhost:${port}`);
});