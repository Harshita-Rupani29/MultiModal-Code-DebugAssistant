import axios from "axios";
import { LANGUAGE_VERSIONS } from "../utils/constants";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export const executeCode = async (language, sourceCode) => {
  try {
    const response = await API.post("/execute", {
      language: language,
      version: LANGUAGE_VERSIONS[language],
      files: [
        {
          content: sourceCode,
        },
      ],
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || 'Failed to execute code. Please try again.'
    );
  }
};
export const extractTextFromImage = async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch('http://localhost:3000/api/ai/extract-text-from-image', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to extract text from image.');
        }

        return await response.json();
    } catch (error) {
        console.error("Error extracting text from image:", error);
        throw error;
    }
};
export const analyzeImageError = async (imageFile, code, errorLogs, language, additionalNotes, extractedText = '') => {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('code', code);
    formData.append('errorLogs', errorLogs);
    formData.append('language', language);
    formData.append('additionalNotes', additionalNotes);
    formData.append('extractedText', extractedText); 

    try {
        const response = await fetch('http://localhost:3000/api/ai/analyze-image-error', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to analyze image error.');
        }

        return await response.json();
    } catch (error) {
        console.error("Error analyzing image error:", error);
        throw error;
    }
};