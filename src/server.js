require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const SteamManager = require('./steamManager');
const logger = require('./logger');

const server = http.createServer(); // без express
const io = new Server(server, {
  cors: { origin: "*" }
});

const steamManager = new SteamManager(io);

io.on('connection', (socket) => {
  logger.info('Client connected via WebSocket');

  // Авторизация аккаунта
  socket.on('login', async (data) => {
    const { login, password, shared_secret } = data || {};
  
    if (!login || !password || !shared_secret) {
      return socket.emit('login-result', { success: false, error: 'Missing fields' });
    }
  
    try {
      await steamManager.login({ login, password, shared_secret });
      socket.emit('login-result', { success: true, message: 'Logged in successfully' });
    } catch (err) {
      socket.emit('login-result', { success: false, error: err.message });
    }
  });
  
  // Отправка сообщения другу
  socket.on('send-message', async (data) => {
    const { login, friendSteamId64, message } = data || {};
    if (!login || !friendSteamId64 || !message) {
      return socket.emit('send-message-result', { success: false, error: 'Missing fields: login, friendSteamId64, message' });
    }

    try {
      await steamManager.sendMessage({ login, friendSteamId64, message });
      socket.emit('send-message-result', { success: true, message: 'Message sent successfully' });
    } catch (err) {
      socket.emit('send-message-result', { success: false, error: err.message });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  logger.info(`WebSocket server running on port ${PORT}`);
  await steamManager.autoLoginAll();
});
