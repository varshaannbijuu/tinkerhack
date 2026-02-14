const Session = require('../models/Session');
const User = require('../models/User');

// @desc    Start a new focus session
// @route   POST /api/session/start
// @access  Private
exports.startSession = async (req, res) => {
    const { userId, duration } = req.body; // duration in minutes

    if (!userId || !duration) {
        return res.status(400).json({ msg: 'Please provide userId and duration' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const newSession = new Session({
            userId,
            duration,
        });

        const session = await newSession.save();
        res.status(201).json(session);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    End a focus session
// @route   POST /api/session/end
// @access  Private
exports.endSession = async (req, res) => {
    const { sessionId, tabSwitchCount } = req.body;

    if (!sessionId) {
        return res.status(400).json({ msg: 'Please provide sessionId' });
    }

    try {
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ msg: 'Session not found' });
        }

        if (session.completed) {
            return res.status(400).json({ msg: 'Session has already been completed' });
        }

        session.endTime = Date.now();
        session.completed = true;
        session.tabSwitchCount = tabSwitchCount || 0;

        await session.save();

        // Optional: Update pet health based on final session stats
        const user = await User.findById(session.userId);
        if (user && user.pet && user.pet.alive) {
            // Give a bonus for completing the session
            user.pet.focusHP = Math.min(100, user.pet.focusHP + 10);
            await user.save();
        }

        res.json(session);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
