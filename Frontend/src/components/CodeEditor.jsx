// src/components/CodeEditor.jsx
import PropTypes from 'prop-types';
import Editor from "@monaco-editor/react";

const CodeEditor = ({ code, onCodeChange, roomId, language }) => { 
  const handleMonacoEditorChange = (newCode) => {
    onCodeChange(newCode);
  };

  return (
    <Editor
      height="80vh"
      language={language} 
      value={code}
      onChange={handleMonacoEditorChange}
      options={{
        minimap: { enabled: false },
        fontSize: 16,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        lineNumbers: "on",
        roundedSelection: false,
        scrollBeyondLastLine: true,
        automaticLayout: true,
      }}
      theme="vs-dark"
    />
  );
};

CodeEditor.propTypes = {
  code: PropTypes.string.isRequired,
  onCodeChange: PropTypes.func.isRequired,
  roomId: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired, 
};

export default CodeEditor;