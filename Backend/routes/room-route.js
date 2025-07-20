// routes/room-route.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

module.exports = (rooms) => {
  router.get("/createroom", async (req, res) => {
    try {
      const roomId = Math.random().toString(36).substring(2, 8);
      rooms.set(roomId, { users: new Map() });

      const userDir = path.join(__dirname, "../User");
      if (!fs.existsSync(userDir)) fs.mkdirSync(userDir);

      const filePath = path.join(userDir, `${roomId}.js`);
      const initialContent = "// Type your JavaScript code here\nfunction example() {\n  // Start typing here...\n}\n";
      fs.writeFileSync(filePath, initialContent);

      res.status(201).json({ roomId });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
};
