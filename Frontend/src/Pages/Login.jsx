import React, { useState, useEffect } from 'react';

// Main Login component
const Login = () => {
    const [userId, setUserId] = useState(null);
    const [email, setEmail] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Function to parse URL parameters
        const getUrlParameter = (name) => {
            name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
            const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
            const results = regex.exec(window.location.search);
            return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
        };

        // Check for token and user info in URL after Google OAuth callback
        const token = getUrlParameter('token');
        const id = getUrlParameter('userId');
        const userEmail = getUrlParameter('email');
        const authMessage = getUrlParameter('message'); // Capture message from OAuth callback

        if (token && id && userEmail) {
            // Store token and user info (e.g., in localStorage)
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('userId', id);
            localStorage.setItem('userEmail', userEmail);

            setUserId(id);
            setEmail(userEmail);
            setMessage(authMessage || 'Successfully logged in with Google!');

            // Clean up URL parameters (optional, but good for UX)
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (localStorage.getItem('jwtToken')) {
            // If token already exists in localStorage (e.g., on page refresh)
            setUserId(localStorage.getItem('userId'));
            setEmail(localStorage.getItem('userEmail'));
            setMessage('Welcome back!');
        }
    }, []);

    const handleGuestLogin = () => {
        setLoading(true);
        setMessage('Continuing as guest...');
        // Simulate guest login success
        setTimeout(() => {
            setUserId('guest-user-123'); // Assign a generic ID for guest
            setEmail('guest@example.com');
            setMessage('You are now browsing as a guest.');
            localStorage.removeItem('jwtToken'); // Ensure no old JWT is present for guest
            localStorage.setItem('userId', 'guest-user-123');
            localStorage.setItem('userEmail', 'guest@example.com');
            setLoading(false);
            window.location.href = '/home'; // Redirect to /home after guest login
        }, 1000);
    };

    const handleGoogleLogin = () => {
        setLoading(true);
        setMessage('Redirecting to Google for authentication...');
         window.location.href = 'http://localhost:3000/api/users/auth/google'; 
    };

    const handleLogout = () => {
        setUserId(null);
        setEmail(null);
        setMessage('Logged out.');
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 font-sans">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md text-center border border-gray-700">
                <h1 className="text-3xl font-bold text-blue-400 mb-6">Welcome</h1>

                {userId && email ? (
                    <div className="space-y-4">
                        <p className="text-lg text-gray-300">Logged in as:</p>
                        <p className="text-xl font-semibold text-blue-300">User ID: {userId}</p>
                        <p className="text-xl font-semibold text-blue-300">Email: {email}</p>
                        <button
                            onClick={handleLogout}
                            className="w-full py-3 px-6 bg-red-700 text-white font-semibold rounded-lg shadow-md hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-75 transition duration-300 ease-in-out"
                            disabled={loading}
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-gray-400 mb-6">Choose your login method:</p>

                        <button
                            onClick={handleGoogleLogin}
                            className="w-full flex items-center justify-center py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-300 ease-in-out"
                            disabled={loading}
                        >
                            {loading && message.includes('Google') ? (
                                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12.24 10.24v3.52h6.08c-.24 1.68-.96 3.12-2.08 4.16l-.08.08-2.72 2.16c-1.68 1.36-3.84 2.16-6.16 2.16-4.96 0-9.04-4.08-9.04-9.04s4.08-9.04 9.04-9.04c2.64 0 4.96 1.04 6.72 2.72l2.32-2.32c-2.4-2.4-5.68-3.84-9.04-3.84-7.2 0-13.04 5.84-13.04 13.04s5.84 13.04 13.04 13.04c3.84 0 7.2-1.68 9.6-4.48 2.4-2.8 3.68-6.4 3.68-10.08 0-.72-.08-1.44-.24-2.16h-12.8v-3.52z"/>
                                </svg>
                            )}
                            Continue with Google
                        </button>

                        <button
                            onClick={handleGuestLogin}
                            className="w-full py-3 px-6 bg-gray-700 text-gray-200 font-semibold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-300 ease-in-out"
                            disabled={loading}
                        >
                            {loading && message.includes('guest') ? (
                                <svg className="animate-spin h-5 w-5 mr-3 text-gray-200" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : null}
                            Continue as Guest
                        </button>

                        {message && (
                            <p className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
