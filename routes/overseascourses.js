const express = require("express");
const router = express.Router();
const db = require("../db"); // your MySQL connection

// ✅ Ensure table exists
const createTableSQL = `
CREATE TABLE IF NOT EXISTS overseas_courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  university_name VARCHAR(255) NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  course_type VARCHAR(100),
  duration VARCHAR(50),
  tuition_fee DECIMAL(10,2),
  intake_month VARCHAR(50),
  ielts_required DECIMAL(2,1),
  toefl_required INT,
  gpa_required DECIMAL(3,2),
  scholarships TEXT,
  application_deadline DATE,
  career_outcomes TEXT,
  course_structure TEXT,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
`;

// Run table creation when route file is loaded
db.query(createTableSQL, (err) => {
  if (err) console.error("Error creating overseas_courses table:", err);
  else console.log("overseas_courses table exists or created successfully.");
});

// ✅ Fetch all or filtered overseas courses
router.get("/overseas-courses", (req, res) => {
  const { country, city, courseType, duration, maxFee, intake } = req.query;

  let sql = "SELECT * FROM overseas_courses WHERE 1=1";
  const params = [];

  if (country) { sql += " AND country = ?"; params.push(country); }
  if (city) { sql += " AND city = ?"; params.push(city); }
  if (courseType) { sql += " AND course_type = ?"; params.push(courseType); }
  if (duration) { sql += " AND duration LIKE ?"; params.push(`%${duration}%`); }
  if (maxFee) { sql += " AND tuition_fee <= ?"; params.push(maxFee); }
  if (intake) { sql += " AND intake_month = ?"; params.push(intake); }

  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add new overseas course
router.post("/overseas-courses", (req, res) => {
  const data = req.body;
  const sql = `
    INSERT INTO overseas_courses
    (university_name, course_name, country, city, course_type, duration, tuition_fee, intake_month, ielts_required, toefl_required, gpa_required, scholarships, application_deadline, career_outcomes, course_structure, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    data.university_name, data.course_name, data.country, data.city, data.course_type, data.duration,
    data.tuition_fee, data.intake_month, data.ielts_required, data.toefl_required, data.gpa_required,
    data.scholarships, data.application_deadline, data.career_outcomes, data.course_structure,
    data.description, data.image_url
  ];

  db.query(sql, params, (err, result) => {
    if(err) return res.status(500).json({ error: err.message });
    res.json({ message: "Course added successfully!", id: result.insertId });
  });
});

// ✅ Get distinct universities
router.get("/universities", (req, res) => {
  const sql = "SELECT DISTINCT university_name, country, city FROM overseas_courses ORDER BY university_name";
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ Get courses by university
router.get("/universities/:universityName", (req, res) => {
  const { universityName } = req.params;
  const sql = "SELECT * FROM overseas_courses WHERE university_name = ?";
  db.query(sql, [universityName], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
// ✅ Get detailed overseas course info by ID
router.get("/overseas-courses/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM overseas_courses WHERE id = ?";
  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Course not found" });
    res.json(rows[0]);
  });
});
module.exports = router;
