const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const User = require('../models/User');
const { generatePersonalizedContent } = require('../services/aiService');

// Setup Multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage }).single('file');

// @desc    Upload a PDF and get personalized content
// @route   POST /api/pdf/upload
// @access  Private
exports.uploadPdf = (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err);
        } else if (err) {
            return res.status(500).json(err);
        }

        const { userId } = req.body;
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }
        if (!userId) {
            // Clean up uploaded file
            fs.unlinkSync(req.file.path);
            return res.status(400).send('No user ID provided.');
        }

        try {
            const user = await User.findById(userId);
            if (!user) {
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ msg: 'User not found' });
            }
            if(!user.learningStyle) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ msg: 'User has no learning style defined' });
            }

            const dataBuffer = fs.readFileSync(req.file.path);
            const data = await pdf(dataBuffer);
            const textContent = data.text;

            // Clean up the uploaded file after parsing
            fs.unlinkSync(req.file.path);

            // Generate the personalized content
            const personalizedContent = await generatePersonalizedContent(textContent, user.learningStyle);

            res.json(personalizedContent);

        } catch (error) {
            console.error(error);
            // Ensure file is deleted even if AI service fails
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).send('Server Error');
        }
    });
};
