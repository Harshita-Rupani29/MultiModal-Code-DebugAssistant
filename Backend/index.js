require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const http = require('http'); // Keep this
const { CopilotRuntime, GoogleGenerativeAIAdapter, copilotRuntimeNodeHttpEndpoint } = require("@copilotkit/runtime");
const fs = require('fs').promises;
const pool = require("./config/db");
const userRoutes = require("./routes/user-route");
const HttpError = require("./models/http-error");
const aiRoutes = require("./routes/ai-route"); 
require("./config/passport")(passport);
const multer = require("multer");
const {
    extractTextFromImage, // <--- ENSURE THIS IS IMPORTED
    classifyDebugRequest,
    analyzeError,
    generateSolution,
} = require('./services/ai-services');
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
const upload = multer({ dest: 'uploads/' });
// Routes
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.post('/api/ai/extract-text-from-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded.' });
    }

    try {
        const text = await extractTextFromImage(req.file.path);
        // Clean up the uploaded file
        await fs.unlink(req.file.path);
        res.json({ extractedText: text });
    } catch (error) {
        console.error('Error in /api/ai/extract-text-from-image:', error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(e => console.error("Error deleting temp file:", e));
        }
        res.status(500).json({ message: 'Failed to extract text from image.', error: error.message });
    }
});


// MODIFIED ROUTE: Endpoint for full AI analysis with optional extractedText
app.post('/api/ai/analyze-image-error', upload.single('image'), async (req, res) => {
    const { code, errorLogs, language, additionalNotes, extractedText: preExtractedText } = req.body;
    let finalExtractedText = preExtractedText; // Use pre-extracted text if provided

    try {
        if (req.file) {
            // If an image is uploaded AND no pre-extracted text, do OCR
            if (!preExtractedText) {
                finalExtractedText = await extractTextFromImage(req.file.path);
            }
            // Always delete the temp file if it was uploaded
            await fs.unlink(req.file.path);
        }

        const context = {
            language: language || 'auto',
            extractedText: finalExtractedText, // Pass extracted text to agents
            additionalNotes: additionalNotes || '',
        };

        const initialClassification = await classifyDebugRequest(code, errorLogs, finalExtractedText, language, additionalNotes);
        context.initialClassification = initialClassification;

        const analysis = await analyzeError(code, errorLogs, context);
        const solution = await generateSolution(code, errorLogs, { ...context, ...analysis });

        res.json({
            classification: initialClassification,
            analysis: analysis,
            solution: solution,
            extractedText: finalExtractedText // Also send extracted text back for reference
        });

    } catch (error) {
        console.error('Error in /api/ai/analyze-image-error:', error);
        if (req.file) { // Ensure cleanup if an error occurs early
            await fs.unlink(req.file.path).catch(e => console.error("Error deleting temp file on error:", e));
        }
        res.status(500).json({ message: 'Failed to perform AI analysis from image and code.', error: error.message });
    }
});


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