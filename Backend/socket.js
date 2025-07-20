// src/socket.js (This is your setupSocket.js file)
const fs = require("fs");
const path = require("path");

function setupSocket(io, rooms) { // <--- Receive 'rooms' map here
    io.on("connection", (socket) => {
        console.log("New client connected");

        socket.on("join-room", async (roomId, username) => {
            socket.join(roomId);
            console.log(`User ${username} joined room: ${roomId}`);

            // Ensure the room exists in the in-memory map
            if (!rooms.has(roomId)) {
                // Initialize room with users map, default code, and default language
                rooms.set(roomId, {
                    users: new Map(),
                    code: "// Type your JavaScript code here\nfunction example() {\n \t// Start typing here...\n}\n", // Default initial code
                    language: "javascript" // Default initial language
                });
            }

            const roomData = rooms.get(roomId);
            roomData.users.set(socket.id, username);

            const filePath = path.join(__dirname, "../User", `${roomId}.js`); // Note: .js extension might be problematic if not always JS

            // 1. Ensure the 'User' directory exists
            const userDir = path.join(__dirname, "../User");
            if (!fs.existsSync(userDir)) {
                try {
                    fs.mkdirSync(userDir, { recursive: true });
                    console.log(`Created directory: ${userDir}`);
                } catch (err) {
                    console.error(`Error creating User directory ${userDir}:`, err);
                    socket.emit("room-error", "Server error: Could not set up room files.");
                    return;
                }
            }

            // 2. Read the file, creating it if it doesn't exist.
            //    Prioritize the in-memory `roomData.code` if it exists.
            let fileContent = roomData.code; // Start with the in-memory code
            let initialLanguage = roomData.language; // Start with the in-memory language

            try {
                if (fs.existsSync(filePath)) {
                    // If file exists, read it and *update* in-memory code to match disk (e.g., if server restarted)
                    const diskContent = fs.readFileSync(filePath, "utf8");
                    if (diskContent) { // Only update if disk content is not empty
                        fileContent = diskContent;
                        roomData.code = diskContent; // Sync in-memory with disk
                        console.log(`Successfully read file for room ${roomId}`);
                    }
                } else {
                    // File does not exist, write the current in-memory content to disk
                    console.warn(`File for room ${roomId} not found. Creating it with initial in-memory content.`);
                    fs.writeFileSync(filePath, fileContent, "utf8");
                }
            } catch (err) {
                console.error("Error during initial file operation (read/create):", err);
                socket.emit("initial-code", "// Error loading code: " + err.message);
                socket.emit("language-change-update", "javascript", "// Error loading code: " + err.message); // Fallback language
                return;
            }

            // Send initial code and language to the joining client
            socket.emit("initial-code", fileContent);
            socket.emit("language-change-update", initialLanguage, fileContent); // <--- Send initial language and code snippet

            // Emit updated user list to all in the room
            io.to(roomId).emit("user-list", Array.from(roomData.users.values()));
        });

        socket.on("code-change", (roomId, newCode) => {
            const roomData = rooms.get(roomId);
            if (roomData) {
                roomData.code = newCode; // Update in-memory code
            }

            const filePath = path.join(__dirname, "../User", `${roomId}.js`);

            // Handle writing the file, ensuring it exists
            // Using fs.writeFile with 'w' flag will create if not exists or overwrite
            fs.writeFile(filePath, newCode, { flag: 'w' }, (writeErr) => {
                if (writeErr) {
                    console.error(`Error writing file for room ${roomId}:`, writeErr);
                    return;
                }
                // Broadcast to all clients in the room *except the sender*
                socket.to(roomId).emit("code-update", newCode);
            });
        });

        // Language change listener
        socket.on('language-change', (roomId, newLanguage, newCodeSnippet) => {
            const roomData = rooms.get(roomId);
            if (roomData) {
                roomData.language = newLanguage; // Update in-memory language
                roomData.code = newCodeSnippet; // Update in-memory code with the snippet for the new language
            }

            // You might want to also save the language to a file or database if persistence is needed
            // For now, it's just in memory.

            console.log(`Backend: Received 'language-change' for room ${roomId}. New language: ${newLanguage}. Broadcasting...`);
            // Broadcast the language and new code snippet to all others in the room
            socket.to(roomId).emit('language-change-update', newLanguage, newCodeSnippet);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
            rooms.forEach((room, roomId) => {
                if (room.users.has(socket.id)) {
                    room.users.delete(socket.id);

                    // If room still has users, just update the user list
                    if (room.users.size > 0) {
                        io.to(roomId).emit("user-list", Array.from(room.users.values()));
                    } else {
                        // If room is empty, remove from in-memory map and delete file
                        rooms.delete(roomId);
                        const filePath = path.join(__dirname, "../User", `${roomId}.js`);

                        fs.access(filePath, fs.constants.F_OK, (err) => {
                            if (!err) { // If file exists
                                fs.unlink(filePath, (unlinkErr) => {
                                    if (unlinkErr) {
                                        console.error("Error deleting file:", unlinkErr);
                                    } else {
                                        console.log(`Deleted file for empty room: ${roomId}`);
                                    }
                                });
                            } else {
                                console.log(`File for room ${roomId} already does not exist (not deleting).`);
                            }
                        });
                    }
                    // Break out of forEach after finding the user's room
                    // Note: forEach doesn't allow direct breaks, a `for...of` loop with `break` would be better
                    // For simplicity, this is often "good enough" but less efficient for many rooms/users.
                }
            });
        });
    });
}

module.exports = setupSocket;