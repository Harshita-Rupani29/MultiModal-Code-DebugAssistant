
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import socket from '../utils/socket';
import CodeEditor from '../components/CodeEditor';
import CodeExecutor from '../components/CodeExecutor';
import { CODE_SNIPPETS } from '../utils/constants'; 

const EditorPage = () => {
  const { roomId, username } = useParams();
  const [code, setCode] = useState(CODE_SNIPPETS.javascript);
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');

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

    socket.on('code-update', (newCode) => {
      console.log('Received code update:', newCode);
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

  const handleEditorChange = useCallback((newCode) => {
    setCode(newCode);
    socket.emit('code-change', roomId, newCode);
  }, [roomId]);

  const handleLanguageChangeFromDropdown = useCallback((newLanguage) => {
    setSelectedLanguage(newLanguage); 
    const newCodeSnippet = CODE_SNIPPETS[newLanguage] || ''; 
    setCode(newCodeSnippet);
    socket.emit('language-change', roomId, newLanguage, newCodeSnippet);
  }, [roomId]);


  useEffect(() => {
    socket.on('language-change-update', (updatedLanguage, updatedCodeSnippet) => {
      console.log('Received language change update:', updatedLanguage);
      setSelectedLanguage(updatedLanguage);
      setCode(updatedCodeSnippet);
    });

    return () => {
      socket.off('language-change-update');
    };
  }, []); 

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
        <CodeEditor
          code={code}
          onCodeChange={handleEditorChange}
          roomId={roomId}
          language={selectedLanguage} />
        <CodeExecutor
          code={code}
          onLanguageChange={handleLanguageChangeFromDropdown} 
        />
      </div>
    </div>
  );
};

export default EditorPage;