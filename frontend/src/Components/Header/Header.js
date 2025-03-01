import React from "react";
import "./Header.css";
import { useLocation } from "react-router-dom";
// import '../../Pages/Global/Global.css';

const Header = () => {
  const location = useLocation();
  const username = location.state?.username;

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
