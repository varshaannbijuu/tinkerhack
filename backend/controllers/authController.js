const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { email, password, username } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            email,
            password, // In a real app, you MUST hash this password
            username,
        });

        await user.save();

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
        });

    } catch (err) {
  console.error("REGISTER ERROR:", err);
  res.status(500).json({
    error: err.message,
    stack: err.stack
  });
}

};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // In a real app, you would compare the hashed password
        const isMatch = user.password === password;

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            learningStyle: user.learningStyle,
            pet: user.pet,
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
