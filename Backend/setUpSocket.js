// socketSetup.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/user'); // Still need User model for user details

// Basic in-memory storage for sessions and invitations
// In a real application, this would be in a database (e.g., MongoDB, PostgreSQL)
const activeSessions = {}; // { sessionId: { ownerId: 'userId', invitedUsers: ['userId1', 'userId2'], currentCode: '', currentLanguage: 'python' } }

const canUserJoinCollaborativeSession = async (userId, sessionId) => {
    if (!userId) {
        return false;
    }

    const session = activeSessions[sessionId];

    if (!session) {
        console.log(`Collaborative Session ${sessionId} not found in memory.`);
        return false;
    }

    // Check if the user is the owner OR is among the invited users
    if (session.ownerId === userId || session.invitedUsers.includes(userId)) {
        return true;
    }

    console.log(`User ${userId} is not authorized for session ${sessionId}. Owner: ${session.ownerId}, Invited: ${session.invitedUsers}`);
    return false;
};

/**
 * Sets up and configures the Socket.IO server.
 * @param {http.Server} server - The HTTP server instance to attach Socket.IO to.
 */
module.exports.setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
           origin: process.env.CLIENT_URL || "http://localhost:3000",
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true,
        }
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            socket.isAuthenticated = false;
            socket.userId = null;
            socket.userHandle = 'Guest';
            console.log(`Socket connection: Unauthenticated connection ${socket.id}`);
            return next();
        }

        try {
            const decodedToken = jwt.verify(token, process.env.JWT_KEY);
            socket.isAuthenticated = true;
            socket.userId = decodedToken.userId;

            // Fetch user from database to get first_name or email for userHandle
            const user = await User.findById(decodedToken.userId);

            if (user) {
                socket.userHandle = user.first_name || user.email || `User-${socket.userId}`;
            } else {
                socket.userHandle = `User-${socket.userId}`;
                console.warn(`User not found in DB for ID: ${socket.userId} after token verification.`);
            }

            console.log(`Socket connection: Authenticated ${socket.id} for User ID: ${socket.userId} (${socket.userHandle})`);
            next();
        } catch (err) {
            console.error(`Socket authentication failed for ${socket.id}: ${err.message}`);
            socket.isAuthenticated = false;
            socket.userId = null;
            socket.userHandle = 'Guest';
            // Optionally emit an auth error to the client before closing or allowing guest access
            socket.emit('authError', { message: "Authentication failed: Invalid token. Please log in again." });
            return next(new Error("Authentication failed: Invalid token."));
        }
    });

    io.on('connection', (socket) => {
        const { userId, userHandle, isAuthenticated } = socket;
        console.log(`User ${userHandle} (${userId || 'Unauthenticated'}) connected with socket ID: ${socket.id}`);

        let currentSessionId = null;

        socket.emit('connected', { socketId: socket.id, userId, userHandle, isAuthenticated });

        // Event to create/join a collaborative session (for the owner)
        socket.on('createOrJoinSession', async ({ sessionId, initialCode, language }) => {
            if (!isAuthenticated) {
                socket.emit('authError', { message: 'You must be logged in to create or join a session.' });
                return;
            }

            if (!sessionId) {
                // In a real app, generate a unique ID here
                sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                console.log(`Generated new session ID: ${sessionId}`);
            }

            if (!activeSessions[sessionId]) {
                // Create new session if it doesn't exist
                activeSessions[sessionId] = {
                    ownerId: userId,
                    invitedUsers: [], // No invited users initially
                    currentCode: initialCode || '',
                    currentLanguage: language || 'python'
                };
                console.log(`Session ${sessionId} created by ${userHandle}.`);
            } else if (activeSessions[sessionId].ownerId !== userId) {
                 // If session exists and user is not owner, they must be invited
                const isAuthorized = await canUserJoinCollaborativeSession(userId, sessionId);
                if (!isAuthorized) {
                    socket.emit('authError', { message: 'You are not authorized to join this session.' });
                    return;
                }
            }

            // Leave previous session if any
            if (currentSessionId && currentSessionId !== sessionId) {
                socket.leave(currentSessionId);
                console.log(`User ${userHandle} left previous session room: ${currentSessionId}`);
                io.to(currentSessionId).emit('userLeftSession', { userId, userHandle, socketId: socket.id });
            }

            socket.join(sessionId);
            currentSessionId = sessionId;

            // Send initial state to the joining user
            const sessionData = activeSessions[sessionId];
            socket.emit('sessionJoined', {
                sessionId,
                ownerId: sessionData.ownerId,
                invitedUsers: sessionData.invitedUsers,
                initialCode: sessionData.currentCode,
                language: sessionData.currentLanguage,
                message: `You joined session: ${sessionId}.`
            });

            console.log(`User ${userHandle} joined session room: ${sessionId}`);
            // Notify others in the session
            socket.to(sessionId).emit('userJoinedSession', { userId, userHandle, socketId: socket.id, message: `${userHandle} has joined the session.` });
        });

        // Event: Invite a user to a session
        socket.on('inviteUser', async ({ sessionId, invitedUserId }) => {
            if (!isAuthenticated || !sessionId || !invitedUserId) {
                socket.emit('error', { message: 'Invalid invite request.' });
                return;
            }

            const session = activeSessions[sessionId];
            if (!session || session.ownerId !== userId) {
                socket.emit('authError', { message: 'You can only invite users to sessions you own.' });
                return;
            }

            // Prevent inviting self or already invited users
            if (invitedUserId === userId || session.invitedUsers.includes(invitedUserId)) {
                socket.emit('error', { message: 'User already invited or cannot invite self.' });
                return;
            }

            // Add to in-memory invited list
            session.invitedUsers.push(invitedUserId);
            console.log(`User ${userId} invited ${invitedUserId} to session ${sessionId}. Invited users: ${session.invitedUsers}`);

            // Find the invited user's active sockets and notify them
            // This is complex in real-time, often a push notification/email is also used
            io.to(sessionId).emit('invitedUserListUpdate', { invitedUsers: session.invitedUsers });

            // Notify the specific invited user's connected sockets (if any)
            // This loop iterates through all connected sockets to find the invited user's sockets
            for (const [id, connectedSocket] of io.of("/").sockets) {
                if (connectedSocket.userId === invitedUserId) {
                    connectedSocket.emit('youAreInvited', {
                        sessionId,
                        inviterHandle: userHandle,
                        message: `${userHandle} has invited you to a collaborative session!`
                    });
                }
            }
            socket.emit('inviteSentConfirmation', { invitedUserId, sessionId, message: `Invitation sent to ${invitedUserId}.` });
        });


        socket.on('leaveSession', (sessionId) => {
            if (currentSessionId === sessionId) {
                socket.leave(sessionId);
                currentSessionId = null;
                console.log(`User ${userHandle} left session room: ${sessionId}`);
                io.to(sessionId).emit('userLeftSession', { userId, userHandle, socketId: socket.id });

                // If session owner leaves and no one else is there, optionally clean up session
                const clientsInRoom = io.sockets.adapter.rooms.get(sessionId);
                if (!clientsInRoom || clientsInRoom.size === 0) {
                    if (activeSessions[sessionId] && activeSessions[sessionId].ownerId === userId) {
                         // Only delete if owner leaves and room is empty
                        delete activeSessions[sessionId];
                        console.log(`Session ${sessionId} closed as owner ${userHandle} left and room is empty.`);
                    }
                }

            } else {
                console.warn(`User ${userHandle} tried to leave session ${sessionId} but was not in it or it's not their current session.`);
            }
        });

        socket.on('codeChange', ({ sessionId, codeContent, language }) => {
            if (!isAuthenticated || currentSessionId !== sessionId) {
                console.warn(`Attempted unauthorized/out-of-room code change by ${userHandle} for ${sessionId}.`);
                return;
            }
            // Update in-memory code
            if (activeSessions[sessionId]) {
                activeSessions[sessionId].currentCode = codeContent;
                activeSessions[sessionId].currentLanguage = language;
            }
            socket.to(sessionId).emit('codeUpdate', { codeContent, language, userId, userHandle });
        });

        socket.on('cursorActivity', ({ sessionId, cursorPosition }) => {
            if (!isAuthenticated || currentSessionId !== sessionId) {
                return;
            }
            socket.to(sessionId).emit('cursorUpdate', { cursorPosition, userId, userHandle });
        });

        socket.on('selectionChange', ({ sessionId, selection }) => {
            if (!isAuthenticated || currentSessionId !== sessionId) {
                return;
            }
            socket.to(sessionId).emit('selectionUpdate', { selection, userId, userHandle });
        });

        socket.on('disconnect', () => {
            console.log(`User ${userHandle} (${userId || 'Unauthenticated'}) disconnected with socket ID: ${socket.id}`);
            if (currentSessionId) {
                io.to(currentSessionId).emit('userLeftSession', { userId, userHandle, socketId: socket.id });

                // Optional: Clean up session if owner disconnects and room becomes empty
                const clientsInRoom = io.sockets.adapter.rooms.get(currentSessionId);
                if (!clientsInRoom || clientsInRoom.size === 0) {
                     if (activeSessions[currentSessionId] && activeSessions[currentSessionId].ownerId === userId) {
                        delete activeSessions[currentSessionId];
                        console.log(`Session ${currentSessionId} closed as owner ${userHandle} disconnected and room is empty.`);
                    }
                }
            }
        });
    });
};