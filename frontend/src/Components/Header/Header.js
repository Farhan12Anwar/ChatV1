import React from "react";
import "./Header.css";
import { useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const username = location.state?.username;

  const setGlobal =() => {

  }

  return (
    <>
      <h1>Welcome {username}</h1>
      <header>
        <nav className="navigation">
        <h1>
          To connect to different channels, enter '/' followed by the channel
          name
        </h1>
        </nav>
      </header>
    </>
  );
};

export default Header;
