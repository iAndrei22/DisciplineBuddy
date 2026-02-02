const Challenge = require("../models/challenge.model");
const User = require("../models/user.model");
const Task = require("../models/task.model");
const Enrollment = require("../models/enrollment.model");
const { checkAndAssignBadges } = require("../services/task.service");
const levelService = require("../services/level.service");

// Get available categories
exports.getCategories = (req, res) => {
    const { CATEGORIES } = require('../models/challenge.model');
    res.json(CATEGORIES);
};

// Create a general challenge (coach) with tasks
exports.createChallenge = async (req, res) => {
    try {
        const { title, description, durationDays, category, createdBy, tasks } = req.body;
        console.log("=== CREATE CHALLENGE ===");
        console.log("Received tasks:", tasks);
        if (!title) return res.status(400).json({ message: "Title required" });

        // Creează mai întâi challenge-ul
        const challenge = new Challenge({
            title,
            description: description || "",
            durationDays: durationDays || 7,
            category: category || 'Habits & Routines',
            createdBy: createdBy || null,
            tasks: []
        });

        await challenge.save();

        // Creează task-urile template și leagă-le de challenge
        let taskIds = [];
        if (tasks && Array.isArray(tasks) && tasks.length > 0) {
            console.log("Creating", tasks.length, "tasks for challenge", challenge._id);
            for (const t of tasks) {
                const newTask = new Task({
                    title: t.title,
                    description: t.description,
                    points: t.points || 10,
                    challengeId: challenge._id,
                    userId: null, // Task template, nu aparține niciunui user
                    isCompleted: false
                });
                await newTask.save();
                console.log("Created task:", newTask._id, newTask.title);
                taskIds.push(newTask._id);
            }
            // Actualizează challenge-ul cu task-urile create
            challenge.tasks = taskIds;
            await challenge.save();
            console.log("Updated challenge with tasks:", challenge.tasks);
        } else {
            console.log("No tasks provided or empty tasks array");
        }

        // Populate și returnează
        await challenge.populate('createdBy', 'username');
        await challenge.populate('tasks');
        
        res.status(201).json(challenge);
    } catch (err) {
        console.error("Create challenge error:", err);
        res.status(500).json({ message: err.message });
    }
};

// List all general challenges with tasks populated
exports.listChallenges = async (req, res) => {
    try {
        const userId = req.query.userId;
        const challenges = await Challenge.find()
            .sort({ createdAt: -1 })
            .populate('tasks')
            .populate('participants.user', 'username email')
            .lean();
        
        for (let i = 0; i < challenges.length; i++) {
            const createdById = challenges[i].createdBy;
            if (createdById) {
                try {
                    const coach = await User.findOne({ _id: createdById });
                    if (coach) {
                        challenges[i].coachUsername = coach.username;
                        challenges[i].coachEmail = coach.email;
                    }
                } catch(e) {}
            }

            // Dacă userId e specificat, calculează userTasks și userStatus
            if (userId) {
                const userTasks = await Task.find({ 
                    userId: userId, 
                    challengeId: challenges[i]._id 
                });
                challenges[i].userTasks = userTasks;
                
                // Calculează status
                if (userTasks.length === 0) {
                    challenges[i].userStatus = 'new';
                } else {
                    const completedCount = userTasks.filter(t => t.isCompleted).length;
                    if (completedCount === 0) {
                        challenges[i].userStatus = 'new';
                    } else if (completedCount === userTasks.length) {
                        challenges[i].userStatus = 'completed';
                    } else {
                        challenges[i].userStatus = 'in-progress';
                    }
                }
            }
        }
        
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

// Enroll user in a challenge - creează task-uri personale pentru user
exports.enrollChallenge = async (req, res) => {
    try {
        const challengeId = req.params.id;
        const { userId } = req.body;

        // Get challenge with tasks
        const challenge = await Challenge.findById(challengeId).populate('tasks');
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

        // Add user to challenge participants with status 'new' (nu a început niciun task)
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

        // Creează copii ale task-urilor template pentru acest user
        let userTasks = [];
        if (challenge.tasks && challenge.tasks.length > 0) {
            for (const templateTask of challenge.tasks) {
                const newTask = new Task({
                    userId: userId,
                    challengeId: challengeId,
                    title: templateTask.title,
                    description: templateTask.description,
                    points: templateTask.points || 10,
                    isCompleted: false
                });
                await newTask.save();
                userTasks.push(newTask);
            }
        }

        // Return updated challenge with tasks and userTasks
        const updatedChallenge = await Challenge.findById(challengeId)
            .populate('tasks')
            .populate('participants.user', 'username email')
            .lean();
        
        // Add coach info
        if (updatedChallenge.createdBy) {
            const coach = await User.findById(updatedChallenge.createdBy);
            if (coach) {
                updatedChallenge.coachUsername = coach.username;
            }
        }
        
        updatedChallenge.userTasks = userTasks;
        updatedChallenge.userStatus = 'new';

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

        const previousStatus = participant.status;

        // Update status
        participant.status = status;
        if (status === 'completed') {
            participant.completedAt = new Date();
        } else {
            participant.completedAt = null;
        }

        await challenge.save();

        if (previousStatus !== 'completed' && status === 'completed') {
            await User.findByIdAndUpdate(userId, { $inc: { completedChallenges: 1 } });
            await checkAndAssignBadges(userId);
        } else if (previousStatus === 'completed' && status !== 'completed') {
            const user = await User.findById(userId).select('completedChallenges');
            const currentCount = user ? (user.completedChallenges || 0) : 0;
            const nextCount = Math.max(0, currentCount - 1);
            await User.findByIdAndUpdate(userId, { completedChallenges: nextCount });
        }

        // Update user XP/Level
        try {
            await levelService.updateUserLevel(userId);
        } catch (e) {
            console.error("Failed to update user level after challenge completion:", e);
        }

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
