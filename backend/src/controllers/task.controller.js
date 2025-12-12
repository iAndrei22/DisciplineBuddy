const express = require("express");
const router = express.Router();
const taskService = require("../services/task.service");
const Task = require("../models/task.model");
const User = require("../models/user.model");

// Create task
router.post("/", async (req, res) => {
    try {

        const { userId, title, description, points } = req.body;
        const task = await taskService.createTask(userId, title, description, points);
        
        res.status(201).json(task);
        
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all tasks for a user
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const tasks = await taskService.getUserTasks(userId);

        res.status(200).json(tasks);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete task
router.delete("/:taskId", async (req, res) => {
    try {
        const result = await taskService.deleteTask(req.params.taskId);

        if (!result) {
            return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json({ message: "Task deleted" });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Toggle task completion
router.put("/:taskId", async (req, res) => {
    try {
        const { isCompleted } = req.body;

        const updated = await taskService.toggleTaskCompletion(
            req.params.taskId,
            isCompleted
        );

        res.status(200).json(updated);

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Extra routes: progress and score

// Get daily progress percentage
router.get("/progress/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { date } = req.query; // YYYY-MM-DD optional, defaults to today

        const target = date ? new Date(date) : new Date();
        const start = new Date(target.getFullYear(), target.getMonth(), target.getDate());
        const end = new Date(target.getFullYear(), target.getMonth(), target.getDate() + 1);

        const total = await Task.countDocuments({ userId, createdAt: { $gte: start, $lt: end } });
        const completed = await Task.countDocuments({ userId, isCompleted: true, createdAt: { $gte: start, $lt: end } });

        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        res.status(200).json({ date: start.toISOString().slice(0,10), total, completed, percent });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get user total score
router.get("/score/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("score");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ score: user.score || 0 });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get current streak (consecutive days with at least one completed task)
router.get("/streak/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch all completion dates for the user
        const completedTasks = await Task.find({ userId, isCompleted: true }).select('updatedAt');
        if (!completedTasks.length) return res.status(200).json({ currentStreak: 0 });

        // Build a set of unique YYYY-MM-DD dates where tasks were completed
        const dateSet = new Set(
            completedTasks.map(t => new Date(t.updatedAt))
                .map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0,10))
        );

        // Count consecutive days going backwards from today
        let streak = 0;
        let cursor = new Date();
        cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());

        while (true) {
            const key = cursor.toISOString().slice(0,10);
            if (dateSet.has(key)) {
                streak += 1;
                // Move to previous day
                cursor.setDate(cursor.getDate() - 1);
            } else {
                break;
            }
        }

        res.status(200).json({ currentStreak: streak });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
