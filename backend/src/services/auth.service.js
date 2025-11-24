const bcrypt = require('bcrypt');
const db = require('../config.js/db'); 
const saltRounds = 10;

// Register Logic (US-AUTH-1)
const register = async (username, email, password) => {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const defaultRole = 'User'; 

        const sql = `
            INSERT INTO Users (username, email, password, role)
            VALUES (?, ?, ?, ?)
        `;
        const values = [username, email, hashedPassword, defaultRole];

        const [result] = await db.promise().execute(sql, values);
        return result.insertId;

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            throw new Error("Email or Username already in use.");
        }
        console.error('Registration error:', error.message);
        throw new Error("Registration failed due to a server error.");
    }
};

// Login Logic (US-AUTH-2)
const login = async (email, password) => {
    // 1. Find user by email
    const [rows] = await db.promise().execute(
        'SELECT user_id, password, role, username FROM Users WHERE email = ?', 
        [email]
    );

    const user = rows[0];

    // Check if user exists
    if (!user) {
        throw new Error("Invalid credentials.");
    }

    // 2. Compare the provided password with the stored hash
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        throw new Error("Invalid credentials.");
    }

    // 3. Success: return user data (excluding the password hash)
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};


module.exports = {
    register,
    login
};