import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import "./Global.css";
import Header from "../../Components/Header/Header";

const socket = io("http://localhost:8080"); // Correct socket connection URL

const Global = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState("global"); // Default to global room
  const [rooms, setRooms] = useState(["global"]); // List of available rooms
  const location = useLocation();
  const username = location.state?.username;
  const navigate = useNavigate();

  // Effect to handle room creation and feedback from server
  useEffect(() => {
    socket.on("room created", (newRoom) => {
      console.log(`Room ${newRoom} created successfully.`);
      setRooms((prevRooms) => [...prevRooms, newRoom]); // Add new room to list
      setCurrentRoom(newRoom); // Update the current room only for the creator
    });

    socket.on("room exists", (roomName) => {
      alert(`Room ${roomName} already exists.`);
    });

    // Listen for rooms list from the server
    socket.emit("request rooms list");
    socket.on("rooms list", (availableRooms) => {
      setRooms(availableRooms); // Update available rooms
    });

    return () => {
      socket.off("rooms list");
    };
  }, []);

  useEffect(() => {
    console.log(`Current Room: ${currentRoom}, Username: ${username}`); // Log username
    socket.emit("join room", { room: currentRoom, username });
  }, [currentRoom, username]);

  useEffect(() => {
    // Join the default global room
    socket.emit("join room", { room: currentRoom, username }); // Ensure username is included here

    // Listen for incoming messages from the server
    socket.on("chat message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    // Clean up the listener on component unmount
    return () => {
      socket.off("chat message");
    };
  }, [currentRoom]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMessage = { sender: username, text: message, room: currentRoom };

    if (message.startsWith("/createRoom ")) {
      const newRoom = message.split(" ")[1]; // Extract the room name
      if (
        newRoom &&
        /^[a-zA-Z0-9]+$/.test(newRoom) &&
        !rooms.includes(newRoom)
      ) {
        socket.emit("create room", newRoom, username); // Pass the username when creating the room
      } else {
        alert("Invalid room name or room already exists.");
      }
    } else if (message.startsWith("/")) {
      const commandParts = message.trim().split(" ");
      const newRoom = commandParts[0].substring(1); // Extract room name from command
      if (newRoom !== currentRoom) {
        socket.emit("leave room", currentRoom); // Leave the current room
        setCurrentRoom(newRoom); // Update current room
        socket.emit("join room", { room: newRoom, username }); // Pass username when joining the room
      }
    } else {
      socket.emit("chat message", newMessage); // Emit message with room info
    }
    setMessage(""); // Clear the input field
  };

  return (
    <div className="App">
      <Header />
      <h1>Global Chat</h1>
      <h1>Current Room: {currentRoom}</h1>
      <div id="chat-window">
        <ul id="messages">
          {messages.map((msg, index) => (
            <li
              key={index}
              className={
                msg.sender === username ? "my-message" : "other-message"
              }
            >
              <span className="sender">{msg.sender}</span>
              <p className="message-text">{msg.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message or a command to switch room"
        />
        <button type="submit">Send</button>
      </form>

      <h1>
        To connect to different channels, enter '/' followed by the channel name
      </h1>
    </div>
  );
};

export default Global;
