const express = require("express");
const cors = require("cors");
const connectDB = require("./config.js/db.js");
const authService = require("./services/auth.service");
const taskController = require("./controllers/task.controller");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();


// Routes
app.get("/", (req, res) => res.send("Backend running (MongoDB)"));

// Serve badges.json for frontend
const path = require("path");
const fs = require("fs");
app.get("/api/badges", (req, res) => {
    const badgesPath = path.join(__dirname, "./badges.json");
    fs.readFile(badgesPath, "utf8", (err, data) => {
        if (err) return res.status(500).json({ message: "Could not load badges." });
        res.json(JSON.parse(data));
    });
});

app.post("/api/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const userId = await authService.register(username, email, password);
        res.status(201).json({ message: "User registered", userId });
    } catch (err) {
        const status = err.message.includes("in use") ? 409 : 500;
        res.status(status).json({ message: err.message });
    }
});

app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Missing fields" });
        }

        const user = await authService.login(email, password);
        res.status(200).json({ message: "Login successful", user });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
});

app.use("/api/tasks", taskController);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));