require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");
const axios = require("axios");

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

    if (msg.text.startsWith("!")) {
      console.log("Detected command:", msg.text);

      const command = msg.text.substring(1); // Remove '!' to get the command text
      try {
        console.log("Calling Hugging Face API with command:", command);
        const response = await axios.post(
          "https://api-inference.huggingface.co/models/google/flan-t5-small", // Correct Hugging Face endpoint
          { inputs: command },
          {
            headers: {
              Authorization: `Bearer ${`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`}`, // Use your Hugging Face API token here
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data && response.data.length > 0) {
          const apiResponse =
            response.data[0].generated_text || "No response generated";
          io.to(msg.room).emit("chat message", {
            sender: "Omni",
            text: apiResponse,
            room: msg.room,
          });
        } else {
          io.to(msg.room).emit("chat message", {
            sender: "Omni",
            text: "No response generated",
            room: msg.room,
          });
        }
      } catch (error) {
        console.error("Error querying Hugging Face API:", error.message);
        io.to(msg.room).emit("chat message", {
          sender: "Omni",
          text: "There was an error processing your command.",
          room: msg.room,
        });
      }
    } else {
      io.to(msg.room).emit("chat message", msg);
      console.log(`Message in ${msg.room}: ${msg.text} by ${msg.sender}`);
    }
  });

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

app.listen(PORT, () => {
  console.log(`Server Listening on Port ${PORT}`);
});
