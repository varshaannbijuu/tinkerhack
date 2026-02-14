const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Make uploads folder static
app.use('/uploads', express.static('uploads'));
app.get('/', (req, res) => {
  res.send('FocusPet Backend Running 🚀');
});


// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/pet', require('./routes/petRoutes'));
app.use('/api/session', require('./routes/sessionRoutes'));
app.use('/api/pdf', require('./routes/pdfRoutes'));
// A simple user route, can be expanded
app.get('/api/users/:id', async (req, res) => {
    try {
        const User = require('./models/User');
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
