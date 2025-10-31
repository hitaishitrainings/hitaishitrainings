// routes/managerOperational.js
const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper for async DB queries
const queryDB = (sql, params) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows); // ✅ directly return rows array
    });
  });

// Ensure table exists
const initializeTable = async () => {
  try {
    await queryDB(`
      CREATE TABLE IF NOT EXISTS manager_operational (
        id INT AUTO_INCREMENT PRIMARY KEY,
        manager_id INT NOT NULL UNIQUE,
        villages JSON,
        trainers JSON,
        programs JSON,
        students_by_village JSON,
        resources JSON,
        totals JSON,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (manager_id) REFERENCES nonprofit(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("✅ manager_operational table verified.");
  } catch (err) {
    console.error("❌ Error initializing table:", err);
  }
};
initializeTable();

// --------------------- POST /api/manager/operational ---------------------
// routes/managerOperational.js - Enhanced POST endpoint
router.post("/manager/operational", async (req, res) => {
  try {
    console.log("📥 Received POST request to /manager/operational");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    
    const {
      manager_id,
      villages = [],
      trainers = [],
      programs = [],
      studentsByVillage = [],
      resources = {},
      totals = {}
    } = req.body;

    if (!manager_id) {
      console.log("❌ Missing manager_id");
      return res.status(400).json({ error: "Manager ID required" });
    }

    console.log("📊 Data breakdown:", {
      manager_id,
      villages: villages.length,
      trainers: trainers.length,
      programs: programs.length,
      studentsByVillage: studentsByVillage.length,
      resources,
      totals
    });

    // Check if data exists
    const existing = await queryDB(
      "SELECT id FROM manager_operational WHERE manager_id = ?",
      [manager_id]
    );

    console.log("🔍 Existing record check:", existing.length > 0 ? "Exists" : "New record");

    if (existing.length > 0) {
      // UPDATE
      console.log("🔄 Updating existing record...");
      const result = await queryDB(
        `UPDATE manager_operational SET 
         villages=?, trainers=?, programs=?, students_by_village=?, 
         resources=?, totals=?, updated_at=NOW() WHERE manager_id=?`,
        [
          JSON.stringify(villages),
          JSON.stringify(trainers),
          JSON.stringify(programs),
          JSON.stringify(studentsByVillage),
          JSON.stringify(resources),
          JSON.stringify(totals),
          manager_id
        ]
      );
      console.log("✅ Update result:", result);
      return res.json({ message: "Updated successfully", action: "update" });
    } else {
      // INSERT
      console.log("🆕 Inserting new record...");
      const result = await queryDB(
        `INSERT INTO manager_operational 
         (manager_id, villages, trainers, programs, students_by_village, resources, totals)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          manager_id,
          JSON.stringify(villages),
          JSON.stringify(trainers),
          JSON.stringify(programs),
          JSON.stringify(studentsByVillage),
          JSON.stringify(resources),
          JSON.stringify(totals)
        ]
      );
      console.log("✅ Insert result:", result);
      res.json({ message: "Saved successfully", action: "insert" });
    }
  } catch (err) {
    console.error("❌ POST /manager/operational error:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      error: err.message,
      details: "Database operation failed",
      code: err.code
    });
  }
});

// --------------------- GET /api/manager/operational/:id ---------------------
// Enhanced GET endpoint
router.get("/manager/operational/:manager_id", async (req, res) => {
  try {
    const { manager_id } = req.params;
    console.log("📤 Fetching operational data for manager:", manager_id);
    
    const rows = await queryDB(
      "SELECT * FROM manager_operational WHERE manager_id = ?",
      [manager_id]
    );

    if (rows.length === 0) {
      console.log("❌ No operational data found for manager:", manager_id);
      return res.json({ message: "No operational data found", data: null });
    }

    const r = rows[0];
    const data = {
      manager_id: r.manager_id,
      villages: JSON.parse(r.villages || "[]"),
      trainers: JSON.parse(r.trainers || "[]"),
      programs: JSON.parse(r.programs || "[]"),
      studentsByVillage: JSON.parse(r.students_by_village || "[]"),
      resources: JSON.parse(r.resources || "{}"),
      totals: JSON.parse(r.totals || "{}"),
      updated_at: r.updated_at
    };
    
    console.log("📥 Retrieved data:", {
      villages: data.villages.length,
      trainers: data.trainers.length,
      programs: data.programs.length
    });

    res.json({
      message: "Data found",
      data: data
    });
  } catch (err) {
    console.error("GET /manager/operational error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
