const User = require('../models/User');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Submit quiz results
// @route   POST /api/quiz/submit
// @access  Private (should be)
exports.submitQuiz = async (req, res) => {
    const { userId, scores, result } = req.body;

    if (!userId || !result) {
        return res.status(400).json({ msg: 'Missing userId or result' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // 1. Update user's learning style
        user.learningStyle = result;
        await user.save();

        // 2. Create a record of the quiz attempt
        const quizAttempt = new QuizAttempt({
            userId,
            scores,
            result,
        });
        await quizAttempt.save();

        res.json({
            msg: 'Learning style updated successfully',
            learningStyle: user.learningStyle,
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
