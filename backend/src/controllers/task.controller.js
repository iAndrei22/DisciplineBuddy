const express = require("express");
const router = express.Router();
const taskService = require("../services/task.service");

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

module.exports = router;
