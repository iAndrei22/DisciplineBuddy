const express = require("express");
const cors = require("cors");
require("dotenv").config();

require("./config.js/db"); 
const authService = require("./services/auth.service"); 

const app = express();

// Middleware setup
app.use(cors()); 
app.use(express.json()); 

// Route 1: Health Check
app.get("/", (req, res) => {
    res.send("DisciplineBuddy Backend is running correctly!");
});

// Route 2: User Registration (US-AUTH-1)
app.post("/api/register", async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "All fields are required." });
    }

    try {
        const userId = await authService.register(username, email, password);
        
        res.status(201).json({ 
            message: "User registered successfully!", 
            userId: userId 
        });
    } catch (error) {
        const statusCode = error.message.includes("in use") ? 409 : 500;
        console.error("Registration error:", error.message);
        res.status(statusCode).json({ message: error.message });
    }
});

// Route 3: User Login (US-AUTH-2)
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const user = await authService.login(email, password);
        // Implement token generation here later (e.g., JWT)
        res.status(200).json({ 
            message: "Login successful.", 
            user: user 
        });
    } catch (error) {
        // 'Invalid credentials' error handled by the service returns 401 Unauthorized
        res.status(401).json({ message: error.message });
    }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));