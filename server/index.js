const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const GameManager = require('./gameManager');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameManager = new GameManager(io);

// REST API Endpoints for Quiz Management
app.get('/api/quizzes', (req, res) => {
  try {
    const quizzes = gameManager.getAllQuizzes();
    res.json({ success: true, quizzes, count: quizzes.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/quizzes', (req, res) => {
  try {
    const quiz = req.body;
    const index = gameManager.addQuiz(quiz);
    res.json({ success: true, index, message: 'Quiz added successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/quizzes/bulk', (req, res) => {
  try {
    console.log('📥 Bulk quiz upload request received');
    const { quizzes } = req.body;

    if (!quizzes) {
      console.error('❌ No quizzes field in request body');
      return res.status(400).json({ success: false, error: 'Missing quizzes field' });
    }

    if (!Array.isArray(quizzes)) {
      console.error('❌ Quizzes is not an array:', typeof quizzes);
      return res.status(400).json({ success: false, error: 'Quizzes must be an array' });
    }

    console.log(`📊 Attempting to add ${quizzes.length} quizzes`);
    const results = gameManager.addBulkQuizzes(quizzes);
    console.log(`✅ Bulk upload complete: ${results.success} success, ${results.failed} failed`);

    res.json({ success: true, results });
  } catch (error) {
    console.error('❌ Bulk upload error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/quizzes/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const quiz = req.body;
    gameManager.updateQuiz(index, quiz);
    res.json({ success: true, message: 'Quiz updated successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/quizzes/:index', (req, res) => {
  try {
    const index = parseInt(req.params.index);
    gameManager.deleteQuiz(index);
    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  gameManager.handleConnection(socket);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameManager.handleDisconnect(socket);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
