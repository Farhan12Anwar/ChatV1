import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Using a unique CSS file

const Home = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUsername(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username) {
      navigate("/global", { state: { username } });
    } else {
      alert("Please enter a username");
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="home-box">
          <h2>Welcome</h2>
          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Enter Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleChange}
              placeholder="Enter Username"
            />
            <button type="submit">Join Chat</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
