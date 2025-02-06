import io from 'socket.io-client';

// Connect to the backend server
const socket = io('http://localhost:5000');

// Join a room
function joinRoom(roomId) {
  socket.emit('joinRoom', roomId);
}

// Send a chat message
function sendMessage(roomId, userId, message, imageUrl) {
  socket.emit('sendMessage', { roomId, userId, message, imageUrl });
}

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message received:', message);
});

export { joinRoom, sendMessage };
