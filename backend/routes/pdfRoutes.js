const express = require('express');
const router = express.Router();
const { uploadPdf } = require('../controllers/pdfController');

// @route   POST api/pdf/upload
// @desc    Upload PDF for AI personalization
// @access  Private
router.post('/upload', uploadPdf);

module.exports = router;
