import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import "./Global.css";
import Header from "../../Components/Header/Header";
import Sidebar from "../../Components/Sidebar/Sidebar";

const socket = io("http://localhost:8080"); // Correct socket connection URL

const Global = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [currentRoom, setCurrentRoom] = useState("global"); // Default to global room
  const [rooms, setRooms] = useState([{ name: "global", users: [] }]); // Initial room
  const username = useLocation().state?.username;
  const navigate = useNavigate();

  // Effect to handle room creation and feedback from server
  useEffect(() => {
    socket.on("room created", (newRoom) => {
      setRooms((prevRooms) => [...prevRooms, { name: newRoom, users: [] }]);
      setCurrentRoom(newRoom);
    });

    socket.on("room exists", (roomName) => {
      alert(`Room ${roomName} already exists.`);
    });

    socket.emit("request rooms list");
    socket.on("rooms list", (roomsList) => {
      setRooms(roomsList);
    });

    socket.emit("request room users", currentRoom);
    socket.on("room users", (roomData) => {
      const updatedRooms = rooms.map((room) =>
        room.name === roomData.name ? roomData : room
      );
      setRooms(updatedRooms);
    });

    return () => {
      socket.off("room users");
      socket.off("rooms list");
    };
  }, [currentRoom, rooms]);

  useEffect(() => {
    socket.emit("request rooms list");

    socket.on("rooms list", (roomsList) => {
      setRooms(roomsList);
    });

    return () => {
      socket.off("rooms list");
    };
  }, [socket]);

  useEffect(() => {
    setMessages([]);

    socket.emit("join room", { room: currentRoom, username });

    const messageListener = (msg) => {
      if (msg.room === currentRoom) {
        setMessages((prevMessages) => [...prevMessages, msg]);
      }
    };

    socket.on("chat message", messageListener);

    return () => {
      socket.off("chat message", messageListener);
    };
  }, [currentRoom, username]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newMessage = { sender: username, text: message, room: currentRoom };

    if (message.startsWith("/createRoom ")) {
      const newRoom = message.split(" ")[1]; // Extract the room name
      if (
        newRoom &&
        /^[a-zA-Z0-9]+$/.test(newRoom) &&
        !rooms.some((room) => room.name === newRoom)
      ) {
        socket.emit("create room", newRoom, username);
      } else {
        alert("Invalid room name or room already exists.");
      }
    } else if (message.startsWith("/")) {
      const commandParts = message.trim().split(" ");
      const newRoom = commandParts[0].substring(1); // Extract room name
      if (newRoom !== currentRoom) {
        socket.emit("leave room", currentRoom);
        setCurrentRoom(newRoom);
      }
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
          To connect to different channels, enter '/' followed by the channel
          name
        </h1>
      </div>
    </div>
  );
};

export default Global;
