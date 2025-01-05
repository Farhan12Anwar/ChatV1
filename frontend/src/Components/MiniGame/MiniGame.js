import { io } from "socket.io-client";
import React, { useState, useEffect } from "react";
import "./MiniGame.css";

const socket = io("http://localhost:8080"); // Ensure this matches the server URL

const MiniGame = ({ room, username }) => {
  const [gameState, setGameState] = useState({
    choices: {},
    winner: null,
    players: [],
  });

  useEffect(() => {
    socket.emit("join game", room);
    socket.on("game state", (state) => {
      setGameState(state);
    });

    return () => {
      socket.off("game state");
    };
  }, [room]);

  const handleChoice = (choice) => {
    if (gameState.players.length < 2 || gameState.winner) return;

    socket.emit("game move", { room, choice, username });
  };

  // Function to determine the winner
  const determineWinner = (player1Choice, player2Choice) => {
    const rules = {
      rock: ["scissors", "lizard"],
      paper: ["rock", "spock"],
      scissors: ["paper", "lizard"],
      lizard: ["spock", "paper"],
      spock: ["scissors", "rock"],
    };

    if (player1Choice === player2Choice) return "draw";

    if (rules[player1Choice].includes(player2Choice)) {
      return "player1";
    } else {
      return "player2";
    }
  };

  return (
    <div className="mini-game">
      <h2>Rock-Paper-Scissors-Lizard-Spock</h2>
      {gameState.winner ? (
        <h3>
          {gameState.winner === "draw"
            ? "It's a Draw!"
            : `${gameState.winner} Wins!`}
        </h3>
      ) : (
        <div>
          <p>Choose your move:</p>
          <div className="choices">
            {["rock", "paper", "scissors", "lizard", "spock"].map((choice) => (
              <button key={choice} onClick={() => handleChoice(choice)}>
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniGame;
