const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const db = require('./db'); // Import the database connection


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(__dirname));


//import routes
const contactRoutes = require('./routes/contact');
const subscribeRoutes = require('./routes/subscribe');
const choosePlanRoutes = require('./routes/chooseplan');
const registerRoutes = require('./routes/register');
const enrollRoutes = require('./routes/enroll'); // Uncomment if you want to use enroll route
const webinarRegisterRoutes = require('./routes/webnar-register');
const submitResumeRoutes = require('./routes/submit-resume');
const trainerRegisterRoutes = require('./routes/trainerregister');
const coursesRoutes = require('./routes/courses');


// use route
app.use('/api', contactRoutes);
app.use('/api', subscribeRoutes);
app.use('/api', choosePlanRoutes);
app.use('/api', registerRoutes);
app.use('/api', enrollRoutes); // Uncomment if you want to use enroll route
app.use('/api', webinarRegisterRoutes);
app.use('/api', submitResumeRoutes);
app.use('/api', trainerRegisterRoutes);
app.use('/api', coursesRoutes);


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});