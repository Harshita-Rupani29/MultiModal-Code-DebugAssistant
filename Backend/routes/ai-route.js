// routes/ai-route.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs/promises'); 

const {
    extractTextFromImage,
    classifyDebugRequest,
    analyzeError,
    generateSolution
} = require('../services/ai-services');
const router = express.Router();

const upload = multer({
    dest: 'uploads/', 
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

router.post('/extract-text-from-image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file uploaded.' });
    }

    try {
        const text = await extractTextFromImage(req.file.path);
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

router.post('/analyze-image-error', upload.single('image'), async (req, res, next) => {
    const { code, errorLogs, language, additionalNotes, extractedText: preExtractedText } = req.body;
    let finalExtractedText = preExtractedText;

    try {
        if (req.file) {
            if (!preExtractedText) {
                finalExtractedText = await extractTextFromImage(req.file.path);
            }
            await fs.unlink(req.file.path); 
        }

        const context = {
            language: language || 'auto',
            extractedText: finalExtractedText,
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
            extractedText: finalExtractedText
        });

    } catch (error) {
        console.error("Full error analysis pipeline failed:", error);
        if (req.file) {
            await fs.unlink(req.file.path).catch(e => console.error("Error deleting temp file on error:", e));
        }
        res.status(500).json({ message: "Failed to analyze image and code.", error: error.message });
    } finally {
    }
});

module.exports = router;