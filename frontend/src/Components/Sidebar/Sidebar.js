import React from "react";
import "./Sidebar.css";

const Sidebar = ({ rooms, onlineUsers }) => {
  
  return (
    <div className="sidebar">
      <h2>Rooms</h2>
      <ul>
        {rooms.map((room, index) => (
          <li key={index}>
            <strong>{room.name}</strong> ({room.users.length} users)
          </li>
        ))}
      </ul>
      <h2>Online Users</h2>
      <ul>
        {onlineUsers.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
