// HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import { useCopilotChatSuggestions } from "@copilotkit/react-ui";
import Editor from '@monaco-editor/react';
import Dropdown from '../components/Dropdown';
import { CODE_SNIPPETS } from '../utils/constants';
import { executeCode } from '../api/Api';
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSignInAlt, FaSignOutAlt, FaUpload, FaTimesCircle } from 'react-icons/fa';

import ImageUploadModal from '../components/ImageUploadModal';
import { extractTextFromImage, analyzeImageError } from '../api/Api';


const HomePage = () => {
    return (
        <>
            <CopilotKit runtimeUrl="http://localhost:3000/api">
                <div
                    style={
                        {
                            "--copilot-kit-primary-color": "rgb(47, 53, 102)",
                        }
                    }>
                    <CopilotPopup
                        labels={{
                            title: "Echo Code Chatbot",
                            initial: "Hi! 👋 Ask me anything related to your code?",
                        }}
                    />
                </div>
                <HomePageExtend />
            </CopilotKit>
        </>
    );
}

const HomePageExtend = () => {
    const [language, setLanguage] = useState('python');
    const [inputCode, setInputCode] = useState(CODE_SNIPPETS[language]);
    const [output, setOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [showImageUploadModal, setShowImageUploadModal] = useState(false);
    const [extractedTextFromImage, setExtractedTextFromImage] = useState('');
    const [aiAnalysisResult, setAiAnalysisResult] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    const getAuthToken = () => localStorage.getItem('jwtToken');

    const cleanCodeString = (str) => {
        if (typeof str !== 'string') return '';
        let cleanedStr = str.replace(/\\"/g, '"');
        cleanedStr = cleanedStr.replace(/\\n/g, '\n');
        cleanedStr = cleanedStr.replace(/\\t/g, '\t');
        return cleanedStr;
    };

    const handleInputChange = (value) => {
        setInputCode(value || '');
    };

    const handleLanguageChange = (lan) => {
        setLanguage(lan);
        setInputCode(CODE_SNIPPETS[lan]);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setAiAnalysisResult(null);
        try {
            const response = await executeCode(language, inputCode);
            if (response.run) {
                setOutput(response.run.output);
            } else {
                setOutput('No output received');
            }
        } catch (error) {
            setOutput(`Error: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        setIsLoggedIn(false);
        navigate('/login');
    };

    const handleEditorDidMount = (editor, monaco) => {

    };

    const handleOCRComplete = (text) => {
        setExtractedTextFromImage(text);
        setAiAnalysisResult(null);
    };

    const handleAIAnalysisComplete = (result) => {
        setAiAnalysisResult(result);
        setExtractedTextFromImage('');
    };

    const handleAnalysisError = (errorMessage) => {
        setAiAnalysisResult({ error: errorMessage });
        setExtractedTextFromImage('');
    };

    const clearOCRResult = () => {
        setExtractedTextFromImage('');
    };

    const clearAIAnalysisResult = () => {
        setAiAnalysisResult(null);
    };


    useEffect(() => {
        const tokenFromUrl = new URLSearchParams(location.search).get('token');
        const userIdFromUrl = new URLSearchParams(location.search).get('userId');
        const emailFromUrl = new URLSearchParams(location.search).get('email');
        const tokenFromStorage = localStorage.getItem('jwtToken');

        if (tokenFromUrl && userIdFromUrl && emailFromUrl) {
            localStorage.setItem('jwtToken', tokenFromUrl);
            localStorage.setItem('userId', userIdFromUrl);
            localStorage.setItem('userEmail', emailFromUrl);
            setIsLoggedIn(true);
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (tokenFromStorage) {
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }

        const handleStorageChange = () => {
            setIsLoggedIn(!!localStorage.getItem('jwtToken'));
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [location.search]);

    useCopilotReadable({
        description: "The code for the program written in " + language,
        value: inputCode
    });

    useCopilotAction({
        name: "analyzeCode",
        description: "Analyze code, error logs, and optionally extracted text from screenshots for debugging. Returns a classification, detailed analysis, and a proposed solution with code fix.",
        parameters: {
            type: "object",
            properties: {
                code: {
                    type: "string",
                    description: "The code snippet provided by the user.",
                },
                errorLogs: {
                    type: "string",
                    description: "Any relevant error logs provided by the user.",
                },
                language: {
                    type: "string",
                    description: "The programming language of the code (e.g., 'python', 'javascript', 'c++').",
                },
                extractedText: {
                    type: "string",
                    description: "Text extracted from a screenshot, if available.",
                },
                additionalNotes: {
                    type: "string",
                    description: "Any additional context or notes from the user.",
                },
            },
            required: ["code", "errorLogs"],
        },
        handler: async ({ code, errorLogs, language, extractedText, additionalNotes }) => {
            console.log("Copilot Action: analyzeCode triggered with:", {
                code, errorLogs, language, extractedText, additionalNotes
            });
            return `Analyzing your code, logs, and any extracted text... This might take a moment.`;
        },
    });

    useCopilotAction({
        name: "updateCode",
        description: "Updates the code in the editor. The code should be fully runnable and correctly formatted.",
        parameters: {
            type: "object",
            properties: {
                updatedCode: {
                    type: "string",
                    description: "The updated code.",
                },
            },
            required: ["updatedCode"],
        },
        handler: ({ updatedCode }) => {
            setInputCode(cleanCodeString(updatedCode));
            return "Code editor updated successfully!";
        },
    });

    useCopilotChatSuggestions({
        instructions: `The following is the code written in ${language} language.`,
    });


    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 relative">
            <section className="rounded-lg shadow-md">
                <div className="flex justify-between w-full mx-auto items-center">
                    <div>
                        <Link to='/'>
                            <h1 className="text-2xl md:text-3xl font-bold mb-1">Echo Code</h1>
                        </Link>
                        <p className="text-sm md:text-sm text-gray-300">
                            Master programming with our AI-powered code editor and intelligent assistant.
                        </p>
                    </div>
                    <div className="flex gap-4 items-center">
                        {isLoggedIn ? (
                            <>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 rounded-md bg-gradient-to-r from-red-500 via-pink-600 to-purple-600 hover:from-red-600 hover:via-pink-700 hover:to-purple-700 transition-all duration-300 ease-in-out text-white font-semibold shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-70 flex items-center gap-2 border border-red-300 hover:border-red-500"
                                    style={{ minHeight: '36px', fontSize: '0.95rem', letterSpacing: '0.01em' }}
                                >
                                    <FaSignOutAlt className="text-base" /> Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-md bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 hover:from-indigo-600 hover:via-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out text-white font-semibold shadow-md transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-70 flex items-center gap-2 border border-blue-300 hover:border-blue-500"
                                style={{ minHeight: '36px', fontSize: '0.95rem', letterSpacing: '0.01em' }}
                            >
                                <FaSignInAlt className="text-base" /> Login
                            </Link>
                        )}
                    </div>
                </div>
            </section >


            <div className="flex justify-between items-center mt-6 mb-4">
                <div className='flex items-center gap-8'>
                    <header className="text-xl font-bold">AI Code Editor</header>
                    <Dropdown language={language} handleLanguageChange={handleLanguageChange} />
                </div>
                <div className='flex gap-6 mr-4'>
                    <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className={`px-4 py-2 rounded-md transition ${isRunning ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                    >
                        {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                </div>
            </div >
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
                    <div className="flex justify-between items-center bg-gray-700 p-4 rounded-t-lg">
                        <h2 className="text-xl font-semibold">Input Code</h2>
                        <h2 className="text-md text-gray-300 font-semibold">Ask copilot if you need some help.</h2>
                    </div>
                    <Editor
                        height="500px"
                        language={language}
                        value={inputCode}
                        theme="vs-dark"
                        onChange={handleInputChange}
                        onMount={handleEditorDidMount}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                        }}
                    />
                </div>
                <div className="flex-1 bg-gray-800 rounded-lg p-4">
                    <h2 className="text-xl font-semibold mb-2">Output</h2>
                    <pre className="whitespace-pre-wrap h-[500px] overflow-y-auto bg-gray-900 p-4 rounded">
                        {output}
                    </pre>
                </div>
            </div>

            <button
                onClick={() => setShowImageUploadModal(true)}
                className="fixed bottom-8 right-8 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-70 flex items-center justify-center text-xl z-40"
                aria-label="Upload Image for Analysis"
                title="Upload Image for AI Analysis"
            >
                <FaUpload />
            </button>

            {showImageUploadModal && (
                <ImageUploadModal
                    onClose={() => setShowImageUploadModal(false)}
                    currentCode={inputCode}
                    currentOutput={output}
                    currentLanguage={language}
                    onOCRComplete={handleOCRComplete}
                    onAnalysisComplete={handleAIAnalysisComplete}
                    onAnalysisError={handleAnalysisError}
                />
            )}

            {extractedTextFromImage && (
                <div className="fixed bottom-8 left-8 bg-gray-800 text-white p-6 rounded-lg shadow-lg z-30 w-80 max-h-96 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">Extracted Text (OCR)</h3>
                        <button onClick={clearOCRResult} className="text-gray-400 hover:text-red-400">
                            <FaTimesCircle />
                        </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm overflow-y-auto flex-grow bg-gray-900 p-3 rounded">
                        {extractedTextFromImage}
                    </pre>
                    <p className="text-xs text-gray-400 mt-2">This is the text detected in your image.</p>
                </div>
            )}

            {aiAnalysisResult && (
                <div className="fixed bottom-8 left-96 ml-8 bg-gray-800 text-white p-6 rounded-lg shadow-lg z-30 w-[400px] max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">AI Analysis Result</h3>
                        <button onClick={clearAIAnalysisResult} className="text-gray-400 hover:text-red-400">
                            <FaTimesCircle />
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-grow">
                        {aiAnalysisResult.error ? (
                            <div className="text-red-400">
                                <strong>Error:</strong> {aiAnalysisResult.error}
                            </div>
                        ) : (
                            <>
                                <p className="mb-1 text-sm"><span className="font-semibold">Classification:</span> {aiAnalysisResult.classification?.classification} - {aiAnalysisResult.classification?.summary}</p>
                                <p className="mb-1 text-sm"><span className="font-semibold">Error Type:</span> {aiAnalysisResult.analysis?.errorType}</p>
                                <p className="mb-2 text-sm"><span className="font-semibold">Explanation:</span> {aiAnalysisResult.analysis?.explanation}</p>
                                {aiAnalysisResult.solution?.suggestedCodeFix && (
                                    <>
                                        <h4 className="font-bold text-md mb-2">Suggested Code Fix:</h4>
                                        <pre className="bg-gray-700 p-2 rounded text-xs overflow-x-auto">
                                            {aiAnalysisResult.solution.suggestedCodeFix}
                                        </pre>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">This is the detailed analysis from the AI.</p>
                </div>
            )}
        </div>
    );
};

export default HomePage;