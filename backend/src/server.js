require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const port = process.env.PORT || 5000;

const { Server } = require('socket.io');

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

const io = new Server(server, {
  cors: { origin: '*' }
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Client connected to cloud socket:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected from cloud socket:', socket.id);
  });
});

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
