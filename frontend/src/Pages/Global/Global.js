import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import "./Global.css";
import Header from "../../Components/Header/Header";
import Sidebar from "../../Components/Sidebar/Sidebar";

const socket = io("http://localhost:8080");

const Global = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null); // State for image
  const [currentRoom, setCurrentRoom] = useState("global");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState([{ name: "global", users: [] }]);
  const username = useLocation().state?.username;

  useEffect(() => {
    // Notify server of new user
    if (username) {
      socket.emit("user connected", username);
    }

    // Listen for online users updates
    socket.on("online users", (users) => {
      setOnlineUsers(users);
    });

    return () => {
      socket.off("online users");
    };
  }, [username]);

  useEffect(() => {
    socket.emit("request rooms list");
    socket.on("rooms list", (roomsList) => {
      setRooms(roomsList);
    });

    socket.emit("join room", { room: currentRoom, username });
    socket.on("chat message", (msg) => {
      if (msg.room === currentRoom) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }
    });

    return () => {
      socket.off("rooms list");
      socket.off("chat message");
    };
  }, [currentRoom, username]);

  const handleSubmit = (e) => {
    e.preventDefault();
  
    if (message.startsWith("/")) {
      const commandParts = message.trim().split(" ");
      const newRoom = commandParts[0].substring(1);
      if (newRoom !== currentRoom) {
        socket.emit("leave room", currentRoom); // Emit leave room event
        setCurrentRoom(newRoom); // Update current room state
        setMessages([]); // Clear previous messages
      }
      setMessage(""); // Clear the input field
      return; // Exit the function to prevent the message from being sent
    }
  
    if (message.startsWith("!")) {
      socket.emit("chat message", { text: message, room: currentRoom });
    } else if (image && message) {
      const newImageMessage = { sender: username, image, room: currentRoom };
      const newMessage = { sender: username, text: message, room: currentRoom };
      socket.emit("chat message", newMessage);
      socket.emit("chat message", newImageMessage);
      setMessage("");
      setImage(null); // Clear the image state
    } else if (message) {
      const newMessage = { sender: username, text: message, room: currentRoom };
      socket.emit("chat message", newMessage);
      setMessage("");
    } else if (image) {
      const newImageMessage = { sender: username, image, room: currentRoom };
      socket.emit("chat message", newImageMessage);
      setImage(null); // Clear the image state
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Store the base64 string of the image
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="App">
      <Sidebar rooms={rooms} onlineUsers={onlineUsers} />
      <div className="main-content">
        <Header />
        <h1>Global Chat</h1>
        <h2>Current Room: {currentRoom}</h2>
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
                {msg.text && <p className="message-text">{msg.text}</p>}
                {msg.image && (
                  <img
                    src={msg.image}
                    alt="shared"
                    className={
                      msg.sender === username ? "my-image" : "other-image"
                    }
                  />
                )}
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
            placeholder="Type a message, a command, or ! for Hugging Face API"
          />
          <div className="image-upload">
            <label className="upload-button" htmlFor="file-input">
              Choose Image
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
          </div>
          <button type="submit">Send</button>
        </form>
        {image && (
          <div className="preview-container">
            <div className="image-preview">
              <img src={image} alt="Preview" />
            </div>
          </div>
        )}

        <h3>
          To connect to different channels, enter '/' followed by the channel
          name or '!' for a Hugging Face command
        </h3>
      </div>
    </div>
  );
};

export default Global;
