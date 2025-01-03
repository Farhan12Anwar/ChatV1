import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import Home from "./Pages/Home/Home.js";
import Global from "./Pages/Global/Global.js";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="global" element={<Global />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
