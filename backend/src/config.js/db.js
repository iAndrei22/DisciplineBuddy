const mysql = require("mysql2");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

//Adding a connection check to the server
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ ERROR: Could not connect to the MySQL/MariaDB database. Check if XAMPP is running and if the data in .env is correct.', err);
        // Stop the application if it cannot connect to the essential DB.
        process.exit(1);
    }
    console.log('✅ Database connection successful (Schema: disciplinebuddy)!');
    connection.release(); // Release the connection back to the pool
});

module.exports = db;