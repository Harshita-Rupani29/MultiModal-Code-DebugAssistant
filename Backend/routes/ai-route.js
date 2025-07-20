// routes/ai-route.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises'); // For deleting the file after processing

const {
    extractTextFromImage,
    classifyDebugRequest,
    analyzeError,
    generateSolution
} = require('../services/ai-services'); // Adjust path if necessary

const router = express.Router();

// Configure Multer for image uploads
const upload = multer({
    dest: 'uploads/', // Temporary directory for storing uploaded files
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Route for image-based error analysis
router.post('/analyze-image-error', upload.single('image'), async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded.' });
    }

    const { code, errorLogs, language, additionalNotes } = req.body;
    const imagePath = req.file.path; // Path to the temporarily saved image

    try {
        // 1. Extract text from the image using OCR
        const extractedText = await extractTextFromImage(imagePath);
        console.log("Extracted Text from Image:", extractedText);

        // 2. Classify the debug request
        const initialClassification = await classifyDebugRequest(
            code,
            errorLogs,
            extractedText,
            language,
            additionalNotes
        );
        console.log("Initial Classification:", initialClassification);

        // 3. Analyze the error based on all inputs
        const errorAnalysis = await analyzeError(code, errorLogs, {
            language,
            extractedText,
            additionalNotes,
            initialClassification
        });
        console.log("Error Analysis:", errorAnalysis);

        // 4. Generate the solution
        const solution = await generateSolution(code, errorLogs, {
            ...errorAnalysis, // Pass error analysis details
            language,
            extractedText,
            additionalNotes
        });
        console.log("Generated Solution:", solution);

        // Send the complete analysis back to the client
        res.json({
            classification: initialClassification,
            analysis: errorAnalysis,
            solution: solution
        });

    } catch (error) {
        console.error("Full error analysis pipeline failed:", error);
        res.status(500).json({ message: "Failed to analyze image and code.", error: error.message });
    } finally {
        // Clean up: Delete the uploaded file
        try {
            await fs.unlink(imagePath);
            console.log(`Deleted temporary file: ${imagePath}`);
        } catch (unlinkError) {
            console.error("Failed to delete temporary file:", unlinkError);
        }
    }
});

module.exports = router;