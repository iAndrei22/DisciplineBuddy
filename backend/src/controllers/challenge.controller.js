const Challenge = require("../models/challenge.model");
const User = require("../models/user.model");
const Enrollment = require("../models/enrollment.model");

// Get available categories
exports.getCategories = (req, res) => {
    const { CATEGORIES } = require('../models/challenge.model');
    res.json(CATEGORIES);
};

// Create a general challenge (coach)
exports.createChallenge = async (req, res) => {
    try {
        const { title, description, durationDays, category, createdBy } = req.body;
        if (!title) return res.status(400).json({ message: "Title required" });

        const challenge = new Challenge({
            title,
            description: description || "",
            durationDays: durationDays || 7,
            category: category || 'Habits & Routines',
            createdBy: createdBy || null,
        });

        await challenge.save();
        
        // Populate createdBy before returning
        await challenge.populate('createdBy', 'username');
        
        res.status(201).json(challenge);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// List all general challenges
exports.listChallenges = async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ createdAt: -1 }).lean();
        
        for (let i = 0; i < challenges.length; i++) {
            const createdById = challenges[i].createdBy;
            console.log("Challenge:", challenges[i].title, "createdBy:", createdById);
            
            if (createdById) {
                try {
                    const coach = await User.findOne({ _id: createdById });
                    console.log("Found coach:", coach ? coach.username : "NOT FOUND");
                    if (coach) {
                        challenges[i].coachUsername = coach.username;
                        challenges[i].coachEmail = coach.email;
                    }
                } catch(e) {
                    console.log("Error finding coach:", e.message);
                }
            }
        }
        
        console.log("Final challenges:", JSON.stringify(challenges, null, 2));
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get participants for a specific challenge
exports.getParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const challenge = await Challenge.findById(id).populate("participants.user", "username email");
        if (!challenge) return res.status(404).json({ message: "Challenge not found" });
        res.json(challenge.participants || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Enroll user in a challenge
exports.enrollChallenge = async (req, res) => {
    try {
        const challengeId = req.params.id;
        const { userId } = req.body;

        // Get challenge first
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        // Check if user is already a participant in the challenge
        const alreadyParticipant = challenge.participants.some(p => {
            const oderId = p.user._id ? p.user._id.toString() : p.user.toString();
            return oderId === userId;
        });
        
        if (alreadyParticipant) {
            return res.status(400).json({ message: "Already enrolled in this challenge" });
        }

        // Add user to challenge participants with status
        challenge.participants.push({
            user: userId,
            status: 'in-progress',
            enrolledAt: new Date(),
            completedAt: null
        });
        await challenge.save();

        // Add challenge to user's enrolledChallenges
        await User.findByIdAndUpdate(userId, {
            $addToSet: { enrolledChallenges: challengeId }
        });

        // Return updated challenge
        const updatedChallenge = await Challenge.findById(challengeId).lean();
        
        // Add coach info
        if (updatedChallenge.createdBy) {
            const coach = await User.findById(updatedChallenge.createdBy);
            if (coach) {
                updatedChallenge.coachUsername = coach.username;
            }
        }

        res.json(updatedChallenge);
    } catch (err) {
        console.error("Enroll error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Update participant status (mark as completed or in-progress)
exports.updateParticipantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId, status } = req.body;

        console.log("=== UPDATE STATUS REQUEST ===");
        console.log("Challenge ID:", id);
        console.log("User ID:", userId);
        console.log("New Status:", status);

        if (!['in-progress', 'completed'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Use 'in-progress' or 'completed'" });
        }

        const challenge = await Challenge.findById(id);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge not found" });
        }

        console.log("Looking for userId:", userId);
        console.log("Participants:", JSON.stringify(challenge.participants));

        // Find participant - handle both ObjectId and populated user
        const participant = challenge.participants.find(p => {
            const oderId = p.user._id ? p.user._id.toString() : p.user.toString();
            return oderId === userId;
        });
        
        if (!participant) {
            return res.status(404).json({ message: "User not enrolled in this challenge" });
        }

        // Update status
        participant.status = status;
        if (status === 'completed') {
            participant.completedAt = new Date();
        } else {
            participant.completedAt = null;
        }

        await challenge.save();

        // Return updated challenge with coach info
        const updatedChallenge = await Challenge.findById(id).lean();
        if (updatedChallenge.createdBy) {
            const coach = await User.findById(updatedChallenge.createdBy);
            if (coach) {
                updatedChallenge.coachUsername = coach.username;
            }
        }

        res.json(updatedChallenge);
    } catch (err) {
        console.error("Update status error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Delete a challenge (coach only)
exports.deleteChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        console.log("=== DELETE CHALLENGE REQUEST ===");
        console.log("Challenge ID:", id);
        console.log("User ID:", userId);

        const challenge = await Challenge.findById(id);
        if (!challenge) {
            console.log("Challenge not found");
            return res.status(404).json({ message: "Challenge not found" });
        }

        console.log("Challenge createdBy:", challenge.createdBy.toString());

        // Verify the user is the coach who created this challenge
        if (challenge.createdBy.toString() !== userId) {
            console.log("User is not the coach");
            return res.status(403).json({ message: "Only the coach who created this challenge can delete it" });
        }

        // Remove challenge from all enrolled users
        await User.updateMany(
            { enrolledChallenges: id },
            { $pull: { enrolledChallenges: id } }
        );

        // Delete the challenge
        await Challenge.findByIdAndDelete(id);

        res.json({ message: "Challenge deleted successfully" });
    } catch (err) {
        console.error("Delete challenge error:", err);
        res.status(500).json({ message: err.message });
    }
};
