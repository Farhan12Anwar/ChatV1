require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");
const axios = require("axios");

const app = express();
const PORT = 8000;

let onlineUsers = {};

const server = http.createServer(app);
const io = socketIo(8080, {
  cors: {
    origin: "http://localhost:3000", // React app origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.use(express.static("public"));

// Socket.IO connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("user connected", (username) => {
    onlineUsers[socket.id] = username;
    io.emit("online users", Object.values(onlineUsers)); // Broadcast online users
  });

  // Join room
  socket.on("join room", ({ room, username }) => {
    socket.join(room);
    console.log(`${username} joined room: ${room}`);

    const rooms = getRoomsList();
    io.emit("rooms list", rooms);
  });

  // Leave room
  socket.on("leave room", (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  // Handle chat messages
  socket.on("chat message", async (msg) => {
    console.log("Received message:", msg);
    

    if (msg.image) {
      // Handle image messages
      console.log("Received an image message.");
      io.to(msg.room).emit("chat message", msg);
    } else if (msg.text?.startsWith("!")) {
      // Handle commands
      const command = msg.text.substring(1); // Remove '!' to get the command text
      console.log("Calling Hugging Face API with command:", command);

      try {
        const response = await axios.post(
          "https://api-inference.huggingface.co/models/google/flan-t5-small", // Hugging Face API endpoint
          { inputs: command },
          {
            headers: {
              Authorization: `Bearer ${process.env.HF_TOKEN}`, // Hugging Face API token
              "Content-Type": "application/json",
            },
          }
        );

        const apiResponse =
          response.data && response.data.length > 0
            ? response.data[0].generated_text || "No response generated"
            : "No response generated";

        io.to(msg.room).emit("chat message", {
          sender: "Omni",
          text: apiResponse,
          room: msg.room,
        });
      } catch (error) {
        console.error("Error querying Hugging Face API:", error.message);
        io.to(msg.room).emit("chat message", {
          sender: "Omni",
          text: "There was an error processing your command.",
          room: msg.room,
        });
      }
    } else {
      // Handle text messages
      io.to(msg.room).emit("chat message", msg); // Forward text messages to the room
      console.log(`Message in ${msg.room}: ${msg.text} by ${msg.sender}`);
    }
  });

  // Create room
  socket.on("create room", (roomName) => {
    console.log(`Room created: ${roomName}`);
    io.emit("rooms list", getRoomsList());
  });

  // Disconnect
  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("online users", Object.values(onlineUsers)); // Broadcast updated online users
    console.log(`User disconnected: ${socket.id}`);
  });

  // Get list of rooms
  const getRoomsList = () => {
    return Array.from(io.sockets.adapter.rooms.keys())
      .filter((room) => !io.sockets.sockets.has(room)) // Exclude socket-specific rooms
      .map((roomName) => {
        const users = Array.from(io.sockets.adapter.rooms.get(roomName) || []);
        return { name: roomName, users };
      });
  };
});

app.listen(PORT, () => {
  console.log(`Server Listening on Port ${PORT}`);
});
