// Backend Code (Server Side)
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

  socket.on("join room", ({ room, username }) => {
    socket.join(room);
    console.log(`${username} joined room: ${room}`);
    io.emit("rooms list", getRoomsList());
  });

  socket.on("leave room", (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  socket.on("create room", (roomName) => {
    if (!io.sockets.adapter.rooms.has(roomName)) {
      socket.join(roomName);
      console.log(`Room created and joined: ${roomName}`);
      io.emit("rooms list", getRoomsList());
    } else {
      socket.emit("room exists", roomName);
    }
  });

  socket.on("chat message", (msg) => {
    io.to(msg.room).emit("chat message", msg);
    console.log(`Message in ${msg.room}: ${msg.text} by ${msg.sender}`);
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
