require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");
const axios = require("axios"); // Import axios for API calls

const app = express();
const PORT = 8000;

let onlineUsers = {};

const server = http.createServer(app);
const io = socketIo(8080, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  maxHttpBufferSize: 1e8,
});

app.use(cors());

app.use(express.static("public"));

// Socket.IO connection
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("user connected", (username) => {
    onlineUsers[socket.id] = username;
    io.emit("online users", Object.values(onlineUsers));
  });

  socket.on("join room", ({ room, username }) => {
    socket.join(room);
    console.log(`${username} joined room: ${room}`);

    const rooms = getRoomsList();
    io.emit("rooms list", rooms);
  });

  socket.on("leave room", (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  socket.on("chat message", async (msg) => {
    console.log("Received message:", msg);

    if (msg.image) {
      console.log("Received an image message.");
      io.to(msg.room).emit("chat message", msg);
    } else {
      // Handle text messages
      try {
        io.to(msg.room).emit("chat message", msg);
        console.log(`Message in ${msg.room}: ${msg.text} by ${msg.sender}`);
      } catch (error) {
        console.log(error);
      }
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
