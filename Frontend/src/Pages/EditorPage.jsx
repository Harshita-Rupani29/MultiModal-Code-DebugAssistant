// src/pages/EditorPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../utils/socket';
import CodeEditor from '../components/CodeEditor';
import CodeExecutor from '../components/CodeExecutor';
import { CODE_SNIPPETS } from '../utils/constants'; // <--- Import CODE_SNIPPETS

const EditorPage = () => {
  const { roomId, username } = useParams();
  const [code, setCode] = useState(CODE_SNIPPETS.javascript); // <--- Initialize with default JS snippet
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript'); // <--- New state for selected language

  useEffect(() => {
    if (!roomId || !username) {
      setErrorMessage("Room ID or username is missing.");
      return;
    }

    console.log(`Attempting to join room: ${roomId} as ${username}`);
    socket.emit('join-room', roomId, username);

    socket.on('initial-code', (initialCode) => {
      console.log('Received initial code:', initialCode);
      setCode(initialCode);
    });

    // When code changes from another user or initial load, update the editor
    socket.on('code-update', (newCode) => {
      console.log('Received code update:', newCode);
      // Only update if the new code is different
      if (code !== newCode) {
        setCode(newCode);
      }
    });

    socket.on('user-list', (updatedUserList) => {
      console.log('Received user list:', updatedUserList);
      setUsers(updatedUserList);
    });

    socket.on('room-error', (message) => {
        console.error('Room Error:', message);
        setErrorMessage(message);
    });

    return () => {
      console.log('Leaving room and cleaning up listeners.');
      socket.off('initial-code');
      socket.off('code-update');
      socket.off('user-list');
      socket.off('room-error');
    };
  }, [roomId, username]);

  // Handler for when the Monaco editor's content changes
  const handleEditorChange = useCallback((newCode) => {
    setCode(newCode);
    socket.emit('code-change', roomId, newCode);
  }, [roomId]);

  // Handler for when the language dropdown in CodeExecutor changes
  const handleLanguageChangeFromDropdown = useCallback((newLanguage) => {
    setSelectedLanguage(newLanguage); // Update language state
    // Update the code in the editor with the snippet for the chosen language
    const newCodeSnippet = CODE_SNIPPETS[newLanguage] || ''; // Fallback to empty string if no snippet
    setCode(newCodeSnippet);
    // You might also want to emit this language change to other users in the room
    // so their editors also switch language and code snippet.
    socket.emit('language-change', roomId, newLanguage, newCodeSnippet);
  }, [roomId]);


  // Listen for language changes from other users
  useEffect(() => {
    socket.on('language-change-update', (updatedLanguage, updatedCodeSnippet) => {
      console.log('Received language change update:', updatedLanguage);
      setSelectedLanguage(updatedLanguage);
      setCode(updatedCodeSnippet);
    });

    return () => {
      socket.off('language-change-update');
    };
  }, []); // Empty dependency array means this effect runs once on mount

  if (errorMessage) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500 text-xl">
        Error: {errorMessage}
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="w-1/4 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-4">Room: {roomId}</h2>
        <h3 className="text-lg font-semibold mb-2">Users:</h3>
        <ul>
          {users.map((user, index) => (
            <li key={index} className="mb-1">{user} {user === username && "(You)"}</li>
          ))}
        </ul>
      </div>
      <div className="flex-1 flex flex-col">
        {/* Pass selectedLanguage to CodeEditor so it can set defaultLanguage */}
        <CodeEditor
          code={code}
          onCodeChange={handleEditorChange}
          roomId={roomId}
          language={selectedLanguage} // <--- Pass the selected language
        />
        {/* Pass the new handleLanguageChangeFromDropdown to CodeExecutor */}
        <CodeExecutor
          code={code}
          onLanguageChange={handleLanguageChangeFromDropdown} // <--- Pass the handler
        />
      </div>
    </div>
  );
};

export default EditorPage;