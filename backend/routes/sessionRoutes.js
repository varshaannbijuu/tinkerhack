const express = require('express');
const router = express.Router();
const { startSession, endSession } = require('../controllers/sessionController');

// @route   POST api/session/start
// @desc    Start a new focus session
// @access  Private
router.post('/start', startSession);

// @route   POST api/session/end
// @desc    End a focus session and record stats
// @access  Private
router.post('/end', endSession);

module.exports = router;
