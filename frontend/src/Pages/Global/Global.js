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
  const [currentRoom, setCurrentRoom] = useState("global");
  const [rooms, setRooms] = useState([{ name: "global", users: [] }]);
  const username = useLocation().state?.username;

  useEffect(() => {
    socket.emit("request rooms list");
    socket.on("rooms list", (roomsList) => {
      setRooms(roomsList);
    });

    socket.emit("join room", { room: currentRoom, username });
    socket.on("chat message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    return () => {
      socket.off("rooms list");
      socket.off("chat message");
    };
  }, [currentRoom, username]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMessage = { sender: username, text: message, room: currentRoom };

    if (message.startsWith("/createRoom ")) {
      const newRoom = message.split(" ")[1];
      if (
        newRoom &&
        /^[a-zA-Z0-9]+$/.test(newRoom) &&
        !rooms.some((room) => room.name === newRoom)
      ) {
        socket.emit("create room", newRoom);
      } else {
        alert("Invalid room name or room already exists.");
      }
    } else if (message.startsWith("/")) {
      const commandParts = message.trim().split(" ");
      const newRoom = commandParts[0].substring(1);
      if (newRoom !== currentRoom) {
        socket.emit("leave room", currentRoom);
        setCurrentRoom(newRoom);
      }
    } else if (message.startsWith("!")) {
      console.log("!!!!!");
      socket.emit("chat message", { text: message, room: currentRoom });
    } else {
      socket.emit("chat message", newMessage);
    }
    setMessage("");
  };

  return (
    <div className="App">
      <Sidebar rooms={rooms} />
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
            placeholder="Type a message, a command, or ! for Hugging Face API"
          />
          <button type="submit">Send</button>
        </form>

        <h3>
          To connect to different channels, enter '/' followed by the channel
          name or '!' for a Hugging Face command
        </h3>
      </div>
    </div>
  );
};

export default Global;
