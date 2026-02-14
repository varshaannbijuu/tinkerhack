const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    petType: {
        type: String,
        enum: ['Dog', 'Hamster', 'Kitten'],
        required: true,
    },
    focusHP: {
        type: Number,
        default: 100,
    },
    alive: {
        type: Boolean,
        default: true,
    },
    tabSwitchCount: {
        type: Number,
        default: 0,
    }
});

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    learningStyle: {
        type: String,
        enum: ['Visual', 'Audio', 'Reader', 'Active', null],
        default: null,
    },
    pet: petSchema,
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
