// projectRoutes.js

const express = require('express');
const router = express.Router();
const db = require('../db');


// POST route to handle project submission
router.post('/submit-project', (req, res) => {
    // SQL query to create the table if it doesn't exist
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            projectName VARCHAR(255) NOT NULL,
            shortDescription TEXT NOT NULL,
            category VARCHAR(100) NOT NULL,
            technologies VARCHAR(255) NOT NULL,
            languages VARCHAR(255) NOT NULL,
            complexity ENUM('Beginner', 'Intermediate', 'Advanced') NOT NULL,
            country VARCHAR(100) NOT NULL,
            startupCompany VARCHAR(255) NOT NULL,
            submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // First, execute the table creation query
    db.query(createTableSql, (err) => {
        if (err) {
            console.error('Error creating table:', err);
            return res.status(500).send('Error setting up the database table.');
        }

        // Destructure the form data from the request body
        const { 
            projectName, 
            shortDescription, 
            category, 
            technologies, 
            languages, 
            complexity, 
            country, 
            startupCompany 
        } = req.body;

        // SQL query to insert data into the 'projects' table
        const insertDataSql = `
            INSERT INTO projects (
                projectName, 
                shortDescription, 
                category, 
                technologies, 
                languages, 
                complexity, 
                country, 
                startupCompany
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            projectName, 
            shortDescription, 
            category, 
            technologies, 
            languages, 
            complexity, 
            country, 
            startupCompany
        ];

        // Then, execute the data insertion query
        db.query(insertDataSql, values, (err, result) => {
            if (err) {
                console.error('Error inserting project data:', err);
                return res.status(500).send('Error submitting project.');
            }
            console.log('Project submitted successfully:', result.insertId);
            res.status(200).send('Project submitted successfully!');
        });
    });
});
// GET route to retrieve projects
router.get('/api/submit-project', (req, res) => {
    // Get the search query from the URL, if it exists
    const searchTerm = req.query.search;
    let sql = 'SELECT * FROM projects';
    const params = [];

    // If a search term is provided, modify the SQL query
    if (searchTerm) {
        sql += ' WHERE projectName LIKE ? OR technologies LIKE ? OR languages LIKE ?';
        const likeTerm = `%${searchTerm}%`;
        params.push(likeTerm, likeTerm, likeTerm);
    }

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error('Error fetching projects:', err);
            return res.status(500).send('Error fetching projects');
        }
        res.status(200).json(results);
    });
});

module.exports = router;