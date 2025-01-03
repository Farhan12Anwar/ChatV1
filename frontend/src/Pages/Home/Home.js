import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    e.preventDefault();
    setUsername(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username) {
      // Navigate to the Global route and pass the username as state
      navigate("/global", { state: { username } });
    } else {
      alert("Please enter a username");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="userName">Enter Username</label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={handleChange}
        placeholder="Enter Username"
      />
    </form>
  );
};

export default Home;
