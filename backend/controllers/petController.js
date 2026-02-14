const User = require('../models/User');

// @desc    Adopt a new pet
// @route   POST /api/pet/adopt
// @access  Private
exports.adoptPet = async (req, res) => {
    const { userId, petName, petType } = req.body;

    if (!userId || !petName || !petType) {
        return res.status(400).json({ msg: 'Please provide userId, petName, and petType' });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.pet && user.pet.alive) {
            return res.status(400).json({ msg: 'You already have a living pet' });
        }

        user.pet = {
            name: petName,
            petType: petType,
            focusHP: 100,
            alive: true,
            tabSwitchCount: 0,
        };

        await user.save();

        res.status(201).json(user.pet);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Update pet state (HP, tab switches)
// @route   POST /api/pet/update
// @access  Private
exports.updatePetState = async (req, res) => {
    const { userId, tabSwitchCount, focused } = req.body;

    if (!userId || tabSwitchCount === undefined) {
        return res.status(400).json({ msg: 'Please provide userId and tabSwitchCount' });
    }

    try {
        const user = await User.findById(userId);

        if (!user || !user.pet) {
            return res.status(404).json({ msg: 'User or pet not found' });
        }

        if (!user.pet.alive) {
            return res.status(400).json({ msg: 'Your pet is not alive.' });
        }

        const pet = user.pet;
        
        // Update tab switch count
        pet.tabSwitchCount = tabSwitchCount;

        // Decrease HP on tab switch
        // This is a simple logic, if the count increases, we decrease HP.
        // A more robust logic would track the previous count.
        // For this hackathon, we assume any update call with tabSwitchCount > pet.tabSwitchCount is a new switch.
        // The rule is "After 3 tab switches -> pet dies"
        
        if (tabSwitchCount > pet.tabSwitchCount) {
             pet.focusHP -= 34; // 3 switches and HP is ~ 0
        }
        
        if(focused) {
            pet.focusHP = Math.min(100, pet.focusHP + 5);
        }

        // Check for death conditions
        if (pet.tabSwitchCount >= 3 || pet.focusHP <= 0) {
            pet.alive = false;
            pet.focusHP = 0;
        }

        user.pet = pet;
        await user.save();

        res.json(user.pet);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Revive a pet
// @route   POST /api/pet/revive
// @access  Private
exports.revivePet = async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await User.findById(userId);
        if(!user || !user.pet) {
            return res.status(404).json({ msg: 'User or pet not found' });
        }

        user.pet.alive = true;
        user.pet.focusHP = 50; // Revive with half HP
        user.pet.tabSwitchCount = 0;
        
        await user.save();
        res.json(user.pet);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}
