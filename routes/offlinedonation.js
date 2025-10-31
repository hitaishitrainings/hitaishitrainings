const express = require("express");
const router = express.Router();
const db = require("../db"); // your existing MySQL connection - ensure this path is correct relative to server.js

// 1. Create table if not exists - Verification fields are removed.
const createTableQuery = `
CREATE TABLE IF NOT EXISTS offline_donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  village_name VARCHAR(100) NOT NULL,
  collection_date DATE NOT NULL,
  manager_name VARCHAR(255) NOT NULL, /* Name of the collector/manager */
  team_members VARCHAR(500) DEFAULT NULL,  /* Names of participating team members */
  trainers VARCHAR(500) DEFAULT NULL,      /* Names of participating trainers */
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`;

db.query(createTableQuery, (err) => {
  if (err) console.error("Error creating offline_donations table:", err);
  else console.log("offline_donations table ready");
});

// 2. POST route to add offline donation
router.post("/offlinedonations", (req, res) => {
  // Destructure the 6 expected fields
  const { village_name, collection_date, manager_name, team_members, trainers, amount } = req.body;

  // Basic validation (can be more extensive)
  if (!village_name || !collection_date || !manager_name || !amount) {
    return res.status(400).json({ message: "Missing required fields: village, date, manager, or amount." });
  }

  // SQL to insert the new record (only required fields are listed)
  const sql = `
    INSERT INTO offline_donations (village_name, collection_date, manager_name, team_members, trainers, amount)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  // Note: team_members and trainers can be null, so we use || null
  db.query(sql, [village_name, collection_date, manager_name, team_members || null, trainers || null, amount], (err, results) => {
    if (err) {
      console.error("Database error during insert:", err);
      return res.status(500).json({ message: "Database error during donation submission.", error: err.message });
    }

    // Success response
    res.status(201).json({ 
        message: "Offline donation record created successfully.", 
        donationId: results.insertId 
    });
  });
});


// 3. GET route to fetch all offline donations
router.get("/offlinedonations", (req, res) => {
  // Select all columns (which now excludes verification fields)
  const sql = `SELECT * FROM offline_donations ORDER BY collection_date DESC, created_at DESC`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error during select all:", err);
      return res.status(500).json({ message: "Database error during record retrieval.", error: err.message });
    }
    // Return the array of donation records
    res.json(results);
  });
});

// 4. GET route to fetch a single offline donation by ID
router.get("/offlinedonations/:id", (req, res) => {
  const { id } = req.params;
  const sql = `SELECT * FROM offline_donations WHERE id = ?`;
  
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Database error during select by ID:", err);
      return res.status(500).json({ message: "Database error during record retrieval.", error: err.message });
    }
    // Handles case where route is found but record ID doesn't exist
    if (results.length === 0) {
      return res.status(404).json({ message: `Donation record with ID ${id} not found.` });
    }
    res.json(results[0]);
  });
});


// 5. DELETE route to remove a donation record
router.delete("/offlinedonations/:id", (req, res) => {
    const { id } = req.params;
    const sql = `DELETE FROM offline_donations WHERE id = ?`;
    
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Database error during deletion:", err);
            return res.status(500).json({ message: "Database error during record deletion.", error: err.message });
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Donation record with ID ${id} not found.` });
        }
        res.status(200).json({ message: `Donation record with ID ${id} deleted successfully.` });
    });
});


// Export the router for use in server.js
module.exports = router;
