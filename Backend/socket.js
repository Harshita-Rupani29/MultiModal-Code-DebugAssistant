
const fs = require("fs");
const path = require("path");

function setupSocket(io, rooms) { 
    io.on("connection", (socket) => {
        console.log("New client connected");

        socket.on("join-room", async (roomId, username) => {
            socket.join(roomId);
            console.log(`User ${username} joined room: ${roomId}`);

            if (!rooms.has(roomId)) {
                rooms.set(roomId, {
                    users: new Map(),
                    code: "// Type your JavaScript code here\nfunction example() {\n \t// Start typing here...\n}\n",
                    language: "javascript" 
                });
            }

            const roomData = rooms.get(roomId);
            roomData.users.set(socket.id, username);

            const filePath = path.join(__dirname, "../User", `${roomId}.js`); 
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

            let fileContent = roomData.code;
            let initialLanguage = roomData.language; 

            try {
                if (fs.existsSync(filePath)) {
                    const diskContent = fs.readFileSync(filePath, "utf8");
                    if (diskContent) { 
                        fileContent = diskContent;
                        roomData.code = diskContent; 
                        console.log(`Successfully read file for room ${roomId}`);
                    }
                } else {
                    console.warn(`File for room ${roomId} not found. Creating it with initial in-memory content.`);
                    fs.writeFileSync(filePath, fileContent, "utf8");
                }
            } catch (err) {
                console.error("Error during initial file operation (read/create):", err);
                socket.emit("initial-code", "// Error loading code: " + err.message);
                socket.emit("language-change-update", "javascript", "// Error loading code: " + err.message); 
                return;
            }

            socket.emit("initial-code", fileContent);
            socket.emit("language-change-update", initialLanguage, fileContent); 
            io.to(roomId).emit("user-list", Array.from(roomData.users.values()));
        });

        socket.on("code-change", (roomId, newCode) => {
            const roomData = rooms.get(roomId);
            if (roomData) {
                roomData.code = newCode; 
            }

            const filePath = path.join(__dirname, "../User", `${roomId}.js`);

            fs.writeFile(filePath, newCode, { flag: 'w' }, (writeErr) => {
                if (writeErr) {
                    console.error(`Error writing file for room ${roomId}:`, writeErr);
                    return;
                }
                socket.to(roomId).emit("code-update", newCode);
            });
        });

        
        socket.on('language-change', (roomId, newLanguage, newCodeSnippet) => {
            const roomData = rooms.get(roomId);
            if (roomData) {
                roomData.language = newLanguage; 
                roomData.code = newCodeSnippet; 
            }


            console.log(`Backend: Received 'language-change' for room ${roomId}. New language: ${newLanguage}. Broadcasting...`);
            
            socket.to(roomId).emit('language-change-update', newLanguage, newCodeSnippet);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
            rooms.forEach((room, roomId) => {
                if (room.users.has(socket.id)) {
                    room.users.delete(socket.id);

                    if (room.users.size > 0) {
                        io.to(roomId).emit("user-list", Array.from(room.users.values()));
                    } else {
                        rooms.delete(roomId);
                        const filePath = path.join(__dirname, "../User", `${roomId}.js`);

                        fs.access(filePath, fs.constants.F_OK, (err) => {
                            if (!err) {
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
                    
                }
            });
        });
    });
}

module.exports = setupSocket;