const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});


io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  socket.on('code', (data) => {
    console.log('📡 Code received:', data);
    socket.broadcast.emit('code', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ A user disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
