// routes/register.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const multer = require("multer");

// Setup file upload handler
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

function getFileName(filePath) {
  if (!filePath) return null;
  return path.basename(filePath);  // strips out C:/... and keeps only filename
}

router.use(express.json());


// ✅ CREATE TABLE IF NOT EXISTS
const createTableQuery = `
  CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(100) PRIMARY KEY,
    fullname VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    course VARCHAR(100),
    password VARCHAR(100),
    dob DATE,
    gender VARCHAR(10),
    address TEXT,
    certificates TEXT,
    resume VARCHAR(255),
    profileImage VARCHAR(255),
    skills TEXT,
    languages TEXT,
    education TEXT,
    jobs TEXT,
    extraCourse TEXT
  )
`;

db.query(createTableQuery, (err) => {
  if (err) console.error("❌ Table creation error:", err.message);
  else console.log("✅ users table ready.");
});

// ✅ REGISTER
router.post("/register", (req, res) => {
  const {
    fullname, email, phone, course, password,
    dob, gender, address,
    certificates, resume, profileImage,
    skills, languages, education, jobs, extraCourse
  } = req.body;

  if (!fullname || !email || !phone || !course || !password) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const userId = uuidv4();

  const insertQuery = `
    INSERT INTO users (
      id, fullname, email, phone, course, password,
      dob, gender, address,
      certificates, resume, profileImage,
      skills, languages, education, jobs, extraCourse
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    userId, fullname, email, phone, course, password,
    dob || null, gender || null, address || null,
    certificates || null, resume || null, profileImage || null,
    JSON.stringify(skills || []),
    JSON.stringify(languages || []),
    JSON.stringify(education || []),
    JSON.stringify(jobs || []),
    extraCourse || null
  ];

  db.query(insertQuery, values, (err) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email already exists" });
      }
      console.error("❌ Registration Error:", err.message);
      return res.status(500).json({ message: "Registration failed" });
    }

    res.status(200).json({
      message: "Registration successful",
      user: { id: userId, fullname, email, phone, course }
    });
  });
});

// ✅ LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  const query = "SELECT * FROM users WHERE email = ? AND password = ?";

  db.query(query, [email, password], (err, results) => {
    if (err) return res.status(500).json({ message: "DB error" });
    if (results.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = results[0];

    // Parse JSON fields
    user.skills = JSON.parse(user.skills || "[]");
    user.languages = JSON.parse(user.languages || "[]");
    user.education = JSON.parse(user.education || "[]");
    user.jobs = JSON.parse(user.jobs || "[]");

    res.json({
      message: "Login successful",
      user: user
    });
  });
});


// ✅ GET PROFILE
router.get("/profile/:email", (req, res) => {
  const email = req.params.email;
  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) return res.status(404).json({ message: "User not found" });

    const user = results[0];
    user.skills = JSON.parse(user.skills || "[]");
    user.languages = JSON.parse(user.languages || "[]");
    user.education = JSON.parse(user.education || "[]");
    user.jobs = JSON.parse(user.jobs || "[]");

    res.json({ user });
  });
});

// ✅ Only keep filename, not path



// Update student profile
router.put("/profile/:email", upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "resume", maxCount: 1 }
]), (req, res) => {
  const email = req.params.email;

  const {
    fullname, phone, course, dob, gender, address,
    certificates, extraCourse, skills, languages,
    education, jobs,
    existingProfileImage,
    existingResume
  } = req.body;

  const parsedDob = dob && dob.trim() !== "" ? dob : null;

  // ✅ Always keep only the filename (never C:/uploads/...)
  const profileImage = req.files?.profileImage?.[0]?.filename 
    || (existingProfileImage ? path.basename(existingProfileImage) : null);

  const resume = req.files?.resume?.[0]?.filename 
    || (existingResume ? path.basename(existingResume) : null);

  const values = [
    fullname,
    phone,
    parsedDob,
    gender || null,
    address || null,
    course,
    certificates || null,
    extraCourse || null,
    JSON.stringify(skills || []),
    JSON.stringify(languages || []),
    JSON.stringify(education || []),
    JSON.stringify(jobs || []),
    resume,
    profileImage,
    email
  ];

  const query = `
    UPDATE users SET
      fullname = ?, phone = ?, dob = ?, gender = ?, address = ?, course = ?,
      certificates = ?, extraCourse = ?,
      skills = ?, languages = ?, education = ?, jobs = ?,
      resume = ?, profileImage = ?
    WHERE email = ?
  `;

  db.query(query, values, (err, result) => {
    if (err) {
      console.error("❌ SQL Update Error:", err.message);
      return res.status(500).json({ message: "Update failed", error: err.message });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  });
});




module.exports = router;
