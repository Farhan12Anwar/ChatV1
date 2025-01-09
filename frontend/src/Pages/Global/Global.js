import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";
import "./Global.css";
import Header from "../../Components/Header/Header";
import Sidebar from "../../Components/Sidebar/Sidebar";

const socket = io("http://localhost:8080");

const Global = () => {
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState(null);
  const [currentRoom, setCurrentRoom] = useState("global");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState([{ name: "global", users: [] }]);
  const username = useLocation().state?.username;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // References for the chat window
  const chatWindowRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const isUserPostingRef = useRef(false);

  useEffect(() => {
    if (username) {
      socket.emit("user connected", username);
    }

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

  useEffect(() => {
    const chatWindow = chatWindowRef.current;

    if (chatWindow) {
      if (isUserPostingRef.current || isAtBottomRef.current) {
        // Scroll to bottom if the user is posting or is already at the bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;
      }
    }

    // Reset user posting flag after messages are updated
    isUserPostingRef.current = false;
  }, [messages]);

  const handleScroll = () => {
    const chatWindow = chatWindowRef.current;
    if (chatWindow) {
      const isAtBottom =
        chatWindow.scrollHeight - chatWindow.scrollTop ===
        chatWindow.clientHeight;
      isAtBottomRef.current = isAtBottom;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.startsWith("/")) {
      const commandParts = message.trim().split(" ");
      const newRoom = commandParts[0].substring(1);
      if (newRoom !== currentRoom) {
        socket.emit("leave room", currentRoom);
        setCurrentRoom(newRoom);
        setMessages([]);
      }
      setMessage("");
      return;
    }

    const newMessage = {
      sender: username,
      text: message || null,
      image: image || null,
      room: currentRoom,
    };

    if (message.startsWith("!")) {
      socket.emit("chat message", { text: message, room: currentRoom });
    } else if (message || image) {
      socket.emit("chat message", newMessage);
    }

    setMessage("");
    setImage(null);

    // Indicate that the user is posting a message
    isUserPostingRef.current = true;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  async function downloadImage(imageSrc, nameOfDownload = "my-image.png") {
    const response = await fetch(imageSrc);
    const blobImage = await response.blob();
    const href = URL.createObjectURL(blobImage);
    const anchorElement = document.createElement("a");
    anchorElement.href = href;
    anchorElement.download = nameOfDownload;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
  }

  return (
    <div className="App">
      <Sidebar rooms={rooms} onlineUsers={onlineUsers} />
      <div className="main-content">
        <Header />
        <h1>Global Chat</h1>
        <h2>Current Room: {currentRoom}</h2>
        <div
          id="chat-window"
          ref={chatWindowRef}
          onScroll={handleScroll}
          style={{ overflowY: "scroll", height: "400px" }}
        >
          <ul id="messages">
            {messages.map((msg, index) => (
              <li
                key={index}
                className={
                  msg.sender === username ? "my-message" : "other-message"
                }
              >
                <span className="sender">{msg.sender}</span>
                {msg.text && (
                  <p className="message-text">
                    {msg.text.split(urlRegex).map((part, index) =>
                      urlRegex.test(part) ? (
                        <a
                          key={index}
                          href={part}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {part}
                        </a>
                      ) : (
                        part
                      )
                    )}
                  </p>
                )}
                {msg.image && (
                  <img
                    onClick={() => downloadImage(msg.image)}
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
            placeholder="Type a message, a command, or ! for talking with Omni"
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
          name or '!' for talking with Omni
        </h3>
      </div>
    </div>
  );
};

export default Global;
