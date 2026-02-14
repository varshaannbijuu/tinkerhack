const express = require('express');
const router = express.Router();
const { adoptPet, updatePetState, revivePet } = require('../controllers/petController');

// @route   POST api/pet/adopt
// @desc    Adopt a new pet
// @access  Private
router.post('/adopt', adoptPet);

// @route   POST api/pet/update
// @desc    Update pet's state (HP, tab switches)
// @access  Private
router.post('/update', updatePetState);

// @route   POST api/pet/revive
// @desc    Revive a dead pet
// @access  Private
router.post('/revive', revivePet);

module.exports = router;
