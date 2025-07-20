import React, { useState, useEffect, useRef } from 'react';
import { extractTextFromImage, analyzeImageError } from '../api/Api'; 
import { CloudArrowUpIcon, DocumentTextIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Still using icons for clarity, but they can be removed if preferred

const ImageUploadModal = ({
    onClose,
    currentCode,
    currentOutput,
    currentLanguage,
    onAnalysisComplete, 
    onOCRComplete,     
    onAnalysisError
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [extractedText, setExtractedText] = useState(''); 
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setExtractedText('');
            setMessage('');
            fileInputRef.current.value = ''; 
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation(); 
        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setExtractedText('');
            setMessage('');
        } else {
            setMessage('Please drop an image file.');
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
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
            const formData = new FormData();
            formData.append('image', selectedFile);

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
            onOCRComplete(data.extractedText); 
        } catch (error) {
            console.error('Error during OCR:', error);
            setMessage(`OCR failed: ${error.message}`);
            setExtractedText(''); 
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
                selectedFile,
                currentCode,
                currentOutput,
                currentLanguage,
                additionalNotes,
                extractedText 
            );
            setMessage('AI Analysis complete!');
            onAnalysisComplete(result);
            onClose(); 
        } catch (error) {
            console.error('Error during AI analysis:', error);
            setMessage(`AI Analysis failed: ${error.message}`);
            onAnalysisError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-gray-800 p-8 rounded-xl shadow-xl w-full max-w-xl border border-gray-700 max-h-[90vh] flex flex-col relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 transition"
                    aria-label="Close modal"
                    disabled={isLoading}
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-3xl font-bold mb-3 text-white text-center">Analyze Screenshot</h2>
                <p className="text-gray-400 mb-6 text-center text-base">
                    Extract text from your image for AI-powered analysis.
                </p>

                <div 
                    className="relative mb-6 p-6 border-2 border-gray-600 border-dashed rounded-md text-center cursor-pointer hover:border-gray-500 transition"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => fileInputRef.current.click()}
                >
                    <input
                        type="file"
                        id="imageUpload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        ref={fileInputRef}
                    />
                    {!selectedFile ? (
                        <>
                            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-500 mb-2" />
                            <p className="text-gray-400 text-sm mb-1">Drag & drop image here or</p>
                            <span className="text-blue-400 hover:text-blue-300 text-sm font-medium cursor-pointer transition">Browse Files</span>
                        </>
                    ) : (
                        <div className="flex flex-col items-center">
                            <p className="text-gray-300 text-sm font-medium flex items-center">
                                <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-400" />
                                File: {selectedFile.name}
                            </p>
                            <button
                                type="button"
                                className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition"
                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setExtractedText(''); setMessage(''); fileInputRef.current.value = ''; }}
                            >
                                Change
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mb-6">
                    <button
                        onClick={handleOCR}
                        disabled={!selectedFile || isLoading}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500 transition ${
                            (!selectedFile || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isLoading && message.includes('Extracting') ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Extracting...
                            </>
                        ) : (
                            <>
                                <DocumentTextIcon className="h-4 w-4 mr-2" />
                                Extract Text
                            </>
                        )}
                    </button>
                </div>

                {extractedText && (
                    <div className="mb-6 flex-grow overflow-y-auto bg-gray-700 p-4 rounded-md border border-gray-600 text-sm">
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            OCR Result:
                        </label>
                        <textarea 
                            value={extractedText} 
                            onChange={(e) => setExtractedText(e.target.value)}
                            className="w-full h-full bg-transparent text-gray-300 whitespace-pre-wrap font-mono resize-none focus:outline-none"
                            rows="5"
                        ></textarea>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-gray-300 text-sm font-medium mb-2" htmlFor="additionalNotes">
                        Additional Notes <span className="text-gray-500 text-xs">(Optional)</span>:
                    </label>
                    <textarea
                        id="additionalNotes"
                        rows="3"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="e.g., 'The error happens when I click the 'Save' button.'"
                        className="shadow-sm appearance-none border border-gray-600 rounded-md w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-700 resize-none placeholder:text-gray-500"
                    ></textarea>
                </div>

                {message && (
                    <p className={`mt-auto mb-4 text-center text-sm font-medium ${
                        isLoading ? 'text-blue-400' : 
                        message.includes('failed') ? 'text-red-400' :
                        'text-green-400'
                    }`}>
                        {message}
                    </p>
                )}

                <div className="flex justify-end gap-3"> 
                    <button
                        onClick={onClose}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500 transition"
                        disabled={isLoading}
                    >
                        Close
                    </button>
                    <button
                        onClick={handleAnalyzeAI}
                        disabled={!extractedText || isLoading}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 transition ${
                            (!extractedText || isLoading) ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                        {isLoading && message.includes('Analyzing') ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <SparklesIcon className="h-4 w-4 mr-2" />
                                Analyze with AI
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageUploadModal;