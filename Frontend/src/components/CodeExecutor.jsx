// src/components/CodeExecutor.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { executeCode } from '../api/Api';
import { LANGUAGE_VERSIONS } from '../utils/constants';

const CodeExecutor = ({ code, onLanguageChange }) => {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

  const languages = Object.keys(LANGUAGE_VERSIONS);

  const handleExecute = async () => {
    setIsLoading(true);
    setOutput("");
    setError("");

    try {
      const result = await executeCode(selectedLanguage, code);
      if (result.run.stderr) {
        setError(result.run.stderr);
      } else {
        setOutput(result.run.stdout);
      }
    } catch (err) {
      console.error("Execution error:", err);
      setError(err.message || "An unexpected error occurred during execution.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  return (
    <div className="bg-gray-700 p-4 rounded-b-md">
      <div className="flex justify-between items-center mb-4">
        <select
          className="bg-gray-800 text-white p-2 rounded mr-2"
          value={selectedLanguage}
          onChange={handleLanguageChange}
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button
          onClick={handleExecute}
          disabled={isLoading}
          className={`px-4 py-2 rounded font-bold ${
            isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {isLoading ? "Running..." : "Run Code"}
        </button>
      </div>

      <div className="bg-gray-800 p-3 rounded h-40 overflow-y-auto text-sm">
        <h4 className="font-semibold mb-2 text-white">Output:</h4>
        {output && <pre className="text-green-300 whitespace-pre-wrap">{output}</pre>}
        {error && <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>}
        {!output && !error && !isLoading && <p className="text-gray-400">Click Run Code to see output.</p>}
      </div>
    </div>
  );
};

CodeExecutor.propTypes = {
  code: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func, 
};

export default CodeExecutor;