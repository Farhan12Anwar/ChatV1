// Sidebar.js
import React from 'react';
import './Sidebar.css';

const Sidebar = ({ rooms }) => {
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
    </div>
  );
};

export default Sidebar;
