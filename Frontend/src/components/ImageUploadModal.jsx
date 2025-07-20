// components/ImageUploadModal.jsx
import React, { useState, useEffect } from 'react';
// Assuming 'extractTextFromImage' and 'analyzeImageError' are available
import { extractTextFromImage, analyzeImageError } from '../api/Api'; // You'll need to expose extractTextFromImage in your API

const ImageUploadModal = ({
    onClose,
    currentCode,
    currentOutput,
    currentLanguage,
    onAnalysisComplete, // This will be for the *full AI analysis*
    onOCRComplete,      // New prop: to send extracted text back to HomePageExtend
    onAnalysisError
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [extractedText, setExtractedText] = useState(''); // To store OCR result
    const [showAnalysisResult, setShowAnalysisResult] = useState(false); // To control display of full AI analysis inside modal if needed

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
        setExtractedText(''); // Reset extracted text on new file selection
        setMessage('');
    };

    const handleOCR = async () => {
        if (!selectedFile) {
            setMessage('Please select an image file first.');
            return;
        }

        setIsLoading(true);
        setMessage('Extracting text from image...');
        setExtractedText('');

        try {
            // Create FormData for image upload to a new OCR-specific endpoint
            const formData = new FormData();
            formData.append('image', selectedFile);

            // You'll need a new backend API endpoint that *only* does OCR
            const response = await fetch('http://localhost:3000/api/ai/extract-text-from-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to extract text.');
            }

            const data = await response.json();
            setExtractedText(data.extractedText || "No text could be extracted.");
            setMessage('Text extracted. You can now analyze it with AI.');
            onOCRComplete(data.extractedText); // Send extracted text back to parent
        } catch (error) {
            console.error('Error during OCR:', error);
            setMessage(`OCR failed: ${error.message}`);
            setExtractedText(`Error extracting text: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyzeAI = async () => {
        if (!extractedText) {
            setMessage('No text extracted yet to analyze.');
            return;
        }

        setIsLoading(true);
        setMessage('Analyzing with AI...');

        try {
            const result = await analyzeImageError(
                selectedFile, // The image file itself might still be needed for full analysis
                currentCode,
                currentOutput,
                currentLanguage,
                additionalNotes,
                extractedText // Pass the already extracted text
            );
            setMessage('AI Analysis complete!');
            onAnalysisComplete(result); // Trigger the callback for the full analysis
            onClose(); // Close modal after analysis complete
        } catch (error) {
            console.error('Error during AI analysis:', error);
            setMessage(`AI Analysis failed: ${error.message}`);
            onAnalysisError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-11/12 md:w-2/3 lg:w-1/2 xl:w-2/5 border border-gray-700 max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-white">Upload Screenshot for Analysis</h2>
                <p className="text-gray-400 mb-4">
                    Upload an image. First, we'll extract text (OCR). Then, you can use that text for AI analysis.
                </p>
                <div className="mb-4">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="imageUpload">
                        Select Image:
                    </label>
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-500 file:text-white
                                hover:file:bg-blue-600 cursor-pointer"
                    />
                    {selectedFile && (
                        <p className="mt-2 text-sm text-gray-400">Selected: {selectedFile.name}</p>
                    )}
                </div>

                <div className="flex justify-end gap-3 mb-4">
                    <button
                        onClick={handleOCR}
                        disabled={!selectedFile || isLoading}
                        className={`bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ${
                            (!selectedFile || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isLoading && message.includes('Extracting') ? 'Extracting...' : 'Extract Text (OCR)'}
                    </button>
                </div>

                {extractedText && (
                    <div className="mb-4 flex-grow overflow-y-auto bg-gray-900 p-3 rounded">
                        <label className="block text-gray-300 text-sm font-bold mb-2">
                            Extracted Text (OCR Result):
                        </label>
                        <pre className="text-gray-300 text-sm whitespace-pre-wrap">{extractedText}</pre>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-gray-300 text-sm font-bold mb-2" htmlFor="additionalNotes">
                        Additional Notes for AI Analysis (Optional):
                    </label>
                    <textarea
                        id="additionalNotes"
                        rows="3"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="e.g., 'The error occurs when I click this button.'"
                        className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-gray-100 leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
                    ></textarea>
                </div>

                <div className="flex justify-end gap-3 mt-auto"> {/* mt-auto pushes buttons to bottom */}
                    <button
                        onClick={onClose}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200"
                        disabled={isLoading}
                    >
                        Close
                    </button>
                    <button
                        onClick={handleAnalyzeAI}
                        disabled={!extractedText || isLoading}
                        className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 ${
                            (!extractedText || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isLoading && message.includes('Analyzing') ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                </div>
                {message && (
                    <p className={`mt-4 text-center text-sm ${isLoading ? 'text-blue-400' : 'text-green-400'}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default ImageUploadModal;