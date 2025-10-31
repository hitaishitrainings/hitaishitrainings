const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./db'); // Import the database connection

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));

// Import routes
const searchRoutes = require('./routes/search');
const contactRoutes = require('./routes/contact');
const subscribeRoutes = require('./routes/subscribe');
const choosePlanRoutes = require('./routes/chooseplan');
const registerRoutes = require('./routes/register');
const enrollRoutes = require('./routes/enroll');
const webinarRegisterRoutes = require('./routes/webnar-register');
const submitResumeRoutes = require('./routes/submit-resume');
const coursesRoutes = require('./routes/courses');
const projectRoutes = require('./routes/project');
const hpregisterRoutes = require('./routes/hpregister');
const managernonprofitRoutes = require('./routes/managernonprofit');
const offlinedonationRoutes = require('./routes/offlinedonation');
const overseascoursesRoutes = require('./routes/overseascourses');
const trainerRegisterRoutes = require('./routes/trainerregister');


// Use routes
app.use('/api', searchRoutes);
app.use('/api', contactRoutes);
app.use('/api', subscribeRoutes);
app.use('/api', choosePlanRoutes);
app.use('/api', registerRoutes);
app.use('/api', enrollRoutes);
app.use('/api', webinarRegisterRoutes);
app.use('/api', submitResumeRoutes);
app.use('/api', coursesRoutes);
app.use('/api', projectRoutes);
app.use('/api', hpregisterRoutes);
app.use('/api', managernonprofitRoutes);
app.use('/api', offlinedonationRoutes);
app.use('/api', overseascoursesRoutes);
app.use('/api', trainerRegisterRoutes);

// Create HTTP server for Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// WebRTC signaling using Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('offer', (data) => {
    socket.to(data.to).emit('offer', { sdp: data.sdp, from: socket.id });
  });

  socket.on('answer', (data) => {
    socket.to(data.to).emit('answer', { sdp: data.sdp, from: socket.id });
  });

  socket.on('candidate', (data) => {
    socket.to(data.to).emit('candidate', data.candidate);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("✅ Search route loaded");

});
