require("dotenv").config();
const express = require("express");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");
const cron = require("node-cron");

const app = express();
const PORT = 8000;

let onlineUsers = {};
let roomActivity = {}; // Track last activity time for each room

const io = socketIo(8080, {
  cors: {
    origin: "*", // Allows requests from any domainz
    methods: ["GET", "POST"],s
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

    // Update room activity time
    roomActivity[room] = Date.now();

    const rooms = getRoomsList();
    io.emit("rooms list", rooms);
  });

  socket.on("leave room", (room) => {
    socket.leave(room);
    console.log(`User left room: ${room}`);
  });

  socket.on("chat message", (msg) => {
    console.log("Received message:", msg);

    // Update room activity when a message is sent
    roomActivity[msg.room] = Date.now();

    io.to(msg.room).emit("chat message", msg);
  });

  socket.on("create room", (roomName) => {
    console.log(`Room created: ${roomName}`);
    io.emit("rooms list", getRoomsList());
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("online users", Object.values(onlineUsers));
    console.log(`User disconnected: ${socket.id}`);
  });

  const getRoomsList = () => {
    return Array.from(io.sockets.adapter.rooms.keys())
      .filter((room) => !io.sockets.sockets.has(room))
      .map((roomName) => {
        const users = Array.from(io.sockets.adapter.rooms.get(roomName) || []);
        return { name: roomName, users };
      });
  };
});

// Cron job to clean up inactive rooms every hour
cron.schedule("0 * * * *", () => {
  console.log("Running room cleanup...");
  const now = Date.now();
  const inactiveThreshold = 60 * 60 * 24000; // 21 hour

  Object.keys(roomActivity).forEach((room) => {
    if (now - roomActivity[room] > inactiveThreshold) {
      console.log(`Removing inactive room: ${room}`);
      delete roomActivity[room];
    }
  });

  io.emit("rooms list", getRoomsList()); // Update frontend
});

app.listen(PORT, () => {
  console.log(`Server Listening on Port ${PORT}`);
});
