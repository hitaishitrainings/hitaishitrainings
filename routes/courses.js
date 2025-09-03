const express = require("express");
const router = express.Router();
const db = require("../db");

// Create courses table with timeSlots
db.query(`
  CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    trainerId VARCHAR(50),
    title VARCHAR(100),
    description TEXT,
    mode VARCHAR(20),
    duration VARCHAR(50),
    fee INT,
    startDate DATE,
    timeSlots TEXT,
    tags TEXT,
    media TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) console.error("Error creating courses table:", err);
  else console.log("✅ Courses table ready");
});

// Submit new course
router.post("/submit-course", (req, res) => {
  const {
    trainerId, title, description, mode,
    duration, fee, startDate, timeSlots,
    tags, media
  } = req.body;

  if (!trainerId || !title || !description || !mode) {
    return res.status(400).json({ success: false, error: "Missing fields" });
  }

  db.query(
    `INSERT INTO courses (trainerId, title, description, mode, duration, fee, startDate, timeSlots, tags, media)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      trainerId,
      title,
      description,
      mode,
      duration,
      fee,
      startDate,
      JSON.stringify(timeSlots || []),
      tags,
      media
    ],
    (err, result) => {
      if (err) {
        console.error("Insert error:", err);
        return res.status(500).json({ success: false, error: "Database error" });
      }
      res.json({ success: true, message: "Course submitted" });
    }
  );
});

// Get all courses for a trainer
router.get("/my-courses/:trainerId", (req, res) => {
  const { trainerId } = req.params;
  db.query("SELECT * FROM courses WHERE trainerId = ?", [trainerId], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: "Database error" });

    // Parse timeSlots
    results.forEach(course => {
      if (course.timeSlots) {
        try {
          course.timeSlots = JSON.parse(course.timeSlots);
        } catch (e) {
          course.timeSlots = [];
        }
      }
    });

    res.json({ success: true, courses: results });
  });
});

// Delete a course
router.delete("/delete-course/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM courses WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ success: false, error: "Failed to delete" });
    res.json({ success: true });
  });
});

// Get course by ID
router.get("/course/:id", (req, res) => {
  const courseId = req.params.id;

  db.query("SELECT * FROM courses WHERE id = ?", [courseId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    const course = results[0];
    try {
      course.timeSlots = JSON.parse(course.timeSlots);
    } catch {
      course.timeSlots = [];
    }

    res.json({ success: true, course });
  });
});

// Update course
router.put("/course/:id", (req, res) => {
  const courseId = req.params.id;
  const {
    title, description, mode, duration,
    fee, startDate, timeSlots, tags, media
  } = req.body;

  const query = `
    UPDATE courses SET 
      title = ?, 
      description = ?, 
      mode = ?, 
      duration = ?, 
      fee = ?, 
      startDate = ?, 
      timeSlots = ?, 
      tags = ?, 
      media = ? 
    WHERE id = ?
  `;

  const values = [
    title,
    description,
    mode,
    duration,
    fee,
    startDate,
    JSON.stringify(timeSlots || []),
    tags,
    media,
    courseId
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("Update error:", err);
      return res.status(500).json({ success: false, error: "Failed to update course" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    res.json({ success: true, message: "Course updated successfully" });
  });
});

// Get all courses with trainer names
router.get("/all-trainer-courses", (req, res) => {
  const query = `
    SELECT c.*, t.name AS trainer_name 
    FROM courses c
    LEFT JOIN trainers t ON c.trainerId = t.trainerId
    ORDER BY c.createdAt DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching all courses:", err);
      return res.status(500).json({ success: false, error: "Database error" });
    }

    results.forEach(course => {
      try {
        course.timeSlots = JSON.parse(course.timeSlots || '[]');
      } catch {
        course.timeSlots = [];
      }
    });

    res.json({ success: true, courses: results });
  });
});


module.exports = router;
