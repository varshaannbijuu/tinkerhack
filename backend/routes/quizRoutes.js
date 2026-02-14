const express = require('express');
const router = express.Router();
const { submitQuiz } = require('../controllers/quizController');

// @route   POST api/quiz/submit
// @desc    Submit quiz results and update user learning style
// @access  Private
router.post('/submit', submitQuiz);

module.exports = router;
