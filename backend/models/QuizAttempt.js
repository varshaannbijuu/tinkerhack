const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    scores: {
        visual: Number,
        audio: Number,
        reader: Number,
        active: Number,
    },
    result: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
