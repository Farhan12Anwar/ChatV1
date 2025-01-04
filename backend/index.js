require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");

const app = express();
const PORT = 8000;

const server = http.createServer(app);
const io = socketIo(8080, {
  cors: {
    origin: "http://localhost:3000", // React app origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room handler
  socket.on("join room", ({ room, username }) => {
    socket.join(room);
    console.log(`${username} joined room: ${room}`);

    // Update rooms list
    const rooms = Array.from(io.sockets.adapter.rooms.keys())
      .filter((r) => !io.sockets.sockets.has(r))
      .map((roomName) => {
        const users = Array.from(io.sockets.adapter.rooms.get(roomName) || []);
        return { name: roomName, users };
      });

    io.emit("rooms list", rooms);
  });

  // Leave room handler
  socket.on("leave room", (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  // Chat message handler
  socket.on("chat message", (msg) => {
    io.to(msg.room).emit("chat message", msg);
    console.log(`Message in ${msg.room}: ${msg.text} by ${msg.sender}`);
  });

  // Create room handler
  socket.on("create room", (roomName) => {
    console.log(`Room created: ${roomName}`);
    io.emit("rooms list", getRoomsList());
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });

  const getRoomsList = () => {
    return Array.from(io.sockets.adapter.rooms.keys())
      .filter((r) => !io.sockets.sockets.has(r))
      .map((roomName) => {
        const users = Array.from(io.sockets.adapter.rooms.get(roomName) || []);
        return { name: roomName, users };
      });
  };
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.listen(PORT, () => {
  console.log(`Server Listening on Port ${PORT}`);
});
