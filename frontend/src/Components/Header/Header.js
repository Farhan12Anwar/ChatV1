import React from "react";
import "./Header.css";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
const Header = () => {
  const location = useLocation();
  const username = location.state?.username;

  return (
    <>
        <h1>Welcome {username}</h1>
    <header>
      <nav className="navigation">
        <ul>
          <li>Global</li>
          <li>About</li>
          <li>List</li>
        </ul>
      </nav>
    </header>
    </>
  );
};

export default Header;
